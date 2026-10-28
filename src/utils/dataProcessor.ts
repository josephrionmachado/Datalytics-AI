import Papa from 'papaparse';
import {
  ColumnSchema,
  ColumnStats,
  ColumnType,
  Dataset,
  NumericStats,
  CategoricalStats,
  DateStats,
  QualityReport,
  QualityIssue,
} from '../types/data';

/**
 * Infer data type for an array of values
 */
export function inferColumnType(values: any[]): ColumnType {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  if (nonNulls.length === 0) return 'string';

  let numCount = 0;
  let boolCount = 0;
  let dateCount = 0;

  for (const v of nonNulls) {
    const s = String(v).trim().toLowerCase();

    // Check boolean
    if (['true', 'false', 'yes', 'no', '1', '0'].includes(s)) {
      boolCount++;
    }

    // Check number (strip optional $ or % or commas if simple)
    const cleanNum = String(v).trim().replace(/^[$,]|[%]$/g, '').replace(/,/g, '');
    if (cleanNum !== '' && !isNaN(Number(cleanNum))) {
      numCount++;
    }

    // Check date (e.g. YYYY-MM-DD or MM/DD/YYYY)
    if (
      s.includes('-') ||
      s.includes('/') ||
      /^\d{4}$/.test(s) === false // Avoid plain years being treated solely as dates if they are numeric
    ) {
      const parsedDate = Date.parse(String(v));
      if (!isNaN(parsedDate) && String(v).length >= 6) {
        dateCount++;
      }
    }
  }

  const threshold = nonNulls.length * 0.75;

  if (numCount >= threshold) return 'number';
  if (dateCount >= threshold && dateCount >= numCount) return 'date';
  if (boolCount >= threshold) return 'boolean';

  return 'string';
}

/**
 * Coerce value to inferred type
 */
export function coerceValue(val: any, type: ColumnType): any {
  if (val === null || val === undefined || String(val).trim() === '') {
    return null;
  }

  const s = String(val).trim();

  if (type === 'number') {
    const clean = s.replace(/^[$,]|[%]$/g, '').replace(/,/g, '');
    const num = Number(clean);
    return isNaN(num) ? null : num;
  }

  if (type === 'boolean') {
    const lower = s.toLowerCase();
    if (['true', 'yes', '1'].includes(lower)) return true;
    if (['false', 'no', '0'].includes(lower)) return false;
    return null;
  }

  if (type === 'date') {
    const parsed = Date.parse(s);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().split('T')[0];
    }
    return s;
  }

  return s;
}

/**
 * Compute numeric statistics
 */
export function calculateNumericStats(values: (number | null)[]): NumericStats {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v)).sort((a, b) => a - b);
  const count = valid.length;
  const nullCount = values.length - count;

  if (count === 0) {
    return {
      count: 0,
      nullCount,
      min: 0,
      max: 0,
      sum: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      outliersCount: 0,
    };
  }

  const sum = valid.reduce((acc, v) => acc + v, 0);
  const min = valid[0];
  const max = valid[count - 1];
  const mean = sum / count;

  const median =
    count % 2 === 0 ? (valid[count / 2 - 1] + valid[count / 2]) / 2 : valid[Math.floor(count / 2)];

  // Variance & Standard Deviation
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Quartiles
  const q1 = valid[Math.floor(count * 0.25)];
  const q3 = valid[Math.floor(count * 0.75)];
  const iqr = q3 - q1;

  // Outliers: < Q1 - 1.5*IQR or > Q3 + 1.5*IQR
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliersCount = valid.filter((v) => v < lowerBound || v > upperBound).length;

  return {
    count,
    nullCount,
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    sum: Number(sum.toFixed(2)),
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    outliersCount,
  };
}

/**
 * Compute categorical statistics
 */
export function calculateCategoricalStats(values: any[]): CategoricalStats {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  const nullCount = values.length - nonNulls.length;
  const freqMap: Record<string, number> = {};

  for (const v of nonNulls) {
    const key = String(v);
    freqMap[key] = (freqMap[key] || 0) + 1;
  }

  const entries = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  const uniqueCount = entries.length;

  const topValues = entries.slice(0, 10).map(([value, count]) => ({
    value,
    count,
    percentage: nonNulls.length ? Number(((count / nonNulls.length) * 100).toFixed(1)) : 0,
  }));

  return {
    count: nonNulls.length,
    nullCount,
    uniqueCount,
    topValues,
  };
}

