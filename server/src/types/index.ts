// ============================================================
// Shared types for the Load Balancer Simulator
// ============================================================

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

export interface SimulationMetrics {
  // Traffic
  totalRequests: number;
  requestsPerSecond: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;

  // Performance
  latency: LatencyMetrics;
  throughput: number;

  // Nodes
  healthyNodes: number;
  failedNodes: number;
  degradedNodes: number;

  // Algorithm comparison
  algorithmStats: Record<AlgorithmType, AlgorithmStats>;

  // Timestamp
  timestamp: number;
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

export interface TrafficConfig {
  requestsPerSecond: number;
  pattern: TrafficPattern;
  spikeConfig: SpikeConfig;
}

export interface SpikeConfig {
  normalRps: number;
  spikeRps: number;
  spikeDurationMs: number;
  rampUpMs: number;
  rampDownMs: number;
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
  type: EventType;
  message: string;
  nodeId?: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

export type EventType =
  | 'REQUEST_ROUTED'
  | 'REQUEST_COMPLETED'
  | 'REQUEST_FAILED'
  | 'REQUEST_BANNED'
  | 'CLIENT_BANNED'
  | 'CLIENT_UNBANNED'
  | 'NODE_FAILED'
  | 'NODE_RECOVERED'
  | 'NODE_DEGRADED'
  | 'NODE_ADDED'
  | 'NODE_REMOVED'
  | 'SPIKE_STARTED'
  | 'SPIKE_ENDED'
  | 'SIMULATION_STARTED'
  | 'SIMULATION_PAUSED'
  | 'SIMULATION_RESET'
  | 'ALGORITHM_CHANGED'
  | 'TRAFFIC_CHANGED'
  | 'SCENARIO_STARTED';

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

// WebSocket event payloads
export interface WsSimulationUpdate {
  state: SimulationState;
}

export interface WsRequestRouted {
  request: SimulatedRequest;
  node: MicroserviceNodeData;
}

export interface WsRequestCompleted {
  request: SimulatedRequest;
  node: MicroserviceNodeData;
}

export interface WsNodeUpdated {
  node: MicroserviceNodeData;
}

export interface WsMetricsUpdate {
  metrics: SimulationMetrics;
  nodes: MicroserviceNodeData[];
}

export interface WsEventLog {
  event: EventLogEntry;
}

export interface WsHashRing {
  ring: HashRingState;
}

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

