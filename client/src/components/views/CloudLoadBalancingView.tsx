import React, { useState } from 'react';
import {
  TrafficConfig,
  SimulationState,
  MicroserviceNodeData,
  SimulationMetrics,
  EventLogEntry,
  AlgorithmType,
} from '../../types';

interface CloudLoadBalancingViewProps {
  simulationState: SimulationState | null;
  nodes: MicroserviceNodeData[];
  metrics: SimulationMetrics | null;
  events: EventLogEntry[];
  isSpiking: boolean;
  onAlgorithmChange: (algo: AlgorithmType) => void;
  onTrafficUpdate: (config: Partial<TrafficConfig>) => void;
  onTriggerSpike: () => void;
  onFailNode: (nodeId: string) => void;
  onRecoverNode: (nodeId: string) => void;
  onAddNode: () => void;
  onRemoveNode: (nodeId: string) => void;
  onResetSimulation: () => void;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onClearEvents: () => void;
}

export const CloudLoadBalancingView: React.FC<CloudLoadBalancingViewProps> = ({
  simulationState,
  nodes,
  metrics,
  events,
  isSpiking,
  onAlgorithmChange,
  onTrafficUpdate,
  onTriggerSpike,
  onFailNode,
  onRecoverNode,
  onAddNode,
  onRemoveNode,
  onResetSimulation,
  onStartSimulation,
  onPauseSimulation,
  onClearEvents,
}) => {
  const isRunning = simulationState?.status === 'RUNNING';
  const activeAlgorithm = simulationState?.config.algorithm ?? 'ROUND_ROBIN';
  const currentRps = simulationState?.config.trafficConfig.requestsPerSecond ?? 10;

  // Local interactive UI states
  const [payloadType, setPayloadType] = useState<'light' | 'medium' | 'heavy'>('light');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rate, setRate] = useState<number>(currentRps);

  const handleRateChange = (val: number) => {
    setRate(val);
    onTrafficUpdate({ requestsPerSecond: val });
  };

  const handleStepDispatch = () => {
    // If not running, temporarily route or trigger traffic
    onTrafficUpdate({ requestsPerSecond: Math.max(1, rate) });
    if (!isRunning) {
      onStartSimulation();
      setTimeout(() => onPauseSimulation(), 400);
    }
  };

  // Node comparative calculations
  const maxReqs = Math.max(...nodes.map(n => n.totalRequests), 1);
  const avgLat = (nodes.reduce((acc, n) => acc + (n.currentLatency || n.averageLatency), 0) / (nodes.length || 1)).toFixed(1);

  // Standard deviation of requests for Cluster Load Skew
  const meanReqs = nodes.reduce((acc, n) => acc + n.totalRequests, 0) / (nodes.length || 1);
  const variance = nodes.reduce((acc, n) => acc + Math.pow(n.totalRequests - meanReqs, 2), 0) / (nodes.length || 1);
  const stdDev = Math.sqrt(variance);
  const skewPercent = meanReqs > 0 ? ((stdDev / meanReqs) * 100).toFixed(1) : '0.0';

  // Filter trace logs
  const filteredEvents = events.filter(e => {
    if (statusFilter === 'all') return true;
    if (statusFilter === '200') return !e.type.includes('FAIL') && !e.type.includes('SPIKE');
    if (statusFilter === '429') return e.type.includes('SPIKE') || e.message.includes('429');
    if (statusFilter === '503') return e.type.includes('FAIL') || e.message.includes('503');
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Simulation Control Deck & Frosted Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-surface-container-lowest/90 backdrop-blur-xl p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-secondary ring-4 ring-secondary-container/30 animate-pulse" />
            <h1 className="font-headline-md text-headline-md text-primary-container tracking-tight">
              Adaptive Traffic Balancer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
              Mesh v3.4 L7
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            High-throughput comparative dispatcher testbed with real-time cluster telemetry
          </p>
        </div>

        {/* Frosted Floating Capsule Controller */}
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-surface-container/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] self-stretch lg:self-auto justify-between lg:justify-start">
          {/* Play / Pause / Step Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={isRunning ? onPauseSimulation : onStartSimulation}
              className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:bg-secondary transition-all shadow-[0_4px_14px_rgba(0,29,57,0.25)]"
              title={isRunning ? 'Pause' : 'Start / Resume Engine'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isRunning ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button
              onClick={handleStepDispatch}
              className="w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-all flex items-center justify-center"
              title="Step Single Request Dispatch"
            >
              <span className="material-symbols-outlined text-[19px]">skip_next</span>
            </button>
            <button
              onClick={onResetSimulation}
              className="w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-all flex items-center justify-center"
              title="Reset Traffic & Gauges"
            >
              <span className="material-symbols-outlined text-[19px]">restart_alt</span>
            </button>
          </div>

          <div className="h-6 w-px bg-outline-variant/40 mx-1" />

          {/* Algorithm Toggle Pill Group */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-full gap-1">
            <button
              onClick={() => onAlgorithmChange('ROUND_ROBIN')}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all font-semibold flex items-center gap-1.5 ${
                activeAlgorithm === 'ROUND_ROBIN'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">sync_alt</span>
              Round Robin
            </button>
            <button
              onClick={() => onAlgorithmChange('LEAST_CONNECTIONS')}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all font-semibold flex items-center gap-1.5 ${
                activeAlgorithm === 'LEAST_CONNECTIONS'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">dynamic_form</span>
              Least Conns
            </button>
          </div>

          <div className="h-6 w-px bg-outline-variant/40 mx-1" />

          {/* Node Management */}
          <div className="flex items-center gap-1">
            <button
              onClick={onAddNode}
              className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high text-label-md font-label-md font-semibold transition-all flex items-center gap-1"
              title="Add Backend Node"
            >
              <span className="material-symbols-outlined text-[17px] text-secondary">add_circle</span>
              <span>Node</span>
            </button>
            <button
              onClick={() => {
                if (nodes.length > 2) {
                  onRemoveNode(nodes[nodes.length - 1].id);
                }
              }}
              disabled={nodes.length <= 2}
              className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container-high text-label-md font-label-md font-semibold transition-all flex items-center gap-1 disabled:opacity-40"
              title="Remove Backend Node"
            >
              <span className="material-symbols-outlined text-[17px] text-error">remove_circle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Traffic Tuning Deck & Strategy Insight Ribbon */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Injection Tuner Card */}
        <div className="xl:col-span-5 bg-surface-container-lowest/80 backdrop-blur-xl p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">tune</span>
              <span className="font-headline-sm text-headline-sm text-primary">Traffic Generator</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Burst Stress:</span>
              <button
                onClick={onTriggerSpike}
                className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-colors ${
                  isSpiking ? 'bg-secondary' : 'bg-surface-container-high'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
                    isSpiking ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Slider Row */}
          <div className="flex flex-col gap-2 py-2">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Request Injection Rate</span>
              <span className="font-title-md text-title-md text-secondary font-bold">
                {rate.toLocaleString()} req/s
              </span>
            </div>
            <input
              className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary"
              type="range"
              min="5"
              max="250"
              step="5"
              value={rate}
              onChange={e => handleRateChange(parseInt(e.target.value, 10))}
            />
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>5 req/s (Gentle)</span>
              <span>100</span>
              <span>250 req/s (Heavy)</span>
            </div>
          </div>

          {/* Payload Presets & Synthetic Weight */}
          <div className="flex items-center justify-between pt-3">
            <span className="font-label-md text-label-md text-on-surface-variant">Payload Weight:</span>
            <div className="flex gap-1.5">
              {(['light', 'medium', 'heavy'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPayloadType(p)}
                  className={`px-3 py-1 rounded-full text-label-sm font-label-sm transition-all ${
                    payloadType === p
                      ? 'bg-primary-container text-on-primary font-semibold'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p === 'light' ? 'Tiny (4KB)' : p === 'medium' ? 'Standard (32KB)' : 'Complex (256KB)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Routing Strategy Banner & Algorithmic Math Breakdown */}
        <div className="xl:col-span-7 bg-surface-container-lowest/80 backdrop-blur-xl p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">psychology</span>
              <span className="font-headline-sm text-headline-sm text-primary">Routing Heuristics</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
              {activeAlgorithm === 'ROUND_ROBIN' ? 'Sequential Strict Mode' : 'Minimum Conns Heuristic'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-1">
            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Active Algorithm Formula</span>
              <span className="font-title-md text-title-md text-primary font-bold tracking-tight">
                {activeAlgorithm === 'ROUND_ROBIN' ? 'S_next = (i + 1) % N' : 'S_next = argmin(Conns)'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                {activeAlgorithm === 'ROUND_ROBIN'
                  ? 'Deterministically cycles target pointer'
                  : 'Dynamic state-adaptive least weighted load'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Cluster Load Skew (Std Dev)</span>
              <span className="font-title-md text-title-md text-secondary font-bold tracking-tight">
                ± {skewPercent}%
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Low variance optimal</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">P99 Cluster Latency</span>
              <span className="font-title-md text-title-md text-primary font-bold tracking-tight">
                {metrics?.latency.p99 ? metrics.latency.p99.toFixed(1) + ' ms' : `${avgLat} ms`}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">SLO Target: &lt; 25 ms</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">
              {activeAlgorithm === 'ROUND_ROBIN'
                ? 'Round Robin distributes packets in strict sequential order, oblivious to server load or connection lifetime.'
                : 'Least Connections routes incoming traffic to whichever server currently handles the lowest concurrent open connections.'}
            </p>
            <span className="font-label-sm text-label-sm text-secondary font-bold whitespace-nowrap ml-4">
              L7 Ingress Aware
            </span>
          </div>
        </div>
      </div>

      {/* Comparative Live Distribution Bar Deck */}
      <div className="bg-surface-container-lowest/90 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary">Live Comparative Node Distribution</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Simultaneous allocation breakdown across all active cluster pods
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Total Dispatched</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary-container" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Active Conns</span>
            </div>
          </div>
        </div>

        {/* Comparative Visual Bars Container */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {nodes.map(node => {
            const heightPercentReq = Math.min(100, Math.max(12, (node.totalRequests / maxReqs) * 100));
            const heightPercentConns = Math.min(100, Math.max(12, (node.activeConnections / 50) * 100));

            return (
              <div
                key={node.id}
                className="flex flex-col items-center bg-surface-container-low p-3 rounded-xl gap-2"
              >
                <span className="font-label-sm text-label-sm font-semibold text-primary truncate w-full text-center">
                  {node.name}
                </span>

                {/* Bars Comparison Track */}
                <div className="h-32 w-full flex items-end justify-center gap-2 px-2 bg-surface-container rounded-lg pb-1">
                  <div className="w-1/2 flex flex-col items-center justify-end h-full">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-1 text-[10px]">
                      {node.totalRequests}
                    </span>
                    <div
                      style={{ height: `${heightPercentReq}%` }}
                      className="w-full bg-secondary rounded-t-md transition-all duration-300"
                    />
                  </div>
                  <div className="w-1/2 flex flex-col items-center justify-end h-full">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-1 text-[10px]">
                      {node.activeConnections}
                    </span>
                    <div
                      style={{ height: `${heightPercentConns}%` }}
                      className="w-full bg-secondary-container rounded-t-md transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between w-full font-label-sm text-label-sm text-on-surface-variant">
                  <span>Conns:</span>
                  <span className="font-bold text-secondary">{node.activeConnections}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backend Server Cluster Matrix */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">dns</span>
            <h2 className="font-headline-sm text-headline-sm text-primary">Cluster Server Fleet</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
              {nodes.length} Nodes Online
            </span>
          </div>
        </div>

        {/* Matrix Grid of Servers */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nodes.map(node => {
            const isFailed = node.status === 'FAILED';
            const isDegraded = node.status === 'DEGRADED';
            const statusBadgeClass = !isFailed && !isDegraded
              ? 'bg-secondary-fixed text-on-secondary-fixed'
              : isDegraded
              ? 'bg-surface-container-high text-on-surface'
              : 'bg-error-container text-on-error-container';

            return (
              <div
                key={node.id}
                className="bg-surface-container-lowest/90 backdrop-blur-xl p-5 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col justify-between gap-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isFailed ? 'bg-error' : isDegraded ? 'bg-error-container' : 'bg-secondary'
                      }`}
                    />
                    <div>
                      <h3 className="font-title-md text-title-md text-primary font-bold">{node.name}</h3>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {node.id} • weight: {node.weight}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${statusBadgeClass}`}>
                      {node.status}
                    </span>
                    <button
                      onClick={() => (isFailed ? onRecoverNode(node.id) : onFailNode(node.id))}
                      className="p-1 rounded-full hover:bg-surface-container-high transition-all text-on-surface-variant hover:text-on-surface"
                      title={isFailed ? 'Recover Node' : 'Fail / Crash Node'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isFailed ? 'play_arrow' : 'power_settings_new'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Connection Gauge & Load Progress */}
                <div className="grid grid-cols-2 gap-3 py-1">
                  <div className="p-2.5 rounded-xl bg-surface-container-low flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Active Pool</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      {node.activeConnections}{' '}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        streams
                      </span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-low flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Throughput</span>
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                      {node.totalRequests}{' '}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                        pkts
                      </span>
                    </span>
                  </div>
                </div>

                {/* CPU Load Meter */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-label-sm text-label-sm">
                    <span className="text-on-surface-variant">CPU Provision Load</span>
                    <span className="font-bold text-primary">{node.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-secondary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, node.cpuUsage)}%` }}
                    />
                  </div>
                </div>

                {/* Latency Response */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Avg Latency Response</span>
                  <div className="flex items-center gap-2">
                    <svg className="w-20 h-5 text-secondary overflow-visible" viewBox="0 0 80 20" fill="none">
                      <path
                        d={`M0,15 Q20,3 40,11 T80,${Math.max(2, Math.min(18, Math.floor((node.averageLatency || 20) / 4)))}`}
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="font-label-sm text-label-sm text-primary font-bold font-mono">
                      {(node.currentLatency || node.averageLatency).toFixed(1)}ms
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Request Dispatch Pipeline & Live Trace Log */}
      <div className="bg-surface-container-lowest/90 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[24px]">stream</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary">Real-time Ingress Dispatch Stream</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Live L7 trace logger capturing packet assignment, connection pooling, and latency metrics
              </p>
            </div>
          </div>

          {/* Filters & Stream Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-surface-container-low rounded-full px-3 py-1.5 gap-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">filter_list</span>
              <select
                className="bg-transparent text-label-sm font-label-sm text-on-surface focus:outline-none cursor-pointer"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All HTTP Codes</option>
                <option value="200">200 OK Only</option>
                <option value="429">429 Overload Only</option>
                <option value="503">503 Degraded/Drain</option>
              </select>
            </div>

            <button
              onClick={onClearEvents}
              className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-label-sm font-label-sm transition-all"
            >
              Clear Log
            </button>
          </div>
        </div>

        {/* Real-time Ingress Dispatch Stream Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase">
                <th className="py-2.5 px-4">Request Hash</th>
                <th className="py-2.5 px-4">Origin Region</th>
                <th className="py-2.5 px-4">Algorithm Selected</th>
                <th className="py-2.5 px-4">Assigned Node</th>
                <th className="py-2.5 px-4">Latency</th>
                <th className="py-2.5 px-4">Pool State</th>
                <th className="py-2.5 px-4">HTTP Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-on-surface-variant font-label-md">
                    No active trace events logged yet. Start simulation engine to view real-time packets.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 15).map((evt, idx) => {
                  const isError = evt.type.includes('FAIL');
                  const isSpike = evt.type.includes('SPIKE');
                  const statusLabel = isError ? '503 Fail' : isSpike ? '429 Spike' : '200 OK';
                  const statusClass = isError
                    ? 'text-error bg-error-container'
                    : isSpike
                    ? 'text-on-surface-variant bg-surface-container-high'
                    : 'text-secondary bg-secondary-fixed/40';

                  return (
                    <tr key={evt.id || idx} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-primary">
                        0x{evt.id ? evt.id.slice(0, 6).toUpperCase() : 'E1F4A0'}
                      </td>
                      <td className="py-2.5 px-4 text-on-surface-variant">US-East (N. Virginia)</td>
                      <td className="py-2.5 px-4 font-medium text-on-surface">
                        {activeAlgorithm === 'ROUND_ROBIN' ? 'Round Robin' : 'Least Conns'}
                      </td>
                      <td className="py-2.5 px-4 flex items-center gap-1.5 font-mono text-secondary font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        {evt.nodeId || 'node-01'}
                      </td>
                      <td className="py-2.5 px-4 text-on-surface">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 text-on-surface-variant font-mono">
                        {evt.message || 'Stream routed'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
