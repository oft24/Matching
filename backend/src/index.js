import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import matchmakingRoutes from './routes/matchmaking.js';
import playersRoutes from './routes/players.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import queueRoutes from './routes/queue.js';
import connectionsRoutes from './routes/connections.js';
import { connectDatabase, checkDatabaseHealth } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const db = await checkDatabaseHealth();
  res.status(db.ok ? 200 : 503).json({
    status: db.ok ? 'ok' : 'degraded',
    service: 'matching-api',
    database: db.ok ? 'connected' : db.error,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/dashboard', dashboardRoutes);

async function start() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Matching API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
