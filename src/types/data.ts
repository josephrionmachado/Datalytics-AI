export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  originalType: string;
  sampleValues: any[];
}

export interface NumericStats {
  count: number;
  nullCount: number;
  min: number;
  max: number;
  sum: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  outliersCount: number;
}

export interface CategoricalStats {
  count: number;
  nullCount: number;
  uniqueCount: number;
  topValues: { value: string; count: number; percentage: number }[];
}

export interface DateStats {
  count: number;
  nullCount: number;
  minDate: string;
  maxDate: string;
  spanDays: number;
}

export interface ColumnStats {
  name: string;
  type: ColumnType;
  totalCount: number;
  missingCount: number;
  missingPercentage: number;
  numeric?: NumericStats;
  categorical?: CategoricalStats;
  date?: DateStats;
}

export interface QualityIssue {
  id: string;
  type: 'missing_values' | 'duplicate_rows' | 'outliers' | 'constant_column';
  column?: string;
  severity: 'low' | 'medium' | 'high';
  count: number;
  description: string;
  suggestedAction: CleaningActionType;
}

export interface QualityReport {
  healthScore: number; // 0 - 100
  totalRows: number;
  totalColumns: number;
  duplicateRowsCount: number;
  totalMissingCells: number;
  missingCellsPercentage: number;
  issues: QualityIssue[];
}

export type CleaningActionType =
  | 'remove_duplicates'
  | 'drop_missing_rows'
  | 'impute_numeric_mean'
  | 'impute_numeric_median'
  | 'fill_missing_constant'
  | 'trim_text_whitespace'
  | 'remove_outliers';

export interface CleaningOperation {
  id: string;
  type: CleaningActionType;
  column?: string;
  fillValue?: string | number;
  description: string;
  appliedAt: string;
  affectedRows: number;
}

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columns: ColumnSchema[];
  rows: Record<string, any>[];
  originalRows: Record<string, any>[]; // Preserved original
  history: CleaningOperation[];
  stats: Record<string, ColumnStats>;
  quality: QualityReport;
  isSynthetic?: boolean;
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter';
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  secondaryAxis?: string;
  aggregation: AggregationType;
  sortBy?: 'name' | 'value-desc' | 'value-asc';
  topN?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metrics?: Record<string, any>;
  suggestedFollowUps?: string[];
  isError?: boolean;
}
