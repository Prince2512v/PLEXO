import React, { useEffect, useRef, useMemo } from 'react';
import { MicroserviceNodeData, RoutedRequest } from '../types';

interface RequestFlowVisualizerProps {
  nodes: MicroserviceNodeData[];
  recentRouted: RoutedRequest[];
  isRunning: boolean;
}

interface AnimatedDot {
  id: string;
  nodeId: string;
  progress: number;
  startTime: number;
}

export const RequestFlowVisualizer: React.FC<RequestFlowVisualizerProps> = ({
  nodes, recentRouted, isRunning
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dotsRef = useRef<AnimatedDot[]>([]);
  const lastRoutedRef = useRef<RoutedRequest[]>([]);

  useEffect(() => {
    if (!isRunning) return;
    const newItems = recentRouted.filter(
      r => !lastRoutedRef.current.some(lr => lr.requestId === r.requestId)
    );
    lastRoutedRef.current = recentRouted;

    for (const item of newItems) {
      dotsRef.current.push({
        id: item.requestId,
        nodeId: item.nodeId,
        progress: 0,
        startTime: Date.now(),
      });
    }

    if (dotsRef.current.length > 50) {
      dotsRef.current = dotsRef.current.slice(-50);
    }
  }, [recentRouted, isRunning]);

  const nodePositions = useMemo(() => {
    const total = nodes.length;
    return nodes.reduce<Record<string, { x: number; y: number }>>((acc, node, i) => {
      const angle = (i / total) * Math.PI - Math.PI / 2;
      acc[node.id] = {
        x: 0.5 + 0.35 * Math.cos(angle),
        y: 0.5 + 0.35 * Math.sin(angle),
      };
      return acc;
    }, {});
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const now = Date.now();
      const DOT_DURATION = 600;

      // Positions
      const lbX = W * 0.15;
      const lbY = H * 0.5;
      const clientX = W * 0.03;
      const clientY = H * 0.5;

      // Draw Client -> LB link
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(clientX + 14, clientY);
      ctx.lineTo(lbX - 20, lbY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw LB -> Worker Nodes links
      for (const node of nodes) {
        const pos = nodePositions[node.id];
        if (!pos) continue;
        const nx = pos.x * W;
        const ny = pos.y * H;

        ctx.beginPath();
        if (node.status === 'FAILED') {
          ctx.strokeStyle = 'rgba(244,63,94,0.2)';
          ctx.setLineDash([3, 6]);
        } else {
          ctx.strokeStyle = 'rgba(99,102,241,0.25)';
          ctx.setLineDash([]);
        }
        ctx.lineWidth = 1.2;
        ctx.moveTo(lbX + 20, lbY);
        ctx.lineTo(nx - 20, ny);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Animate flowing particle dots
      dotsRef.current = dotsRef.current.filter(dot => {
        const elapsed = now - dot.startTime;
        const t = Math.min(elapsed / DOT_DURATION, 1);
        dot.progress = t;

        const pos = nodePositions[dot.nodeId];
        if (!pos) return false;

        const nx = pos.x * W;
        const ny = pos.y * H;

        const startX = lbX + 20;
        const startY = lbY;
        const endX = nx - 20;
        const endY = ny;
        const cpX = (startX + endX) / 2;
        const cpY = (startY + endY) / 2 - 20;

        const bx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cpX + t * t * endX;
        const by = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cpY + t * t * endY;

        ctx.beginPath();
        const alpha = 1 - t;
        ctx.fillStyle = `rgba(6,182,212,${alpha * 0.95})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(6,182,212,0.9)';
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        return t < 1;
      });

      // Draw Client Box
      drawBox(ctx, clientX - 2, clientY - 14, 28, 28, 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.15)');
      ctx.fillStyle = '#f4f4f5';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CLI', clientX + 12, clientY + 3);

      // Draw LB Box
      drawBox(ctx, lbX - 20, lbY - 22, 40, 44, 'rgba(99,102,241,0.15)', 'rgba(99,102,241,0.5)');
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PLEXO', lbX, lbY - 4);
      ctx.font = '6.5px monospace';
      ctx.fillStyle = '#a5b4fc';
      ctx.fillText('BALANCER', lbX, lbY + 7);

      // Draw Nodes
      for (const node of nodes) {
        const pos = nodePositions[node.id];
        if (!pos) continue;
        const nx = pos.x * W;
        const ny = pos.y * H;

        const failed = node.status === 'FAILED';
        const degraded = node.status === 'DEGRADED';
        const borderColor = failed ? 'rgba(244,63,94,0.5)' : degraded ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)';
        const bgColor = failed ? 'rgba(244,63,94,0.1)' : degraded ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';

        drawBox(ctx, nx - 26, ny - 18, 52, 36, bgColor, borderColor);

        ctx.fillStyle = failed ? '#fda4af' : degraded ? '#fde68a' : '#a7f3d0';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, nx, ny - 3);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '7.5px monospace';
        ctx.fillText(failed ? 'OFFLINE' : `${node.activeConnections} conns`, nx, ny + 9);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, nodePositions]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    observer.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => observer.disconnect();
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
          Live Request Dispatch & Routing Flow
        </h3>
        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-cyan inline-block shadow-sm shadow-accent-cyan" />
            Dispatch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400" />
            Online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500" />
            Failed
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: '220px', display: 'block' }}
      />
    </div>
  );
};

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  bg: string, border: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}
