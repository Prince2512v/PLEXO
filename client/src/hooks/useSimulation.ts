import { useEffect, useRef, useCallback, useState } from 'react';
import {
  SimulationState,
  MicroserviceNodeData,
  SimulationMetrics,
  EventLogEntry,
  HashRingState,
  LatencyPoint,
  ThroughputPoint,
  RoutedRequest,
  AlgorithmType,
  SimulationConfig,
  TrafficConfig,
  BannedClientRecord,
  ThreatEvaluationResult,
} from '../types';
import socketService from '../services/socket';
import { Socket } from 'socket.io-client';

interface SimulationStore {
  // Connection
  isConnected: boolean;

  // State
  simulationState: SimulationState | null;
  nodes: MicroserviceNodeData[];
  metrics: SimulationMetrics | null;
  events: EventLogEntry[];
  hashRing: HashRingState | null;
  latencySeries: LatencyPoint[];
  throughputSeries: ThroughputPoint[];
  currentRps: number;
  isSpiking: boolean;

  // Recent routed requests (for flow visualization)
  recentRouted: RoutedRequest[];

  // Threat & Anomaly ML
  bannedClients: BannedClientRecord[];
  lastThreatEvaluation: ThreatEvaluationResult | null;
  unbanClient: (clientId: string) => void;
  clearAllBans: () => void;
  simulateAttack: (attackType: 'VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER') => void;

  // Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setAlgorithm: (algo: AlgorithmType) => void;
  updateTraffic: (config: Partial<TrafficConfig>) => void;
  triggerSpike: () => void;
  failNode: (nodeId: string) => void;
  recoverNode: (nodeId: string) => void;
  failRandom: () => void;
  recoverAll: () => void;
  addNode: () => void;
  removeNode: (nodeId: string) => void;
  updateConfig: (config: Partial<SimulationConfig>) => void;
  runScenario: (id: number) => void;
  clearEvents: () => void;
}

const MAX_LATENCY_SERIES = 60;
const MAX_THROUGHPUT_SERIES = 60;
const MAX_EVENTS = 300;
const MAX_ROUTED = 20;

