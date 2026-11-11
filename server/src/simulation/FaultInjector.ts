import { EventEmitter } from 'events';
import { MicroserviceNode } from './MicroserviceNode';

interface FaultInjectorEvents {
  node_failed: (nodeId: string) => void;
  node_recovered: (nodeId: string) => void;
}

export declare interface FaultInjector {
  on<K extends keyof FaultInjectorEvents>(event: K, listener: FaultInjectorEvents[K]): this;
  emit<K extends keyof FaultInjectorEvents>(event: K, ...args: Parameters<FaultInjectorEvents[K]>): boolean;
}

export class FaultInjector extends EventEmitter {
  private nodes: Map<string, MicroserviceNode>;

  constructor(nodes: Map<string, MicroserviceNode>) {
    super();
    this.nodes = nodes;
  }

  updateNodes(nodes: Map<string, MicroserviceNode>): void {
    this.nodes = nodes;
  }

  failNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    if (node.getStatus() === 'FAILED') return false;

    node.fail();
    this.emit('node_failed', nodeId);
    return true;
  }

  recoverNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    if (node.getStatus() !== 'FAILED') return false;

    node.recover();
    this.emit('node_recovered', nodeId);
    return true;
  }

  failRandomNode(): string | null {
    const healthyNodes = Array.from(this.nodes.values()).filter(
      n => n.getStatus() === 'HEALTHY'
    );
    if (healthyNodes.length === 0) return null;

    const target = healthyNodes[Math.floor(Math.random() * healthyNodes.length)];
    target.fail();
    this.emit('node_failed', target.getId());
    return target.getId();
  }

  recoverAllNodes(): string[] {
    const recovered: string[] = [];
    for (const node of this.nodes.values()) {
      if (node.getStatus() === 'FAILED') {
        node.recover();
        this.emit('node_recovered', node.getId());
        recovered.push(node.getId());
      }
    }
    return recovered;
  }

  failMultipleNodes(count: number): string[] {
    const healthyNodes = Array.from(this.nodes.values()).filter(
      n => n.getStatus() === 'HEALTHY'
    );

    // Ensure at least one node remains healthy
    const maxFail = Math.max(0, healthyNodes.length - 1);
    const toFail = Math.min(count, maxFail);

    const targets = this.shuffleArray(healthyNodes).slice(0, toFail);
    const failed: string[] = [];

    for (const node of targets) {
      node.fail();
      this.emit('node_failed', node.getId());
      failed.push(node.getId());
    }

    return failed;
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
