import React, { useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { EventLogEntry } from '../types';

interface EventLogProps {
  events: EventLogEntry[];
  onClear: () => void;
}

const EVENT_COLORS: Record<string, string> = {
  REQUEST_ROUTED: 'text-zinc-500',
  REQUEST_COMPLETED: 'text-zinc-500',
  REQUEST_FAILED: 'text-rose-400/70',
  NODE_FAILED: 'text-rose-400',
  NODE_RECOVERED: 'text-emerald-400',
  NODE_DEGRADED: 'text-amber-400',
  NODE_ADDED: 'text-cyan-400',
  NODE_REMOVED: 'text-zinc-400',
  SPIKE_STARTED: 'text-rose-400 font-bold',
  SPIKE_ENDED: 'text-cyan-400',
  SIMULATION_STARTED: 'text-emerald-400 font-semibold',
  SIMULATION_PAUSED: 'text-amber-400',
  SIMULATION_RESET: 'text-zinc-400',
  ALGORITHM_CHANGED: 'text-violet-400 font-semibold',
  TRAFFIC_CHANGED: 'text-indigo-400',
  SCENARIO_STARTED: 'text-violet-400 font-bold',
};

const EVENT_ICONS: Record<string, string> = {
  NODE_FAILED: '🔴',
  NODE_RECOVERED: '🟢',
  NODE_DEGRADED: '🟡',
  NODE_ADDED: '➕',
  NODE_REMOVED: '➖',
  SPIKE_STARTED: '⚡',
  SPIKE_ENDED: '✓',
  SIMULATION_STARTED: '▶',
  SIMULATION_PAUSED: '⏸',
  SIMULATION_RESET: '↺',
  ALGORITHM_CHANGED: '⚙',
  SCENARIO_STARTED: '🎬',
  REQUEST_ROUTED: '→',
  REQUEST_COMPLETED: '✓',
  REQUEST_FAILED: '✗',
  TRAFFIC_CHANGED: '~',
};

export const EventLog: React.FC<EventLogProps> = ({ events, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Auto-scroll only if user was near the top (newest-first ordering)
    el.scrollTop = 0;
  }, [events.length]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Filter out high-frequency request events to avoid spamming
  const displayEvents = events.filter(e =>
    e.type !== 'REQUEST_ROUTED' && e.type !== 'REQUEST_COMPLETED'
  ).slice(0, 200);

  return (
    <div className="bg-zinc-900/40 border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Event Log</h3>
          <span className="text-xs text-zinc-500 font-mono">({displayEvents.length})</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-500 hover:text-rose-400 border border-transparent hover:border-rose-500/30 rounded-lg transition-all"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div
        ref={scrollRef}
        className="overflow-y-auto font-mono text-xs flex-1"
        style={{ maxHeight: '280px' }}
      >
        {displayEvents.length === 0 ? (
          <div className="p-4 text-zinc-600 text-center text-sm font-sans">
            Events will appear here as the simulation runs
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {displayEvents.map(event => (
              <div
                key={event.id}
                className="flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors animate-slide-in"
              >
                <span className="text-zinc-600 flex-shrink-0 tabular-nums">
                  {formatTime(event.timestamp)}
                </span>
                <span className="flex-shrink-0 w-4 text-center">
                  {EVENT_ICONS[event.type] ?? '·'}
                </span>
                <span className={EVENT_COLORS[event.type] ?? 'text-zinc-400'}>
                  {event.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
