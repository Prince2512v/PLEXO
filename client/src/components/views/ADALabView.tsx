import React, { useState } from 'react';
import {
  GraphNode,
  GraphEdge,
  DijkstraResult,
  KnapsackTask,
  KnapsackResult,
} from '../../types';

interface StepData {
  curr: string;
  dist: number;
  text: string;
  pq: string;
  visited: string[];
  dists: Record<string, string>;
  prev: Record<string, string>;
  optimal?: boolean;
}

const DIJKSTRA_STEPS: StepData[] = [
  { curr: 'S', dist: 0, text: 'Evaluated Gateway S. Neighbor candidates: A (4ms), B (7ms).', pq: '[A:4, B:7]', visited: ['S'], dists: { A: '4', B: '7', R1: '∞', R2: '∞', D: '∞' }, prev: { A: 'S', B: 'S', R1: '-', R2: '-', D: '-' } },
  { curr: 'A', dist: 4, text: 'Selected min POP A (4ms). Discovered path to R2 (4+5=9ms), R1 (4+12=16ms).', pq: '[B:6, R2:9, R1:16]', visited: ['S', 'A'], dists: { A: '4', B: '6', R1: '16', R2: '9', D: '∞' }, prev: { A: 'S', B: 'A', R1: 'A', R2: 'A', D: '-' } },
  { curr: 'B', dist: 6, text: 'Visited POP B (6ms via A). Path to R2 via B is 6+8=14ms (higher than current 9ms, discard).', pq: '[R2:9, R1:16]', visited: ['S', 'A', 'B'], dists: { A: '4', B: '6', R1: '16', R2: '9', D: '∞' }, prev: { A: 'S', B: 'A', R1: 'A', R2: 'A', D: '-' } },
  { curr: 'R2', dist: 9, text: 'Visited Core Router R2 (9ms). Evaluated link to Target Datacenter D: 9+9 = 18ms.', pq: '[R1:12, D:18]', visited: ['S', 'A', 'B', 'R2'], dists: { A: '4', B: '6', R1: '12', R2: '9', D: '18' }, prev: { A: 'S', B: 'A', R1: 'R2', R2: 'A', D: 'R2' } },
  { curr: 'R1', dist: 12, text: 'Visited Core Router R1 (12ms). Link to D gives 12+15 = 27ms (greater than 18ms, ignore).', pq: '[D:18]', visited: ['S', 'A', 'B', 'R2', 'R1'], dists: { A: '4', B: '6', R1: '12', R2: '9', D: '18' }, prev: { A: 'S', B: 'A', R1: 'R2', R2: 'A', D: 'R2' } },
  { curr: 'D', dist: 18, text: 'Goal Reached: Target Datacenter D settled with minimal latency of 18ms via [S -> A -> R2 -> D].', pq: 'Priority Queue Empty', visited: ['S', 'A', 'B', 'R2', 'R1', 'D'], dists: { A: '4', B: '6', R1: '12', R2: '9', D: '18' }, prev: { A: 'S', B: 'A', R1: 'R2', R2: 'A', D: 'R2' }, optimal: true },
];

const KNAPSACK_TASKS = [
  { id: 1, name: 'T1: ML Mesh', w: 20, v: 35, type: 'Inference', status: 'Priority Core' },
  { id: 2, name: 'T2: Video Transcode', w: 30, v: 50, type: 'Media Worker', status: 'Burst Stream' },
  { id: 3, name: 'T3: DB Backup', w: 40, v: 45, type: 'Storage Task', status: 'Scheduled Batch' },
  { id: 4, name: 'T4: Analytics Core', w: 20, v: 57, type: 'Aggregator', status: 'Real-time OLAP' },
];

