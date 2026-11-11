import { MicroserviceNodeData } from '../types';
import { LoadBalancer } from './LoadBalancer';

/**
 * Round Robin Load Balancer
 *
 * Distributes requests sequentially across all healthy nodes.
 * If a node fails, it is skipped. The counter advances only through healthy nodes.
 *
 * Example with 5 nodes (Node 3 failed):
 *   Request 1 → Node 1
 *   Request 2 → Node 2
 *   Request 3 → Node 4  (Node 3 skipped)
 *   Request 4 → Node 5
 *   Request 5 → Node 1
 */
export class RoundRobin extends LoadBalancer {
  private currentIndex: number = 0;

  constructor() {
    super('ROUND_ROBIN');
  }

  selectNode(nodes: MicroserviceNodeData[]): MicroserviceNodeData | null {
    const healthy = this.getHealthyNodes(nodes);
    if (healthy.length === 0) return null;

    // Ensure currentIndex is within bounds
    this.currentIndex = this.currentIndex % healthy.length;
    const selected = healthy[this.currentIndex];

    // Advance counter for next call
    this.currentIndex = (this.currentIndex + 1) % healthy.length;

    return selected;
  }

  reset(): void {
    this.currentIndex = 0;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}
