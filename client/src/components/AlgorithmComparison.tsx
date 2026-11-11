import React from 'react';
import { AlgorithmStats, AlgorithmType } from '../types';

interface AlgorithmComparisonProps {
  algorithmStats: Record<AlgorithmType, AlgorithmStats> | undefined;
}

const ALGO_NAMES: Record<AlgorithmType, string> = {
  ROUND_ROBIN: 'Round Robin',
  LEAST_CONNECTIONS: 'Least Connections',
};

const ALGO_ORDER: AlgorithmType[] = ['ROUND_ROBIN', 'LEAST_CONNECTIONS'];

interface MetricRow {
  label: string;
  key: keyof AlgorithmStats;
  format: (v: number) => string;
  lowerIsBetter: boolean;
}

const METRIC_ROWS: MetricRow[] = [
  { label: 'Avg Latency', key: 'avgLatency', format: v => `${v}ms`, lowerIsBetter: true },
  { label: 'P95 Latency', key: 'p95Latency', format: v => `${v}ms`, lowerIsBetter: true },
  { label: 'Throughput', key: 'throughput', format: v => `${v} r/s`, lowerIsBetter: false },
  { label: 'Error Rate', key: 'errorRate', format: v => `${v}%`, lowerIsBetter: true },
  { label: 'Load Variance', key: 'loadVariance', format: v => v.toFixed(2), lowerIsBetter: true },
  { label: 'Total Requests', key: 'totalRequests', format: v => v.toLocaleString(), lowerIsBetter: false },
];

export const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({ algorithmStats }) => {
  if (!algorithmStats) return null;

  const getBestAlgo = (row: MetricRow): AlgorithmType | null => {
    const values = ALGO_ORDER.map(a => ({
      algo: a,
      value: algorithmStats[a][row.key] as number,
    })).filter(v => v.value > 0);

    if (values.length === 0) return null;

    return values.reduce((best, cur) => {
      const isBetter = row.lowerIsBetter
        ? cur.value < best.value
        : cur.value > best.value;
      return isBetter ? cur : best;
    }).algo;
  };

  const hasSomeData = ALGO_ORDER.some(
    a => algorithmStats[a].totalRequests > 0
  );

  return (
    <div className="bg-zinc-900/40 border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Algorithm Comparison</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Metrics accumulate as you switch between algorithms during the simulation
        </p>
      </div>

      {!hasSomeData ? (
        <div className="p-6 text-center text-zinc-600 text-sm">
          Run the simulation and switch between algorithms to compare metrics
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider font-mono">Metric</th>
                {ALGO_ORDER.map(algo => (
                  <th key={algo} className="px-4 py-2.5 text-center text-xs">
                    <div className="text-zinc-300 font-semibold">{ALGO_NAMES[algo]}</div>
                    <div className="text-zinc-600 text-xs mt-0.5">
                      {algorithmStats[algo].totalRequests.toLocaleString()} reqs
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map(row => {
                const best = getBestAlgo(row);
                return (
                  <tr key={row.key} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-zinc-400 text-xs font-medium uppercase tracking-wider font-mono">{row.label}</td>
                    {ALGO_ORDER.map(algo => {
                      const stat = algorithmStats[algo];
                      const value = stat[row.key] as number;
                      const hasData = stat.totalRequests > 0;
                      const isBest = algo === best && hasData;
                      return (
                        <td key={algo} className="px-4 py-2.5 text-center">
                          {hasData ? (
                            <span className={`font-mono text-sm ${
                              isBest ? 'text-emerald-400 font-bold' : 'text-zinc-300'
                            }`}>
                              {row.format(value)}
                              {isBest && <span className="ml-1 text-xs">★</span>}
                            </span>
                          ) : (
                            <span className="text-zinc-700 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasSomeData && (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="text-emerald-400">★</span>
            <span>indicates best value for each metric. Results depend on current traffic conditions.</span>
          </div>
        </div>
      )}
    </div>
  );
};
