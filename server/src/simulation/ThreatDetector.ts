// ============================================================
// Machine Learning Threat & Anomaly Detection Engine (Isolation Forest)
// ============================================================

export interface ThreatFeatureVector {
  reqRatePerSec: number;        // Requests per second from this client
  burstVelocity: number;        // Short-term burst count in last 500ms
  payloadEntropy: number;       // Shannon entropy of headers/query (0.0 to 8.0)
  payloadSizeBytes: number;     // Estimated byte size of request payload
  errorRateRatio: number;       // Ratio of recent requests returning errors
  consecutiveRejections: number;// Consecutive failed attempts
}

export interface ThreatEvaluationResult {
  clientId: string;
  threatScore: number;          // 0.0 (benign) to 1.0 (critical anomaly)
  isSuspicious: boolean;        // threatScore >= 0.50
  isBanned: boolean;            // threatScore >= 0.80 or already blacklisted
  triggerReason: string;        // Human-readable primary violation
  vector: ThreatFeatureVector;
  timestamp: number;
}

export interface BannedClientRecord {
  clientId: string;
  bannedAt: number;
  threatScore: number;
  reason: string;
  totalRequestsAttempted: number;
  lastAttemptAt: number;
}

interface IsolationNode {
  splitFeature?: keyof ThreatFeatureVector;
  splitValue?: number;
  left?: IsolationNode;
  right?: IsolationNode;
  size?: number; // Leaf size
}

export class IsolationForestThreatDetector {
  private trees: IsolationNode[] = [];
  private readonly numTrees = 25;
  private readonly subSampleSize = 64;
  private readonly maxDepth: number;

  // Track client behavioral statistics
  private clientHistory: Map<string, {
    timestamps: number[];
    errors: number;
    successes: number;
    lastBurst: number;
    lastPayloadEntropy: number;
    lastSizeBytes: number;
  }> = new Map();

  // Permanent blacklist: Set of clientIds banned permanently
  private permanentBlacklist: Map<string, BannedClientRecord> = new Map();
  private readonly MAX_CLIENT_HISTORY = 1000;
  private readonly MAX_BANNED_CLIENTS = 500;

  constructor() {
    this.maxDepth = Math.ceil(Math.log2(this.subSampleSize));
    this.trainInitialBaseline();
  }

  /**
   * Train baseline Isolation Trees with typical benign load balancing traffic vectors
   */
  private trainInitialBaseline(): void {
    const trainingData: ThreatFeatureVector[] = [];
    
    // Generate 250 benign synthetic traffic vectors
    for (let i = 0; i < 250; i++) {
      trainingData.push({
        reqRatePerSec: Math.random() * 8 + 0.5,           // 0.5 to 8.5 req/s (normal)
        burstVelocity: Math.floor(Math.random() * 3) + 1, // 1 to 3 burst
        payloadEntropy: Math.random() * 1.8 + 2.1,        // 2.1 to 3.9 normal ASCII entropy
        payloadSizeBytes: Math.floor(Math.random() * 800) + 200, // 200B - 1000B
        errorRateRatio: Math.random() * 0.05,             // < 5% error rate
        consecutiveRejections: 0,
      });
    }

    this.trees = [];
    for (let t = 0; t < this.numTrees; t++) {
      const sample = this.sampleRandom(trainingData, this.subSampleSize);
      this.trees.push(this.buildTree(sample, 0));
    }
  }

