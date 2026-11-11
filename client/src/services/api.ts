import {
  GraphNode,
  GraphEdge,
  DijkstraResult,
  KnapsackTask,
  KnapsackResult,
  TrafficAnalyticsReport,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchDijkstraNetwork(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const res = await fetch(`${API_BASE}/ada/dijkstra/network`);
  if (!res.ok) throw new Error('Failed to load network topology');
  return res.json();
}

export async function solveDijkstra(
  source: string,
  destination: string,
  edges?: GraphEdge[]
): Promise<DijkstraResult> {
  const res = await fetch(`${API_BASE}/ada/dijkstra/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, destination, edges }),
  });
  if (!res.ok) throw new Error('Failed to compute shortest path');
  return res.json();
}

export async function fetchKnapsackTasks(): Promise<{ tasks: KnapsackTask[] }> {
  const res = await fetch(`${API_BASE}/ada/knapsack/tasks`);
  if (!res.ok) throw new Error('Failed to load knapsack tasks');
  return res.json();
}

export async function solveKnapsack(
  capacity: number,
  tasks?: KnapsackTask[]
): Promise<KnapsackResult> {
  const res = await fetch(`${API_BASE}/ada/knapsack/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capacity, tasks }),
  });
  if (!res.ok) throw new Error('Failed to solve knapsack allocation');
  return res.json();
}

export async function fetchAnalyticsReport(): Promise<TrafficAnalyticsReport> {
  const res = await fetch(`${API_BASE}/analytics/report`);
  if (!res.ok) throw new Error('Failed to fetch analytics report');
  return res.json();
}

export async function fetchBannedClients(): Promise<{ banned: any[] }> {
  const res = await fetch(`${API_BASE}/threat/banned`);
  if (!res.ok) throw new Error('Failed to fetch banned clients');
  return res.json();
}

export async function unbanClient(clientId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/threat/ban/${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to unban client');
}

export async function clearAllBans(): Promise<void> {
  const res = await fetch(`${API_BASE}/threat/clear`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear bans');
}

export async function simulateAttack(attackType: 'VOLUMETRIC_FLOOD' | 'ENTROPY_EXPLOIT' | 'SCAN_CRAWLER'): Promise<void> {
  const res = await fetch(`${API_BASE}/threat/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType }),
  });
  if (!res.ok) throw new Error('Failed to trigger attack simulation');
}
