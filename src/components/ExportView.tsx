import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Check,
} from 'lucide-react';
import { Dataset } from '../types/data';

interface ExportViewProps {
  dataset: Dataset | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  dataset,
  onOpenUpload,
  onLoadSample,
}) => {
  const [downloadedType, setDownloadedType] = useState<string | null>(null);

  if (!dataset) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#202228] rounded-2xl border border-[#2C2F37] text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-[#a120f7]/15 text-[#c084fc] rounded-2xl flex items-center justify-center mx-auto border border-[#a120f7]/30">
          <Download className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400">
          Upload a CSV or load the sample data to export datasets, reports, or schemas.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={onOpenUpload}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#a120f7] text-white hover:bg-[#8e17db] transition cursor-pointer shadow-md shadow-[#a120f7]/20"
          >
            Upload CSV
          </button>
          <button
            onClick={onLoadSample}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#282A31] text-slate-300 hover:bg-[#32353E] transition cursor-pointer border border-[#3A3D47]"
          >
            Load Sample Data
          </button>
        </div>
      </div>
    );
  }

  const downloadCsv = () => {
    const headers = dataset.columns.map((c) => c.name).join(',');
    const rows = dataset.rows
      .map((row) =>
        dataset.columns
          .map((col) => {
            const val = row[col.name];
            if (val === null || val === undefined) return '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dataset.name.replace(/\.[^/.]+$/, '')}_processed.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedType('csv');
    setTimeout(() => setDownloadedType(null), 2500);
  };

  const downloadReport = () => {
    const lines = [
      `# Datalytics AI - Executive Data Summary Report`,
      `Dataset: ${dataset.name}`,
      `Rows: ${dataset.rowCount}`,
      `Columns: ${dataset.columnCount}`,
      `Health Score: ${dataset.quality.healthScore}/100`,
      `Missing Cells: ${dataset.quality.totalMissingCells}`,
      `Duplicate Records: ${dataset.quality.duplicateRowsCount}`,
      `\n## Column Schema & Summaries:`,
    ];

    dataset.columns.forEach((col) => {
      const stats = dataset.stats[col.name];
      lines.push(`- **${col.name}** (${col.type}): Missing: ${stats?.missingCount || 0}`);
      if (stats?.numeric) {
        lines.push(
          `    Min: ${stats.numeric.min}, Max: ${stats.numeric.max}, Mean: ${stats.numeric.mean.toFixed(2)}, Sum: ${stats.numeric.sum.toFixed(2)}`
        );
      }
    });

    const reportContent = lines.join('\n');
    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dataset.name.replace(/\.[^/.]+$/, '')}_audit_report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedType('report');
    setTimeout(() => setDownloadedType(null), 2500);
  };

  const downloadJson = () => {
    const jsonContent = JSON.stringify(
      {
        datasetName: dataset.name,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        quality: dataset.quality,
        columns: dataset.columns,
        statistics: dataset.stats,
      },
      null,
      2
    );

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dataset.name.replace(/\.[^/.]+$/, '')}_metadata.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedType('json');
    setTimeout(() => setDownloadedType(null), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg">
        <h3 className="text-base font-bold text-white">Data & Insights Export Hub</h3>
        <p className="text-xs text-slate-400">
          Export verified datasets, markdown executive reports, or JSON metadata schemas.
        </p>
      </div>

      {/* 3 Bento Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV */}
        <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#a120f7]/15 border border-[#a120f7]/30 flex items-center justify-center text-[#c084fc]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Cleaned CSV Dataset</h4>
            <p className="text-xs text-slate-400">
              Download current dataset with applied cleaning transformations ({dataset.rowCount} rows).
            </p>
          </div>
          <button
            onClick={downloadCsv}
            className="w-full py-2.5 px-3 rounded-xl bg-[#a120f7] hover:bg-[#8e17db] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-[#a120f7]/20"
          >
            {downloadedType === 'csv' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadedType === 'csv' ? 'Downloaded CSV' : 'Export Cleaned CSV'}</span>
          </button>
        </div>

        {/* Markdown */}
        <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#a120f7]/15 border border-[#a120f7]/30 flex items-center justify-center text-[#c084fc]">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Markdown Audit Report</h4>
            <p className="text-xs text-slate-400">
              Executive documentation with column summaries, hygiene scores, and descriptive statistics.
            </p>
          </div>
          <button
            onClick={downloadReport}
            className="w-full py-2.5 px-3 rounded-xl bg-[#a120f7] hover:bg-[#8e17db] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-[#a120f7]/20"
          >
            {downloadedType === 'report' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadedType === 'report' ? 'Downloaded Report' : 'Export Markdown (.md)'}</span>
          </button>
        </div>

        {/* JSON Schema */}
        <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#a120f7]/15 border border-[#a120f7]/30 flex items-center justify-center text-[#c084fc]">
              <FileCode className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">JSON Metadata Schema</h4>
            <p className="text-xs text-slate-400">
              Machine-readable schema with data types, completeness ratios, and pre-computed stats.
            </p>
          </div>
          <button
            onClick={downloadJson}
            className="w-full py-2.5 px-3 rounded-xl bg-[#a120f7] hover:bg-[#8e17db] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-[#a120f7]/20"
          >
            {downloadedType === 'json' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloadedType === 'json' ? 'Downloaded JSON' : 'Export JSON Schema'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