/**
 * Compute date statistics
 */
export function calculateDateStats(values: any[]): DateStats {
  const validDates: number[] = [];
  let nullCount = 0;

  for (const v of values) {
    if (!v) {
      nullCount++;
      continue;
    }
    const t = Date.parse(String(v));
    if (!isNaN(t)) {
      validDates.push(t);
    } else {
      nullCount++;
    }
  }

  if (validDates.length === 0) {
    return { count: 0, nullCount, minDate: '', maxDate: '', spanDays: 0 };
  }

  validDates.sort((a, b) => a - b);
  const minDate = new Date(validDates[0]).toISOString().split('T')[0];
  const maxDate = new Date(validDates[validDates.length - 1]).toISOString().split('T')[0];
  const spanDays = Math.round((validDates[validDates.length - 1] - validDates[0]) / (1000 * 60 * 60 * 24));

  return {
    count: validDates.length,
    nullCount,
    minDate,
    maxDate,
    spanDays,
  };
}

/**
 * Find duplicate rows in dataset
 */
export function findDuplicateRows(rows: Record<string, any>[]): number[] {
  const seen = new Set<string>();
  const duplicateIndices: number[] = [];

  rows.forEach((row, idx) => {
    // stringify values in stable order
    const key = Object.keys(row)
      .sort()
      .map((k) => `${k}:${row[k]}`)
      .join('|');
    if (seen.has(key)) {
      duplicateIndices.push(idx);
    } else {
      seen.add(key);
    }
  });

  return duplicateIndices;
}

/**
 * Build data quality report
 */
export function assessDataQuality(
  rows: Record<string, any>[],
  columns: ColumnSchema[],
  stats: Record<string, ColumnStats>
): QualityReport {
  const totalRows = rows.length;
  const totalColumns = columns.length;
  const totalCells = totalRows * totalColumns;

  if (totalCells === 0) {
    return {
      healthScore: 100,
      totalRows: 0,
      totalColumns: 0,
      duplicateRowsCount: 0,
      totalMissingCells: 0,
      missingCellsPercentage: 0,
      issues: [],
    };
  }

  let totalMissingCells = 0;
  const issues: QualityIssue[] = [];

  // 1. Missing values check
  columns.forEach((col) => {
    const colStat = stats[col.name];
    if (colStat && colStat.missingCount > 0) {
      totalMissingCells += colStat.missingCount;
      const severity =
        colStat.missingPercentage > 15 ? 'high' : colStat.missingPercentage > 5 ? 'medium' : 'low';
      issues.push({
        id: `missing_${col.name}`,
        type: 'missing_values',
        column: col.name,
        severity,
        count: colStat.missingCount,
        description: `Column "${col.name}" has ${colStat.missingCount} missing value${
          colStat.missingCount > 1 ? 's' : ''
        } (${colStat.missingPercentage}% missing).`,
        suggestedAction:
          col.type === 'number'
            ? 'impute_numeric_median'
            : 'drop_missing_rows',
      });
    }
  });

  // 2. Duplicate rows check
  const duplicateIndices = findDuplicateRows(rows);
  if (duplicateIndices.length > 0) {
    issues.push({
      id: 'duplicate_rows',
      type: 'duplicate_rows',
      severity: duplicateIndices.length > totalRows * 0.05 ? 'high' : 'medium',
      count: duplicateIndices.length,
      description: `Detected ${duplicateIndices.length} duplicate record${
        duplicateIndices.length > 1 ? 's' : ''
      } in the dataset.`,
      suggestedAction: 'remove_duplicates',
    });
  }

  // 3. Outlier checks on numeric columns
  columns
    .filter((c) => c.type === 'number')
    .forEach((col) => {
      const colStat = stats[col.name];
      if (colStat?.numeric && colStat.numeric.outliersCount > 0) {
        issues.push({
          id: `outlier_${col.name}`,
          type: 'outliers',
          column: col.name,
          severity: 'low',
          count: colStat.numeric.outliersCount,
          description: `Column "${col.name}" contains ${colStat.numeric.outliersCount} statistical outlier${
            colStat.numeric.outliersCount > 1 ? 's' : ''
          } exceeding 1.5× IQR.`,
          suggestedAction: 'remove_outliers',
        });
      }
    });

  // Calculate Health Score (100 base, deductions for duplicates & missing rate)
  const missingCellsPercentage = Number(((totalMissingCells / totalCells) * 100).toFixed(1));
  const duplicatePenalty = Math.min(30, (duplicateIndices.length / Math.max(1, totalRows)) * 100 * 2);
  const missingPenalty = Math.min(40, missingCellsPercentage * 2.5);
  const outlierPenalty = Math.min(10, issues.filter((i) => i.type === 'outliers').length * 2);

  const rawScore = 100 - (duplicatePenalty + missingPenalty + outlierPenalty);
  const healthScore = Math.max(10, Math.min(100, Math.round(rawScore)));

  return {
    healthScore,
    totalRows,
    totalColumns,
    duplicateRowsCount: duplicateIndices.length,
    totalMissingCells,
    missingCellsPercentage,
    issues,
  };
}

