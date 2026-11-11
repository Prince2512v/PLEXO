import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { ThroughputPoint } from '../types';

interface ThroughputChartProps {
  data: ThroughputPoint[];
  isSpiking: boolean;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  const time = typeof label === 'number'
    ? new Date(label).toLocaleTimeString()
    : label;
  return (
    <div className="bg-zinc-950/90 border border-white/[0.12] backdrop-blur-md rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-zinc-400 mb-1">{time}</div>
      <div className="text-cyan-400 font-mono font-bold">{payload[0].value} req/s</div>
    </div>
  );
};

export const ThroughputChart: React.FC<ThroughputChartProps> = ({ data, isSpiking }) => {
  const maxRps = Math.max(1, ...data.map(d => d.rps));

  return (
    <div className="bg-zinc-900/40 border border-white/[0.07] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Throughput Over Time</h3>
        {isSpiking && (
          <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full animate-pulse">
            ⚡ Spike Active
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">
          Start the simulation to see throughput data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isSpiking ? '#f43f5e' : '#06b6d4'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isSpiking ? '#f43f5e' : '#06b6d4'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={v => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              tick={{ fill: '#71717a', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, Math.ceil(maxRps * 1.3)]}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickFormatter={v => `${v}`}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="rps" name="Req/s"
              stroke={isSpiking ? '#f43f5e' : '#06b6d4'}
              strokeWidth={2}
              fill="url(#throughputGrad)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
