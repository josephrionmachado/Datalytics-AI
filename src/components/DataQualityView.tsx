import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  Trash2,
  Eraser,
  Wand2,
} from 'lucide-react';
import { Dataset, CleaningActionType } from '../types/data';
import { CleaningPreviewModal } from './CleaningPreviewModal';

interface DataQualityViewProps {
  dataset: Dataset | null;
  onUpdateDataset: (dataset: Dataset) => void;
  onOpenUpload: () => void;
  onLoadSample: () => void;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({
  dataset,
  onUpdateDataset,
  onOpenUpload,
  onLoadSample,
}) => {
  const [activeModalAction, setActiveModalAction] = useState<CleaningActionType | null>(null);

  if (!dataset) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#202228] rounded-2xl border border-[#2C2F37] text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-[#a120f7]/15 text-[#c084fc] rounded-2xl flex items-center justify-center mx-auto border border-[#a120f7]/30">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400">
          Upload a CSV or load the sample dataset to inspect hygiene, missing cells, and cleaning recommendations.
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

  const { healthScore: qualityScore, totalMissingCells: totalMissingValues, duplicateRowsCount } = dataset.quality;
  const isHealthy = qualityScore >= 90;

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Bento Top Header Tile */}
      <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#a120f7]/15 border border-[#a120f7]/30 flex items-center justify-center text-[#c084fc]">
            {isHealthy ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 text-amber-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Dataset Quality & Audit Studio</h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isHealthy
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800'
                }`}
              >
                Health: {qualityScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audit results for {dataset.name} · {dataset.history.length} transformation(s) applied
            </p>
          </div>
        </div>

        {dataset.history.length > 0 && (
          <span className="text-xs text-[#c084fc] bg-[#a120f7]/15 px-3 py-1.5 rounded-xl border border-[#a120f7]/30 font-medium">
            Original dataset preserved for rollback
          </span>
        )}
      </div>

      {/* Bento 4-Tile Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quality Score */}
        <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-lg space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Audit Health Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{qualityScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="w-full bg-[#18191E] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                qualityScore > 85 ? 'bg-[#a120f7]' : qualityScore > 70 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${qualityScore}%` }}
            />
          </div>
        </div>

        {/* Missing Values */}
        <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-lg space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Missing / Null Values
          </span>
          <div className="text-3xl font-black font-mono text-[#c084fc]">
            {totalMissingValues}
          </div>
          <p className="text-xs text-slate-400">
            {totalMissingValues === 0 ? 'No empty cells detected' : 'Incomplete cells across columns'}
          </p>
        </div>

        {/* Duplicate Rows */}
        <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-lg space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Duplicate Rows
          </span>
          <div className="text-3xl font-black font-mono text-slate-200">
            {duplicateRowsCount}
          </div>
          <p className="text-xs text-slate-400">
            {duplicateRowsCount === 0 ? 'Zero exact duplicates' : 'Identical records found'}
          </p>
        </div>

        {/* Schema Status */}
        <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-lg space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Column Structure
          </span>
          <div className="text-3xl font-black font-mono text-white">
            {dataset.columnCount}
          </div>
          <p className="text-xs text-slate-400">
            All data types inferred deterministically
          </p>
        </div>
      </div>

      {/* Bento Cleaning Studio Operations Tile */}
      <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#2C2F37] pb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#c084fc]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Recommended Cleaning Operations
            </h4>
          </div>
          <span className="text-xs text-slate-400">Preview changes before applying</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Operation 1: Drop Duplicates */}
          <div className="p-4 bg-[#18191E] rounded-xl border border-[#2C2F37] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Trash2 className="w-4 h-4 text-[#c084fc]" />
                <h5 className="text-xs font-bold text-white">Remove Duplicate Rows</h5>
              </div>
              <p className="text-[11px] text-slate-400">
                Purge completely identical rows to prevent double-counting metrics in aggregations.
              </p>
            </div>
            <button
              onClick={() => setActiveModalAction('remove_duplicates')}
              disabled={duplicateRowsCount === 0}
              className="w-full py-2 px-3 rounded-lg bg-[#a120f7] hover:bg-[#8e17db] text-white text-xs font-semibold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#a120f7]/20"
            >
              <span>{duplicateRowsCount > 0 ? `Clean ${duplicateRowsCount} Duplicates` : 'No Duplicates'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Operation 2: Drop Missing Rows */}
          <div className="p-4 bg-[#18191E] rounded-xl border border-[#2C2F37] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Eraser className="w-4 h-4 text-[#c084fc]" />
                <h5 className="text-xs font-bold text-white">Drop Incomplete Rows</h5>
              </div>
              <p className="text-[11px] text-slate-400">
                Discard any record that contains one or more missing values across any column.
              </p>
            </div>
            <button
              onClick={() => setActiveModalAction('drop_missing_rows')}
              disabled={totalMissingValues === 0}
              className="w-full py-2 px-3 rounded-lg bg-[#a120f7] hover:bg-[#8e17db] text-white text-xs font-semibold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#a120f7]/20"
            >
              <span>{totalMissingValues > 0 ? 'Purge Incomplete Rows' : 'No Missing Rows'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Operation 3: Impute Missing Numeric */}
          <div className="p-4 bg-[#18191E] rounded-xl border border-[#2C2F37] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-[#c084fc]" />
                <h5 className="text-xs font-bold text-white">Impute Numeric Means</h5>
              </div>
              <p className="text-[11px] text-slate-400">
                Fill blank numeric entries with the calculated column average to preserve sample size.
              </p>
            </div>
            <button
              onClick={() => setActiveModalAction('impute_numeric_mean')}
              disabled={totalMissingValues === 0}
              className="w-full py-2 px-3 rounded-lg bg-[#a120f7] hover:bg-[#8e17db] text-white text-xs font-semibold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#a120f7]/20"
            >
              <span>Impute Missing Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bento Column Hygiene Matrix */}
      <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Column-by-Column Health Breakdown
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2C2F37] text-slate-400">
                <th className="py-2 px-3 font-semibold">Column</th>
                <th className="py-2 px-3 font-semibold">Inferred Type</th>
                <th className="py-2 px-3 font-semibold text-right">Missing Count</th>
                <th className="py-2 px-3 font-semibold text-right">Completeness</th>
                <th className="py-2 px-3 font-semibold text-right">Distinct Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C2F37] font-mono text-[11px]">
              {dataset.columns.map((col) => {
                const stats = dataset.stats[col.name];
                const missing = stats?.missingCount || 0;
                const completeness = (((dataset.rowCount - missing) / dataset.rowCount) * 100).toFixed(1);
                const distinct = stats?.categorical?.uniqueCount ?? (stats?.numeric ? 'Numeric' : '-');

                return (
                  <tr key={col.name} className="hover:bg-[#18191E]/60 transition">
                    <td className="py-2.5 px-3 font-semibold text-white font-sans">{col.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18191E] border border-[#2C2F37] text-[#c084fc]">
                        {col.type}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${missing > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {missing}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{completeness}%</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{distinct}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cleaning Preview Modal */}
      {activeModalAction && (
        <CleaningPreviewModal
          isOpen={true}
          onClose={() => setActiveModalAction(null)}
          actionType={activeModalAction}
          dataset={dataset}
          onConfirm={(cleaned) => {
            onUpdateDataset(cleaned);
            setActiveModalAction(null);
          }}
        />
      )}
    </div>
  );
};
