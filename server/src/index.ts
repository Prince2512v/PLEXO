import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SimulationEngine } from './simulation/SimulationEngine';
import { setupSocketHandlers } from './websocket/SocketHandler';
import { createApiRouter } from './routes/api';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Permissive CORS for simulator demo
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ─── Socket.IO ───────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// ─── Simulation Engine ───────────────────────────────────────────
const engine = new SimulationEngine();

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api', createApiRouter(engine));

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// ─── WebSocket ───────────────────────────────────────────────────
setupSocketHandlers(io, engine);

// ─── Start ───────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Load Balancer Simulator Server`);
  console.log(`   Port:    ${PORT}`);
  console.log(`   API:     http://localhost:${PORT}/api`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   WS:      ws://localhost:${PORT}\n`);
});

export { engine, io };
