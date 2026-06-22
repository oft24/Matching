import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import matchmakingRoutes from './routes/matchmaking.js';
import playersRoutes from './routes/players.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'matching-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Matching API running on http://localhost:${PORT}`);
});
