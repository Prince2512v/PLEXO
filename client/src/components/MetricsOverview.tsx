import React from 'react';
import { TrendingUp, Clock, Zap, AlertCircle, Activity, CheckCircle, XCircle, Server } from 'lucide-react';
import { SimulationMetrics } from '../types';

interface MetricsOverviewProps {
  metrics: SimulationMetrics | null;
  isSpiking: boolean;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
  highlight?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label, value, unit, icon, color, subValue, highlight
}) => (
  <div className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 backdrop-blur-sm border ${
    highlight
      ? 'border-rose-500/50 bg-rose-500/5 shadow-lg shadow-rose-500/10'
      : 'border-white/[0.08] bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-white/[0.14]'
  }`}>
    <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
      <span className="font-medium text-zinc-400">{label}</span>
      <span className={color}>{icon}</span>
    </div>
    <div className="flex items-baseline gap-1 mt-1">
      <span className={`text-2xl font-bold font-mono tracking-tight ${highlight ? 'text-rose-400' : 'text-white'}`}>
        {value}
      </span>
      {unit && <span className="text-zinc-500 text-xs font-mono">{unit}</span>}
    </div>
    {subValue && <div className="text-zinc-500 text-[11px] font-mono mt-1">{subValue}</div>}
  </div>
);

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics, isSpiking }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/40 border border-white/[0.06] rounded-2xl p-4 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const formatLatency = (ms: number) => ms > 0 ? ms.toString() : '—';

  return (
    <div className="space-y-3">
      {isSpiking && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl animate-pulse">
          <Zap className="w-4 h-4 text-rose-400 fill-rose-400" />
          <span className="text-rose-400 text-xs font-semibold uppercase tracking-wider font-mono">
            Traffic Spike Detected
          </span>
          <span className="text-rose-300/70 text-xs font-sans">
            — Workload scaling at maximum simulated saturation
          </span>
        </div>
      )}

      {/* Primary Metrics Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Requests / sec"
          value={metrics.requestsPerSecond.toLocaleString()}
          icon={<TrendingUp className="w-4 h-4" />}
          color="text-accent-cyan"
          subValue={`${metrics.totalRequests.toLocaleString()} total dispatched`}
          highlight={isSpiking}
        />
        <MetricCard
          label="Avg Latency"
          value={formatLatency(metrics.latency.avg)}
          unit="ms"
          icon={<Clock className="w-4 h-4" />}
          color="text-accent-indigo"
          subValue={`p50: ${formatLatency(metrics.latency.p50)}ms`}
        />
        <MetricCard
          label="Throughput"
          value={metrics.throughput.toLocaleString()}
          unit="r/s"
          icon={<Activity className="w-4 h-4" />}
          color="text-emerald-400"
          subValue={`${metrics.successfulRequests.toLocaleString()} completed`}
        />
        <MetricCard
          label="Error Rate"
          value={metrics.errorRate.toFixed(1)}
          unit="%"
          icon={<AlertCircle className="w-4 h-4" />}
          color={metrics.errorRate > 5 ? 'text-rose-400' : 'text-amber-400'}
          subValue={`${metrics.failedRequests.toLocaleString()} dropped`}
          highlight={metrics.errorRate > 10}
        />
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
        <SmallMetric label="p95 Latency" value={`${formatLatency(metrics.latency.p95)}ms`} color="text-accent-purple" />
        <SmallMetric label="p99 Tail" value={`${formatLatency(metrics.latency.p99)}ms`} color="text-rose-400" />
        <SmallMetric label="Min Latency" value={`${formatLatency(metrics.latency.min)}ms`} color="text-emerald-400" />
        <SmallMetric
          label="Healthy"
          value={metrics.healthyNodes.toString()}
          icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
          color="text-emerald-400"
        />
        <SmallMetric
          label="Offline"
          value={metrics.failedNodes.toString()}
          icon={<XCircle className="w-3.5 h-3.5 text-rose-400" />}
          color={metrics.failedNodes > 0 ? 'text-rose-400' : 'text-zinc-500'}
        />
        <SmallMetric
          label="Degraded"
          value={metrics.degradedNodes.toString()}
          icon={<Server className="w-3.5 h-3.5 text-amber-400" />}
          color={metrics.degradedNodes > 0 ? 'text-amber-400' : 'text-zinc-500'}
        />
      </div>
    </div>
  );
};

const SmallMetric: React.FC<{
  label: string; value: string; color: string; icon?: React.ReactNode
}> = ({ label, value, color, icon }) => (
  <div className="bg-zinc-900/40 border border-white/[0.07] rounded-xl px-3.5 py-2.5 backdrop-blur-sm">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-zinc-500 text-[11px] font-medium">{label}</span>
    </div>
    <div className={`font-mono text-sm font-bold tracking-tight ${color}`}>{value}</div>
  </div>
);
