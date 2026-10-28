import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Sparkles,
  Sliders,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { Dataset, ChartType, AggregationType } from '../types/data';
import { aggregateDataForChart } from '../utils/dataProcessor';

interface VisualizationsViewProps {
  dataset: Dataset | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
}

const PALETTE = [
  '#a120f7', // Electric Purple (Secondary Brand)
  '#c084fc', // Bright Lavender
  '#6366f1', // Indigo Accent
  '#38bdf8', // Sky Blue
  '#34d399', // Mint Emerald
  '#f59e0b', // Warm Amber
  '#ec4899', // Pink Accent
  '#94a3b8', // Cool Slate
];

export const VisualizationsView: React.FC<VisualizationsViewProps> = ({
  dataset,
  onOpenUpload,
  onLoadSample,
}) => {
  if (!dataset) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#202228] rounded-2xl border border-[#2C2F37] text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-[#a120f7]/15 text-[#c084fc] rounded-2xl flex items-center justify-center mx-auto border border-[#a120f7]/30">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400">
          Upload a CSV or load the sample sales data to create interactive visual charts.
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

  const numericColumns = dataset.columns.filter((c) => c.type === 'number');
  const categoricalColumns = dataset.columns.filter((c) => c.type === 'string' || c.type === 'boolean');
  const dateColumns = dataset.columns.filter((c) => c.type === 'date');

  const [xAxis, setXAxis] = useState<string>(
    categoricalColumns[0]?.name || dateColumns[0]?.name || dataset.columns[0]?.name || ''
  );
  const [yAxis, setYAxis] = useState<string>(
    numericColumns[0]?.name || dataset.columns[1]?.name || ''
  );
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [topN, setTopN] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'value-desc' | 'value-asc' | 'name'>('value-desc');

  const selectedXCol = dataset.columns.find((c) => c.name === xAxis);
  const selectedYCol = dataset.columns.find((c) => c.name === yAxis);

  // Recommendation engine
  const recommendedType: ChartType = useMemo(() => {
    if (selectedXCol?.type === 'date') return 'line';
    if (selectedXCol?.type === 'number' && selectedYCol?.type === 'number') return 'scatter';
    if (selectedXCol?.type === 'string') {
      const uniqueCount = dataset.stats[selectedXCol.name]?.categorical?.uniqueCount || 10;
      if (uniqueCount <= 6) return 'pie';
      return 'bar';
    }
    return 'bar';
  }, [selectedXCol, selectedYCol, dataset.stats]);

  // Aggregate data
  const chartData = useMemo(() => {
    if (!xAxis || !yAxis) return [];

    if (chartType === 'scatter') {
      return dataset.rows
        .filter((r) => r[xAxis] !== null && r[yAxis] !== null)
        .slice(0, 150)
        .map((r, i) => ({
          x: Number(r[xAxis]),
          y: Number(r[yAxis]),
          label: r['Product_Name'] || r['Order_ID'] || `Row ${i + 1}`,
        }));
    }

    return aggregateDataForChart(dataset.rows, xAxis, yAxis, aggregation, topN, sortBy);
  }, [dataset.rows, xAxis, yAxis, aggregation, topN, sortBy, chartType]);

  // Summary statistics
  const totalValue = useMemo(() => {
    if (chartType === 'scatter') return 0;
    return (chartData as { value: number }[]).reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [chartData, chartType]);

  const avgValue = useMemo(() => {
    if (chartType === 'scatter' || !chartData.length) return 0;
    return totalValue / chartData.length;
  }, [chartData, totalValue, chartType]);

  const maxValueGroup = useMemo(() => {
    if (chartType === 'scatter' || !chartData.length) return null;
    return [...(chartData as { name: string; value: number }[])].sort((a, b) => b.value - a.value)[0];
  }, [chartData, chartType]);

  const minValueGroup = useMemo(() => {
    if (chartType === 'scatter' || !chartData.length) return null;
    return [...(chartData as { name: string; value: number }[])].sort((a, b) => a.value - b.value)[0];
  }, [chartData, chartType]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* BENTO TOP CONTROLS TILE                                        */}
      {/* ============================================================== */}
      <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C2F37] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#c084fc]" />
            <h3 className="text-sm font-bold text-white">Visualization Studio</h3>
            <span className="text-xs text-slate-400">· Configure axes & aggregations</span>
          </div>

          {chartType !== recommendedType && (
            <button
              onClick={() => setChartType(recommendedType)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#a120f7]/15 hover:bg-[#a120f7]/25 text-[#c084fc] border border-[#a120f7]/30 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a120f7]" />
              <span>Recommended: {recommendedType.toUpperCase()} Chart</span>
            </button>
          )}
        </div>

        {/* Bento Control Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className="w-full bg-[#18191E] border border-[#2C2F37] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-[#a120f7] cursor-pointer"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Donut / Pie</option>
              <option value="scatter">Scatter Plot</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Dimension (X)</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full bg-[#18191E] border border-[#2C2F37] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-[#a120f7] cursor-pointer"
            >
              {dataset.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Metric (Y)</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full bg-[#18191E] border border-[#2C2F37] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-[#a120f7] cursor-pointer"
            >
              {numericColumns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Aggregation</label>
            <select
              value={aggregation}
              disabled={chartType === 'scatter'}
              onChange={(e) => setAggregation(e.target.value as AggregationType)}
              className="w-full bg-[#18191E] border border-[#2C2F37] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-[#a120f7] disabled:opacity-40 cursor-pointer"
            >
              <option value="sum">Sum (Total)</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Max Groups</label>
            <select
              value={topN}
              disabled={chartType === 'scatter'}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="w-full bg-[#18191E] border border-[#2C2F37] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-[#a120f7] disabled:opacity-40 cursor-pointer"
            >
              <option value={5}>Top 5</option>
              <option value={8}>Top 8</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={25}>Top 25</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Order</label>
            <select
              value={sortBy}
              disabled={chartType === 'scatter'}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#18191E] border border-[#2C2F37] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-[#a120f7] disabled:opacity-40 cursor-pointer"
            >
              <option value="value-desc">High to Low</option>
              <option value="value-asc">Low to High</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BENTO MID ROW: Main Chart Canvas (8) + Summary Metrics (4)     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bento Chart Stage */}
        <div className="lg:col-span-8 bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#2C2F37] pb-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                {chartType === 'scatter'
                  ? `Correlation: ${xAxis} vs ${yAxis}`
                  : `${aggregation.toUpperCase()} of ${yAxis} by ${xAxis}`}
              </h2>
              <p className="text-xs text-slate-400">
                Visualizing {chartData.length} aggregated segments
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-[#c084fc] bg-[#a120f7]/15 px-2.5 py-1 rounded-lg border border-[#a120f7]/20">
              {chartType.toUpperCase()}
            </span>
          </div>

          {/* Chart viewport */}
          <div className="h-80 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No data points found for selected configuration.
              </div>
            ) : chartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData as any[]} margin={{ top: 15, right: 15, left: 15, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2C2F37" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141519',
                      borderRadius: '12px',
                      border: '1px solid #2C2F37',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [
                      Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 }),
                      `${aggregation} of ${yAxis}`,
                    ]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {(chartData as any[]).map((_, index) => (
                      <Cell key={`bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : chartType === 'line' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData as any[]} margin={{ top: 15, right: 15, left: 15, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2C2F37" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141519',
                      borderRadius: '12px',
                      border: '1px solid #2C2F37',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [
                      Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 }),
                      `${aggregation} of ${yAxis}`,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#a120f7"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#c084fc', strokeWidth: 1.5, stroke: '#141519' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : chartType === 'area' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData as any[]} margin={{ top: 15, right: 15, left: 15, bottom: 35 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a120f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a120f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2C2F37" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141519',
                      borderRadius: '12px',
                      border: '1px solid #2C2F37',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [
                      Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 }),
                      `${aggregation} of ${yAxis}`,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#a120f7"
                    strokeWidth={2.5}
                    fill="url(#areaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : chartType === 'pie' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141519',
                      borderRadius: '12px',
                      border: '1px solid #2C2F37',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [
                      Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 }),
                      `${aggregation} of ${yAxis}`,
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#94a3b8', fontSize: '11px' }} />
                  <Pie
                    data={chartData as any[]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={115}
                    paddingAngle={3}
                  >
                    {(chartData as any[]).map((_, index) => (
                      <Cell key={`pie-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="#202228" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2C2F37" />
                  <XAxis type="number" dataKey="x" name={xAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="number" dataKey="y" name={yAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#141519] border border-[#2C2F37] text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg">
                            <p className="font-bold text-[#c084fc]">{data.label}</p>
                            <p className="text-slate-300 font-mono">
                              {xAxis}: {data.x}
                            </p>
                            <p className="text-slate-300 font-mono">
                              {yAxis}: {data.y}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Points" data={chartData as any[]} fill="#a120f7" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bento Metric Summary Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Bento Stat Box 1: Total */}
          <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Aggregated Sum ({yAxis})
            </span>
            <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
              {totalValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Summed across {chartData.length} groups
            </div>
          </div>

          {/* Bento Stat Box 2: Mean */}
          <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Mean Value Per Group
            </span>
            <div className="text-2xl font-black text-[#c084fc] font-mono tabular-nums mt-1">
              {avgValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Group average across segments
            </div>
          </div>

          {/* Bento Stat Box 3: Top Performer */}
          {maxValueGroup && (
            <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-lg">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Top Segment ({maxValueGroup.name})
              </span>
              <div className="text-xl font-black text-[#a120f7] font-mono tabular-nums mt-1 truncate">
                {maxValueGroup.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Highest aggregated contribution
              </div>
            </div>
          )}

          {/* Bento Stat Box 4: Lowest Performer */}
          {minValueGroup && minValueGroup.name !== maxValueGroup?.name && (
            <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-4 shadow-lg">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Lowest Segment ({minValueGroup.name})
              </span>
              <div className="text-xl font-black text-slate-300 font-mono tabular-nums mt-1 truncate">
                {minValueGroup.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Lowest aggregated contribution
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* BENTO BOTTOM ROW: Aggregation Breakdown Table Tile             */}
      {/* ============================================================== */}
      {chartType !== 'scatter' && chartData.length > 0 && (
        <div className="bg-[#202228] rounded-2xl border border-[#2C2F37] p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#2C2F37] pb-3 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Aggregated Data Matrix
            </h4>
            <span className="text-xs text-slate-400">
              {chartData.length} categories sorted by {sortBy}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2C2F37] text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Group / Dimension</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Records Count</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Aggregated {yAxis}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Share of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2F37] font-mono text-[11px]">
                {(chartData as any[]).map((row, idx) => {
                  const share = totalValue > 0 ? ((row.value / totalValue) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="hover:bg-[#18191E]/60 transition">
                      <td className="py-2.5 px-3 font-semibold text-white font-sans">{row.name}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{row.count}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-[#c084fc]">
                        {row.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
