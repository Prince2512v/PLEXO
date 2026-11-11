import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  SimulationConfig,
  SimulationState,
  SimulatedRequest,
  AlgorithmType,
  EventLogEntry,
  EventType,
  MicroserviceNodeData,
} from '../types';
import { MicroserviceNode } from './MicroserviceNode';
import { TrafficGenerator } from './TrafficGenerator';
import { FaultInjector } from './FaultInjector';
import { MetricsCollector } from './MetricsCollector';
import { LoadBalancer } from '../algorithms/LoadBalancer';
import { RoundRobin } from '../algorithms/RoundRobin';
import { LeastConnections } from '../algorithms/LeastConnections';
import { AnalyticsEngine, TrafficAnalyticsReport, CorrelationMetric } from './AnalyticsEngine';
import {
  IsolationForestThreatDetector,
  ThreatEvaluationResult,
  BannedClientRecord,
} from './ThreatDetector';

const DEFAULT_CONFIG: SimulationConfig = {
  algorithm: 'ROUND_ROBIN',
  trafficConfig: {
    requestsPerSecond: 10,
    pattern: 'CONSTANT',
    spikeConfig: {
      normalRps: 10,
      spikeRps: 100,
      spikeDurationMs: 5000,
      rampUpMs: 2000,
      rampDownMs: 2000,
    },
  },
  baseLatency: 30,
  latencyJitter: 15,
  failureProbability: 0.01,
  maxConnections: 50,
  requestTimeoutMs: 500,
};

const DEFAULT_NODE_COUNT = 5;

export interface SimulationEngineEvents {
  state_update: (state: SimulationState) => void;
  request_routed: (req: SimulatedRequest, node: MicroserviceNodeData) => void;
  request_completed: (req: SimulatedRequest, node: MicroserviceNodeData) => void;
  request_banned: (threat: ThreatEvaluationResult) => void;
  client_banned: (record: BannedClientRecord) => void;
  client_unbanned: (clientId: string) => void;
  threat_evaluated: (threat: ThreatEvaluationResult) => void;
  node_updated: (node: MicroserviceNodeData) => void;
  node_failed: (nodeId: string, nodeName: string) => void;
  node_recovered: (nodeId: string, nodeName: string) => void;
  metrics_update: (state: SimulationState) => void;
  event_log: (entry: EventLogEntry) => void;
  spike_started: (rps: number) => void;
  spike_ended: () => void;
}

export declare interface SimulationEngine {
  on<K extends keyof SimulationEngineEvents>(event: K, listener: SimulationEngineEvents[K]): this;
  emit<K extends keyof SimulationEngineEvents>(event: K, ...args: Parameters<SimulationEngineEvents[K]>): boolean;
}

export class SimulationEngine extends EventEmitter {
  private nodes: Map<string, MicroserviceNode> = new Map();
  private loadBalancer: LoadBalancer;
  private trafficGenerator: TrafficGenerator;
  private faultInjector: FaultInjector;
  private metricsCollector: MetricsCollector;
  private threatDetector: IsolationForestThreatDetector;

  private config: SimulationConfig;
  private status: 'IDLE' | 'RUNNING' | 'PAUSED' = 'IDLE';
  private startedAt: number | null = null;
  private isSpiking = false;

  private recentRequests: SimulatedRequest[] = [];
  private eventLog: EventLogEntry[] = [];
  private readonly MAX_RECENT_REQUESTS = 200;
  private readonly MAX_EVENT_LOG = 500;

  private metricsIntervalId: NodeJS.Timeout | null = null;
  private readonly METRICS_INTERVAL_MS = 500;

  // Concurrency control: limit simultaneous async requests
  private pendingRequests = 0;
  private readonly MAX_PENDING = 500;

