import React, { useState } from 'react';
import {
  Sliders, Zap, AlertTriangle, ChevronDown, ChevronRight,
  Plus, Minus, RefreshCw, Cpu
} from 'lucide-react';
import {
  AlgorithmType, TrafficPattern, SimulationState, MicroserviceNodeData, SimulationConfig
} from '../types';

interface ControlPanelProps {
  state: SimulationState | null;
  nodes: MicroserviceNodeData[];
  onAlgorithmChange: (algo: AlgorithmType) => void;
  onTrafficUpdate: (config: Record<string, unknown>) => void;
  onTriggerSpike: () => void;
  onFailNode: (id: string) => void;
  onRecoverNode: (id: string) => void;
  onFailRandom: () => void;
  onRecoverAll: () => void;
  onAddNode: () => void;
  onRemoveNode: (id: string) => void;
  onConfigUpdate: (config: Partial<SimulationConfig>) => void;
}

const ALGORITHMS: { value: AlgorithmType; label: string; desc: string }[] = [
  { value: 'ROUND_ROBIN', label: 'Round Robin', desc: 'Deterministic sequential rotation' },
  { value: 'LEAST_CONNECTIONS', label: 'Least Connections', desc: 'Routes to lowest active connection count' },
];

const PATTERNS: { value: TrafficPattern; label: string }[] = [
  { value: 'CONSTANT', label: 'Constant' },
  { value: 'RANDOM', label: 'Random' },
  { value: 'BURST', label: 'Burst' },
  { value: 'SPIKE', label: 'Spike' },
];

