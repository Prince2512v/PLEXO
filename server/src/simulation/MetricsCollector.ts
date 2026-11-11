import { SimulationMetrics, AlgorithmStats, AlgorithmType, MicroserviceNodeData } from '../types';

interface LatencySample {
  value: number;
  timestamp: number;
  algorithm: AlgorithmType;
}

interface ThroughputSample {
  count: number;
  timestamp: number;
}

export class MetricsCollector {
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;

  private latencySamples: LatencySample[] = [];
  private throughputWindow: number[] = []; // timestamps of completed requests
  private readonly WINDOW_MS = 60_000; // 1-minute rolling window
  private readonly MAX_SAMPLES = 10_000;

  private algorithmStats: Map<AlgorithmType, {
    requests: number;
    successful: number;
    latencies: number[];
    startTime: number;
  }> = new Map();

  private startTime = Date.now();

  recordRequest(
    algorithm: AlgorithmType,
    latency: number,
    success: boolean
  ): void {
    const now = Date.now();

    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    // Track latency sample
    this.latencySamples.push({ value: latency, timestamp: now, algorithm });
    if (this.latencySamples.length > this.MAX_SAMPLES) {
      this.latencySamples.shift();
    }

    // Track throughput (only successful)
    if (success) {
      this.throughputWindow.push(now);
    }

    // Clean old throughput entries
    const cutoff = now - this.WINDOW_MS;
    this.throughputWindow = this.throughputWindow.filter(t => t >= cutoff);

    // Update algorithm stats
    let stats = this.algorithmStats.get(algorithm);
    if (!stats) {
      stats = { requests: 0, successful: 0, latencies: [], startTime: now };
      this.algorithmStats.set(algorithm, stats);
    }
    stats.requests++;
    if (success) stats.successful++;
    stats.latencies.push(latency);
    if (stats.latencies.length > 5000) stats.latencies.shift();
  }

  getMetrics(nodes: MicroserviceNodeData[]): SimulationMetrics {
    const now = Date.now();
    const recentLatencies = this.getRecentLatencies(10_000);

    // Requests per second over last 5 seconds
    const rpsWindow = 5000;
    const rpsCutoff = now - rpsWindow;
    const recentRequests = this.throughputWindow.filter(t => t >= rpsCutoff).length;
    const requestsPerSecond = Math.round(recentRequests / (rpsWindow / 1000));

    // Throughput (successful req/s over last 10 seconds)
    const throughputWindow = 10_000;
    const throughputCutoff = now - throughputWindow;
    const throughputRequests = this.throughputWindow.filter(t => t >= throughputCutoff).length;
    const throughput = Math.round(throughputRequests / (throughputWindow / 1000));

    const healthyNodes = nodes.filter(n => n.status === 'HEALTHY').length;
    const failedNodes = nodes.filter(n => n.status === 'FAILED').length;
    const degradedNodes = nodes.filter(n => n.status === 'DEGRADED').length;

    const errorRate = this.totalRequests > 0
      ? Math.round((this.failedRequests / this.totalRequests) * 10000) / 100
      : 0;

    return {
      totalRequests: this.totalRequests,
      requestsPerSecond,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      errorRate,
      latency: this.calculateLatencyPercentiles(recentLatencies),
      throughput,
      healthyNodes,
      failedNodes,
      degradedNodes,
      algorithmStats: this.getAlgorithmStats(nodes),
      timestamp: now,
    };
  }

  private getRecentLatencies(maxSamples: number): number[] {
    const samples = this.latencySamples.slice(-maxSamples);
    return samples.map(s => s.value);
  }

  private calculateLatencyPercentiles(latencies: number[]) {
    if (latencies.length === 0) {
      return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      avg: Math.round(sorted.reduce((a, b) => a + b, 0) / len),
      min: sorted[0],
      max: sorted[len - 1],
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
    };
  }

  private getAlgorithmStats(nodes: MicroserviceNodeData[]): Record<AlgorithmType, AlgorithmStats> {
    const result: Record<AlgorithmType, AlgorithmStats> = {
      ROUND_ROBIN: this.buildAlgorithmStat('ROUND_ROBIN', nodes),
      LEAST_CONNECTIONS: this.buildAlgorithmStat('LEAST_CONNECTIONS', nodes),
    };
    return result;
  }

  private buildAlgorithmStat(algorithm: AlgorithmType, nodes: MicroserviceNodeData[]): AlgorithmStats {
    const stats = this.algorithmStats.get(algorithm);
    if (!stats || stats.requests === 0) {
      return {
        algorithm,
        totalRequests: 0,
        avgLatency: 0,
        p95Latency: 0,
        throughput: 0,
        errorRate: 0,
        loadVariance: 0,
      };
    }

    const sorted = [...stats.latencies].sort((a, b) => a - b);
    const len = sorted.length;
    const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / len);
    const p95 = sorted[Math.floor(len * 0.95)] ?? 0;

    const elapsed = (Date.now() - stats.startTime) / 1000;
    const throughput = elapsed > 0 ? Math.round(stats.successful / elapsed) : 0;

    const errorRate = stats.requests > 0
      ? Math.round(((stats.requests - stats.successful) / stats.requests) * 10000) / 100
      : 0;

    // Load variance: std dev of per-node request counts
    const loadVariance = this.calculateLoadVariance(nodes);

    return {
      algorithm,
      totalRequests: stats.requests,
      avgLatency: avg,
      p95Latency: p95,
      throughput,
      errorRate,
      loadVariance,
    };
  }

  private calculateLoadVariance(nodes: MicroserviceNodeData[]): number {
    if (nodes.length === 0) return 0;
    const counts = nodes.map(n => n.totalRequests);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    if (mean === 0) return 0;
    const variance = counts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / counts.length;
    return Math.round(Math.sqrt(variance) / mean * 100) / 100; // coefficient of variation
  }

  reset(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.latencySamples = [];
    this.throughputWindow = [];
    this.algorithmStats.clear();
    this.startTime = Date.now();
  }

  // Returns latency time series for charting (last N seconds)
  getLatencyTimeSeries(windowMs = 60_000): Array<{ timestamp: number; avg: number; p95: number; p99: number }> {
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = this.latencySamples.filter(s => s.timestamp >= cutoff);

    if (recent.length === 0) return [];

    // Group into 1-second buckets
    const buckets = new Map<number, number[]>();
    for (const s of recent) {
      const bucket = Math.floor(s.timestamp / 1000) * 1000;
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)!.push(s.value);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, values]) => {
        const sorted = [...values].sort((a, b) => a - b);
        const len = sorted.length;
        return {
          timestamp: ts,
          avg: Math.round(sorted.reduce((a, b) => a + b, 0) / len),
          p95: sorted[Math.floor(len * 0.95)] ?? 0,
          p99: sorted[Math.floor(len * 0.99)] ?? 0,
        };
      });
  }

  // Returns req/s time series for charting
  getThroughputTimeSeries(windowMs = 60_000): Array<{ timestamp: number; rps: number }> {
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = this.throughputWindow.filter(t => t >= cutoff);

    if (recent.length === 0) return [];

    const buckets = new Map<number, number>();
    for (const ts of recent) {
      const bucket = Math.floor(ts / 1000) * 1000;
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, count]) => ({ timestamp: ts, rps: count }));
  }
}
