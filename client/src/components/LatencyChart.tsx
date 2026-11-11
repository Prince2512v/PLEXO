import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from 'recharts';
import { LatencyPoint } from '../types';

interface LatencyChartProps {
  data: LatencyPoint[];
  isSpiking: boolean;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  const time = typeof label === 'number'
    ? new Date(label).toLocaleTimeString()
    : label;
  return (
    <div className="bg-zinc-950/90 border border-white/[0.12] rounded-xl px-3 py-2 text-xs backdrop-blur-md shadow-xl">
      <div className="text-zinc-500 mb-1 font-mono text-[10px]">{time}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-300">{p.name}:</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>{p.value}ms</span>
        </div>
      ))}
    </div>
  );
};

export const LatencyChart: React.FC<LatencyChartProps> = ({ data, isSpiking }) => {
  const formattedData = data.map(d => ({
    ...d,
    time: d.timestamp,
  }));

  const maxLatency = Math.max(0, ...data.map(d => d.p99));

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
          Latency Over Time (ms)
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-accent-indigo inline-block rounded" />Mean</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-amber-400 inline-block rounded" />p95</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-rose-500 inline-block rounded" />p99</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-zinc-600 text-xs font-mono">
          Start simulation to stream latency telemetry
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={formattedData} margin={{ left: -15, right: 10, top: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="time"
              tickFormatter={v => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
              domain={[0, maxLatency > 0 ? Math.ceil(maxLatency * 1.2) : 100]}
              tickFormatter={v => `${v}`}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            {isSpiking && (
              <ReferenceLine
                x={formattedData[formattedData.length - 1]?.time}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                label={{ value: 'SPIKE', fill: '#f43f5e', fontSize: 9 }}
              />
            )}
            <Line
              type="monotone" dataKey="avg" name="Mean"
              stroke="#6366f1" strokeWidth={2} dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone" dataKey="p95" name="p95"
              stroke="#f59e0b" strokeWidth={1.5} dot={false}
              strokeDasharray="4 2"
              isAnimationActive={false}
            />
            <Line
              type="monotone" dataKey="p99" name="p99"
              stroke="#f43f5e" strokeWidth={1} dot={false}
              strokeDasharray="2 2"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
