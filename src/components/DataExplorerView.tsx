import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  BarChart2,
} from 'lucide-react';
import { Dataset, ColumnSchema, ColumnStats } from '../types/data';

interface DataExplorerViewProps {
  dataset: Dataset | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  dataset,
  onOpenUpload,
  onLoadSample,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Initialize visible columns when dataset loads
  React.useEffect(() => {
    if (dataset) {
      setVisibleColumns(dataset.columns.map((c) => c.name));
      setSelectedColumnName(dataset.columns[0]?.name || null);
    }
  }, [dataset]);

  // If no dataset
  if (!dataset) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Dataset Loaded</h3>
        <p className="text-xs text-slate-500">
          Upload a CSV file or load the sample sales data to inspect records and column statistics.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={onOpenUpload}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
          >
            Upload CSV
          </button>
          <button
            onClick={onLoadSample}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Load Sample Data
          </button>
        </div>
      </div>
    );
  }

  // Filter rows by global search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return dataset.rows;
    const term = searchTerm.toLowerCase().trim();
    return dataset.rows.filter((row) =>
      dataset.columns.some((col) => {
        const val = row[col.name];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
      })
    );
  }, [dataset.rows, dataset.columns, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    const colObj = dataset.columns.find((c) => c.name === sortColumn);
    const isNum = colObj?.type === 'number';

    return [...filteredRows].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (isNum) {
        return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredRows, sortColumn, sortDirection, dataset.columns]);

  // Paginated Rows
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Toggle column sort
  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (colName: string) => {
    if (visibleColumns.includes(colName)) {
      if (visibleColumns.length > 1) {
        setVisibleColumns(visibleColumns.filter((c) => c !== colName));
      }
    } else {
      setVisibleColumns([...visibleColumns, colName]);
    }
  };

  const selectedColStats: ColumnStats | undefined = selectedColumnName
    ? dataset.stats[selectedColumnName]
    : undefined;
  const selectedColSchema: ColumnSchema | undefined = dataset.columns.find(
    (c) => c.name === selectedColumnName
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search records across all fields..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Column Visibility and Page Size */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value={10}>10 rows</option>
              <option value={15}>15 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-900">{sortedRows.length}</span> of{' '}
            {dataset.rowCount} rows
          </span>
        </div>
      </div>

      {/* Main Grid: Data Table + Column Stats Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Table Container (3 columns on large screens) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/90 sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-400 w-12 text-center">#</th>
                  {dataset.columns
                    .filter((c) => visibleColumns.includes(c.name))
                    .map((col) => {
                      const isSorted = sortColumn === col.name;
                      const isSelected = selectedColumnName === col.name;

                      return (
                        <th
                          key={col.name}
                          className={`py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition select-none ${
                            isSelected ? 'bg-indigo-50/70 text-indigo-900' : ''
                          }`}
                          onClick={() => {
                            setSelectedColumnName(col.name);
                            handleSort(col.name);
                          }}
                        >
                          <div className="flex items-center gap-1.5 justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold">{col.name}</span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-mono font-medium ${
                                  col.type === 'number'
                                    ? 'bg-blue-100 text-blue-700'
                                    : col.type === 'date'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {col.type}
                              </span>
                            </div>

                            <span className="text-slate-400">
                              {isSorted ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={index} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 text-center text-slate-400 text-[10px]">
                          {rowNumber}
                        </td>
                        {dataset.columns
                          .filter((c) => visibleColumns.includes(c.name))
                          .map((col) => {
                            const val = row[col.name];
                            const isNull = val === null || val === undefined;
                            const isSelected = selectedColumnName === col.name;

                            return (
                              <td
                                key={col.name}
                                className={`py-2 px-3 whitespace-nowrap text-slate-700 ${
                                  isSelected ? 'bg-indigo-50/20' : ''
                                }`}
                              >
                                {isNull ? (
                                  <span className="text-slate-300 italic font-sans text-[10px]">
                                    null
                                  </span>
                                ) : col.type === 'number' ? (
                                  <span className="text-indigo-900 font-medium">
                                    {typeof val === 'number' ? val.toLocaleString() : String(val)}
                                  </span>
                                ) : (
                                  <span>{String(val)}</span>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + 1}
                      className="py-10 text-center text-slate-400 font-sans text-xs"
                    >
                      No records found matching "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page <span className="font-semibold text-slate-900">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Column Statistics Inspector Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Column Statistics
              </h3>
            </div>
            {selectedColSchema && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {selectedColSchema.type}
              </span>
            )}
          </div>

          {/* Column selector dropdown */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Select Column to Inspect:
            </label>
            <select
              value={selectedColumnName || ''}
              onChange={(e) => setSelectedColumnName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {dataset.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {selectedColStats && (
            <div className="space-y-4">
              {/* Missing Values Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Missing Values:</span>
                  <span
                    className={`font-semibold ${
                      selectedColStats.missingCount > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedColStats.missingCount} ({selectedColStats.missingPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      selectedColStats.missingPercentage > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, selectedColStats.missingPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Numeric Specific Metrics */}
              {selectedColStats.numeric && (
                <div className="space-y-2 text-xs">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Descriptive Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Sum</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedColStats.numeric.sum.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Mean (Avg)</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedColStats.numeric.mean.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Median</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedColStats.numeric.median.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Std Deviation</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedColStats.numeric.stdDev.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Min</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedColStats.numeric.min.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Max</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedColStats.numeric.max.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Outliers */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-600">Statistical Outliers:</span>
                    <span
                      className={`font-bold font-mono ${
                        selectedColStats.numeric.outliersCount > 0
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {selectedColStats.numeric.outliersCount}
                    </span>
                  </div>
                </div>
              )}

              {/* Categorical Specific Metrics */}
              {selectedColStats.categorical && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Top Frequencies
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {selectedColStats.categorical.uniqueCount} distinct
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedColStats.categorical.topValues.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium text-slate-800 truncate max-w-[130px]">
                            {item.value || '(Empty)'}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Specific Metrics */}
              {selectedColStats.date && (
                <div className="space-y-2 text-xs">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Temporal Span
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Earliest:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {selectedColStats.date.minDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Latest:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {selectedColStats.date.maxDate}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-semibold text-indigo-700">
                        {selectedColStats.date.spanDays} days
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Column Visibility checklist */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Toggle Columns
            </h4>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {dataset.columns.map((c) => {
                const isVisible = visibleColumns.includes(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => toggleColumnVisibility(c.name)}
                    className="w-full flex items-center justify-between text-left px-2 py-1 rounded text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span className="truncate text-slate-700">{c.name}</span>
                    {isVisible ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
