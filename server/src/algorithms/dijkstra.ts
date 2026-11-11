/**
 * Dijkstra's Shortest Path Algorithm Implementation
 * 
 * Architecture:
 * - Adjacency List graph representation
 * - Binary Min-Heap Priority Queue for O((V + E) log V) time complexity
 * - Step-by-step trace recorder for visual exploration and viva demonstration
 */

export interface GraphEdge {
  target: string;
  weight: number;
}

export interface GraphNode {
  id: string;
  label: string;
  region: string;
  type: 'GATEWAY' | 'ROUTER' | 'COMPUTE' | 'DATABASE' | 'STORAGE';
  x: number; // Layout coordinates for 2D visualization
  y: number;
}

export interface DijkstraStep {
  stepNumber: number;
  currentNode: string;
  currentDist: number;
  evaluatedEdge?: {
    to: string;
    edgeWeight: number;
    calculatedDist: number;
    relaxed: boolean;
  };
  distances: Record<string, number>;
  visited: string[];
  description: string;
}

export interface DijkstraResult {
  source: string;
  destination: string;
  path: string[];
  totalCost: number;
  distances: Record<string, number>;
  steps: DijkstraStep[];
  visitedOrder: string[];
  timeComplexity: string;
  spaceComplexity: string;
}

/**
 * Binary Min-Heap Priority Queue implementation for Dijkstra
 */
export class MinPriorityQueue<T> {
  private heap: Array<{ item: T; priority: number }> = [];

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  insert(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  extractMin(): { item: T; priority: number } | null {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.bubbleDown(0);
    }
    return min;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parentIndex].priority) break;
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }
      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

/**
 * Default Cloud Network Topology
 * Represents a distributed multi-region cloud infrastructure
 */
export const DEFAULT_NETWORK_NODES: GraphNode[] = [
  { id: 'EDGE_GW', label: 'Global Edge Gateway', region: 'Global Edge', type: 'GATEWAY', x: 100, y: 220 },
  { id: 'US_EAST_RT', label: 'US-East Backbone', region: 'us-east-1', type: 'ROUTER', x: 260, y: 120 },
  { id: 'US_WEST_RT', label: 'US-West Backbone', region: 'us-west-2', type: 'ROUTER', x: 260, y: 320 },
  { id: 'EU_CENTRAL_RT', label: 'EU-Central Hub', region: 'eu-central-1', type: 'ROUTER', x: 440, y: 120 },
  { id: 'AP_EAST_RT', label: 'AP-East Gateway', region: 'ap-east-1', type: 'ROUTER', x: 440, y: 320 },
  { id: 'COMPUTE_APP_1', label: 'App Cluster Alpha', region: 'us-east-1', type: 'COMPUTE', x: 620, y: 120 },
  { id: 'COMPUTE_APP_2', label: 'App Cluster Beta', region: 'eu-central-1', type: 'COMPUTE', x: 620, y: 220 },
  { id: 'COMPUTE_APP_3', label: 'App Cluster Gamma', region: 'ap-east-1', type: 'COMPUTE', x: 620, y: 320 },
  { id: 'DB_CORE', label: 'Core Database Primary', region: 'us-east-1', type: 'DATABASE', x: 800, y: 160 },
  { id: 'STORAGE_LAKE', label: 'Cloud Storage Lake', region: 'us-east-1', type: 'STORAGE', x: 800, y: 280 },
];

export const DEFAULT_NETWORK_EDGES: Array<{ source: string; target: string; weight: number }> = [
  // Gateway links
  { source: 'EDGE_GW', target: 'US_EAST_RT', weight: 15 },
  { source: 'EDGE_GW', target: 'US_WEST_RT', weight: 25 },

  // Inter-backbone meshes
  { source: 'US_EAST_RT', target: 'US_WEST_RT', weight: 35 },
  { source: 'US_EAST_RT', target: 'EU_CENTRAL_RT', weight: 70 },
  { source: 'US_WEST_RT', target: 'AP_EAST_RT', weight: 110 },
  { source: 'EU_CENTRAL_RT', target: 'AP_EAST_RT', weight: 130 },

  // Compute cluster routing
  { source: 'US_EAST_RT', target: 'COMPUTE_APP_1', weight: 10 },
  { source: 'US_EAST_RT', target: 'COMPUTE_APP_2', weight: 80 },
  { source: 'US_WEST_RT', target: 'COMPUTE_APP_1', weight: 45 },
  { source: 'US_WEST_RT', target: 'COMPUTE_APP_3', weight: 115 },
  { source: 'EU_CENTRAL_RT', target: 'COMPUTE_APP_2', weight: 12 },
  { source: 'AP_EAST_RT', target: 'COMPUTE_APP_3', weight: 14 },

  // App to Storage & Database backends
  { source: 'COMPUTE_APP_1', target: 'DB_CORE', weight: 8 },
  { source: 'COMPUTE_APP_1', target: 'STORAGE_LAKE', weight: 20 },
  { source: 'COMPUTE_APP_2', target: 'DB_CORE', weight: 75 },
  { source: 'COMPUTE_APP_2', target: 'STORAGE_LAKE', weight: 65 },
  { source: 'COMPUTE_APP_3', target: 'DB_CORE', weight: 160 },
  { source: 'COMPUTE_APP_3', target: 'STORAGE_LAKE', weight: 140 },
];

