/// <reference types="vite/client" />
import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  const envUrl = (import.meta as { env?: { VITE_SOCKET_URL?: string } }).env?.VITE_SOCKET_URL;
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') {
    // If running in browser locally on Vite port 5173
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // If deployed on production without VITE_SOCKET_URL set, fallback to current origin
    return window.location.origin;
  }
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to simulation server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      this.reconnectAttempts++;
      console.error(`❌ Connection error (attempt ${this.reconnectAttempts}):`, err.message);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Simulation control
  startSimulation() { this.socket?.emit('simulation:start'); }
  pauseSimulation() { this.socket?.emit('simulation:pause'); }
  resetSimulation() { this.socket?.emit('simulation:reset'); }

  // Algorithm
  setAlgorithm(algorithm: string) { this.socket?.emit('algorithm:set', { algorithm }); }

  // Traffic
  updateTraffic(config: Record<string, unknown>) { this.socket?.emit('traffic:update', { config }); }
  triggerSpike() { this.socket?.emit('traffic:spike'); }

  // Fault injection
  failNode(nodeId: string) { this.socket?.emit('node:fail', { nodeId }); }
  recoverNode(nodeId: string) { this.socket?.emit('node:recover', { nodeId }); }
  failRandom() { this.socket?.emit('node:fail_random'); }
  recoverAll() { this.socket?.emit('node:recover_all'); }

  // Node management
  addNode() { this.socket?.emit('node:add'); }
  removeNode(nodeId: string) { this.socket?.emit('node:remove', { nodeId }); }

  // Config
  updateConfig(config: Record<string, unknown>) { this.socket?.emit('config:update', { config }); }

  // Scenarios
  runScenario(scenarioId: number) { this.socket?.emit('scenario:run', { scenarioId }); }
}

export const socketService = new SocketService();
export default socketService;
