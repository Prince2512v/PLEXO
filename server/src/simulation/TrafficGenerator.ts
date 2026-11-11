import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { TrafficConfig, TrafficPattern } from '../types';

interface TrafficGeneratorEvents {
  request: (
    clientId: string,
    requestKey: string,
    attackType?: 'VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER'
  ) => void;
  spike_start: (rps: number) => void;
  spike_end: () => void;
  rps_changed: (rps: number) => void;
}

export declare interface TrafficGenerator {
  on<K extends keyof TrafficGeneratorEvents>(event: K, listener: TrafficGeneratorEvents[K]): this;
  emit<K extends keyof TrafficGeneratorEvents>(event: K, ...args: Parameters<TrafficGeneratorEvents[K]>): boolean;
}

export class TrafficGenerator extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private spikeTimeoutId: NodeJS.Timeout | null = null;
  private rampIntervalId: NodeJS.Timeout | null = null;

  private config: TrafficConfig;
  private currentRps: number;
  private isRunning = false;
  private isSpiking = false;

  // Client pool for consistent hashing (simulates real client diversity)
  private readonly CLIENT_POOL = Array.from({ length: 50 }, () => `client-${uuidv4()}`);
  private readonly ATTACKER_POOL = Array.from({ length: 8 }, (_, i) => `attacker-entity-${i + 1}`);

  constructor(config: TrafficConfig) {
    super();
    this.config = config;
    this.currentRps = config.requestsPerSecond;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleRequests(this.currentRps);
  }

  stop(): void {
    this.isRunning = false;
    this.clearInterval();
    this.clearSpike();
  }

  updateConfig(config: Partial<TrafficConfig>): void {
    this.config = { ...this.config, ...config };
    if (!this.isSpiking) {
      this.currentRps = this.config.requestsPerSecond;
      if (this.isRunning) {
        this.clearInterval();
        this.scheduleRequests(this.currentRps);
        this.emit('rps_changed', this.currentRps);
      }
    }
  }

  triggerSpike(): void {
    if (!this.isRunning || this.isSpiking) return;

    const { spikeConfig } = this.config;
    this.isSpiking = true;
    const normalRps = spikeConfig.normalRps || this.config.requestsPerSecond;
    const spikeRps = spikeConfig.spikeRps;

    this.emit('spike_start', spikeRps);

    // Ramp up
    this.rampRps(normalRps, spikeRps, spikeConfig.rampUpMs, () => {
      // Hold spike
      this.spikeTimeoutId = setTimeout(() => {
        // Ramp down
        this.rampRps(spikeRps, normalRps, spikeConfig.rampDownMs, () => {
          this.isSpiking = false;
          this.currentRps = normalRps;
          this.emit('spike_end');
        });
      }, spikeConfig.spikeDurationMs);
    });
  }

  private rampRps(fromRps: number, toRps: number, durationMs: number, onComplete: () => void): void {
    const steps = 20;
    const stepMs = durationMs / steps;
    const rpsStep = (toRps - fromRps) / steps;
    let current = fromRps;
    let step = 0;

    this.rampIntervalId = setInterval(() => {
      step++;
      current += rpsStep;
      const clampedRps = Math.max(1, Math.round(current));
      this.currentRps = clampedRps;

      this.clearInterval();
      this.scheduleRequests(clampedRps);
      this.emit('rps_changed', clampedRps);

      if (step >= steps) {
        if (this.rampIntervalId) clearInterval(this.rampIntervalId);
        this.rampIntervalId = null;
        onComplete();
      }
    }, stepMs);
  }

  private scheduleRequests(rps: number): void {
    this.clearInterval();
    if (rps <= 0 || !this.isRunning) return;

    const intervalMs = 1000 / rps;

    this.intervalId = setInterval(() => {
      if (!this.isRunning) return;

      const count = this.getRequestCount(rps);
      for (let i = 0; i < count; i++) {
        // Exactly 1 out of 10 requests (~10% probability) is synthetic suspicious / malicious traffic
        const isSuspicious = Math.random() < 0.10;
        let attackType: 'VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER' | undefined = undefined;

        let clientId: string;
        if (isSuspicious) {
          const attacks: ('VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER')[] = [
            'ENTROPY_EXPLOIT',
            'VOLUMETRIC_FLOOD',
            'SCAN_CRAWLER',
          ];
          attackType = attacks[Math.floor(Math.random() * attacks.length)];
          // Pick from persistent attacker pool or create new attacker with 20% probability
          if (Math.random() < 0.8) {
            clientId = this.ATTACKER_POOL[Math.floor(Math.random() * this.ATTACKER_POOL.length)];
          } else {
            clientId = `attacker-${attackType.toLowerCase().replace('_', '-')}-${uuidv4().slice(0, 6)}`;
          }
        } else {
          clientId = this.getClientId();
        }

        const requestKey = `${clientId}:${Date.now()}`;
        this.emit('request', clientId, requestKey, attackType);
      }
    }, Math.max(intervalMs, 10)); // minimum 10ms interval for performance
  }

  private getRequestCount(rps: number): number {
    switch (this.config.pattern) {
      case 'CONSTANT':
        return 1;
      case 'RANDOM':
        // Poisson-like: random between 0 and 2 * rps/interval
        return Math.random() < 0.7 ? 1 : Math.random() < 0.5 ? 0 : 2;
      case 'BURST':
        // Occasional bursts
        return Math.random() < 0.1 ? Math.ceil(Math.random() * 5) : 1;
      case 'SPIKE':
        return 1; // Spike is handled by rampRps
      default:
        return 1;
    }
  }

  private getClientId(): string {
    return this.CLIENT_POOL[Math.floor(Math.random() * this.CLIENT_POOL.length)];
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private clearSpike(): void {
    if (this.spikeTimeoutId) {
      clearTimeout(this.spikeTimeoutId);
      this.spikeTimeoutId = null;
    }
    if (this.rampIntervalId) {
      clearInterval(this.rampIntervalId);
      this.rampIntervalId = null;
    }
    this.isSpiking = false;
  }

  getCurrentRps(): number {
    return this.currentRps;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getIsSpiking(): boolean {
    return this.isSpiking;
  }
}