/**
 * Builds an adjacency list from edge definitions.
 * Network links are modeled as bidirectional for full reachability.
 */
export function buildAdjacencyList(
  edges: Array<{ source: string; target: string; weight: number }>
): Map<string, GraphEdge[]> {
  const adj = new Map<string, GraphEdge[]>();
  for (const { source, target, weight } of edges) {
    if (!adj.has(source)) adj.set(source, []);
    if (!adj.has(target)) adj.set(target, []);
    adj.get(source)!.push({ target, weight });
    adj.get(target)!.push({ target: source, weight }); // Undirected communication link
  }
  return adj;
}

/**
 * Execute Dijkstra's Algorithm with step recording
 */
export function findShortestPath(
  nodes: GraphNode[],
  edges: Array<{ source: string; target: string; weight: number }>,
  source: string,
  destination: string
): DijkstraResult {
  const adj = buildAdjacencyList(edges);
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();
  const visitedOrder: string[] = [];
  const steps: DijkstraStep[] = [];
  let stepCounter = 1;

  for (const node of nodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  }
  distances[source] = 0;

  const pq = new MinPriorityQueue<string>();
  pq.insert(source, 0);

  steps.push({
    stepNumber: stepCounter++,
    currentNode: source,
    currentDist: 0,
    distances: { ...distances },
    visited: Array.from(visited),
    description: `Initialized source node ${source} with distance 0. All other nodes initialized to Infinity (∞).`,
  });

  while (!pq.isEmpty()) {
    const minEntry = pq.extractMin();
    if (!minEntry) break;
    const { item: u, priority: d } = minEntry;

    // Skip if we already found a shorter path to u
    if (visited.has(u)) continue;
    visited.add(u);
    visitedOrder.push(u);

    steps.push({
      stepNumber: stepCounter++,
      currentNode: u,
      currentDist: d,
      distances: { ...distances },
      visited: Array.from(visited),
      description: `Visited node ${u} with confirmed shortest distance ${d}ms.`,
    });

    // If destination reached, we can terminate early
    if (u === destination) {
      break;
    }

    const neighbors = adj.get(u) || [];
    for (const edge of neighbors) {
      const v = edge.target;
      if (visited.has(v)) continue;

      const alt = d + edge.weight;
      const relaxed = alt < distances[v];

      steps.push({
        stepNumber: stepCounter++,
        currentNode: u,
        currentDist: d,
        evaluatedEdge: {
          to: v,
          edgeWeight: edge.weight,
          calculatedDist: alt,
          relaxed,
        },
        distances: { ...distances },
        visited: Array.from(visited),
        description: relaxed
          ? `Relaxation: Link ${u} → ${v} offers shorter distance ${alt}ms (previous: ${distances[v] === Infinity ? '∞' : distances[v] + 'ms'}). Updated.`
          : `Edge ${u} → ${v} (distance ${alt}ms) is not shorter than existing ${distances[v]}ms. Skipped.`,
      });

      if (relaxed) {
        distances[v] = alt;
        previous[v] = u;
        pq.insert(v, alt);
      }
    }
  }

  // Backtrack to reconstruct the optimal shortest path
  const path: string[] = [];
  let curr: string | null = destination;
  if (distances[destination] !== Infinity) {
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }
  }

  return {
    source,
    destination,
    path,
    totalCost: distances[destination] === Infinity ? -1 : distances[destination],
    distances,
    steps,
    visitedOrder,
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V + E)',
  };
}
