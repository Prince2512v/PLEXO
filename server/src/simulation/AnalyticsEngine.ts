/**
 * Software Data Analytics (SDA) Engine
 * 
 * Computes descriptive statistics, Pearson correlation coefficients,
 * and Z-score outlier/spike detection on live simulation telemetry.
 */

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
  coefficient: number; // r in [-1, 1]
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

export class AnalyticsEngine {
  /**
   * Compute comprehensive descriptive statistics on numerical array
   */
  static calculateDescriptiveStats(data: number[]): DescriptiveStats {
    if (!data || data.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        variance: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      };
    }

    const n = data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    // Variance & Standard Deviation
    const sumSquaredDiffs = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const variance = n > 1 ? sumSquaredDiffs / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);

    // Percentiles helper
    const getPercentile = (p: number): number => {
      if (n === 1) return sorted[0];
      const index = (n - 1) * p;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const q1 = getPercentile(0.25);
    const median = getPercentile(0.5);
    const q3 = getPercentile(0.75);
    const iqr = q3 - q1;

    return {
      count: n,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      min: sorted[0],
      max: sorted[n - 1],
      q1: Math.round(q1 * 100) / 100,
      q3: Math.round(q3 * 100) / 100,
      iqr: Math.round(iqr * 100) / 100,
      p50: Math.round(median * 100) / 100,
      p90: Math.round(getPercentile(0.9) * 100) / 100,
      p95: Math.round(getPercentile(0.95) * 100) / 100,
      p99: Math.round(getPercentile(0.99) * 100) / 100,
    };
  }

  /**
   * Compute Pearson Product-Moment Correlation Coefficient (r)
   * r = sum((x - meanX) * (y - meanY)) / sqrt(sum((x - meanX)^2) * sum((y - meanY)^2))
   */
  static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }

    if (denomX === 0 || denomY === 0) return 0;
    const r = numerator / Math.sqrt(denomX * denomY);
    return Math.max(-1, Math.min(1, Math.round(r * 1000) / 1000));
  }

  /**
   * Detect anomalies using Rolling Z-Score (|Z| >= threshold)
   */
  static detectZScoreAnomalies(
    values: Array<{ timestamp: number; value: number }>,
    threshold = 2.5
  ): AnomalyObservation[] {
    if (values.length < 5) return [];

    const rawValues = values.map(v => v.value);
    const stats = this.calculateDescriptiveStats(rawValues);
    if (stats.stdDev === 0) return [];

    const anomalies: AnomalyObservation[] = [];

    for (let i = 0; i < values.length; i++) {
      const item = values[i];
      const zScore = (item.value - stats.mean) / stats.stdDev;

      if (Math.abs(zScore) >= threshold) {
        anomalies.push({
          index: i,
          timestamp: item.timestamp,
          value: item.value,
          mean: stats.mean,
          stdDev: stats.stdDev,
          zScore: Math.round(zScore * 100) / 100,
          type: item.value > stats.mean ? 'LATENCY_OUTLIER' : 'TRAFFIC_SPIKE',
          severity: Math.abs(zScore) >= 3.5 ? 'CRITICAL' : 'WARNING',
          message: `Observed latency ${item.value}ms deviated by ${Math.round(zScore * 10) / 10} standard deviations from mean (${stats.mean}ms).`,
        });
      }
    }

    return anomalies;
  }
}
