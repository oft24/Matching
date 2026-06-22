import { Router } from 'express';
import { PLAYERS } from '../data/mockData.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(PLAYERS);
});

router.get('/:id', (req, res) => {
  const player = PLAYERS.find((p) => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });
  res.json(player);
});

export default router;