const RPS_PRESETS = [1, 5, 10, 25, 50, 100, 250];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state, nodes, onAlgorithmChange, onTrafficUpdate, onTriggerSpike,
  onFailNode, onRecoverNode, onFailRandom, onRecoverAll, onAddNode,
  onRemoveNode, onConfigUpdate,
}) => {
  const [selectedNode, setSelectedNode] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const config = state?.config;
  const rps = config?.trafficConfig.requestsPerSecond ?? 10;
  const pattern = config?.trafficConfig.pattern ?? 'CONSTANT';
  const algorithm = config?.algorithm ?? 'ROUND_ROBIN';

  const handleRpsChange = (val: number) => {
    onTrafficUpdate({ requestsPerSecond: val });
  };

  const targetNode = nodes.find(n => n.id === selectedNode) ?? nodes[0];

  return (
    <div className="space-y-4">
      {/* Algorithm Selection */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3.5">
          <Cpu className="w-4 h-4 text-accent-indigo" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Load Balancing Algorithm
          </h3>
        </div>
        <div className="space-y-2">
          {ALGORITHMS.map(algo => {
            const isSelected = algorithm === algo.value;
            return (
              <button
                key={algo.value}
                onClick={() => onAlgorithmChange(algo.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-accent-indigo/60 bg-accent-indigo/10 text-white shadow-md shadow-accent-indigo/10'
                    : 'border-white/[0.06] bg-zinc-950/40 text-zinc-400 hover:border-white/[0.12] hover:text-zinc-200'
                }`}
              >
                <div
                  className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-accent-indigo shadow-sm shadow-accent-indigo' : 'bg-zinc-700'
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold">{algo.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{algo.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Traffic Control */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3.5">
          <Sliders className="w-4 h-4 text-accent-cyan" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Traffic Generator
          </h3>
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-zinc-400">Incoming Requests / sec</label>
              <span className="text-accent-cyan font-mono text-xs font-bold">{rps} rps</span>
            </div>
            <input
              type="range"
              min="1" max="250" value={rps}
              onChange={e => handleRpsChange(Number(e.target.value))}
              className="w-full accent-accent-cyan"
            />
            <div className="flex justify-between mt-2 gap-1 flex-wrap">
              {RPS_PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => handleRpsChange(p)}
                  className={`text-[11px] px-2 py-0.5 rounded font-mono transition-all ${
                    rps === p
                      ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 font-bold'
                      : 'bg-zinc-950 text-zinc-500 border border-white/[0.06] hover:text-zinc-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Workload Profile</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PATTERNS.map(p => (
                <button
                  key={p.value}
                  onClick={() => onTrafficUpdate({ pattern: p.value })}
                  className={`text-xs py-1.5 rounded-lg border transition-all font-medium ${
                    pattern === p.value
                      ? 'border-accent-purple/50 bg-accent-purple/15 text-accent-purple font-semibold'
                      : 'border-white/[0.06] bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onTriggerSpike}
            className="w-full flex items-center justify-center gap-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-500/10"
          >
            <Zap className="w-3.5 h-3.5 fill-rose-400" />
            Inject Instant Traffic Surge
          </button>
        </div>
      </div>

      {/* Fault Injection */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Chaos Fault Injection
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Select Target Server</label>
            <select
              value={selectedNode || (nodes[0]?.id ?? '')}
              onChange={e => setSelectedNode(e.target.value)}
              className="w-full bg-zinc-950 border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-accent-indigo"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onFailNode(selectedNode || nodes[0]?.id)}
              disabled={!targetNode || targetNode.status === 'FAILED'}
              className="flex items-center justify-center gap-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Crash Node
            </button>
            <button
              onClick={() => onRecoverNode(selectedNode || nodes[0]?.id)}
              disabled={!targetNode || targetNode.status !== 'FAILED'}
              className="flex items-center justify-center gap-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Heal Node
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
            <button
              onClick={onFailRandom}
              className="py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-medium transition-all"
            >
              Random Outage
            </button>
            <button
              onClick={onRecoverAll}
              className="flex items-center justify-center gap-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Heal Entire Pool
            </button>
          </div>
        </div>
      </div>

      {/* Node Pool Elasticity */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Pool Elasticity ({nodes.length}/10)
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onAddNode}
              disabled={nodes.length >= 10}
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 disabled:opacity-40 transition-all"
              title="Scale Out Node"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const lastNode = nodes[nodes.length - 1];
                if (lastNode) onRemoveNode(lastNode.id);
              }}
              disabled={nodes.length <= 2}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 disabled:opacity-40 transition-all"
              title="Scale In Node"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500">
          Scale out up to 10 instances or scale in to a minimum of 2 instances.
        </p>
      </div>

      {/* Advanced Hypervisor Parameters */}
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 overflow-hidden backdrop-blur-sm shadow-xl">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between p-4 text-zinc-400 hover:text-white transition-colors"
        >
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">
            Hypervisor Simulation Config
          </span>
          {advancedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {advancedOpen && config && (
          <div className="px-5 pb-5 space-y-3.5 border-t border-white/[0.06] pt-4">
            <AdvancedSlider
              label="Base Processing Latency (ms)"
              value={config.baseLatency}
              min={5} max={200} step={5}
              onChange={v => onConfigUpdate({ baseLatency: v })}
            />
            <AdvancedSlider
              label="Latency Normal Jitter (ms)"
              value={config.latencyJitter}
              min={0} max={100} step={5}
              onChange={v => onConfigUpdate({ latencyJitter: v })}
            />
            <AdvancedSlider
              label="Random Failure Probability"
              value={Math.round(config.failureProbability * 100)}
              min={0} max={20} step={1}
              onChange={v => onConfigUpdate({ failureProbability: v / 100 })}
              suffix="%"
            />
            <AdvancedSlider
              label="Max Concurrency Limit / Node"
              value={config.maxConnections}
              min={10} max={200} step={10}
              onChange={v => onConfigUpdate({ maxConnections: v })}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface AdvancedSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}

const AdvancedSlider: React.FC<AdvancedSliderProps> = ({
  label, value, min, max, step, onChange, suffix = ''
}) => (
  <div>
    <div className="flex justify-between mb-1 text-xs">
      <label className="text-zinc-400">{label}</label>
      <span className="font-mono text-white font-semibold">{value}{suffix}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-accent-indigo"
    />
  </div>
);
