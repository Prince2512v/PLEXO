import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { MicroserviceNodeData } from '../types';

interface TrafficDistributionChartProps {
  nodes: MicroserviceNodeData[];
}

type MetricKey = 'totalRequests' | 'activeConnections' | 'cpuUsage' | 'averageLatency';

const METRIC_OPTIONS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'totalRequests', label: 'Requests', unit: 'req' },
  { key: 'activeConnections', label: 'Connections', unit: 'conn' },
  { key: 'cpuUsage', label: 'CPU', unit: '%' },
  { key: 'averageLatency', label: 'Latency', unit: 'ms' },
];

const NODE_COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
  '#8b5cf6', '#f43f5e', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

const CustomTooltip = ({ active, payload, label, unit }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950/90 border border-white/[0.12] rounded-xl px-3 py-2 text-xs backdrop-blur-md shadow-xl">
      <div className="text-zinc-400 font-medium">{label}</div>
      <div className="text-accent-cyan font-mono font-bold mt-0.5">
        {payload[0].value.toLocaleString()} {unit}
      </div>
    </div>
  );
};

export const TrafficDistributionChart: React.FC<TrafficDistributionChartProps> = ({ nodes }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('totalRequests');

  const metric = METRIC_OPTIONS.find(m => m.key === selectedMetric)!;
  const total = nodes.reduce((sum, n) => sum + (n[selectedMetric] as number), 0);

  const data = nodes.map((node, i) => {
    const value = node[selectedMetric] as number;
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return {
      name: node.name,
      value,
      pct,
      status: node.status,
      color: node.status === 'FAILED' ? '#f43f5e' : NODE_COLORS[i % NODE_COLORS.length],
    };
  });

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
          Workload Balance Across Nodes
        </h3>
        <div className="flex gap-1 p-0.5 rounded-lg bg-zinc-950 border border-white/[0.06]">
          {METRIC_OPTIONS.map(m => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                selectedMetric === m.key
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category" dataKey="name" width={60}
            tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
          />
          <Tooltip content={<CustomTooltip unit={metric.unit} />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={entry.status === 'FAILED' ? 0.3 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Percentage breakdown */}
      <div className="mt-4 space-y-2 pt-3 border-t border-white/[0.06]">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: entry.color, opacity: entry.status === 'FAILED' ? 0.3 : 1 }}
            />
            <span className="text-zinc-400 text-xs w-16 flex-shrink-0 font-medium">{entry.name}</span>
            <div className="flex-1 bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${entry.pct}%`,
                  background: entry.color,
                  opacity: entry.status === 'FAILED' ? 0.3 : 1,
                }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-300 w-10 text-right font-semibold">{entry.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
