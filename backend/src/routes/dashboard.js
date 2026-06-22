import { Router } from 'express';
import { DASHBOARD } from '../data/mockData.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json({
    ...DASHBOARD,
    level: req.user.level,
    xp: req.user.xp,
    xpToNext: 100,
  });
});

export default router;
