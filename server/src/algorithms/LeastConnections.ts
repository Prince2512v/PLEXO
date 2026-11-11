import { MicroserviceNodeData } from '../types';
import { LoadBalancer } from './LoadBalancer';

/**
 * Least Connections Load Balancer
 *
 * Selects the healthy node with the fewest active connections.
 * Tie-breaker: node with lower index in the healthy list (deterministic).
 *
 * Example:
 *   Node 1 = 5 connections
 *   Node 2 = 2 connections  ← selected
 *   Node 3 = 7 connections
 */
export class LeastConnections extends LoadBalancer {
  constructor() {
    super('LEAST_CONNECTIONS');
  }

  selectNode(nodes: MicroserviceNodeData[]): MicroserviceNodeData | null {
    const healthy = this.getHealthyNodes(nodes);
    if (healthy.length === 0) return null;

    // Find node with minimum active connections
    let selected = healthy[0];
    for (let i = 1; i < healthy.length; i++) {
      const node = healthy[i];
      if (
        node.activeConnections < selected.activeConnections ||
        // Tie-breaker: prefer node that has processed fewer total requests
        (node.activeConnections === selected.activeConnections &&
          node.totalRequests < selected.totalRequests)
      ) {
        selected = node;
      }
    }

    return selected;
  }

  reset(): void {
    // No internal state to reset
  }
}