/**
 * Recompute dataset stats from raw rows
 */
export function computeDatasetStats(
  rows: Record<string, any>[],
  columns: ColumnSchema[]
): Record<string, ColumnStats> {
  const stats: Record<string, ColumnStats> = {};

  columns.forEach((col) => {
    const rawValues = rows.map((r) => r[col.name]);
    const totalCount = rows.length;
    const nonNulls = rawValues.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
    const missingCount = totalCount - nonNulls.length;
    const missingPercentage = totalCount > 0 ? Number(((missingCount / totalCount) * 100).toFixed(1)) : 0;

    const base: ColumnStats = {
      name: col.name,
      type: col.type,
      totalCount,
      missingCount,
      missingPercentage,
    };

    if (col.type === 'number') {
      base.numeric = calculateNumericStats(rawValues);
    } else if (col.type === 'date') {
      base.date = calculateDateStats(rawValues);
    } else {
      base.categorical = calculateCategoricalStats(rawValues);
    }

    stats[col.name] = base;
  });

  return stats;
}

/**
 * Parse CSV string into full Dataset structure
 */
export function parseCsvDataset(
  csvText: string,
  fileName: string = 'dataset.csv',
  fileSize: number = 0,
  isSynthetic: boolean = false
): Dataset {
  const parsed = Papa.parse<Record<string, any>>(csvText.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false, // We handle strong type inference ourselves
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`CSV Parsing failed: ${parsed.errors[0]?.message || 'Malformed CSV format'}`);
  }

  const rawHeaders = parsed.meta.fields || [];
  if (rawHeaders.length === 0) {
    throw new Error('CSV file has no headers or columns detected.');
  }

  // Clean headers (trim whitespace, remove unwanted quotes)
  const cleanHeaders = rawHeaders.map((h) => h.trim().replace(/^["']|["']$/g, ''));

  // Detect column types
  const columns: ColumnSchema[] = cleanHeaders.map((header) => {
    const rawValues = parsed.data.map((row) => row[header]);
    const detectedType = inferColumnType(rawValues);
    const sampleValues = rawValues
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
      .slice(0, 5);

    return {
      name: header,
      type: detectedType,
      originalType: detectedType,
      sampleValues,
    };
  });

  // Coerce and sanitize row data
  const coercedRows = parsed.data.map((row) => {
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      newRow[col.name] = coerceValue(row[col.name], col.type);
    });
    return newRow;
  });

  // Compute stats and quality report
  const stats = computeDatasetStats(coercedRows, columns);
  const quality = assessDataQuality(coercedRows, columns, stats);

  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  return {
    id: `ds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    fileName,
    fileSize: fileSize || new Blob([csvText]).size,
    rowCount: coercedRows.length,
    columnCount: columns.length,
    columns,
    rows: coercedRows,
    originalRows: JSON.parse(JSON.stringify(coercedRows)),
    history: [],
    stats,
    quality,
    isSynthetic,
  };
}

/**
 * Aggregate data for interactive charts
 */
export function aggregateDataForChart(
  rows: Record<string, any>[],
  xCol: string,
  yCol: string,
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum',
  topN: number = 15,
  sortBy: 'name' | 'value-desc' | 'value-asc' = 'value-desc'
): { name: string; value: number; count: number }[] {
  if (!rows.length || !xCol) return [];

  const groups: Record<string, { sum: number; count: number; min: number; max: number }> = {};

  rows.forEach((row) => {
    const rawX = row[xCol];
    const groupKey =
      rawX === null || rawX === undefined || String(rawX).trim() === ''
        ? '(Missing)'
        : String(rawX).trim();

    const rawY = row[yCol];
    const numY = typeof rawY === 'number' ? rawY : Number(rawY);
    const validY = !isNaN(numY) ? numY : 0;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        sum: validY,
        count: 1,
        min: validY,
        max: validY,
      };
    } else {
      groups[groupKey].sum += validY;
      groups[groupKey].count += 1;
      groups[groupKey].min = Math.min(groups[groupKey].min, validY);
      groups[groupKey].max = Math.max(groups[groupKey].max, validY);
    }
  });

  const result = Object.entries(groups).map(([name, data]) => {
    let finalValue = data.sum;
    if (aggregation === 'avg') {
      finalValue = data.count > 0 ? data.sum / data.count : 0;
    } else if (aggregation === 'count') {
      finalValue = data.count;
    } else if (aggregation === 'min') {
      finalValue = data.min;
    } else if (aggregation === 'max') {
      finalValue = data.max;
    }

    return {
      name,
      value: Number(finalValue.toFixed(2)),
      count: data.count,
    };
  });

  if (sortBy === 'value-desc') {
    result.sort((a, b) => b.value - a.value);
  } else if (sortBy === 'value-asc') {
    result.sort((a, b) => a.value - b.value);
  } else if (sortBy === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  return result.slice(0, topN);
}

/**
 * Deterministic Analytical Computations to feed into Gemini AI Analyst
 */
export function computeDeterministicInsights(dataset: Dataset, userQuestion?: string) {
  const { rows, columns, stats } = dataset;
  const numCols = columns.filter((c) => c.type === 'number').map((c) => c.name);
  const catCols = columns.filter((c) => c.type === 'string' || c.type === 'boolean').map((c) => c.name);
  const dateCols = columns.filter((c) => c.type === 'date').map((c) => c.name);

  // Totals and averages for numeric columns
  const numericSummaries: Record<string, any> = {};
  numCols.forEach((col) => {
    if (stats[col]?.numeric) {
      numericSummaries[col] = stats[col].numeric;
    }
  });

  // Top rankings for categorical vs primary numeric (e.g. Revenue/Sales/Profit or first numeric)
  const primaryNumeric =
    numCols.find((c) => /revenue|sales|amount|price|profit|total/i.test(c)) || numCols[0];

  const categoryAggregates: Record<string, any> = {};
  if (primaryNumeric) {
    catCols.slice(0, 4).forEach((catCol) => {
      const agg = aggregateDataForChart(rows, catCol, primaryNumeric, 'sum', 8, 'value-desc');
      categoryAggregates[`Total_${primaryNumeric}_by_${catCol}`] = agg;
    });
  }

  // Monthly trends if date column exists
  const monthlyTrends: Record<string, any> = {};
  if (dateCols.length > 0 && primaryNumeric) {
    const dateCol = dateCols[0];
    const monthMap: Record<string, number> = {};
    rows.forEach((r) => {
      const d = r[dateCol];
      if (d) {
        const month = String(d).substring(0, 7); // YYYY-MM
        const val = Number(r[primaryNumeric]) || 0;
        monthMap[month] = (monthMap[month] || 0) + val;
      }
    });
    monthlyTrends[`Monthly_${primaryNumeric}_by_${dateCol}`] = Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }));
  }

  return {
    primaryMetric: primaryNumeric,
    numericSummaries,
    topRankings: categoryAggregates,
    monthlyTrends,
    dataQualityHighlights: {
      healthScore: dataset.quality.healthScore,
      totalRows: dataset.rowCount,
      duplicateRows: dataset.quality.duplicateRowsCount,
      missingCells: dataset.quality.totalMissingCells,
      missingPercentage: dataset.quality.missingCellsPercentage,
    },
  };
}