  constructor() {
    super();
    this.config = { ...DEFAULT_CONFIG };
    this.loadBalancer = new RoundRobin();
    this.metricsCollector = new MetricsCollector();
    this.threatDetector = new IsolationForestThreatDetector();
    this.faultInjector = new FaultInjector(this.nodes);
    this.trafficGenerator = new TrafficGenerator(this.config.trafficConfig);

    this.initializeNodes(DEFAULT_NODE_COUNT);
    this.setupTrafficGenerator();
    this.setupFaultInjector();
  }

  // ─── Initialization ───────────────────────────────────────────

  private initializeNodes(count: number): void {
    this.nodes.clear();
    for (let i = 0; i < count; i++) {
      const node = MicroserviceNode.createDefault(i, {
        baseLatency: this.config.baseLatency,
        latencyJitter: this.config.latencyJitter,
        failureProbability: this.config.failureProbability,
        maxConnections: this.config.maxConnections,
        requestTimeoutMs: this.config.requestTimeoutMs,
      });
      this.nodes.set(node.getData().id, node);
    }
    this.faultInjector.updateNodes(this.nodes);
  }

  private setupTrafficGenerator(): void {
    this.trafficGenerator.on('request', (clientId, requestKey, attackType) => {
      if (this.status !== 'RUNNING') return;
      if (this.pendingRequests >= this.MAX_PENDING) return; // Back-pressure
      this.handleRequest(clientId, requestKey, attackType);
    });

    this.trafficGenerator.on('spike_start', (rps) => {
      this.isSpiking = true;
      this.emit('spike_started', rps);
      this.addEvent('SPIKE_STARTED', `Traffic spike started: ${rps} req/s`);
    });

    this.trafficGenerator.on('spike_end', () => {
      this.isSpiking = false;
      this.emit('spike_ended');
      this.addEvent('SPIKE_ENDED', 'Traffic spike ended');
    });

    this.trafficGenerator.on('rps_changed', (_rps) => {
      this.emitStateUpdate();
    });
  }

  private setupFaultInjector(): void {
    this.faultInjector.on('node_failed', (nodeId) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;
      const data = node.getData();
      this.emit('node_failed', nodeId, data.name);
      this.addEvent('NODE_FAILED', `${data.name} failed`, nodeId);
      this.emitStateUpdate();
    });

