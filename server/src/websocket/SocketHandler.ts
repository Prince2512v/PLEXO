import { Server, Socket } from 'socket.io';
import { SimulationEngine } from '../simulation/SimulationEngine';

export function setupSocketHandlers(io: Server, engine: SimulationEngine): void {
  // Push state to newly connected clients
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send initial state
    socket.emit('simulation:update', { state: engine.getState() });
    socket.emit('event:history', { events: engine.getEventLog() });

    // ─── Simulation control ───────────────────────────
    socket.on('simulation:start', () => {
      engine.start();
    });

    socket.on('simulation:pause', () => {
      engine.pause();
    });

    socket.on('simulation:reset', () => {
      engine.reset();
      io.emit('simulation:update', { state: engine.getState() });
    });

    // ─── Algorithm ────────────────────────────────────
    socket.on('algorithm:set', ({ algorithm }) => {
      engine.setAlgorithm(algorithm);
    });

    // ─── Traffic ──────────────────────────────────────
    socket.on('traffic:update', ({ config }) => {
      engine.updateTrafficConfig(config);
    });

    socket.on('traffic:spike', () => {
      engine.triggerSpike();
    });

    // ─── Fault injection ──────────────────────────────
    socket.on('node:fail', ({ nodeId }) => {
      engine.failNode(nodeId);
    });

    socket.on('node:recover', ({ nodeId }) => {
      engine.recoverNode(nodeId);
    });

    socket.on('node:fail_random', () => {
      engine.failRandomNode();
    });

    socket.on('node:recover_all', () => {
      engine.recoverAllNodes();
    });

    // ─── Node management ──────────────────────────────
    socket.on('node:add', () => {
      engine.addNode();
    });

    socket.on('node:remove', ({ nodeId }) => {
      engine.removeNode(nodeId);
    });

    // ─── Threat & Blacklist Controls ───────────────────
    socket.on('threat:banned_list', () => {
      socket.emit('threat:banned_list', { banned: engine.getBannedClients() });
    });

    socket.on('threat:ban_client', ({ clientId, reason }) => {
      const record = engine.banClientManually(clientId, reason);
      io.emit('threat:client_banned', { record });
    });

    socket.on('threat:unban_client', ({ clientId }) => {
      engine.unbanClient(clientId);
      io.emit('threat:client_unbanned', { clientId });
    });

    socket.on('threat:clear_all', () => {
      engine.clearAllBans();
      io.emit('threat:banned_list', { banned: [] });
    });

    socket.on('threat:simulate_attack', ({ attackType }) => {
      engine.simulateMaliciousAttack(attackType);
    });

    // ─── Config ───────────────────────────────────────
    socket.on('config:update', ({ config }) => {
      engine.updateSimulationConfig(config);
    });

    // ─── Demo scenarios ───────────────────────────────
    socket.on('scenario:run', ({ scenarioId }) => {
      engine.runScenario(scenarioId);
    });

    // ─── Time series data ────────────────────────────
    socket.on('metrics:latency_series', () => {
      socket.emit('metrics:latency_series', {
        data: engine.getLatencyTimeSeries(),
      });
    });

    socket.on('metrics:throughput_series', () => {
      socket.emit('metrics:throughput_series', {
        data: engine.getThroughputTimeSeries(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // ─── Engine → Socket.IO events ───────────────────────────

  engine.on('state_update', (state) => {
    io.emit('simulation:update', { state });
  });

  engine.on('metrics_update', (state) => {
    io.emit('metrics:update', {
      metrics: state.metrics,
      nodes: state.nodes,
      isSpiking: state.isSpiking,
      currentRps: state.config.trafficConfig.requestsPerSecond,
      latencySeries: engine.getLatencyTimeSeries(),
      throughputSeries: engine.getThroughputTimeSeries(),
    });
  });

  engine.on('request_routed', (req, node) => {
    io.emit('request:routed', { request: req, node });
  });

  engine.on('request_completed', (req, node) => {
    io.emit('request:completed', { request: req, node });
  });

  engine.on('node_updated', (node) => {
    io.emit('node:updated', { node });
  });

  engine.on('node_failed', (nodeId, nodeName) => {
    io.emit('node:failed', { nodeId, nodeName });
  });

  engine.on('node_recovered', (nodeId, nodeName) => {
    io.emit('node:recovered', { nodeId, nodeName });
  });

  engine.on('event_log', (entry) => {
    io.emit('event:log', { event: entry });
  });

  engine.on('spike_started', (rps) => {
    io.emit('traffic:spike_started', { rps });
  });

  engine.on('spike_ended', () => {
    io.emit('traffic:spike_ended', {});
  });

  engine.on('threat_evaluated', (threat) => {
    io.emit('threat:evaluated', { threat });
  });

  engine.on('request_banned', (threat) => {
    io.emit('threat:request_banned', { threat });
    io.emit('threat:banned_list', { banned: engine.getBannedClients() });
  });

  engine.on('client_banned', (record) => {
    io.emit('threat:client_banned', { record });
    io.emit('threat:banned_list', { banned: engine.getBannedClients() });
  });

  engine.on('client_unbanned', (clientId) => {
    io.emit('threat:client_unbanned', { clientId });
    io.emit('threat:banned_list', { banned: engine.getBannedClients() });
  });
}
