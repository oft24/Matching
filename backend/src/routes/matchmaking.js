import { Router } from 'express';
import { GAMES } from '../data/mockData.js';

const router = Router();

router.get('/games', (_req, res) => {
  res.json(GAMES);
});

router.post('/search', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
    const response = await fetch(`${pythonUrl}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error('Python service unavailable');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Matchmaking error:', error.message);
    res.status(503).json({ error: 'Servicio de matchmaking no disponible' });
  }
});

export default router;
