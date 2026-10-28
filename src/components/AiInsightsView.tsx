import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RefreshCw,
  Award,
} from 'lucide-react';
import { Dataset } from '../types/data';

interface AiInsightsViewProps {
  dataset: Dataset | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({
  dataset,
  onOpenUpload,
  onLoadSample,
}) => {
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!dataset) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#202228] rounded-2xl border border-[#2C2F37] text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-[#a120f7]/15 text-[#c084fc] rounded-2xl flex items-center justify-center mx-auto border border-[#a120f7]/30">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400">
          Upload a CSV or load the sample data to synthesize automated executive insights.
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

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const numericColumns = dataset.columns.filter((c) => c.type === 'number');
      const statsSummary = numericColumns.map((c) => ({
        column: c.name,
        stats: dataset.stats[c.name]?.numeric,
      }));

      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetMeta: {
            name: dataset.name,
            rowCount: dataset.rowCount,
            columnCount: dataset.columnCount,
            columns: dataset.columns.map((c) => c.name),
            qualityScore: dataset.quality.healthScore,
          },
          statsSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate executive insights.');
      }

      const data = await response.json();
      setExecutiveSummary(data.summary || 'Summary could not be generated.');
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(executiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Top Bento Header Tile */}
      <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#a120f7]/15 border border-[#a120f7]/30 flex items-center justify-center text-[#c084fc]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Executive Strategic Briefing</h3>
            <p className="text-xs text-slate-400">
              AI-driven synthesis grounded in deterministic calculations for {dataset.name}
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-[#a120f7] hover:bg-[#8e17db] text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md shadow-[#a120f7]/20"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synthesizing Insights...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{executiveSummary ? 'Regenerate Briefing' : 'Generate Executive Briefing'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-200 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Main Insights Content Card */}
      <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-6 shadow-lg min-h-[300px]">
        {executiveSummary ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C2F37] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c084fc]">
                Executive Findings
              </span>
              <button
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            </div>
            <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {executiveSummary}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-[#18191E] rounded-2xl border border-[#2C2F37] flex items-center justify-center mx-auto text-[#c084fc]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Briefing Generated Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the button above to run Gemini AI analysis across aggregate statistics and detect key business findings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
