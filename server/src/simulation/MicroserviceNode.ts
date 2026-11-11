import { v4 as uuidv4 } from 'uuid';
import { MicroserviceNodeData, NodeStatus } from '../types';

interface NodeConfig {
  baseLatency: number;
  latencyJitter: number;
  failureProbability: number;
  maxConnections: number;
  requestTimeoutMs: number;
}

export class MicroserviceNode {
  private data: MicroserviceNodeData;
  private config: NodeConfig;
  private latencyHistory: number[] = [];
  private readonly MAX_LATENCY_HISTORY = 100;

  constructor(id: string, name: string, config: NodeConfig) {
    this.config = config;
    this.data = {
      id,
      name,
      status: 'HEALTHY',
      activeConnections: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      averageLatency: 0,
      currentLatency: config.baseLatency,
      weight: 1,
    };
  }

  getData(): MicroserviceNodeData {
    return { ...this.data };
  }

  /**
   * Process a request. Returns the latency in ms, or throws on failure/timeout.
   */
  async processRequest(): Promise<{ latency: number; success: boolean }> {
    if (this.data.status === 'FAILED') {
      throw new Error('Node is FAILED');
    }

    this.data.activeConnections++;
    this.data.totalRequests++;

    const latency = this.calculateLatency();
    this.data.currentLatency = latency;

    try {
      // Simulate processing time (capped for performance — we use real timers but small scale)
      await this.simulateProcessingTime(latency);

      // Check for random failure
      if (Math.random() < this.config.failureProbability) {
        this.data.failedRequests++;
        this.data.activeConnections = Math.max(0, this.data.activeConnections - 1);
        this.updateMetrics(latency, false);
        return { latency, success: false };
      }

      // Check for timeout
      if (latency > this.config.requestTimeoutMs) {
        this.data.failedRequests++;
        this.data.activeConnections = Math.max(0, this.data.activeConnections - 1);
        this.updateMetrics(latency, false);
        return { latency, success: false };
      }

      this.data.successfulRequests++;
      this.data.activeConnections = Math.max(0, this.data.activeConnections - 1);
      this.updateMetrics(latency, true);
      return { latency, success: true };
    } catch {
      this.data.failedRequests++;
      this.data.activeConnections = Math.max(0, this.data.activeConnections - 1);
      this.updateMetrics(latency, false);
      return { latency, success: false };
    }
  }

  /**
   * Latency model:
   *   baseLatency
   *   + loadFactor * (activeConnections / maxConnections)^1.5 * 200
   *   + randomJitter
   *
   * High load → exponentially higher latency (realistic back-pressure)
   */
  private calculateLatency(): number {
    const { baseLatency, latencyJitter, maxConnections } = this.config;
    const loadRatio = Math.min(this.data.activeConnections / maxConnections, 1);

    // Non-linear load factor — mimics real queue behavior
    const loadFactor = Math.pow(loadRatio, 1.5) * 200;

    // Random jitter: ±jitter ms
    const jitter = (Math.random() * 2 - 1) * latencyJitter;

    // Degraded nodes get extra latency
    const degradedPenalty = this.data.status === 'DEGRADED' ? 50 : 0;

    const total = Math.max(1, baseLatency + loadFactor + jitter + degradedPenalty);
    return Math.round(total);
  }

  private async simulateProcessingTime(latencyMs: number): Promise<void> {
    // Cap simulated sleep at 100ms to keep simulator fast,
    // but track the full latency for metrics
    const sleepMs = Math.min(latencyMs, 50);
    return new Promise(resolve => setTimeout(resolve, sleepMs));
  }

  private updateMetrics(latency: number, _success: boolean): void {
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > this.MAX_LATENCY_HISTORY) {
      this.latencyHistory.shift();
    }

    // Recalculate average latency
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    this.data.averageLatency = Math.round(sum / this.latencyHistory.length);

    // Update CPU / memory (simulated based on load)
    const loadRatio = Math.min(this.data.activeConnections / this.config.maxConnections, 1);
    this.data.cpuUsage = Math.round(
      10 + loadRatio * 80 + (Math.random() * 10 - 5)
    );
    this.data.memoryUsage = Math.round(
      20 + loadRatio * 60 + (Math.random() * 10 - 5)
    );

    // Clamp
    this.data.cpuUsage = Math.max(0, Math.min(100, this.data.cpuUsage));
    this.data.memoryUsage = Math.max(0, Math.min(100, this.data.memoryUsage));

    // Auto-degrade if CPU is very high
    if (this.data.cpuUsage > 85 && this.data.status === 'HEALTHY') {
      this.data.status = 'DEGRADED';
    } else if (this.data.cpuUsage < 80 && this.data.status === 'DEGRADED') {
      this.data.status = 'HEALTHY';
    }
  }

  // ─── Status management ────────────────────────────────────────

  fail(): void {
    this.data.status = 'FAILED';
    this.data.activeConnections = 0;
  }

  recover(): void {
    this.data.status = 'HEALTHY';
    this.data.cpuUsage = Math.round(10 + Math.random() * 20);
    this.data.memoryUsage = Math.round(20 + Math.random() * 20);
  }

  degrade(): void {
    if (this.data.status !== 'FAILED') {
      this.data.status = 'DEGRADED';
    }
  }

  getStatus(): NodeStatus {
    return this.data.status;
  }

  getId(): string {
    return this.data.id;
  }

  updateConfig(config: Partial<NodeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.data.activeConnections = 0;
    this.data.totalRequests = 0;
    this.data.successfulRequests = 0;
    this.data.failedRequests = 0;
    this.data.cpuUsage = 0;
    this.data.memoryUsage = 0;
    this.data.averageLatency = 0;
    this.data.currentLatency = this.config.baseLatency;
    this.data.status = 'HEALTHY';
    this.latencyHistory = [];
  }

  static createDefault(index: number, config: NodeConfig): MicroserviceNode {
    return new MicroserviceNode(
      uuidv4(),
      `Node ${index + 1}`,
      config
    );
  }
}
