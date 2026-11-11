import { Router, Request, Response } from 'express';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { AlgorithmType } from '../types';
import {
  DEFAULT_NETWORK_NODES,
  DEFAULT_NETWORK_EDGES,
  findShortestPath,
} from '../algorithms/dijkstra';
import { DEFAULT_TASKS, solveKnapsack } from '../algorithms/knapsack';

export function createApiRouter(engine: SimulationEngine): Router {
  const router = Router();

  // ─── Status ───────────────────────────────────────────────────
  router.get('/status', (_req: Request, res: Response) => {
    res.json({ ok: true, state: engine.getState() });
  });

  // ─── Nodes ────────────────────────────────────────────────────
  router.get('/nodes', (_req: Request, res: Response) => {
    res.json({ nodes: engine.getNodes() });
  });

  router.post('/nodes', (_req: Request, res: Response) => {
    const node = engine.addNode();
    if (!node) {
      res.status(400).json({ error: 'Maximum node count (10) reached' });
      return;
    }
    res.json({ node });
  });

  router.delete('/nodes/:id', (req: Request, res: Response) => {
    const success = engine.removeNode(req.params.id);
    if (!success) {
      res.status(400).json({ error: 'Cannot remove node (minimum 2 nodes or not found)' });
      return;
    }
    res.json({ ok: true });
  });

  router.post('/nodes/:id/fail', (req: Request, res: Response) => {
    const success = engine.failNode(req.params.id);
    if (!success) {
      res.status(400).json({ error: 'Node not found or already failed' });
      return;
    }
    res.json({ ok: true });
  });

  router.post('/nodes/:id/recover', (req: Request, res: Response) => {
    const success = engine.recoverNode(req.params.id);
    if (!success) {
      res.status(400).json({ error: 'Node not found or not in failed state' });
      return;
    }
    res.json({ ok: true });
  });

  // ─── Simulation control ───────────────────────────────────────
  router.post('/simulation/start', (_req: Request, res: Response) => {
    engine.start();
    res.json({ ok: true, state: engine.getState() });
  });

  router.post('/simulation/pause', (_req: Request, res: Response) => {
    engine.pause();
    res.json({ ok: true, state: engine.getState() });
  });

  router.post('/simulation/reset', (_req: Request, res: Response) => {
    engine.reset();
    res.json({ ok: true, state: engine.getState() });
  });

  // ─── Algorithm ────────────────────────────────────────────────
  router.post('/simulation/algorithm', (req: Request, res: Response) => {
    const { algorithm } = req.body as { algorithm: AlgorithmType };
    const valid: AlgorithmType[] = ['ROUND_ROBIN', 'LEAST_CONNECTIONS'];
    if (!valid.includes(algorithm)) {
      res.status(400).json({ error: `Invalid algorithm. Must be one of: ${valid.join(', ')}` });
      return;
    }
    engine.setAlgorithm(algorithm);
    res.json({ ok: true });
  });

  // ─── Traffic ──────────────────────────────────────────────────
  router.post('/traffic/start', (req: Request, res: Response) => {
    const { requestsPerSecond, pattern } = req.body;
    if (requestsPerSecond !== undefined) {
      const rps = Number(requestsPerSecond);
      if (isNaN(rps) || rps < 1 || rps > 1000) {
        res.status(400).json({ error: 'requestsPerSecond must be between 1 and 1000' });
        return;
      }
    }
    engine.updateTrafficConfig({ requestsPerSecond, pattern });
    res.json({ ok: true });
  });

  router.post('/traffic/spike', (_req: Request, res: Response) => {
    engine.triggerSpike();
    res.json({ ok: true });
  });

  // ─── Metrics ──────────────────────────────────────────────────
  router.get('/metrics', (_req: Request, res: Response) => {
    res.json({
      metrics: engine.getState().metrics,
      latencySeries: engine.getLatencyTimeSeries(),
      throughputSeries: engine.getThroughputTimeSeries(),
    });
  });

  // ─── Events ───────────────────────────────────────────────────
  router.get('/events', (_req: Request, res: Response) => {
    res.json({ events: engine.getEventLog() });
  });

  // ─── Fault injection ──────────────────────────────────────────
  router.post('/fault/random', (_req: Request, res: Response) => {
    const nodeId = engine.failRandomNode();
    if (!nodeId) {
      res.status(400).json({ error: 'No healthy nodes to fail' });
      return;
    }
    res.json({ ok: true, nodeId });
  });

  router.post('/fault/recover-all', (_req: Request, res: Response) => {
    const recovered = engine.recoverAllNodes();
    res.json({ ok: true, recovered });
  });

  // ─── Scenarios ────────────────────────────────────────────────
  router.post('/scenario/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1 || id > 5) {
      res.status(400).json({ error: 'Scenario ID must be 1–5' });
      return;
    }
    engine.runScenario(id);
    res.json({ ok: true });
  });

  // ─── Config ───────────────────────────────────────────────────
  router.post('/config', (req: Request, res: Response) => {
    engine.updateSimulationConfig(req.body);
    res.json({ ok: true, state: engine.getState() });
  });

  // ─── ADA Algorithms: Dijkstra Shortest Path ────────────────────
  router.get('/ada/dijkstra/network', (_req: Request, res: Response) => {
    res.json({
      nodes: DEFAULT_NETWORK_NODES,
      edges: DEFAULT_NETWORK_EDGES,
    });
  });

  router.post('/ada/dijkstra/solve', (req: Request, res: Response) => {
    const { source, destination, edges } = req.body;
    if (!source || !destination) {
      res.status(400).json({ error: 'source and destination are required' });
      return;
    }
    const edgeList = edges || DEFAULT_NETWORK_EDGES;
    const result = findShortestPath(DEFAULT_NETWORK_NODES, edgeList, source, destination);
    res.json(result);
  });

  // ─── ADA Algorithms: 0/1 Knapsack Dynamic Programming ──────────
  router.get('/ada/knapsack/tasks', (_req: Request, res: Response) => {
    res.json({ tasks: DEFAULT_TASKS });
  });

  router.post('/ada/knapsack/solve', (req: Request, res: Response) => {
    const { tasks, capacity } = req.body;
    const taskList = tasks && Array.isArray(tasks) ? tasks : DEFAULT_TASKS;
    const cap = typeof capacity === 'number' ? capacity : 25;
    if (cap < 0 || cap > 100) {
      res.status(400).json({ error: 'capacity must be between 0 and 100' });
      return;
    }
    const result = solveKnapsack(taskList, cap);
    res.json(result);
  });

  // ─── Software Data Analytics (SDA): Traffic Analytics Report ────
  router.get('/analytics/report', (_req: Request, res: Response) => {
    const report = engine.getAnalyticsReport();
    res.json(report);
  });

  // ─── Threat & Anomaly Management: ML Blacklist Endpoints ────────
  router.get('/threat/banned', (_req: Request, res: Response) => {
    res.json({ banned: engine.getBannedClients() });
  });

  router.post('/threat/ban', (req: Request, res: Response) => {
    const { clientId, reason } = req.body;
    if (!clientId) {
      res.status(400).json({ error: 'clientId is required' });
      return;
    }
    const record = engine.banClientManually(clientId, reason);
    res.json({ ok: true, record });
  });

  router.delete('/threat/ban/:clientId', (req: Request, res: Response) => {
    const success = engine.unbanClient(req.params.clientId);
    res.json({ ok: success });
  });

  router.post('/threat/clear', (_req: Request, res: Response) => {
    engine.clearAllBans();
    res.json({ ok: true });
  });

  router.post('/threat/simulate', (req: Request, res: Response) => {
    const { attackType } = req.body;
    engine.simulateMaliciousAttack(attackType || 'ENTROPY_EXPLOIT');
    res.json({ ok: true, message: `Simulated attack ${attackType || 'ENTROPY_EXPLOIT'} triggered` });
  });

  return router;
}