export const ADALabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dijkstra' | 'knapsack'>('dijkstra');

  // Dijkstra Source and Target
  const [sourceNode, setSourceNode] = useState<string>('S');
  const [targetNode, setTargetNode] = useState<string>('D');

  // Dijkstra Step
  const [dijkstraStep, setDijkstraStep] = useState<number>(0);
  const currentDijkstra = DIJKSTRA_STEPS[dijkstraStep];

  // Knapsack State
  const [knapsackCap, setKnapsackCap] = useState<number>(80);

  // Knapsack DP computation
  const step = 10;
  const cols = Math.floor(knapsackCap / step) + 1;
  const n = KNAPSACK_TASKS.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(cols).fill(0));
  for (let i = 1; i <= n; i++) {
    const itemW = KNAPSACK_TASKS[i - 1].w;
    const itemV = KNAPSACK_TASKS[i - 1].v;
    for (let c = 0; c < cols; c++) {
      const cap = c * step;
      if (itemW <= cap) {
        const prevCol = Math.floor((cap - itemW) / step);
        dp[i][c] = Math.max(dp[i - 1][c], dp[i - 1][prevCol] + itemV);
      } else {
        dp[i][c] = dp[i - 1][c];
      }
    }
  }

  // Backtrack optimal items
  let cTrack = cols - 1;
  const selectedTaskIds: number[] = [];
  for (let i = n; i > 0; i--) {
    if (dp[i][cTrack] !== dp[i - 1][cTrack]) {
      selectedTaskIds.push(KNAPSACK_TASKS[i - 1].id);
      const itemW = KNAPSACK_TASKS[i - 1].w;
      cTrack = Math.floor((cTrack * step - itemW) / step);
    }
  }

  const totalAllocWeight = KNAPSACK_TASKS
    .filter(t => selectedTaskIds.includes(t.id))
    .reduce((sum, t) => sum + t.w, 0);
  const totalAllocValue = KNAPSACK_TASKS
    .filter(t => selectedTaskIds.includes(t.id))
    .reduce((sum, t) => sum + t.v, 0);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Utility Context Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              Academic Kernel v3.4
            </span>
            <span className="text-on-surface-variant font-label-sm text-label-sm">
              Mesh Node Optimization Engine
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight">
            ADA Algorithm Laboratory
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Deterministic routing simulations, greedy priority queue analytics, and dynamic programming resource schedulers under operational latency constraints.
          </p>
        </div>

        {/* Algorithm Switcher Tabs (Pill Architecture) */}
        <div className="flex items-center p-1.5 bg-surface-container-low rounded-full shadow-sm backdrop-blur-xl self-start lg:self-center">
          <button
            onClick={() => setActiveTab('dijkstra')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-label-lg text-label-lg transition-all ${
              activeTab === 'dijkstra'
                ? 'bg-primary-container text-on-primary shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>Dijkstra Shortest Path</span>
          </button>
          <button
            onClick={() => setActiveTab('knapsack')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-label-lg text-label-lg transition-all ${
              activeTab === 'knapsack'
                ? 'bg-primary-container text-on-primary shadow-md font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
            <span>0/1 Knapsack DP Allocator</span>
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: DIJKSTRA VISUALIZER ================= */}
      {activeTab === 'dijkstra' && (
        <div className="flex flex-col gap-6">
          {/* Controls Pill Header */}
          <div className="p-4 bg-surface-container-lowest rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Source:</span>
                <select
                  value={sourceNode}
                  onChange={e => setSourceNode(e.target.value)}
                  className="bg-surface-container-low px-3 py-1.5 rounded-full font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="S">Client Gateway (S)</option>
                  <option value="A">Edge POP A (A)</option>
                  <option value="B">Edge POP B (B)</option>
                  <option value="R1">Core Router 1 (R1)</option>
                  <option value="R2">Core Router 2 (R2)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Target:</span>
                <select
                  value={targetNode}
                  onChange={e => setTargetNode(e.target.value)}
                  className="bg-surface-container-low px-3 py-1.5 rounded-full font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="D">Datacenter Main (D)</option>
                  <option value="R2">Core Router 2 (R2)</option>
                  <option value="R1">Core Router 1 (R1)</option>
                  <option value="B">Edge POP B (B)</option>
                </select>
              </div>

              <div className="h-6 w-px bg-surface-variant hidden md:block" />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDijkstraStep(DIJKSTRA_STEPS.length - 1)}
                  className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary font-label-md text-label-md flex items-center gap-1.5 hover:bg-secondary transition-colors shadow-sm font-semibold"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Execute Dijkstra</span>
                </button>
                <button
                  onClick={() => setDijkstraStep(prev => Math.min(DIJKSTRA_STEPS.length - 1, prev + 1))}
                  className="px-4 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">skip_next</span>
                  <span>Step Next</span>
                </button>
                <button
                  onClick={() => setDijkstraStep(0)}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md text-label-md flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-label-sm text-label-sm font-bold px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full shadow-sm">
                Priority Queue: {currentDijkstra.pq}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Complexity: <strong className="text-secondary font-mono">O((V + E) log V)</strong>
              </span>
            </div>
          </div>

          {/* Interactive Topology Graph & State Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Topology Map SVG */}
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    Mesh Network Edge-Weighted Topography
                  </span>
                </div>
                <div className="flex items-center gap-3 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-surface-container-low border border-outline-variant inline-block" /> Unvisited
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-secondary-fixed inline-block" /> Settled (Visited)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-1 bg-secondary inline-block rounded" /> Optimal Shortest Path
                  </span>
                </div>
              </div>

              {/* Topology SVG */}
              <div className="relative w-full h-[400px] bg-surface-container-low/40 rounded-2xl flex items-center justify-center overflow-hidden border border-surface-container">
                <svg className="w-full h-full" viewBox="0 0 760 380">
                  {/* Edges */}
                  <line
                    x1="90" y1="190" x2="250" y2="100"
                    stroke={currentDijkstra.optimal ? '#346095' : '#c4c6ce'}
                    strokeWidth={currentDijkstra.optimal ? '4' : '2'}
                  />
                  <line x1="90" y1="190" x2="250" y2="280" stroke="#c4c6ce" strokeWidth="2" />
                  <line x1="250" y1="100" x2="250" y2="280" stroke="#c4c6ce" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="250" y1="100" x2="470" y2="100" stroke="#c4c6ce" strokeWidth="2" strokeDasharray="4 4" />
                  <line
                    x1="250" y1="100" x2="470" y2="280"
                    stroke={currentDijkstra.optimal ? '#346095' : '#c4c6ce'}
                    strokeWidth={currentDijkstra.optimal ? '4' : '2'}
                  />
                  <line x1="250" y1="280" x2="470" y2="280" stroke="#c4c6ce" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="470" y1="100" x2="470" y2="280" stroke="#c4c6ce" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="470" y1="100" x2="670" y2="190" stroke="#c4c6ce" strokeWidth="2" />
                  <line
                    x1="470" y1="280" x2="670" y2="190"
                    stroke={currentDijkstra.optimal ? '#346095' : '#c4c6ce'}
                    strokeWidth={currentDijkstra.optimal ? '4' : '2'}
                  />

                  {/* Edge Labels */}
                  <rect x="160" y="135" width="28" height="18" rx="4" fill="#edeeef" />
                  <text x="174" y="148" textAnchor="middle" fill="#43474d" fontSize="11" fontWeight="600">4ms</text>
                  <rect x="160" y="240" width="28" height="18" rx="4" fill="#edeeef" />
                  <text x="174" y="253" textAnchor="middle" fill="#43474d" fontSize="11" fontWeight="600">7ms</text>
                  <rect x="350" y="88" width="34" height="18" rx="4" fill="#edeeef" />
                  <text x="367" y="101" textAnchor="middle" fill="#43474d" fontSize="11" fontWeight="600">12ms</text>
                  <rect x="350" y="180" width="28" height="18" rx="4" fill="#edeeef" />
                  <text x="364" y="193" textAnchor="middle" fill="#43474d" fontSize="11" fontWeight="600">5ms</text>
                  <rect x="560" y="135" width="34" height="18" rx="4" fill="#edeeef" />
                  <text x="577" y="148" textAnchor="middle" fill="#43474d" fontSize="11" fontWeight="600">15ms</text>
                  <rect x="560" y="240" width="28" height="18" rx="4" fill="#edeeef" />
                  <text x="574" y="253" textAnchor="middle" fill="#43474d" fontSize="11" fontWeight="600">9ms</text>

                  {/* Nodes */}
                  {/* S */}
                  <g transform="translate(90, 190)">
                    <circle r="32" fill="#e7e8e9" stroke="#346095" strokeWidth="3" />
                    <text y="5" textAnchor="middle" fill="#000105" fontSize="14" fontWeight="800">S</text>
                    <text y="48" textAnchor="middle" fill="#43474d" fontSize="11" fontWeight="600">Gateway</text>
                  </g>
                  {/* A */}
                  <g transform="translate(250, 100)">
                    <circle r="28" fill={currentDijkstra.visited.includes('A') ? '#d3e3ff' : '#f3f4f5'} stroke="#74777e" strokeWidth="2" />
                    <text y="5" textAnchor="middle" fill="#191c1d" fontSize="13" fontWeight="700">A</text>
                    <text y="44" textAnchor="middle" fill="#43474d" fontSize="10">Edge POP A</text>
                  </g>
                  {/* B */}
                  <g transform="translate(250, 280)">
                    <circle r="28" fill={currentDijkstra.visited.includes('B') ? '#d3e3ff' : '#f3f4f5'} stroke="#74777e" strokeWidth="2" />
                    <text y="5" textAnchor="middle" fill="#191c1d" fontSize="13" fontWeight="700">B</text>
                    <text y="44" textAnchor="middle" fill="#43474d" fontSize="10">Edge POP B</text>
                  </g>
                  {/* R1 */}
                  <g transform="translate(470, 100)">
                    <circle r="28" fill={currentDijkstra.visited.includes('R1') ? '#d3e3ff' : '#f3f4f5'} stroke="#74777e" strokeWidth="2" />
                    <text y="5" textAnchor="middle" fill="#191c1d" fontSize="12" fontWeight="700">R1</text>
                    <text y="44" textAnchor="middle" fill="#43474d" fontSize="10">Core Router 1</text>
                  </g>
                  {/* R2 */}
                  <g transform="translate(470, 280)">
                    <circle r="28" fill={currentDijkstra.visited.includes('R2') ? '#d3e3ff' : '#f3f4f5'} stroke="#74777e" strokeWidth="2" />
                    <text y="5" textAnchor="middle" fill="#191c1d" fontSize="12" fontWeight="700">R2</text>
                    <text y="44" textAnchor="middle" fill="#43474d" fontSize="10">Core Router 2</text>
                  </g>
                  {/* D */}
                  <g transform="translate(670, 190)">
                    <circle r="34" fill={currentDijkstra.visited.includes('D') ? '#d3e3ff' : '#f3f4f5'} stroke="#001d39" strokeWidth="3" />
                    <text y="5" textAnchor="middle" fill="#000105" fontSize="15" fontWeight="800">D</text>
                    <text y="50" textAnchor="middle" fill="#43474d" fontSize="11" fontWeight="600">Datacenter</text>
                  </g>
                </svg>
              </div>

              {/* Step Execution Log Description */}
              <div className="p-4 bg-surface-container-low rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-[22px] mt-0.5">terminal</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
                    Step {dijkstraStep + 1} of {DIJKSTRA_STEPS.length} Execution Trace
                  </span>
                  <p className="font-body-md text-body-md text-on-surface mt-0.5">
                    {currentDijkstra.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Distance Settled Table & Summary */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Distance Matrix Card */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-title-md text-on-surface font-bold">Shortest Distance Vector</span>
                  <span className="font-label-sm text-label-sm text-secondary font-bold">Min-Heap State</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-sm text-body-sm">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase">
                        <th className="pb-2">Node</th>
                        <th className="pb-2">Dist</th>
                        <th className="pb-2">Predecessor</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {(['A', 'B', 'R1', 'R2', 'D'] as const).map(nodeId => (
                        <tr key={nodeId} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-2.5 font-bold text-on-surface">{nodeId}</td>
                          <td className="py-2.5 font-mono text-secondary font-semibold">
                            {currentDijkstra.dists[nodeId]} {currentDijkstra.dists[nodeId] !== '∞' ? 'ms' : ''}
                          </td>
                          <td className="py-2.5 font-mono text-on-surface-variant">{currentDijkstra.prev[nodeId]}</td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                              currentDijkstra.visited.includes(nodeId)
                                ? 'bg-secondary-fixed text-on-secondary-fixed font-bold'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}>
                              {currentDijkstra.visited.includes(nodeId) ? 'Visited' : 'Unvisited'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Optimal Settlement KPI Capsule */}
                <div className="p-4 bg-surface-container-low rounded-2xl flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Settled Optimal Latency</span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      {currentDijkstra.optimal ? '18 ms' : '--'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[32px]">verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: 0/1 KNAPSACK ALLOCATOR ================= */}
      {activeTab === 'knapsack' && (
        <div className="flex flex-col gap-6">
          {/* Top Allocator Toolbar */}
          <div className="p-5 bg-surface-container-lowest rounded-3xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-1 w-full lg:w-1/3">
              <div className="flex justify-between items-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
                  Node Compute Budget (Capacity):
                </span>
                <span className="font-title-md text-title-md text-primary font-bold">
                  {knapsackCap} GB RAM
                </span>
              </div>
              <input
                className="w-full accent-primary h-2 bg-surface-container-low rounded-lg cursor-pointer"
                type="range"
                min="40"
                max="100"
                step="10"
                value={knapsackCap}
                onChange={e => setKnapsackCap(Number(e.target.value))}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setKnapsackCap(prev => (prev === 90 ? 80 : 90))}
                className="px-5 py-2 rounded-full bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center gap-2 hover:bg-secondary transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">memory</span>
                <span>Compute Optimal Allocation</span>
              </button>
              <button
                onClick={() => setKnapsackCap(80)}
                className="px-4 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-all"
              >
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Quick KPI Strip */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 bg-surface-container-low rounded-2xl flex flex-col items-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Capacity Used</span>
                <span className="font-title-md text-title-md text-primary font-bold">
                  {totalAllocWeight} / {knapsackCap} GB
                </span>
              </div>
              <div className="px-3.5 py-2 bg-secondary-fixed/50 rounded-2xl flex flex-col items-center">
                <span className="font-label-sm text-label-sm text-on-secondary-fixed uppercase">Total Utility</span>
                <span className="font-title-md text-title-md text-secondary font-bold">
                  {totalAllocValue} pts
                </span>
              </div>
            </div>
          </div>

          {/* Dual Panel: Available Ingress Request Pool + DP Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 Cols: Request Ingress Task Pool */}
            <div className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  Pending Microservice Tasks (n=4)
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-bold">Priority Heap</span>
              </div>

              <div className="flex flex-col gap-3">
                {KNAPSACK_TASKS.map(task => {
                  const isAllocated = selectedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                        isAllocated
                          ? 'bg-secondary-fixed/30 border border-secondary-fixed'
                          : 'bg-surface-container-low opacity-70'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-primary font-bold">
                          {task.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-label-sm text-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                            Req: {task.w} GB
                          </span>
                          <span className="font-label-sm text-label-sm bg-surface-container px-2 py-0.5 rounded text-secondary font-semibold">
                            Value: {task.v}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm ${
                        isAllocated
                          ? 'bg-secondary-fixed text-on-secondary-fixed font-bold'
                          : 'bg-surface-container text-on-surface-variant font-semibold'
                      }`}>
                        {isAllocated ? 'Allocated' : 'Preempted'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Algorithm Complexity Formula Capsule */}
              <div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-1.5 mt-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
                  DP State Recurrence
                </span>
                <p className="font-mono text-body-sm text-secondary font-semibold">
                  DP[i, w] = max(DP[i-1, w], DP[i-1, w - w_i] + v_i)
                </p>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Time: <strong>O(n · W)</strong> | Space: <strong>O(n · W)</strong>
                </span>
              </div>
            </div>

            {/* Right 8 Cols: Dynamic Programming Matrix */}
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">grid_on</span>
                  <span className="font-title-md text-title-md text-on-surface font-bold">
                    Dynamic Programming Value Matrix [n × Capacity]
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Step Granularity: 10 GB
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase">
                      <th className="p-2.5 text-left font-bold">Task \ Cap</th>
                      {Array.from({ length: cols }, (_, c) => (
                        <th key={c} className="p-2 font-mono">
                          {c * step}G
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {Array.from({ length: n + 1 }, (_, i) => (
                      <tr key={i} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-2.5 font-bold text-left text-on-surface">
                          {i === 0 ? '0 (Init)' : KNAPSACK_TASKS[i - 1].name}
                        </td>
                        {Array.from({ length: cols }, (_, c) => {
                          const val = dp[i][c];
                          const isOptimalCorner = i === n && c === cols - 1;
                          return (
                            <td
                              key={c}
                              className={`p-2 font-mono text-label-md ${
                                isOptimalCorner
                                  ? 'font-bold text-on-secondary-fixed bg-secondary-fixed rounded-lg'
                                  : val > 0
                                  ? 'text-secondary font-medium'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Backtrack Explanation */}
              <div className="p-4 bg-surface-container-low rounded-2xl flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[24px]">lightbulb</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">
                    Optimal Subset Selection Backtrack
                  </span>
                  <p className="font-body-md text-body-md text-on-surface mt-0.5">
                    Optimal subset: {KNAPSACK_TASKS.filter(t => selectedTaskIds.includes(t.id)).map(t => `${t.name.split(':')[0]} (${t.w}GB, ${t.v}pts)`).join(' + ')} = {totalAllocWeight}GB used, score {totalAllocValue} pts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
