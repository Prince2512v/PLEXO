// Shared types matching the server-side types

export type NodeStatus = 'HEALTHY' | 'DEGRADED' | 'FAILED';
export type RequestStatus = 'SUCCESS' | 'FAILED' | 'TIMEOUT';
export type AlgorithmType = 'ROUND_ROBIN' | 'LEAST_CONNECTIONS';
export type TrafficPattern = 'CONSTANT' | 'RANDOM' | 'BURST' | 'SPIKE';
export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

export interface MicroserviceNodeData {
  id: string;
  name: string;
  status: NodeStatus;
  activeConnections: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cpuUsage: number;
  memoryUsage: number;
  averageLatency: number;
  currentLatency: number;
  weight: number;
}

export interface SimulatedRequest {
  requestId: string;
  timestamp: number;
  clientId: string;
  selectedNode: string | null;
  algorithm: AlgorithmType;
  startTime: number;
  endTime: number | null;
  latency: number | null;
  status: RequestStatus | null;
}

export interface LatencyMetrics {
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface AlgorithmStats {
  algorithm: AlgorithmType;
  totalRequests: number;
  avgLatency: number;
  p95Latency: number;
  throughput: number;
  errorRate: number;
  loadVariance: number;
}

export interface SimulationMetrics {
  totalRequests: number;
  requestsPerSecond: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  latency: LatencyMetrics;
  throughput: number;
  healthyNodes: number;
  failedNodes: number;
  degradedNodes: number;
  algorithmStats: Record<AlgorithmType, AlgorithmStats>;
  timestamp: number;
}

export interface SpikeConfig {
  normalRps: number;
  spikeRps: number;
  spikeDurationMs: number;
  rampUpMs: number;
  rampDownMs: number;
}

export interface TrafficConfig {
  requestsPerSecond: number;
  pattern: TrafficPattern;
  spikeConfig: SpikeConfig;
}

export interface SimulationConfig {
  algorithm: AlgorithmType;
  trafficConfig: TrafficConfig;
  baseLatency: number;
  latencyJitter: number;
  failureProbability: number;
  maxConnections: number;
  requestTimeoutMs: number;
}

export interface SimulationState {
  status: SimulationStatus;
  config: SimulationConfig;
  nodes: MicroserviceNodeData[];
  metrics: SimulationMetrics;
  startedAt: number | null;
  isSpiking: boolean;
}

export interface EventLogEntry {
  id: string;
  timestamp: number;
  type: string;
  message: string;
  nodeId?: string;
  requestId?: string;
}

export interface HashRingNode {
  nodeId: string;
  virtualIndex: number;
  hash: number;
}

export interface HashRingState {
  nodes: HashRingNode[];
  totalSlots: number;
  virtualNodesPerNode: number;
}

export interface LatencyPoint {
  timestamp: number;
  avg: number;
  p95: number;
  p99: number;
}

export interface ThroughputPoint {
  timestamp: number;
  rps: number;
}

export interface RoutedRequest {
  nodeId: string;
  requestId: string;
  timestamp: number;
}

export type ActiveTab = 'overview' | 'load-balancing' | 'ada-lab' | 'analytics' | 'cloud-architecture' | 'about';

// ─── ML Threat & Anomaly Banning Types ─────────────────────────────────────

export interface BannedClientRecord {
  clientId: string;
  bannedAt: number;
  threatScore: number;
  reason: string;
  totalRequestsAttempted: number;
  lastAttemptAt: number;
}

export interface ThreatEvaluationResult {
  clientId: string;
  threatScore: number;
  isSuspicious: boolean;
  isBanned: boolean;
  triggerReason: string;
  timestamp: number;
}


// ─── ADA Algorithms Types ───────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  region: string;
  type: 'GATEWAY' | 'ROUTER' | 'COMPUTE' | 'DATABASE' | 'STORAGE';
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
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

export interface KnapsackTask {
  id: string;
  name: string;
  weight: number;
  value: number;
  serviceType: 'AUTH' | 'PAYMENT' | 'STREAMING' | 'DATABASE' | 'REPORTING' | 'INGESTION';
}

export interface KnapsackStep {
  itemIndex: number;
  item: KnapsackTask;
  capacity: number;
  decision: 'EXCLUDE_WEIGHT' | 'EXCLUDE_BETTER' | 'INCLUDE';
  formula: string;
  optimalValue: number;
}

export interface KnapsackResult {
  capacity: number;
  tasks: KnapsackTask[];
  dpTable: number[][];
  selectedTasks: KnapsackTask[];
  rejectedTasks: KnapsackTask[];
  totalWeight: number;
  totalValue: number;
  capacityUtilizationPct: number;
  stepTrace: KnapsackStep[];
  timeComplexity: string;
  spaceComplexity: string;
}

// ─── Software Data Analytics (SDA) Types ────────────────────────────────────

export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface CorrelationMetric {
  variableX: string;
  variableY: string;
  coefficient: number;
  relationship: 'STRONG_POSITIVE' | 'MODERATE_POSITIVE' | 'WEAK_OR_NONE' | 'MODERATE_NEGATIVE' | 'STRONG_NEGATIVE';
  description: string;
}

export interface AnomalyObservation {
  index: number;
  timestamp: number;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  type: 'LATENCY_OUTLIER' | 'TRAFFIC_SPIKE' | 'ERROR_BURST';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
}

export interface ServerUtilizationSummary {
  nodeId: string;
  nodeName: string;
  status: string;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  totalRequests: number;
  failedRequests: number;
  trafficSharePct: number;
  errorRatePct: number;
}

export interface TrafficAnalyticsReport {
  timestamp: number;
  summary: {
    totalRequests: number;
    requestsPerSecond: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    throughput: number;
    errorRate: number;
    activeConnections: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
  };
  latencyStats: DescriptiveStats;
  correlations: CorrelationMetric[];
  anomalies: AnomalyObservation[];
  serverUtilization: ServerUtilizationSummary[];
  statusDistribution: {
    success: number;
    failed: number;
    timeout: number;
  };
}
