import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { joinQueue, leaveQueue, getQueueStatus, respondToMatch, expireStaleMatches } from '../services/queueService.js';

const router = Router();

router.use(requireAuth);

router.post('/join', async (req, res) => {
  try {
    const { game, filters } = req.body;
    if (!game || !filters) {
      return res.status(400).json({ error: 'Juego y filtros son obligatorios' });
    }
    await expireStaleMatches();
    const result = await joinQueue(req.user.id, game, filters);
    const status = await getQueueStatus(req.user.id);
    res.json({ ...result, ...status });
  } catch (err) {
    console.error('Queue join error:', err);
    res.status(500).json({ error: 'Error al unirse a la cola' });
  }
});

router.delete('/leave', async (req, res) => {
  try {
    await leaveQueue(req.user.id);
    res.json({ status: 'idle' });
  } catch (err) {
    res.status(500).json({ error: 'Error al salir de la cola' });
  }
});

router.get('/status', async (req, res) => {
  try {
    await expireStaleMatches();
    const status = await getQueueStatus(req.user.id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar estado' });
  }
});

router.post('/matches/:id/accept', async (req, res) => {
  try {
    const result = await respondToMatch(req.user.id, req.params.id, 'accept');
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al aceptar' });
  }
});

router.post('/matches/:id/reject', async (req, res) => {
  try {
    const result = await respondToMatch(req.user.id, req.params.id, 'reject');
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al rechazar' });
  }
});

export default router;
