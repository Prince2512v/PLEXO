import { RoundRobin } from '../algorithms/RoundRobin';
import { LeastConnections } from '../algorithms/LeastConnections';
import { MicroserviceNodeData } from '../types';

// Helper to create mock nodes
function makeNode(overrides: Partial<MicroserviceNodeData> = {}): MicroserviceNodeData {
  return {
    id: `node-${Math.random().toString(36).slice(2)}`,
    name: 'Node',
    status: 'HEALTHY',
    activeConnections: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    averageLatency: 0,
    currentLatency: 30,
    weight: 1,
    ...overrides,
  };
}

// ─── Round Robin ─────────────────────────────────────────────────────────────

describe('RoundRobin', () => {
  test('rotates through all healthy nodes', () => {
    const rr = new RoundRobin();
    const nodes = [makeNode({ name: 'N1' }), makeNode({ name: 'N2' }), makeNode({ name: 'N3' })];
    const selected = [
      rr.selectNode(nodes),
      rr.selectNode(nodes),
      rr.selectNode(nodes),
      rr.selectNode(nodes), // wraps back
    ];
    expect(selected[0]!.name).toBe('N1');
    expect(selected[1]!.name).toBe('N2');
    expect(selected[2]!.name).toBe('N3');
    expect(selected[3]!.name).toBe('N1');
  });

  test('skips failed nodes', () => {
    const rr = new RoundRobin();
    const n1 = makeNode({ name: 'N1' });
    const n2 = makeNode({ name: 'N2', status: 'FAILED' });
    const n3 = makeNode({ name: 'N3' });
    const results: string[] = [];
    for (let i = 0; i < 6; i++) {
      results.push(rr.selectNode([n1, n2, n3])!.name);
    }
    expect(results.every(r => r !== 'N2')).toBe(true);
    // Should alternate between N1 and N3
    expect(results).toEqual(['N1', 'N3', 'N1', 'N3', 'N1', 'N3']);
  });

  test('returns null when all nodes are failed', () => {
    const rr = new RoundRobin();
    const nodes = [makeNode({ status: 'FAILED' }), makeNode({ status: 'FAILED' })];
    expect(rr.selectNode(nodes)).toBeNull();
  });

  test('reset restarts from first node', () => {
    const rr = new RoundRobin();
    const nodes = [makeNode({ name: 'N1' }), makeNode({ name: 'N2' })];
    rr.selectNode(nodes); // N1
    rr.selectNode(nodes); // N2
    rr.reset();
    expect(rr.selectNode(nodes)!.name).toBe('N1');
  });

  test('handles single node', () => {
    const rr = new RoundRobin();
    const nodes = [makeNode({ name: 'N1' })];
    expect(rr.selectNode(nodes)!.name).toBe('N1');
    expect(rr.selectNode(nodes)!.name).toBe('N1');
  });
});

// ─── Least Connections ───────────────────────────────────────────────────────

describe('LeastConnections', () => {
  test('selects node with fewest active connections', () => {
    const lc = new LeastConnections();
    const n1 = makeNode({ name: 'N1', activeConnections: 5 });
    const n2 = makeNode({ name: 'N2', activeConnections: 2 });
    const n3 = makeNode({ name: 'N3', activeConnections: 7 });
    expect(lc.selectNode([n1, n2, n3])!.name).toBe('N2');
  });

  test('skips failed nodes', () => {
    const lc = new LeastConnections();
    const n1 = makeNode({ name: 'N1', activeConnections: 1 });
    const n2 = makeNode({ name: 'N2', activeConnections: 0, status: 'FAILED' });
    const n3 = makeNode({ name: 'N3', activeConnections: 3 });
    expect(lc.selectNode([n1, n2, n3])!.name).toBe('N1');
  });

  test('tie-breaker uses total requests', () => {
    const lc = new LeastConnections();
    const n1 = makeNode({ name: 'N1', activeConnections: 5, totalRequests: 100 });
    const n2 = makeNode({ name: 'N2', activeConnections: 5, totalRequests: 50 });
    // N2 has fewer total requests → chosen
    expect(lc.selectNode([n1, n2])!.name).toBe('N2');
  });

  test('returns null when all failed', () => {
    const lc = new LeastConnections();
    const nodes = [makeNode({ status: 'FAILED' }), makeNode({ status: 'FAILED' })];
    expect(lc.selectNode(nodes)).toBeNull();
  });
});

// ─── Fault handling: failed nodes receive no requests ─────────────────────────

describe('Fault handling: failed nodes receive no requests', () => {
  test('Round Robin never routes to failed node', () => {
    const rr = new RoundRobin();
    const n1 = makeNode({ id: '1', name: 'N1' });
    const n2 = makeNode({ id: '2', name: 'N2', status: 'FAILED' });
    const n3 = makeNode({ id: '3', name: 'N3' });
    const nodes = [n1, n2, n3];
    const results = Array.from({ length: 20 }, () => rr.selectNode(nodes)!.id);
    expect(results.includes('2')).toBe(false);
  });

  test('Least Connections never routes to failed node', () => {
    const lc = new LeastConnections();
    const n1 = makeNode({ id: '1', activeConnections: 10 });
    const n2 = makeNode({ id: '2', activeConnections: 0, status: 'FAILED' }); // lowest but failed
    const n3 = makeNode({ id: '3', activeConnections: 5 });
    const nodes = [n1, n2, n3];
    const results = Array.from({ length: 10 }, () => lc.selectNode(nodes)!.id);
    expect(results.every(r => r !== '2')).toBe(true);
  });
});
