import React from 'react';
import {
  SimulationState,
  MicroserviceNodeData,
  SimulationMetrics,
  ActiveTab,
} from '../../types';

interface OverviewDashboardViewProps {
  state: SimulationState | null;
  nodes: MicroserviceNodeData[];
  metrics: SimulationMetrics | null;
  onNavigate: (tab: ActiveTab) => void;
  onStartSimulation: () => void;
}

export const OverviewDashboardView: React.FC<OverviewDashboardViewProps> = ({
  state,
  nodes,
  metrics,
  onNavigate,
  onStartSimulation,
}) => {
  const status = state?.status ?? 'IDLE';
  const isRunning = status === 'RUNNING';
  const currentAlgo = state?.config.algorithm === 'LEAST_CONNECTIONS' ? 'Least Connections' : 'Round Robin';

  const healthyNodes = nodes.filter(n => n.status === 'HEALTHY').length;
  const failedNodes = nodes.filter(n => n.status === 'FAILED').length;
  const totalConnections = nodes.reduce((sum, n) => sum + n.activeConnections, 0);
  const avgCpu = nodes.length > 0
    ? Math.round(nodes.reduce((sum, n) => sum + n.cpuUsage, 0) / nodes.length)
    : 0;

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Top Academic Hero Card in Oceanic Frosted Theme */}
      <div className="w-full bg-surface-container-lowest rounded-3xl p-8 shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none" />
        <div className="absolute right-48 -bottom-16 w-64 h-64 rounded-full bg-tertiary-fixed/30 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                Postgraduate Research &amp; Engineering
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                Synthesis: ADA • CC • SDA
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                Core Release v3.4.1
              </span>
            </div>

            <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-3">
              Integrated Load Balancing &amp; Network Traffic Analytics
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant">
              An authoritative distributed testbed executing real-time Layer-4/7 load balancing,
              dynamic programming resource allocation (0/1 Knapsack), Dijkstra shortest path network routing,
              and live statistical telemetry processing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            {!isRunning ? (
              <button
                onClick={onStartSimulation}
                className="px-6 py-3 bg-primary-container text-on-primary hover:bg-secondary rounded-full font-label-lg text-label-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                Launch Live Simulation
              </button>
            ) : (
              <button
                onClick={() => onNavigate('load-balancing')}
                className="px-6 py-3 bg-secondary text-on-secondary rounded-full font-label-lg text-label-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">alt_route</span>
                View Live Telemetry
              </button>
            )}

            <button
              onClick={() => onNavigate('about')}
              className="px-5 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              Thesis Guide &amp; Specs
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: Key Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-1">
            <span>Total Requests</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">sync_alt</span>
          </div>
          <div className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
            {metrics?.totalRequests.toLocaleString() ?? 0}
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Processed count</div>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-1">
            <span>Resource Pool</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">dns</span>
          </div>
          <div className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
            {healthyNodes} <span className="text-body-sm font-normal text-on-surface-variant">/ {nodes.length}</span>
          </div>
          <div className="font-label-sm text-label-sm mt-1">
            {failedNodes > 0 ? (
              <span className="text-error font-medium">{failedNodes} offline</span>
            ) : (
              <span className="text-secondary font-medium">100% operational</span>
            )}
          </div>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-1">
            <span>Avg Latency</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">timer</span>
          </div>
          <div className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
            {metrics?.latency.avg ?? 0} <span className="text-body-sm font-normal text-on-surface-variant">ms</span>
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
            p95: <span className="font-semibold text-on-surface">{metrics?.latency.p95 ?? 0}ms</span>
          </div>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-1">
            <span>Throughput</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">speed</span>
          </div>
          <div className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
            {metrics?.throughput ?? 0} <span className="text-body-sm font-normal text-on-surface-variant">r/s</span>
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Effective flow</div>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-1">
            <span>Active Streams</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">hub</span>
          </div>
          <div className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
            {totalConnections}
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Avg CPU: {avgCpu}%</div>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-1">
            <span>Algorithm</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">settings_suggest</span>
          </div>
          <div className="font-title-md text-title-md font-bold text-primary truncate mt-1">
            {currentAlgo}
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">L4/L7 Dispatcher</div>
        </div>
      </div>

      {/* The Three Academic Pillars Navigation Cards */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">account_balance</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">The Three Academic Pillars</h2>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant">Interdisciplinary Theoretical &amp; Practical Foundations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cloud Computing */}
          <div
            onClick={() => onNavigate('load-balancing')}
            className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] relative overflow-hidden group hover:shadow-[0_8px_28px_-4px_rgba(0,29,57,0.08)] transition-all cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/30 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                  Pillar 01 — Cloud Computing
                </span>
                <span className="material-symbols-outlined text-secondary text-[28px]">cloud</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Cloud Load Balancing</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                Execute Round Robin and Least Connections routing across {nodes.length} simulated microservice nodes.
                Observe dynamic failover, active connection shifting, and throughput curves.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-primary">Round Robin Rotation</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">O(1)</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-primary">Least Connections Heuristic</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">O(N)</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 flex items-center justify-between border-t border-surface-container">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Live Console</span>
              <span className="font-label-md text-label-md text-secondary font-bold group-hover:underline flex items-center gap-1">
                Open Balancing Suite <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* ADA Algorithm Lab */}
          <div
            onClick={() => onNavigate('ada-lab')}
            className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] relative overflow-hidden group hover:shadow-[0_8px_28px_-4px_rgba(0,29,57,0.08)] transition-all cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/30 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                  Pillar 02 — Algorithms
                </span>
                <span className="material-symbols-outlined text-secondary text-[28px]">neurology</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-2">ADA Algorithm Lab</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                Dijkstra shortest path with Min-Heap over multi-datacenter network mesh, and 0/1 Knapsack Dynamic Programming for server capacity task scheduling.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-primary">Dijkstra Shortest Path</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">O((V+E)logV)</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-primary">0/1 Knapsack Allocator</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">O(nW) DP</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 flex items-center justify-between border-t border-surface-container">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Lab Module</span>
              <span className="font-label-md text-label-md text-secondary font-bold group-hover:underline flex items-center gap-1">
                Open Algorithm Lab <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Traffic Analytics */}
          <div
            onClick={() => onNavigate('analytics')}
            className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] relative overflow-hidden group hover:shadow-[0_8px_28px_-4px_rgba(0,29,57,0.08)] transition-all cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/30 rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                  Pillar 03 — Data Analytics
                </span>
                <span className="material-symbols-outlined text-secondary text-[28px]">analytics</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Traffic Analytics &amp; ML</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                Telemetry statistical engine: Mean, Median, Variance, IQR, percentiles (p50, p95, p99),
                Pearson correlation matrix, and decision tree latency forecasting.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-primary">Descriptive Statistics</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">Parametrics</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                  <span className="font-body-sm text-body-sm font-semibold text-primary">Decision Tree Regressor</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">R² = 0.94</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 flex items-center justify-between border-t border-surface-container">
              <span className="font-label-sm text-label-sm text-on-surface-variant">SDA Module</span>
              <span className="font-label-md text-label-md text-secondary font-bold group-hover:underline flex items-center gap-1">
                Open Analytics Core <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Health & Node Pool Table */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-surface-container mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">dns</span>
            <h2 className="font-title-md text-title-md font-bold text-on-surface">
              Live Microservice Resource Pool ({nodes.length} Nodes)
            </h2>
          </div>
          <button
            onClick={() => onNavigate('load-balancing')}
            className="font-label-md text-label-md text-secondary hover:underline font-semibold flex items-center gap-1"
          >
            <span>Open Balancing Suite</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase">
              <tr>
                <th className="px-4 py-3">Server Node</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Active Conns</th>
                <th className="px-4 py-3">CPU Saturation</th>
                <th className="px-4 py-3">Memory</th>
                <th className="px-4 py-3">Requests Processed</th>
                <th className="px-4 py-3">Current Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {nodes.map(node => (
                <tr key={node.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-primary flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      node.status === 'HEALTHY' ? 'bg-secondary' :
                      node.status === 'DEGRADED' ? 'bg-secondary-container' :
                      'bg-error'
                    }`} />
                    <span>{node.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                      node.status === 'HEALTHY' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                      node.status === 'DEGRADED' ? 'bg-secondary-container text-on-secondary-container' :
                      'bg-error-container text-on-error-container'
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-on-surface font-bold">{node.activeConnections}</td>
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-secondary h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, node.cpuUsage)}%` }}
                        />
                      </div>
                      <span className="text-on-surface">{node.cpuUsage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-on-surface-variant">{node.memoryUsage}%</td>
                  <td className="px-4 py-3 font-mono text-on-surface-variant">{node.totalRequests.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-secondary font-semibold">{node.averageLatency}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