export function useSimulation(): SimulationStore {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [nodes, setNodes] = useState<MicroserviceNodeData[]>([]);
  const [metrics, setMetrics] = useState<SimulationMetrics | null>(null);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [hashRing, setHashRing] = useState<HashRingState | null>(null);
  const [latencySeries, setLatencySeries] = useState<LatencyPoint[]>([]);
  const [throughputSeries, setThroughputSeries] = useState<ThroughputPoint[]>([]);
  const [currentRps, setCurrentRps] = useState(0);
  const [isSpiking, setIsSpiking] = useState(false);
  const [recentRouted, setRecentRouted] = useState<RoutedRequest[]>([]);
  const [bannedClients, setBannedClients] = useState<BannedClientRecord[]>([]);
  const [lastThreatEvaluation, setLastThreatEvaluation] = useState<ThreatEvaluationResult | null>(null);

  // Fallback REST fetch to ensure state is loaded immediately even before socket events
  const syncFromApi = useCallback(() => {
    fetch('http://localhost:3001/api/status')
      .then(res => res.json())
      .then(data => {
        if (data?.state) {
          setSimulationState(data.state);
          setNodes(data.state.nodes || []);
          setMetrics(data.state.metrics || null);
          setCurrentRps(data.state.config?.trafficConfig?.requestsPerSecond || 10);
          setIsSpiking(data.state.isSpiking || false);
        }
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/threat/banned')
      .then(res => res.json())
      .then(data => {
        if (data?.banned) {
          setBannedClients(data.banned);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const socket = socketService.connect();
    socketRef.current = socket;

    if (socket.connected) {
      setIsConnected(true);
      syncFromApi();
    }

    const onConnect = () => {
      setIsConnected(true);
      syncFromApi();
    };

    const onDisconnect = () => setIsConnected(false);

    // Full state update
    const onSimulationUpdate = ({ state }: { state: SimulationState }) => {
      setSimulationState(state);
      setNodes(state.nodes);
      setMetrics(state.metrics);
      setCurrentRps(state.config.trafficConfig.requestsPerSecond);
      setIsSpiking(state.isSpiking);
    };

    // High-frequency metrics update
    const onMetricsUpdate = (data: {
      metrics: SimulationMetrics;
      nodes: MicroserviceNodeData[];
      isSpiking: boolean;
      currentRps: number;
      latencySeries: LatencyPoint[];
      throughputSeries: ThroughputPoint[];
    }) => {
      setMetrics(data.metrics);
      setNodes(data.nodes);
      setIsSpiking(data.isSpiking);
      setCurrentRps(data.currentRps);

      if (data.latencySeries?.length) {
        setLatencySeries(prev => {
          const combined = [...prev, ...data.latencySeries.slice(-5)];
          return combined.slice(-MAX_LATENCY_SERIES);
        });
      }
      if (data.throughputSeries?.length) {
        setThroughputSeries(prev => {
          const combined = [...prev, ...data.throughputSeries.slice(-5)];
          return combined.slice(-MAX_THROUGHPUT_SERIES);
        });
      }
    };

    // Node updates
    const onNodeUpdated = ({ node }: { node: MicroserviceNodeData }) => {
      setNodes(prev => prev.map(n => n.id === node.id ? node : n));
    };

    // Request routing (for flow visualization)
    const onRequestRouted = ({ request, node }: { request: { requestId: string }; node: MicroserviceNodeData }) => {
      setRecentRouted(prev => {
        const next = [...prev, {
          nodeId: node.id,
          requestId: request.requestId,
          timestamp: Date.now(),
        }];
        return next.slice(-MAX_ROUTED);
      });
    };

    // Events
    const onEventLog = ({ event }: { event: EventLogEntry }) => {
      setEvents(prev => [event, ...prev].slice(0, MAX_EVENTS));
    };

    const onEventHistory = ({ events: history }: { events: EventLogEntry[] }) => {
      setEvents(history.slice(0, MAX_EVENTS));
    };

    // Hash ring
    const onHashRingUpdate = ({ ring }: { ring: HashRingState }) => {
      setHashRing(ring);
    };

    // Spike
    const onSpikeStarted = ({ rps }: { rps: number }) => {
      setIsSpiking(true);
      setCurrentRps(rps);
    };
    const onSpikeEnded = () => setIsSpiking(false);

    // Threat ML
    const onThreatEvaluated = ({ threat }: { threat: ThreatEvaluationResult }) => {
      setLastThreatEvaluation(threat);
    };

    const onBannedList = ({ banned }: { banned: BannedClientRecord[] }) => {
      setBannedClients(banned);
    };

    const onClientBanned = ({ record }: { record: BannedClientRecord }) => {
      setBannedClients(prev => {
        const filtered = prev.filter(b => b.clientId !== record.clientId);
        return [record, ...filtered];
      });
    };

    const onClientUnbanned = ({ clientId }: { clientId: string }) => {
      setBannedClients(prev => prev.filter(b => b.clientId !== clientId));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('simulation:update', onSimulationUpdate);
    socket.on('metrics:update', onMetricsUpdate);
    socket.on('node:updated', onNodeUpdated);
    socket.on('request:routed', onRequestRouted);
    socket.on('event:log', onEventLog);
    socket.on('event:history', onEventHistory);
    socket.on('hash_ring:update', onHashRingUpdate);
    socket.on('traffic:spike_started', onSpikeStarted);
    socket.on('traffic:spike_ended', onSpikeEnded);
    socket.on('threat:evaluated', onThreatEvaluated);
    socket.on('threat:banned_list', onBannedList);
    socket.on('threat:client_banned', onClientBanned);
    socket.on('threat:client_unbanned', onClientUnbanned);

    // Initial load
    syncFromApi();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('simulation:update', onSimulationUpdate);
      socket.off('metrics:update', onMetricsUpdate);
      socket.off('node:updated', onNodeUpdated);
      socket.off('request:routed', onRequestRouted);
      socket.off('event:log', onEventLog);
      socket.off('event:history', onEventHistory);
      socket.off('hash_ring:update', onHashRingUpdate);
      socket.off('traffic:spike_started', onSpikeStarted);
      socket.off('traffic:spike_ended', onSpikeEnded);
      socket.off('threat:evaluated', onThreatEvaluated);
      socket.off('threat:banned_list', onBannedList);
      socket.off('threat:client_banned', onClientBanned);
      socket.off('threat:client_unbanned', onClientUnbanned);
    };
  }, [syncFromApi]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return {
    isConnected,
    simulationState,
    nodes,
    metrics,
    events,
    hashRing,
    latencySeries,
    throughputSeries,
    currentRps,
    isSpiking,
    recentRouted,
    bannedClients,
    lastThreatEvaluation,
    unbanClient: useCallback((clientId: string) => {
      const socket = socketRef.current;
      if (socket) socket.emit('threat:unban_client', { clientId });
    }, []),
    clearAllBans: useCallback(() => {
      const socket = socketRef.current;
      if (socket) socket.emit('threat:clear_all');
    }, []),
    simulateAttack: useCallback((attackType: 'VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER') => {
      const socket = socketRef.current;
      if (socket) socket.emit('threat:simulate_attack', { attackType });
    }, []),
    startSimulation: useCallback(() => socketService.startSimulation(), []),
    pauseSimulation: useCallback(() => socketService.pauseSimulation(), []),
    resetSimulation: useCallback(() => socketService.resetSimulation(), []),
    setAlgorithm: useCallback((algo) => socketService.setAlgorithm(algo), []),
    updateTraffic: useCallback((config) => socketService.updateTraffic(config as Record<string, unknown>), []),
    triggerSpike: useCallback(() => socketService.triggerSpike(), []),
    failNode: useCallback((id) => socketService.failNode(id), []),
    recoverNode: useCallback((id) => socketService.recoverNode(id), []),
    failRandom: useCallback(() => socketService.failRandom(), []),
    recoverAll: useCallback(() => socketService.recoverAll(), []),
    addNode: useCallback(() => socketService.addNode(), []),
    removeNode: useCallback((id) => socketService.removeNode(id), []),
    updateConfig: useCallback((config) => socketService.updateConfig(config as Record<string, unknown>), []),
    runScenario: useCallback((id) => socketService.runScenario(id), []),
    clearEvents,
  };
}