    this.faultInjector.on('node_recovered', (nodeId) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;
      const data = node.getData();
      this.emit('node_recovered', nodeId, data.name);
      this.addEvent('NODE_RECOVERED', `${data.name} recovered`, nodeId);
      this.emitStateUpdate();
    });
  }

  // ─── Request handling ─────────────────────────────────────────

  private async handleRequest(
    clientId: string,
    requestKey: string,
    attackType?: 'VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER'
  ): Promise<void> {
    this.pendingRequests++;

    // ML Threat Inspection via Isolation Forest
    const threat = this.threatDetector.evaluateRequest(clientId, attackType);
    this.emit('threat_evaluated', threat);

    // If request is permanently banned or threat score breaches threshold
    if (threat.isBanned) {
      this.emit('request_banned', threat);
      this.addEvent(
        'REQUEST_BANNED',
        `[ML Isolation Forest] Banned request from ${clientId.slice(0, 14)}… (${(threat.threatScore * 100).toFixed(1)}% threat: ${threat.triggerReason})`
      );
      this.pendingRequests--;
      return;
    }

    const request: SimulatedRequest = {
      requestId: uuidv4(),
      timestamp: Date.now(),
      clientId,
      selectedNode: null,
      algorithm: this.config.algorithm,
      startTime: Date.now(),
      endTime: null,
      latency: null,
      status: null,
    };

    try {
      const nodeData = this.getNodeDataArray();
      const selected = this.loadBalancer.selectNode(nodeData, requestKey);

      if (!selected) {
        // No healthy nodes
        request.status = 'FAILED';
        request.endTime = Date.now();
        request.latency = 0;
        this.addRecentRequest(request);
        this.metricsCollector.recordRequest(this.config.algorithm, 0, false);
        this.threatDetector.recordOutcome(clientId, false);
        this.pendingRequests--;
        return;
      }

      request.selectedNode = selected.id;

      // Emit routing event
      this.emit('request_routed', request, selected);
      this.addEvent('REQUEST_ROUTED', `Request routed → ${selected.name}`, selected.id, request.requestId);

      // Process request on node
      const node = this.nodes.get(selected.id);
      if (!node) {
        this.pendingRequests--;
        return;
      }

      const { latency, success } = await node.processRequest();

      request.endTime = Date.now();
      request.latency = latency;
      request.status = success ? 'SUCCESS' : 'FAILED';

      this.metricsCollector.recordRequest(this.config.algorithm, latency, success);
      this.threatDetector.recordOutcome(clientId, success);

      const updatedNodeData = node.getData();
      this.emit('request_completed', request, updatedNodeData);
      this.emit('node_updated', updatedNodeData);

      this.addRecentRequest(request);
    } finally {
      this.pendingRequests--;
    }
  }

  // ─── Simulation control ───────────────────────────────────────

  start(): void {
    if (this.status === 'RUNNING') return;
    this.status = 'RUNNING';
    if (!this.startedAt) this.startedAt = Date.now();
    this.trafficGenerator.start();
    this.startMetricsLoop();
    this.addEvent('SIMULATION_STARTED', 'Simulation started');
    this.emitStateUpdate();
  }

  pause(): void {
    if (this.status !== 'RUNNING') return;
    this.status = 'PAUSED';
    this.trafficGenerator.stop();
    this.stopMetricsLoop();
    this.addEvent('SIMULATION_PAUSED', 'Simulation paused');
    this.emitStateUpdate();
  }

  reset(): void {
    this.status = 'IDLE';
    this.startedAt = null;
    this.isSpiking = false;
    this.trafficGenerator.stop();
    this.stopMetricsLoop();
    this.pendingRequests = 0;

    // Reset all nodes
    for (const node of this.nodes.values()) {
      node.reset();
    }

    // Reset metrics
    this.metricsCollector.reset();

    // Reset algorithm
    this.loadBalancer.reset();

    // Clear request/event history
    this.recentRequests = [];
    this.eventLog = [];

    // Rebuild traffic generator
    this.trafficGenerator = new TrafficGenerator(this.config.trafficConfig);
    this.setupTrafficGenerator();

    this.addEvent('SIMULATION_RESET', 'Simulation reset');
    this.emitStateUpdate();
  }

  // ─── Configuration ────────────────────────────────────────────

  setAlgorithm(algorithm: AlgorithmType): void {
    this.config.algorithm = algorithm;

    switch (algorithm) {
      case 'ROUND_ROBIN':
        this.loadBalancer = new RoundRobin();
        break;
      case 'LEAST_CONNECTIONS':
        this.loadBalancer = new LeastConnections();
        break;
    }

    this.addEvent('ALGORITHM_CHANGED', `Algorithm changed to ${algorithm}`);
    this.emitStateUpdate();
  }

  updateTrafficConfig(trafficConfig: Partial<typeof DEFAULT_CONFIG.trafficConfig>): void {
    this.config.trafficConfig = { ...this.config.trafficConfig, ...trafficConfig };
    this.trafficGenerator.updateConfig(this.config.trafficConfig);
    this.addEvent('TRAFFIC_CHANGED', `Traffic rate: ${this.config.trafficConfig.requestsPerSecond} req/s`);
    this.emitStateUpdate();
  }

  updateSimulationConfig(config: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...config };

    // Update node configs
    for (const node of this.nodes.values()) {
      node.updateConfig({
        baseLatency: this.config.baseLatency,
        latencyJitter: this.config.latencyJitter,
        failureProbability: this.config.failureProbability,
        maxConnections: this.config.maxConnections,
        requestTimeoutMs: this.config.requestTimeoutMs,
      });
    }

    this.emitStateUpdate();
  }

  triggerSpike(): void {
    if (this.status !== 'RUNNING') return;
    this.trafficGenerator.triggerSpike();
  }

  // ─── Node management ──────────────────────────────────────────

  addNode(): MicroserviceNodeData | null {
    if (this.nodes.size >= 10) return null;

    const index = this.getNextNodeIndex();
    const node = MicroserviceNode.createDefault(index, {
      baseLatency: this.config.baseLatency,
      latencyJitter: this.config.latencyJitter,
      failureProbability: this.config.failureProbability,
      maxConnections: this.config.maxConnections,
      requestTimeoutMs: this.config.requestTimeoutMs,
    });

    this.nodes.set(node.getData().id, node);
    this.faultInjector.updateNodes(this.nodes);

    const data = node.getData();
    this.addEvent('NODE_ADDED', `${data.name} added to pool`, data.id);
    this.emitStateUpdate();
    return data;
  }

  removeNode(nodeId: string): boolean {
    if (this.nodes.size <= 2) return false; // Keep at least 2
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const data = node.getData();
    this.nodes.delete(nodeId);
    this.faultInjector.updateNodes(this.nodes);

    this.addEvent('NODE_REMOVED', `${data.name} removed from pool`, nodeId);
    this.emitStateUpdate();
    return true;
  }

  failNode(nodeId: string): boolean {
    return this.faultInjector.failNode(nodeId);
  }

  recoverNode(nodeId: string): boolean {
    return this.faultInjector.recoverNode(nodeId);
  }

  failRandomNode(): string | null {
    return this.faultInjector.failRandomNode();
  }

  recoverAllNodes(): string[] {
    return this.faultInjector.recoverAllNodes();
  }

  // ─── Demo Scenarios ───────────────────────────────────────────

  async runScenario(scenarioId: number): Promise<void> {
    this.reset();
    this.addEvent('SCENARIO_STARTED', `Demo scenario ${scenarioId} started`);

    switch (scenarioId) {
      case 1: // Normal traffic
        this.setAlgorithm('ROUND_ROBIN');
        this.updateTrafficConfig({ requestsPerSecond: 20 });
        this.start();
        break;

      case 2: // Traffic spike
        this.setAlgorithm('ROUND_ROBIN');
        this.updateTrafficConfig({
          requestsPerSecond: 20,
          spikeConfig: {
            normalRps: 20,
            spikeRps: 200,
            spikeDurationMs: 8000,
            rampUpMs: 2000,
            rampDownMs: 2000,
          },
        });
        this.start();
        setTimeout(() => this.triggerSpike(), 3000);
        break;

      case 3: // Node failure
        this.setAlgorithm('ROUND_ROBIN');
        this.updateTrafficConfig({ requestsPerSecond: 20 });
        this.start();
        setTimeout(() => {
          const nodeIds = Array.from(this.nodes.keys());
          if (nodeIds[2]) this.failNode(nodeIds[2]);
        }, 4000);
        break;

      case 4: // Multiple failures
        this.setAlgorithm('LEAST_CONNECTIONS');
        this.updateTrafficConfig({ requestsPerSecond: 30 });
        this.start();
        setTimeout(() => this.faultInjector.failMultipleNodes(2), 3000);
        setTimeout(() => this.faultInjector.recoverAllNodes(), 10000);
        break;

      case 5: // Algorithm comparison
        this.setAlgorithm('ROUND_ROBIN');
        this.updateTrafficConfig({ requestsPerSecond: 25 });
        this.start();
        setTimeout(() => this.setAlgorithm('LEAST_CONNECTIONS'), 10000);
        setTimeout(() => this.setAlgorithm('ROUND_ROBIN'), 20000);
        break;

      default:
        this.start();
    }
  }

  // ─── State / getters ──────────────────────────────────────────

  getState(): SimulationState {
    const nodes = this.getNodeDataArray();
    return {
      status: this.status,
      config: this.config,
      nodes,
      metrics: this.metricsCollector.getMetrics(nodes),
      startedAt: this.startedAt,
      isSpiking: this.isSpiking,
    };
  }

  getEventLog(): EventLogEntry[] {
    return [...this.eventLog].reverse();
  }

  getRecentRequests(): SimulatedRequest[] {
    return [...this.recentRequests];
  }

  getLatencyTimeSeries() {
    return this.metricsCollector.getLatencyTimeSeries();
  }

  getThroughputTimeSeries() {
    return this.metricsCollector.getThroughputTimeSeries();
  }

  getNodes(): MicroserviceNodeData[] {
    return this.getNodeDataArray();
  }

  getAnalyticsReport(): TrafficAnalyticsReport {
    const nodes = this.getNodeDataArray();
    const metrics = this.metricsCollector.getMetrics(nodes);
    const latencySeries = this.metricsCollector.getLatencyTimeSeries();
    const recentRequests = this.getRecentRequests();

    const latencyValues = recentRequests
      .map(r => r.latency)
      .filter((l): l is number => l !== null && l > 0);

    const latencyStats = AnalyticsEngine.calculateDescriptiveStats(
      latencyValues.length > 0 ? latencyValues : (metrics.latency.avg > 0 ? [metrics.latency.avg] : [25])
    );

    // Pearson Correlation 1: RPS vs Avg Latency from time series
    const rpsValues = this.metricsCollector.getThroughputTimeSeries().map(p => p.rps);
    const latValues = latencySeries.map(p => p.avg);
    const rpsVsLatencyR = AnalyticsEngine.calculatePearsonCorrelation(rpsValues, latValues);

    // Pearson Correlation 2: Active Connections vs CPU Usage across nodes
    const connValues = nodes.map(n => n.activeConnections);
    const cpuValues = nodes.map(n => n.cpuUsage);
    const connVsCpuR = AnalyticsEngine.calculatePearsonCorrelation(connValues, cpuValues);

    const getRelationship = (r: number) => {
      if (r >= 0.7) return 'STRONG_POSITIVE' as const;
      if (r >= 0.3) return 'MODERATE_POSITIVE' as const;
      if (r <= -0.7) return 'STRONG_NEGATIVE' as const;
      if (r <= -0.3) return 'MODERATE_NEGATIVE' as const;
      return 'WEAK_OR_NONE' as const;
    };

    const correlations: CorrelationMetric[] = [
      {
        variableX: 'Traffic Pressure (RPS)',
        variableY: 'System Latency (ms)',
        coefficient: rpsVsLatencyR,
        relationship: getRelationship(rpsVsLatencyR),
        description: 'Measures queueing delay degradation as incoming request volume scales.',
      },
      {
        variableX: 'Active Server Connections',
        variableY: 'Worker CPU Utilization (%)',
        coefficient: connVsCpuR,
        relationship: getRelationship(connVsCpuR),
        description: 'Quantifies compute overhead directly driven by active concurrent connection state.',
      },
    ];

    const anomalies = AnalyticsEngine.detectZScoreAnomalies(
      latencySeries.map(s => ({ timestamp: s.timestamp, value: s.avg }))
    );

    const totalReqs = nodes.reduce((sum, n) => sum + n.totalRequests, 0);
    const serverUtilization = nodes.map(n => ({
      nodeId: n.id,
      nodeName: n.name,
      status: n.status,
      cpuUsage: n.cpuUsage,
      memoryUsage: n.memoryUsage,
      activeConnections: n.activeConnections,
      totalRequests: n.totalRequests,
      failedRequests: n.failedRequests,
      trafficSharePct: totalReqs > 0 ? Math.round((n.totalRequests / totalReqs) * 1000) / 10 : 0,
      errorRatePct: n.totalRequests > 0 ? Math.round((n.failedRequests / n.totalRequests) * 1000) / 10 : 0,
    }));

    const statusCounts = recentRequests.reduce(
      (acc, r) => {
        if (r.status === 'SUCCESS') acc.success++;
        else if (r.status === 'FAILED') acc.failed++;
        else if (r.status === 'TIMEOUT') acc.timeout++;
        return acc;
      },
      { success: 0, failed: 0, timeout: 0 }
    );

    const avgCpu = nodes.length > 0 ? Math.round(nodes.reduce((s, n) => s + n.cpuUsage, 0) / nodes.length) : 0;
    const avgMem = nodes.length > 0 ? Math.round(nodes.reduce((s, n) => s + n.memoryUsage, 0) / nodes.length) : 0;

    return {
      timestamp: Date.now(),
      summary: {
        totalRequests: metrics.totalRequests,
        requestsPerSecond: metrics.requestsPerSecond,
        averageLatency: metrics.latency.avg,
        minLatency: metrics.latency.min,
        maxLatency: metrics.latency.max,
        throughput: metrics.throughput,
        errorRate: metrics.errorRate,
        activeConnections: nodes.reduce((s, n) => s + n.activeConnections, 0),
        averageCpuUsage: avgCpu,
        averageMemoryUsage: avgMem,
      },
      latencyStats,
      correlations,
      anomalies,
      serverUtilization,
      statusDistribution: statusCounts,
    };
  }

  // ─── Threat & Anomaly Management ──────────────────────────────
  public getBannedClients(): BannedClientRecord[] {
    return this.threatDetector.getBannedClients();
  }

  public banClientManually(clientId: string, reason?: string): BannedClientRecord {
    const record = this.threatDetector.banClientManually(clientId, reason);
    this.addEvent('CLIENT_BANNED', `Client permanently banned: ${clientId.slice(0, 14)}… (${record.reason})`);
    this.emit('client_banned', record);
    return record;
  }

  public unbanClient(clientId: string): boolean {
    const success = this.threatDetector.unbanClient(clientId);
    if (success) {
      this.addEvent('CLIENT_UNBANNED', `Client unbanned: ${clientId.slice(0, 14)}…`);
      this.emit('client_unbanned', clientId);
    }
    return success;
  }

  public clearAllBans(): void {
    this.threatDetector.clearAllBans();
    this.addEvent('CLIENT_UNBANNED', 'All blacklisted clients were unbanned');
  }

  public simulateMaliciousAttack(attackType: 'VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER'): void {
    const attackerClientId = `attacker-${attackType.toLowerCase()}-${uuidv4().slice(0, 8)}`;
    const requestKey = `${attackerClientId}:${Date.now()}`;
    this.handleRequest(attackerClientId, requestKey, attackType);
  }

  // ─── Private helpers ──────────────────────────────────────────

  private getNodeDataArray(): MicroserviceNodeData[] {
    return Array.from(this.nodes.values()).map(n => n.getData());
  }

  private getNextNodeIndex(): number {
    const existing = Array.from(this.nodes.values()).map(n => {
      const match = n.getData().name.match(/Node (\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxIdx = Math.max(0, ...existing);
    return maxIdx; // Will become Node (maxIdx + 1)
  }

  private addRecentRequest(req: SimulatedRequest): void {
    this.recentRequests.push(req);
    if (this.recentRequests.length > this.MAX_RECENT_REQUESTS) {
      this.recentRequests.shift();
    }
  }

  private addEvent(type: EventType, message: string, nodeId?: string, requestId?: string): void {
    const entry: EventLogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      type,
      message,
      nodeId,
      requestId,
    };
    this.eventLog.push(entry);
    if (this.eventLog.length > this.MAX_EVENT_LOG) {
      this.eventLog.shift();
    }
    this.emit('event_log', entry);
  }

  private emitStateUpdate(): void {
    this.emit('state_update', this.getState());
  }

  private startMetricsLoop(): void {
    this.stopMetricsLoop();
    this.metricsIntervalId = setInterval(() => {
      this.emit('metrics_update', this.getState());
    }, this.METRICS_INTERVAL_MS);
  }

  private stopMetricsLoop(): void {
    if (this.metricsIntervalId) {
      clearInterval(this.metricsIntervalId);
      this.metricsIntervalId = null;
    }
  }
}
