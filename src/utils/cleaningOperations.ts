import {
  CleaningActionType,
  CleaningOperation,
  ColumnSchema,
  Dataset,
} from '../types/data';
import {
  assessDataQuality,
  computeDatasetStats,
  findDuplicateRows,
} from './dataProcessor';

export interface CleaningPreview {
  actionType: CleaningActionType;
  column?: string;
  affectedRowCount: number;
  previewRowsBefore: Record<string, any>[];
  previewRowsAfter: Record<string, any>[];
  explanation: string;
}

/**
 * Preview what an operation will do before applying it
 */
export function previewCleaning(
  dataset: Dataset,
  actionType: CleaningActionType,
  column?: string,
  fillValue?: any
): CleaningPreview {
  const { rows, columns } = dataset;
  let affectedRowCount = 0;
  const beforeSamples: Record<string, any>[] = [];
  const afterSamples: Record<string, any>[] = [];
  let explanation = '';

  switch (actionType) {
    case 'remove_duplicates': {
      const dupIndices = new Set(findDuplicateRows(rows));
      affectedRowCount = dupIndices.size;
      explanation = `Remove ${affectedRowCount} duplicate row${
        affectedRowCount === 1 ? '' : 's'
      } from the dataset, retaining only the first occurrence of each unique record.`;

      // grab samples of duplicates
      dupIndices.forEach((idx) => {
        if (beforeSamples.length < 3) {
          beforeSamples.push(rows[idx]);
        }
      });
      break;
    }

    case 'drop_missing_rows': {
      if (column) {
        const matching = rows.filter(
          (r) => r[column] === null || r[column] === undefined || String(r[column]).trim() === ''
        );
        affectedRowCount = matching.length;
        explanation = `Drop ${affectedRowCount} row${
          affectedRowCount === 1 ? '' : 's'
        } where column "${column}" has missing values.`;
        beforeSamples.push(...matching.slice(0, 3));
      } else {
        const matching = rows.filter((r) =>
          columns.some(
            (c) => r[c.name] === null || r[c.name] === undefined || String(r[c.name]).trim() === ''
          )
        );
        affectedRowCount = matching.length;
        explanation = `Drop all ${affectedRowCount} row${
          affectedRowCount === 1 ? '' : 's'
        } that contain one or more missing values across any column.`;
        beforeSamples.push(...matching.slice(0, 3));
      }
      break;
    }

    case 'impute_numeric_mean':
    case 'impute_numeric_median': {
      if (!column) break;
      const colStat = dataset.stats[column];
      const targetVal =
        actionType === 'impute_numeric_mean'
          ? colStat?.numeric?.mean ?? 0
          : colStat?.numeric?.median ?? 0;

      const matching = rows.filter((r) => r[column] === null || r[column] === undefined);
      affectedRowCount = matching.length;
      explanation = `Impute ${affectedRowCount} missing value${
        affectedRowCount === 1 ? '' : 's'
      } in column "${column}" with the ${
        actionType === 'impute_numeric_mean' ? 'mean' : 'median'
      } value (${targetVal}).`;

      matching.slice(0, 3).forEach((r) => {
        beforeSamples.push({ ...r });
        afterSamples.push({ ...r, [column]: targetVal });
      });
      break;
    }

    case 'fill_missing_constant': {
      if (!column) break;
      const targetVal = fillValue !== undefined ? fillValue : 'Unknown';
      const matching = rows.filter(
        (r) => r[column] === null || r[column] === undefined || String(r[column]).trim() === ''
      );
      affectedRowCount = matching.length;
      explanation = `Replace ${affectedRowCount} missing cell${
        affectedRowCount === 1 ? '' : 's'
      } in "${column}" with default value "${targetVal}".`;

      matching.slice(0, 3).forEach((r) => {
        beforeSamples.push({ ...r });
        afterSamples.push({ ...r, [column]: targetVal });
      });
      break;
    }

    case 'trim_text_whitespace': {
      const textCols = columns.filter((c) => c.type === 'string');
      let count = 0;
      rows.forEach((r) => {
        let hasUntrimmed = false;
        textCols.forEach((c) => {
          const val = r[c.name];
          if (typeof val === 'string' && val !== val.trim()) {
            hasUntrimmed = true;
          }
        });
        if (hasUntrimmed) {
          count++;
          if (beforeSamples.length < 3) {
            beforeSamples.push({ ...r });
            const cleaned: Record<string, any> = { ...r };
            textCols.forEach((c) => {
              if (typeof cleaned[c.name] === 'string') {
                cleaned[c.name] = cleaned[c.name].trim();
              }
            });
            afterSamples.push(cleaned);
          }
        }
      });
      affectedRowCount = count;
      explanation = `Trim leading and trailing whitespace across all text columns in ${affectedRowCount} record${
        affectedRowCount === 1 ? '' : 's'
      }.`;
      break;
    }

    case 'remove_outliers': {
      if (!column) break;
      const stat = dataset.stats[column]?.numeric;
      if (!stat) break;
      const lower = stat.q1 - 1.5 * stat.iqr;
      const upper = stat.q3 + 1.5 * stat.iqr;

      const matching = rows.filter(
        (r) => r[column] !== null && (r[column] < lower || r[column] > upper)
      );
      affectedRowCount = matching.length;
      explanation = `Filter out ${affectedRowCount} row${
        affectedRowCount === 1 ? '' : 's'
      } where "${column}" is outside the standard IQR range [${lower.toFixed(
        1
      )}, ${upper.toFixed(1)}].`;
      beforeSamples.push(...matching.slice(0, 3));
      break;
    }
  }

  return {
    actionType,
    column,
    affectedRowCount,
    previewRowsBefore: beforeSamples,
    previewRowsAfter: afterSamples,
    explanation,
  };
}

