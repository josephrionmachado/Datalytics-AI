import React from 'react';
import {
  LayoutDashboard,
  TableProperties,
  BarChart3,
  Bot,
  ShieldCheck,
  Sparkles,
  Download,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { Dataset } from '../types/data';

export type ActiveTab =
  | 'dashboard'
  | 'explorer'
  | 'visualizations'
  | 'analyst'
  | 'quality'
  | 'insights'
  | 'export';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dataset: Dataset | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  dataset,
  onOpenUpload,
  onLoadSample,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: dataset ? `${dataset.rowCount}` : null,
    },
    {
      id: 'explorer' as ActiveTab,
      label: 'Data Explorer',
      icon: TableProperties,
      badge: dataset ? `${dataset.columnCount}c` : null,
    },
    {
      id: 'visualizations' as ActiveTab,
      label: 'Visualizations',
      icon: BarChart3,
    },
    {
      id: 'analyst' as ActiveTab,
      label: 'AI Analyst',
      icon: Bot,
      highlight: true,
    },
    {
      id: 'quality' as ActiveTab,
      label: 'Data Quality',
      icon: ShieldCheck,
      badge: dataset ? `${dataset.quality.healthScore}%` : null,
    },
    {
      id: 'insights' as ActiveTab,
      label: 'Executive Briefing',
      icon: Sparkles,
    },
    {
      id: 'export' as ActiveTab,
      label: 'Export Data',
      icon: Download,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#141519] text-slate-300 flex flex-col border-r border-[#282A30] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-[#25272E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#202228] border border-white/10 flex items-center justify-center text-[#A120F7] shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-white text-base tracking-tight">Datalytics</span>
                <span className="text-[10px] font-mono font-bold text-[#A120F7]">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight mt-1">
                Turn Raw Data Into Smart Decisions
              </p>
            </div>
          </div>
        </div>

        {/* Current Dataset Status Box */}
        <div className="p-3 border-b border-[#25272E]">
          {dataset ? (
            <div className="bg-[#1C1E24] rounded-xl p-3 border border-[#2D3038]">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#A120F7] shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{dataset.fileName}</p>
                  <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {dataset.rowCount.toLocaleString()} rows · {dataset.columnCount} cols
                  </p>
                </div>
              </div>
              {dataset.isSynthetic && (
                <div className="mt-1.5 text-[10px] text-[#A120F7] font-medium">
                  Synthetic Retail Sample
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#1C1E24] rounded-xl p-3 border border-[#2D3038] text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">No dataset loaded</p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={onOpenUpload}
                  className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg bg-[#A120F7] hover:bg-[#8e17db] text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload CSV</span>
                </button>
                <button
                  onClick={onLoadSample}
                  className="w-full text-xs font-medium py-1 px-3 rounded-lg bg-[#25272E] hover:bg-[#2C2E36] text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Load Sample Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-0.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-[#22242B] text-white font-semibold border-l-2 border-[#A120F7]'
                    : 'text-slate-400 hover:bg-[#1C1E24] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-[#A120F7]'
                        : item.highlight
                        ? 'text-[#A120F7]/90'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-[#A120F7]/20 text-[#D8B4FE] border border-[#A120F7]/40'
                        : 'bg-[#202228] text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-[#25272E] bg-[#111215] flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] font-mono">Deterministic Engine</span>
          <button
            onClick={onOpenUpload}
            className="text-xs text-[#A120F7] hover:underline font-semibold cursor-pointer"
          >
            + Upload
          </button>
        </div>
      </aside>
    </>
  );
};
