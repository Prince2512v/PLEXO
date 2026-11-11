import React from 'react';
import { SimulationStatus, AlgorithmType } from '../types';

interface HeaderProps {
  isConnected: boolean;
  status: SimulationStatus;
  algorithm: AlgorithmType;
  currentRps: number;
  avgLatency?: number;
  bannedCount?: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onClusterOpsClick?: () => void;
  onThreatClick?: () => void;
}

const ALGO_LABELS: Record<AlgorithmType, string> = {
  ROUND_ROBIN: 'Round Robin',
  LEAST_CONNECTIONS: 'Least Connections',
};

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  status,
  algorithm,
  avgLatency = 4.2,
  bannedCount = 0,
  onStart,
  onPause,
  onReset,
  onClusterOpsClick,
  onThreatClick,
}) => {
  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-8 flex items-center justify-between">
      {/* Left side telemetry pills */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-secondary' : 'bg-error'}`} />
          <span className="font-label-sm text-label-sm text-on-surface font-semibold">
            {isConnected ? 'Mesh Net: Synchronized' : 'Mesh Net: Disconnected'}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            | Latency {avgLatency.toFixed(1)}ms
          </span>
        </div>
        <div className="hidden xl:flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
            autorenew
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Balancing: {ALGO_LABELS[algorithm] || 'Round Robin'}
          </span>
        </div>

        {/* Live ML Ban Counter Pill */}
        {bannedCount > 0 && (
          <button
            onClick={onThreatClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold transition-all animate-pulse cursor-pointer shadow-sm"
            title="Click to view banned clients in Traffic Analytics"
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>ML Intercept: {bannedCount} Banned</span>
          </button>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center bg-surface-container-low px-3 py-1.5 rounded-full gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
            schedule
          </span>
          <span className="font-label-sm text-label-sm text-on-surface">
            {status === 'RUNNING' ? 'Engine Active' : status === 'PAUSED' ? 'Paused' : 'Standby'}
          </span>
        </div>

        {status !== 'RUNNING' ? (
          <button
            onClick={onStart}
            disabled={!isConnected}
            className="px-3.5 py-1.5 bg-primary-container text-on-primary rounded-full font-label-sm text-label-sm font-semibold hover:bg-secondary transition-colors flex items-center gap-1.5 shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            Start
          </button>
        ) : (
          <button
            onClick={onPause}
            className="px-3.5 py-1.5 bg-secondary text-on-secondary rounded-full font-label-sm text-label-sm font-semibold hover:opacity-90 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">pause</span>
            Pause
          </button>
        )}

        <button
          onClick={onReset}
          className="p-1.5 bg-surface-container-low hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
          title="Reset Simulation State"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </button>

        {/* Cluster Ops Button */}
        <button
          onClick={onClusterOpsClick}
          className="px-3 py-1.5 bg-primary-container text-on-primary rounded-full font-label-sm text-label-sm font-semibold hover:bg-secondary transition-colors flex items-center gap-1.5 shadow-[0_4px_20px_-2px_rgba(0,29,57,0.04)]"
          title="Open Cluster Load Balancing Ops"
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Cluster Ops
        </button>

        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
          <span className="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};
