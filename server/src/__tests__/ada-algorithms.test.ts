import {
  findShortestPath,
  buildAdjacencyList,
  MinPriorityQueue,
  DEFAULT_NETWORK_NODES,
  DEFAULT_NETWORK_EDGES,
} from '../algorithms/dijkstra';
import { solveKnapsack, DEFAULT_TASKS, KnapsackTask } from '../algorithms/knapsack';

// ─── MinPriorityQueue Tests ───────────────────────────────────────────────────

describe('MinPriorityQueue', () => {
  test('extracts elements in ascending priority order', () => {
    const pq = new MinPriorityQueue<string>();
    pq.insert('A', 50);
    pq.insert('B', 10);
    pq.insert('C', 30);
    pq.insert('D', 5);
    pq.insert('E', 20);

    expect(pq.extractMin()?.item).toBe('D'); // 5
    expect(pq.extractMin()?.item).toBe('B'); // 10
    expect(pq.extractMin()?.item).toBe('E'); // 20
    expect(pq.extractMin()?.item).toBe('C'); // 30
    expect(pq.extractMin()?.item).toBe('A'); // 50
    expect(pq.extractMin()).toBeNull();
  });

  test('reports correct size and isEmpty state', () => {
    const pq = new MinPriorityQueue<number>();
    expect(pq.isEmpty()).toBe(true);
    expect(pq.size()).toBe(0);

    pq.insert(100, 1);
    expect(pq.isEmpty()).toBe(false);
    expect(pq.size()).toBe(1);

    pq.extractMin();
    expect(pq.isEmpty()).toBe(true);
  });
});

// ─── Dijkstra Shortest Path Tests ─────────────────────────────────────────────

describe('Dijkstra Shortest Path Algorithm', () => {
  test('finds correct shortest path from EDGE_GW to DB_CORE in default cloud network', () => {
    const result = findShortestPath(
      DEFAULT_NETWORK_NODES,
      DEFAULT_NETWORK_EDGES,
      'EDGE_GW',
      'DB_CORE'
    );

    // Shortest path: EDGE_GW (0) -> US_EAST_RT (15) -> COMPUTE_APP_1 (25) -> DB_CORE (33)
    expect(result.path).toEqual(['EDGE_GW', 'US_EAST_RT', 'COMPUTE_APP_1', 'DB_CORE']);
    expect(result.totalCost).toBe(33);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.timeComplexity).toContain('O((V + E) log V)');
  });

  test('returns distance 0 and single node path when source equals destination', () => {
    const result = findShortestPath(
      DEFAULT_NETWORK_NODES,
      DEFAULT_NETWORK_EDGES,
      'US_EAST_RT',
      'US_EAST_RT'
    );
    expect(result.path).toEqual(['US_EAST_RT']);
    expect(result.totalCost).toBe(0);
  });

  test('handles unreachable/disconnected target gracefully', () => {
    const isolatedNodes = [
      { id: 'N1', label: 'Node 1', region: 'us-1', type: 'ROUTER' as const, x: 0, y: 0 },
      { id: 'N2', label: 'Node 2', region: 'us-1', type: 'ROUTER' as const, x: 10, y: 10 },
      { id: 'ISOLATED', label: 'Isolated', region: 'us-1', type: 'ROUTER' as const, x: 20, y: 20 },
    ];
    const isolatedEdges = [{ source: 'N1', target: 'N2', weight: 10 }];

    const result = findShortestPath(isolatedNodes, isolatedEdges, 'N1', 'ISOLATED');
    expect(result.totalCost).toBe(-1);
    expect(result.path).toEqual([]);
  });

  test('buildAdjacencyList builds bidirectional graph links', () => {
    const edges = [{ source: 'A', target: 'B', weight: 42 }];
    const adj = buildAdjacencyList(edges);
    expect(adj.get('A')).toEqual([{ target: 'B', weight: 42 }]);
    expect(adj.get('B')).toEqual([{ target: 'A', weight: 42 }]);
  });
});

// ─── 0/1 Knapsack Dynamic Programming Tests ───────────────────────────────────

describe('0/1 Knapsack Algorithm using Dynamic Programming', () => {
  test('returns 0 when capacity is 0', () => {
    const result = solveKnapsack(DEFAULT_TASKS, 0);
    expect(result.totalValue).toBe(0);
    expect(result.totalWeight).toBe(0);
    expect(result.selectedTasks).toEqual([]);
    expect(result.rejectedTasks.length).toBe(DEFAULT_TASKS.length);
  });

  test('never exceeds total capacity constraint', () => {
    const capacities = [5, 10, 15, 20, 25, 30, 40];
    for (const cap of capacities) {
      const result = solveKnapsack(DEFAULT_TASKS, cap);
      expect(result.totalWeight).toBeLessThanOrEqual(cap);
    }
  });

  test('correctly solves standard textbook knapsack scenario', () => {
    const tasks: KnapsackTask[] = [
      { id: '1', name: 'Task 1', weight: 2, value: 3, serviceType: 'AUTH' },
      { id: '2', name: 'Task 2', weight: 3, value: 4, serviceType: 'PAYMENT' },
      { id: '3', name: 'Task 3', weight: 4, value: 5, serviceType: 'DATABASE' },
      { id: '4', name: 'Task 4', weight: 5, value: 6, serviceType: 'STREAMING' },
    ];
    // Capacity 5: Optimal subset is Task 1 (wt 2, val 3) + Task 2 (wt 3, val 4) => total val 7, total wt 5
    const result = solveKnapsack(tasks, 5);
    expect(result.totalValue).toBe(7);
    expect(result.totalWeight).toBe(5);
    expect(result.selectedTasks.map(t => t.id)).toEqual(['1', '2']);
  });

  test('constructs dynamic programming table of size (n + 1) x (W + 1)', () => {
    const capacity = 12;
    const result = solveKnapsack(DEFAULT_TASKS, capacity);
    expect(result.dpTable.length).toBe(DEFAULT_TASKS.length + 1);
    expect(result.dpTable[0].length).toBe(capacity + 1);
    expect(result.dpTable[DEFAULT_TASKS.length][capacity]).toBe(result.totalValue);
  });

  test('all items selected when capacity is greater than total weight', () => {
    const tasks: KnapsackTask[] = [
      { id: '1', name: 'T1', weight: 2, value: 10, serviceType: 'AUTH' },
      { id: '2', name: 'T2', weight: 3, value: 20, serviceType: 'PAYMENT' },
    ];
    const result = solveKnapsack(tasks, 100);
    expect(result.selectedTasks.length).toBe(2);
    expect(result.rejectedTasks.length).toBe(0);
    expect(result.totalValue).toBe(30);
    expect(result.totalWeight).toBe(5);
  });
});
