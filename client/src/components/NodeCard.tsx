import React from 'react';
import { XCircle, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { MicroserviceNodeData } from '../types';

interface NodeCardProps {
  node: MicroserviceNodeData;
  onFail: (id: string) => void;
  onRecover: (id: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const UsageBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="w-full bg-zinc-800/80 rounded-full h-1 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${color}`}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

export const NodeCard: React.FC<NodeCardProps> = ({
  node, onFail, onRecover, onRemove, canRemove
}) => {
  const isHealthy = node.status === 'HEALTHY';
  const isFailed = node.status === 'FAILED';
  const isDegraded = node.status === 'DEGRADED';

  const borderColor = isFailed
    ? 'border-rose-500/30'
    : isDegraded
    ? 'border-amber-500/30'
    : 'border-white/[0.08]';

  const bgColor = isFailed
    ? 'bg-rose-500/[0.03]'
    : isDegraded
    ? 'bg-amber-500/[0.03]'
    : 'bg-zinc-900/40';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-2xl p-4 flex flex-col gap-3 transition-all duration-300 backdrop-blur-sm shadow-lg hover:border-white/[0.14]`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            isHealthy ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' :
            isDegraded ? 'bg-amber-400 shadow-sm shadow-amber-400/50' :
            'bg-rose-500 shadow-sm shadow-rose-500/50'
          }`} />
          <span className="text-white font-semibold text-xs tracking-tight">{node.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold ${
            isFailed ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
            isDegraded ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {node.status}
          </span>
          {canRemove && (
            <button
              onClick={() => onRemove(node.id)}
              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Scale in (remove) node"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      {isFailed ? (
        <div className="space-y-2 py-2">
          <div className="text-center py-1 bg-zinc-950/60 rounded-xl border border-white/[0.04]">
            <div className="text-rose-400 text-xs font-mono font-semibold">INSTANCE OFFLINE</div>
            <div className="text-zinc-500 text-[10px] mt-0.5">Skipped by load balancer</div>
          </div>
          <StatRow label="Lifetime Reqs" value={node.totalRequests.toLocaleString()} />
          <StatRow label="Last Latency" value={`${node.currentLatency}ms`} />
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Active connections */}
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Active Conns</span>
            <span className="font-mono text-white font-bold">{node.activeConnections}</span>
          </div>

          {/* CPU */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">CPU Usage</span>
              <span className={`font-mono font-semibold ${node.cpuUsage > 80 ? 'text-rose-400' : node.cpuUsage > 60 ? 'text-amber-400' : 'text-zinc-300'}`}>
                {node.cpuUsage}%
              </span>
            </div>
            <UsageBar
              value={node.cpuUsage}
              color={node.cpuUsage > 80 ? 'bg-rose-500' : node.cpuUsage > 60 ? 'bg-amber-500' : 'bg-accent-indigo'}
            />
          </div>

          {/* Memory */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Memory</span>
              <span className={`font-mono font-semibold ${node.memoryUsage > 85 ? 'text-rose-400' : node.memoryUsage > 65 ? 'text-amber-400' : 'text-zinc-300'}`}>
                {node.memoryUsage}%
              </span>
            </div>
            <UsageBar
              value={node.memoryUsage}
              color={node.memoryUsage > 85 ? 'bg-rose-500' : node.memoryUsage > 65 ? 'bg-amber-500' : 'bg-accent-purple'}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.04]">
            <StatRow label="Requests" value={node.totalRequests.toLocaleString()} />
            <StatRow label="Latency" value={`${node.averageLatency}ms`} />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="pt-1">
        {!isFailed ? (
          <button
            onClick={() => onFail(node.id)}
            className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            Crash Node
          </button>
        ) : (
          <button
            onClick={() => onRecover(node.id)}
            className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restore Node
          </button>
        )}
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-[11px]">
    <span className="text-zinc-500">{label}</span>
    <span className="font-mono text-zinc-300 font-medium">{value}</span>
  </div>
);
