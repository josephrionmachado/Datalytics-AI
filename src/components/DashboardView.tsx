import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Columns,
  AlertTriangle,
  Copy,
  Sparkles,
  Bot,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  TableProperties,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Dataset } from '../types/data';
import { ActiveTab } from './Sidebar';
import { aggregateDataForChart } from '../utils/dataProcessor';

interface DashboardViewProps {
  dataset: Dataset | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onLaunchAnalystWithPrompt?: (prompt: string) => void;
}

// Minimalist Bento palette featuring #A120F7 as the secondary accent
const BENTO_PALETTE = ['#A120F7', '#C084FC', '#6366F1', '#38BDF8', '#94A3B8', '#34D399'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  dataset,
  onOpenUpload,
  onLoadSample,
  setActiveTab,
  onLaunchAnalystWithPrompt,
}) => {
  // Empty State Bento
  if (!dataset) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-5 animate-in fade-in duration-300">
        {/* Bento Hero Box with #A120F7 accent */}
        <div className="rounded-2xl bg-[#16171C] text-white p-8 sm:p-12 border border-[#2B2D35] shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#A120F7]">
              Minimalist Data Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Turn Raw Data Into <span className="text-[#A120F7]">Smart Decisions</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl font-normal">
              Upload any comma-delimited spreadsheet to immediately inspect distributions, audit data quality, generate interactive visualizations, and converse with an AI analyst grounded in deterministic math.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenUpload}
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#A120F7] hover:bg-[#8e17db] text-white transition cursor-pointer font-sans shadow-md shadow-[#A120F7]/25"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload CSV Dataset</span>
              </button>
              <button
                onClick={onLoadSample}
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#22242B] hover:bg-[#2A2C35] text-slate-300 border border-[#30333C] transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#A120F7]" />
                <span>Try Demo Sales Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#202228] p-5 rounded-2xl border border-[#2B2E36] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#282B33] flex items-center justify-center text-[#A120F7] mb-3">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Interactive Studio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically recommend bar, line, area, and scatter charts with custom aggregations based on your column schema.
            </p>
          </div>

          <div className="bg-[#202228] p-5 rounded-2xl border border-[#2B2E36] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#282B33] flex items-center justify-center text-[#A120F7] mb-3">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white mb-1">AI Data Analyst</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask natural language business questions. Computed deterministically on client side and interpreted with precision by Gemini.
            </p>
          </div>

          <div className="bg-[#202228] p-5 rounded-2xl border border-[#2B2E36] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#282B33] flex items-center justify-center text-[#A120F7] mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Data Quality & Cleaning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated health score auditing. Detect duplicates, missing values, and outliers with previewable transformations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Dataset Analytics
  const numericCols = dataset.columns.filter((c) => c.type === 'number');
  const categoricalCols = dataset.columns.filter((c) => c.type === 'string' || c.type === 'boolean');
  const dateCols = dataset.columns.filter((c) => c.type === 'date');

  // Dimension & Metric for dynamic Bento Chart
  const [bentoDim, setBentoDim] = useState<string>(
    categoricalCols[0]?.name || dataset.columns[0]?.name || ''
  );
  const [bentoMetric, setBentoMetric] = useState<string>(
    numericCols[0]?.name || ''
  );
  const [bentoAgg, setBentoAgg] = useState<'sum' | 'avg' | 'count'>('sum');

  // Compute bento chart data
  const bentoChartData = useMemo(() => {
    if (!bentoDim || !bentoMetric) return [];
    return aggregateDataForChart(dataset.rows, bentoDim, bentoMetric, bentoAgg, 6, 'value-desc');
  }, [dataset.rows, bentoDim, bentoMetric, bentoAgg]);

  // Leaderboard data
  const leaderboardData = useMemo(() => {
    if (!bentoDim || !bentoMetric) return [];
    const items = aggregateDataForChart(dataset.rows, bentoDim, bentoMetric, 'sum', 4, 'value-desc');
    const total = items.reduce((acc, curr) => acc + (curr.value || 0), 0);
    return items.map((item) => ({
      ...item,
      share: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0,
    }));
  }, [dataset.rows, bentoDim, bentoMetric]);

  const handlePromptClick = (prompt: string) => {
    if (onLaunchAnalystWithPrompt) {
      onLaunchAnalystWithPrompt(prompt);
    } else {
      setActiveTab('analyst');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* BENTO MASTER GRID INSIDE GREY BOX                              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5">
        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 1: Dataset Hero Identity (Span 8 Cols)             */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-8 bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-xs flex flex-col justify-between hover:border-[#383C47] transition">
          <div>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{dataset.name}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-400">{dataset.fileName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{(dataset.fileSize / 1024).toFixed(1)} KB</span>
              </div>
              {dataset.isSynthetic && (
                <span className="text-[10px] font-mono font-medium text-[#C084FC] bg-[#A120F7]/10 px-2 py-0.5 rounded border border-[#A120F7]/30">
                  Synthetic Dataset
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight">
              Dataset Telemetry & Active Records
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              {dataset.rowCount.toLocaleString()} validated records across {dataset.columnCount} fields.
              Aggregations computed deterministically on client thread.
            </p>
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#2B2E36] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono tabular-nums font-semibold text-white">
                {dataset.history.length}
              </span>
              <span>transformations applied</span>
              {dataset.history.length > 0 && (
                <span className="text-[#C084FC] font-mono">· Active State</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('analyst')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#A120F7] hover:bg-[#8e17db] text-white transition cursor-pointer shadow-xs shadow-[#A120F7]/25"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask AI Analyst</span>
              </button>
              <button
                onClick={() => setActiveTab('explorer')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2A2C34] hover:bg-[#32353E] text-slate-200 transition cursor-pointer"
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Data Explorer</span>
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 2: Health Score Gauge (Span 4 Cols)                */}
        {/* ------------------------------------------------------------ */}
        <div
          onClick={() => setActiveTab('quality')}
          className="lg:col-span-4 bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-xs flex flex-col justify-between hover:border-[#383C47] transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Health Index
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
          </div>

          <div className="my-2 flex items-center justify-center gap-4">
            <div className="relative w-18 h-18 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#2C2E36]"
                  strokeWidth="3.6"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#A120F7"
                  strokeDasharray={`${dataset.quality.healthScore}, 100`}
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white font-mono tabular-nums">
                  {dataset.quality.healthScore}%
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-bold text-white">
                {dataset.quality.healthScore >= 90
                  ? 'Audit Nominal'
                  : dataset.quality.healthScore >= 75
                  ? 'Minor Quality Flags'
                  : 'Needs Cleaning'}
              </div>
              <div className="text-slate-400 font-mono text-[11px] tabular-nums">
                {dataset.quality.totalMissingCells} missing · {dataset.quality.duplicateRowsCount} dupes
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2B2E36] text-[11px] text-[#C084FC] font-semibold flex items-center justify-between">
            <span>Audit & cleaning operations</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 3: Total Records Metric Tile (Span 3 Cols)        */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-3 bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
              Total Volume
            </span>
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {dataset.rowCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Rows parsed and validated</div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A120F7]"></span>
            <span>Nominal integrity</span>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 4: Column Schema Breakdown (Span 3 Cols)          */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-3 bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
              Schema Fields
            </span>
            <Columns className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {dataset.columnCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {numericCols.length} num · {categoricalCols.length} text · {dateCols.length} dates
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Strong typing verified
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 5: Missing Values Tile (Span 3 Cols)              */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-3 bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
              Missing Values
            </span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {dataset.quality.totalMissingCells}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
              {dataset.quality.missingCellsPercentage}% missing rate
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {dataset.quality.totalMissingCells === 0 ? 'Zero unpopulated cells' : 'Imputation ready'}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 6: Duplicate Records Tile (Span 3 Cols)           */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-3 bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
              Duplicates
            </span>
            <Copy className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {dataset.quality.duplicateRowsCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Identical record duplicates</div>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {dataset.quality.duplicateRowsCount === 0 ? 'No redundant rows' : '1-click purge in Quality'}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 7: Master Visualizer Bento Card (Span 8 Cols)     */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-8 bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2B2E36] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Primary Metric Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Aggregated values for {bentoMetric} grouped by {bentoDim}
              </p>
            </div>

            {/* In-Card Axis Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bentoDim}
                onChange={(e) => setBentoDim(e.target.value)}
                className="bg-[#18191E] border border-[#333640] rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                title="Select Dimension"
              >
                {categoricalCols.map((c) => (
                  <option key={c.name} value={c.name} className="bg-[#18191E] text-slate-200">
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={bentoMetric}
                onChange={(e) => setBentoMetric(e.target.value)}
                className="bg-[#18191E] border border-[#333640] rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                title="Select Metric"
              >
                {numericCols.map((c) => (
                  <option key={c.name} value={c.name} className="bg-[#18191E] text-slate-200">
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setActiveTab('visualizations')}
                className="text-xs text-[#C084FC] hover:underline font-semibold ml-1 cursor-pointer"
              >
                Full Studio →
              </button>
            </div>
          </div>

          {/* Minimalist Chart Canvas */}
          <div className="h-64 w-full pt-3">
            {bentoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bentoChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141519',
                      borderRadius: '8px',
                      border: '1px solid #30333D',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [
                      Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 }),
                      `${bentoAgg.toUpperCase()} of ${bentoMetric}`,
                    ]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {bentoChartData.map((_, index) => (
                      <Cell
                        key={`bento-cell-${index}`}
                        fill={index === 0 ? '#A120F7' : BENTO_PALETTE[index % BENTO_PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Select valid dimensions to render distribution chart.
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 8: Performance Leaderboard (Span 4 Cols)          */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-4 bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#2B2E36] pb-3">
              <h3 className="text-sm font-bold text-white">Segment Leaders</h3>
              <span className="text-[10px] font-bold uppercase text-slate-400">Share of Total</span>
            </div>

            <div className="space-y-3 mt-4">
              {leaderboardData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                      {item.name}
                    </span>
                    <span className="font-mono tabular-nums text-slate-400 font-medium">
                      {item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({item.share}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#18191E] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, item.share)}%`,
                        backgroundColor: idx === 0 ? '#A120F7' : '#6366F1',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#2B2E36] text-xs text-slate-400 font-mono">
            {dataset.rowCount} records aggregated.
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 9: AI Analyst Quick Launcher (Span 6 Cols)        */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-6 bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#A120F7]/20 text-[#C084FC] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-white">AI Data Analyst</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Deterministic Math</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Ask natural language questions grounded in verified data metrics:
            </p>
          </div>

          <div className="space-y-2">
            {[
              'Which category has the highest total sales or revenue?',
              'What is the monthly revenue trend over time?',
              'Which region performs best overall?',
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(q)}
                className="w-full text-left p-2.5 rounded-xl bg-[#1A1B20] hover:bg-[#252830] border border-[#2B2E36] text-xs font-medium text-slate-300 transition flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate">{q}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#A120F7] transition shrink-0 ml-2" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('analyst')}
            className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-[#2A2C35] hover:bg-[#343642] text-white transition flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <Bot className="w-3.5 h-3.5 text-[#A120F7]" />
            <span>Open Dedicated Analyst Console</span>
          </button>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BENTO CELL 10: Executive Insights Briefing (Span 6 Cols)      */}
        {/* ------------------------------------------------------------ */}
        <div className="lg:col-span-6 bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#A120F7]/20 text-[#C084FC] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-white">Executive Briefing</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">1-Click Synthesis</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Synthesize key findings, underlying statistical distributions, trend directions,
              risk factors, and strategic next steps in a structured Markdown report.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#1A1B20] border border-[#2B2E36] text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200">Briefing scope:</div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>· Key Findings</span>
              <span>· Trend Signals</span>
              <span>· Quality Audit</span>
              <span>· Action Items</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('insights')}
            className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-[#A120F7] hover:bg-[#8e17db] text-white shadow-xs shadow-[#A120F7]/30 transition flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Executive Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
