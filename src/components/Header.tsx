import React from 'react';
import {
  Menu,
  UploadCloud,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { Dataset } from '../types/data';

interface HeaderProps {
  activeTab: ActiveTab;
  dataset: Dataset | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  onResetData?: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  dataset,
  onOpenUpload,
  onLoadSample,
  onResetData,
  onToggleMobileMenu,
}) => {
  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Overview of records, metrics, distribution, and data health',
    },
    explorer: {
      title: 'Data Explorer',
      subtitle: 'Inspect, filter, search, and analyze columns in tabular view',
    },
    visualizations: {
      title: 'Interactive Visualizations',
      subtitle: 'Dynamic charts with smart recommendations and custom aggregations',
    },
    analyst: {
      title: 'AI Data Analyst',
      subtitle: 'Ask questions in natural language backed by deterministic math',
    },
    quality: {
      title: 'Data Quality & Cleaning',
      subtitle: 'Audit missing values, duplicates, and apply previewable transformations',
    },
    insights: {
      title: 'AI Executive Insights',
      subtitle: 'Deep strategic briefing, trends, risk factors, and next actions',
    },
    export: {
      title: 'Export & Reporting',
      subtitle: 'Download cleaned datasets, Markdown briefings, and analysis summaries',
    },
  };

  const currentInfo = titles[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-[#1A1C21]/95 backdrop-blur-md border-b border-[#282A31] px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-[#252830] rounded-lg lg:hidden transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentInfo.title}
              </h1>
              {dataset && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <span aria-hidden="true">·</span>
                  <span>{dataset.fileName}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {dataset && dataset.history.length > 0 && onResetData && (
            <button
              onClick={onResetData}
              title="Revert all transformations back to original uploaded state"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Cleaned ({dataset.history.length})</span>
            </button>
          )}

          {!dataset && (
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-300 bg-[#252830] hover:bg-[#2E313A] border border-[#353842] transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#A120F7]" />
              <span className="hidden sm:inline">Demo Sales Data</span>
              <span className="sm:hidden">Demo</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white bg-[#A120F7] hover:bg-[#8e17db] shadow-xs shadow-[#A120F7]/30 transition cursor-pointer font-sans"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
