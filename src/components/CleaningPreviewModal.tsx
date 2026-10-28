import React from 'react';
import { X, ArrowRight, Wand2 } from 'lucide-react';
import { Dataset, CleaningActionType } from '../types/data';
import { applyCleaningOperation } from '../utils/cleaningOperations';

interface CleaningPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: CleaningActionType;
  dataset: Dataset;
  onConfirm: (cleanedDataset: Dataset) => void;
}

export const CleaningPreviewModal: React.FC<CleaningPreviewModalProps> = ({
  isOpen,
  onClose,
  actionType,
  dataset,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const preview = applyCleaningOperation(dataset, actionType);

  const titles: Record<CleaningActionType, string> = {
    remove_duplicates: 'Remove Duplicate Rows',
    drop_missing_rows: 'Drop Rows with Missing Values',
    impute_numeric_mean: 'Impute Missing Numeric Values with Mean',
    impute_numeric_median: 'Impute Missing Numeric Values with Median',
    fill_missing_constant: 'Fill Missing Values with Constant',
    trim_text_whitespace: 'Trim Leading and Trailing Whitespace',
    remove_outliers: 'Filter Outliers Beyond IQR Fence',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#202228] border border-[#2C2F37] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between border-b border-[#2C2F37] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#a120f7]/15 border border-[#a120f7]/30 flex items-center justify-center text-[#c084fc]">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Preview Transformation</h3>
              <p className="text-[11px] text-slate-400">{titles[actionType]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#18191E] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Change Comparison */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#18191E] rounded-xl border border-[#2C2F37]">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Before</span>
            <div className="mt-1 font-mono font-bold text-white text-base">
              {dataset.rowCount.toLocaleString()} <span className="text-xs text-slate-400 font-sans">rows</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Health Score: {dataset.quality.healthScore}/100
            </div>
          </div>

          <div className="p-3 bg-[#18191E] rounded-xl border border-[#2C2F37]">
            <span className="text-[10px] text-[#c084fc] font-semibold block uppercase">After Preview</span>
            <div className="mt-1 font-mono font-bold text-[#c084fc] text-base">
              {preview.rowCount.toLocaleString()} <span className="text-xs text-slate-400 font-sans">rows</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              Health Score: {preview.quality.healthScore}/100
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          The original dataset is safely preserved in memory. You can revert this cleaning step at any time using the Revert button in the header.
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#2C2F37]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#18191E] hover:bg-[#282A31] text-slate-300 transition cursor-pointer border border-[#2C2F37]"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(preview)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#a120f7] hover:bg-[#8e17db] text-white transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#a120f7]/20"
          >
            <span>Apply Changes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