/**
 * Apply cleaning operation and return updated Dataset
 */
export function applyCleaning(
  dataset: Dataset,
  actionType: CleaningActionType,
  column?: string,
  fillValue?: any
): Dataset {
  const { rows, columns, originalRows } = dataset;
  let newRows: Record<string, any>[] = [];
  let description = '';
  let affectedRows = 0;

  switch (actionType) {
    case 'remove_duplicates': {
      const dupIndices = new Set(findDuplicateRows(rows));
      affectedRows = dupIndices.size;
      newRows = rows.filter((_, idx) => !dupIndices.has(idx));
      description = `Removed ${affectedRows} duplicate row${affectedRows === 1 ? '' : 's'}`;
      break;
    }

    case 'drop_missing_rows': {
      if (column) {
        newRows = rows.filter(
          (r) => r[column] !== null && r[column] !== undefined && String(r[column]).trim() !== ''
        );
      } else {
        newRows = rows.filter((r) =>
          columns.every(
            (c) => r[c.name] !== null && r[c.name] !== undefined && String(r[c.name]).trim() !== ''
          )
        );
      }
      affectedRows = rows.length - newRows.length;
      description = column
        ? `Dropped ${affectedRows} row${affectedRows === 1 ? '' : 's'} with missing "${column}"`
        : `Dropped ${affectedRows} row${affectedRows === 1 ? '' : 's'} with any missing values`;
      break;
    }

    case 'impute_numeric_mean':
    case 'impute_numeric_median': {
      if (!column) return dataset;
      const stat = dataset.stats[column]?.numeric;
      const targetVal =
        actionType === 'impute_numeric_mean' ? stat?.mean ?? 0 : stat?.median ?? 0;

      newRows = rows.map((r) => {
        if (r[column] === null || r[column] === undefined || isNaN(r[column])) {
          affectedRows++;
          return { ...r, [column]: targetVal };
        }
        return r;
      });

      description = `Imputed missing values in "${column}" with ${
        actionType === 'impute_numeric_mean' ? 'mean' : 'median'
      } (${targetVal})`;
      break;
    }

    case 'fill_missing_constant': {
      if (!column) return dataset;
      const targetVal = fillValue !== undefined ? fillValue : 'Unknown';

      newRows = rows.map((r) => {
        if (r[column] === null || r[column] === undefined || String(r[column]).trim() === '') {
          affectedRows++;
          return { ...r, [column]: targetVal };
        }
        return r;
      });

      description = `Filled missing values in "${column}" with "${targetVal}"`;
      break;
    }

    case 'trim_text_whitespace': {
      const textCols = columns.filter((c) => c.type === 'string');
      newRows = rows.map((r) => {
        const updated = { ...r };
        let modified = false;
        textCols.forEach((c) => {
          if (typeof updated[c.name] === 'string') {
            const trimmed = updated[c.name].trim();
            if (trimmed !== updated[c.name]) {
              updated[c.name] = trimmed;
              modified = true;
            }
          }
        });
        if (modified) affectedRows++;
        return updated;
      });

      description = `Trimmed whitespace across text columns in ${affectedRows} rows`;
      break;
    }

    case 'remove_outliers': {
      if (!column) return dataset;
      const stat = dataset.stats[column]?.numeric;
      if (!stat) return dataset;

      const lower = stat.q1 - 1.5 * stat.iqr;
      const upper = stat.q3 + 1.5 * stat.iqr;

      newRows = rows.filter((r) => {
        const val = r[column];
        if (val === null || val === undefined) return true;
        return val >= lower && val <= upper;
      });

      affectedRows = rows.length - newRows.length;
      description = `Removed ${affectedRows} outlier row${
        affectedRows === 1 ? '' : 's'
      } from "${column}"`;
      break;
    }

    default:
      return dataset;
  }

  const newOp: CleaningOperation = {
    id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type: actionType,
    column,
    fillValue,
    description,
    appliedAt: new Date().toLocaleTimeString(),
    affectedRows,
  };

  const newStats = computeDatasetStats(newRows, columns);
  const newQuality = assessDataQuality(newRows, columns, newStats);

  return {
    ...dataset,
    rows: newRows,
    rowCount: newRows.length,
    stats: newStats,
    quality: newQuality,
    history: [...dataset.history, newOp],
    originalRows, // Preserved
  };
}

/**
 * Revert dataset back to completely original state
 */
export function resetToOriginal(dataset: Dataset): Dataset {
  const originalRows = JSON.parse(JSON.stringify(dataset.originalRows));
  const newStats = computeDatasetStats(originalRows, dataset.columns);
  const newQuality = assessDataQuality(originalRows, dataset.columns, newStats);

  return {
    ...dataset,
    rows: originalRows,
    rowCount: originalRows.length,
    stats: newStats,
    quality: newQuality,
    history: [],
  };
}

export const applyCleaningOperation = applyCleaning;
