import React from 'react';
import { Play, Clapperboard } from 'lucide-react';

interface DemoScenariosProps {
  onRunScenario: (id: number) => void;
  isRunning: boolean;
}

const SCENARIOS = [
  {
    id: 1,
    name: 'Normal Traffic',
    description: 'Balanced distribution across 5 nodes at 20 req/s using Round Robin',
    algo: 'Round Robin',
    btnClass: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    tags: ['Round Robin', '20 RPS', 'Stable'],
  },
  {
    id: 2,
    name: 'Traffic Spike',
    description: 'Sudden surge from 20 → 200 req/s. Watch latency and error rate spike.',
    algo: 'Round Robin',
    btnClass: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400',
    tags: ['Spike', '10×', 'Stress'],
  },
  {
    id: 3,
    name: 'Node Failure',
    description: 'Node 3 fails after 4 seconds. Traffic automatically redistributes.',
    algo: 'Round Robin',
    btnClass: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400',
    tags: ['Fault', 'Recovery', 'Redistribution'],
  },
  {
    id: 4,
    name: 'Multiple Failures',
    description: '2 nodes fail simultaneously. Remaining nodes absorb the load.',
    algo: 'Least Connections',
    btnClass: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400',
    tags: ['Multi-fault', 'LC', 'Resilience'],
  },
  {
    id: 5,
    name: 'Algo Comparison',
    description: 'Auto-switches between Round Robin and Least Connections under sustained load to compare balancing efficiency.',
    algo: 'RR & LC',
    btnClass: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 text-violet-400',
    tags: ['Comparison', 'Round Robin', 'Least Connections'],
  },
];

const TAG_COLORS: Record<string, string> = {
  'Round Robin': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Least Connections': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Spike': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'Fault': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  default: 'bg-zinc-800/80 text-zinc-500 border-white/[0.07]',
};

export const DemoScenarios: React.FC<DemoScenariosProps> = ({ onRunScenario, isRunning }) => {
  return (
    <div className="bg-zinc-900/40 border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <Clapperboard className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">Demo Scenarios</h3>
        <span className="text-xs text-zinc-500">— One-click demos</span>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {SCENARIOS.map(scenario => (
          <div
            key={scenario.id}
            className="bg-zinc-950/60 border border-white/[0.06] rounded-xl p-3.5 flex flex-col gap-3 hover:border-white/[0.12] transition-all group"
          >
            <div>
              <div className="flex items-start justify-between mb-1">
                <span className="text-white font-semibold text-sm">{scenario.name}</span>
                <span className="text-zinc-600 text-xs ml-1 flex-shrink-0 font-mono">#{scenario.id}</span>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed">{scenario.description}</p>
            </div>

            <div className="flex flex-wrap gap-1">
              {scenario.tags.map(tag => (
                <span
                  key={tag}
                  className={`text-xs px-1.5 py-0.5 rounded border ${TAG_COLORS[tag] ?? TAG_COLORS.default}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => onRunScenario(scenario.id)}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${scenario.btnClass}`}
            >
              <Play className="w-3 h-3" />
              Run Scenario
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <p className="text-xs text-zinc-600">
          ⚠️ Running a scenario resets the simulation and starts automatically.
          Scenarios are designed for 3–5 minute presentation demos.
        </p>
      </div>
    </div>
  );
};
