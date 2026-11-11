import { MicroserviceNodeData, AlgorithmType } from '../types';

// Abstract base class for all load balancing algorithms
export abstract class LoadBalancer {
  protected algorithm: AlgorithmType;

  constructor(algorithm: AlgorithmType) {
    this.algorithm = algorithm;
  }

  // Select a node for a given request
  abstract selectNode(
    nodes: MicroserviceNodeData[],
    requestKey?: string
  ): MicroserviceNodeData | null;

  // Get healthy nodes only
  protected getHealthyNodes(nodes: MicroserviceNodeData[]): MicroserviceNodeData[] {
    return nodes.filter(n => n.status !== 'FAILED');
  }

  getAlgorithm(): AlgorithmType {
    return this.algorithm;
  }

  // Reset internal state (used when nodes change or simulation resets)
  abstract reset(): void;
}