  private sampleRandom<T>(arr: T[], n: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < Math.min(n, arr.length); i++) {
      result.push(arr[Math.floor(Math.random() * arr.length)]);
    }
    return result;
  }

  private buildTree(data: ThreatFeatureVector[], currentDepth: number): IsolationNode {
    if (currentDepth >= this.maxDepth || data.length <= 1) {
      return { size: data.length };
    }

    const features: (keyof ThreatFeatureVector)[] = [
      'reqRatePerSec',
      'burstVelocity',
      'payloadEntropy',
      'payloadSizeBytes',
      'errorRateRatio',
      'consecutiveRejections',
    ];

    const splitFeature = features[Math.floor(Math.random() * features.length)];
    const values = data.map((d) => d[splitFeature]);
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return { size: data.length };
    }

    const splitValue = min + Math.random() * (max - min);
    const leftData = data.filter((d) => d[splitFeature] < splitValue);
    const rightData = data.filter((d) => d[splitFeature] >= splitValue);

    return {
      splitFeature,
      splitValue,
      left: this.buildTree(leftData, currentDepth + 1),
      right: this.buildTree(rightData, currentDepth + 1),
    };
  }

  private pathLength(vector: ThreatFeatureVector, node: IsolationNode, currentDepth: number): number {
    if (!node.splitFeature || !node.splitValue || !node.left || !node.right) {
      // Leaf node adjustment factor c(size)
      const size = node.size || 1;
      return currentDepth + this.averagePathLengthFactor(size);
    }

    if (vector[node.splitFeature] < node.splitValue) {
      return this.pathLength(vector, node.left, currentDepth + 1);
    } else {
      return this.pathLength(vector, node.right, currentDepth + 1);
    }
  }

  private averagePathLengthFactor(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerMascheroni = 0.5772156649;
    return 2 * (Math.log(n - 1) + eulerMascheroni) - (2 * (n - 1)) / n;
  }

  /**
   * Evaluates an incoming request, calculates threat score, and applies auto-ban if critical
   */
  public evaluateRequest(
    clientId: string,
    simulatedAttackType?: 'VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER'
  ): ThreatEvaluationResult {
    const now = Date.now();

    // Check if client is already permanently banned
    if (this.permanentBlacklist.has(clientId)) {
      const existing = this.permanentBlacklist.get(clientId)!;
      existing.totalRequestsAttempted++;
      existing.lastAttemptAt = now;
      return {
        clientId,
        threatScore: existing.threatScore,
        isSuspicious: true,
        isBanned: true,
        triggerReason: existing.reason,
        vector: {
          reqRatePerSec: 0,
          burstVelocity: 0,
          payloadEntropy: 0,
          payloadSizeBytes: 0,
          errorRateRatio: 1.0,
          consecutiveRejections: existing.totalRequestsAttempted,
        },
        timestamp: now,
      };
    }

    // Update history
    let record = this.clientHistory.get(clientId);
    if (!record) {
      record = {
        timestamps: [],
        errors: 0,
        successes: 0,
        lastBurst: 1,
        lastPayloadEntropy: 2.8,
        lastSizeBytes: 420,
      };
      this.clientHistory.set(clientId, record);
    }

    record.timestamps.push(now);
    // Keep last 10 seconds of timestamps
    record.timestamps = record.timestamps.filter((t) => now - t <= 10000);

    // Compute rolling features
    const recentOneSec = record.timestamps.filter((t) => now - t <= 1000).length;
    const burstIn500ms = record.timestamps.filter((t) => now - t <= 500).length;

    let entropy = 2.4 + (Math.random() * 0.8 - 0.4);
    let sizeBytes = 350 + Math.floor(Math.random() * 250);
    let errorRate = record.errors / Math.max(1, record.errors + record.successes);

    // If an intentional malicious pattern is simulated
    if (simulatedAttackType === 'VOLUMETRIC_FLOOD') {
      entropy = 4.2;
      sizeBytes = 8500;
      errorRate = 0.85;
    } else if (simulatedAttackType === 'ENTROPY_EXPLOIT') {
      entropy = 7.82; // Extreme Shannon entropy (obfuscated shellcode payload)
      sizeBytes = 14200;
      errorRate = 0.90;
    } else if (simulatedAttackType === 'SCAN_CRAWLER') {
      entropy = 5.6;
      sizeBytes = 1200;
      errorRate = 0.95;
    }

    const vector: ThreatFeatureVector = {
      reqRatePerSec: simulatedAttackType === 'VOLUMETRIC_FLOOD' ? 95 : recentOneSec,
      burstVelocity: simulatedAttackType === 'VOLUMETRIC_FLOOD' ? 45 : burstIn500ms,
      payloadEntropy: entropy,
      payloadSizeBytes: sizeBytes,
      errorRateRatio: errorRate,
      consecutiveRejections: record.errors,
    };

    // Calculate Isolation Forest score
    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += this.pathLength(vector, tree, 0);
    }
    const avgPathLength = totalPathLength / this.trees.length;
    const cFactor = this.averagePathLengthFactor(this.subSampleSize);

    // Anomaly score s = 2 ^ (-E(h(x)) / c(n))
    let isolationScore = Math.pow(2, -avgPathLength / (cFactor || 1));

    // Threat Boost heuristics for definitive malicious patterns
    let triggerReason = 'Nominal Ingress Pattern';
    if (vector.payloadEntropy > 6.5) {
      isolationScore = Math.max(isolationScore, 0.94);
      triggerReason = 'High Shannon Entropy (>6.5): Obfuscated Payload Attack';
    } else if (vector.burstVelocity > 15 || vector.reqRatePerSec > 40) {
      isolationScore = Math.max(isolationScore, 0.91);
      triggerReason = 'Volumetric Flood Anomaly: Rapid Burst Velocity';
    } else if (vector.errorRateRatio > 0.70 && record.timestamps.length > 5) {
      isolationScore = Math.max(isolationScore, 0.84);
      triggerReason = 'Directory Scanner / Exploit Probe Spike';
    } else if (isolationScore >= 0.50) {
      triggerReason = 'Multivariate Statistical Variance Anomaly';
    }

    const threatScore = Math.min(1.0, Math.max(0.0, parseFloat(isolationScore.toFixed(3))));
    const isSuspicious = threatScore >= 0.50;
    const isBanned = threatScore >= 0.80;

    // Clean up stale client history to prevent memory leak
    if (this.clientHistory.size > this.MAX_CLIENT_HISTORY) {
      const oldestKeys = Array.from(this.clientHistory.keys()).slice(0, 100);
      for (const k of oldestKeys) {
        this.clientHistory.delete(k);
      }
    }

    // Apply permanent ban if threshold exceeded
    if (isBanned) {
      if (this.permanentBlacklist.size >= this.MAX_BANNED_CLIENTS) {
        const oldestBanned = Array.from(this.permanentBlacklist.keys())[0];
        if (oldestBanned) this.permanentBlacklist.delete(oldestBanned);
      }

      this.permanentBlacklist.set(clientId, {
        clientId,
        bannedAt: now,
        threatScore,
        reason: triggerReason,
        totalRequestsAttempted: 1,
        lastAttemptAt: now,
      });
    }

    return {
      clientId,
      threatScore,
      isSuspicious,
      isBanned,
      triggerReason,
      vector,
      timestamp: now,
    };
  }

  public recordOutcome(clientId: string, success: boolean): void {
    const record = this.clientHistory.get(clientId);
    if (!record) return;
    if (success) {
      record.successes++;
    } else {
      record.errors++;
    }
  }

  public banClientManually(clientId: string, reason = 'Operator Manual Permanent Ban'): BannedClientRecord {
    const record: BannedClientRecord = {
      clientId,
      bannedAt: Date.now(),
      threatScore: 1.0,
      reason,
      totalRequestsAttempted: 1,
      lastAttemptAt: Date.now(),
    };
    this.permanentBlacklist.set(clientId, record);
    return record;
  }

  public unbanClient(clientId: string): boolean {
    return this.permanentBlacklist.delete(clientId);
  }

  public getBannedClients(): BannedClientRecord[] {
    return Array.from(this.permanentBlacklist.values());
  }

  public isClientBanned(clientId: string): boolean {
    return this.permanentBlacklist.has(clientId);
  }

  public clearAllBans(): void {
    this.permanentBlacklist.clear();
  }
}
