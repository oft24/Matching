import express from 'express';
import cors from 'cors';
import matchmakingRoutes from './routes/matchmaking.js';
import playersRoutes from './routes/players.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import queueRoutes from './routes/queue.js';
import connectionsRoutes from './routes/connections.js';
import matchChatRoutes from './routes/matchChat.js';
import friendsRoutes from './routes/friends.js';
import conversationsRoutes from './routes/conversations.js';
import { checkDatabaseHealth } from './config/database.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const db = await checkDatabaseHealth();
  res.status(db.ok ? 200 : 503).json({
    status: db.ok ? 'ok' : 'degraded',
    service: 'q2play-api',
    database: db.ok ? 'connected' : db.error,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/matches', matchChatRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/dashboard', dashboardRoutes);

export default app;
