// server/routes/alerts.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getAlertsByFamily, markAllAlertsRead } from '../db/queries/alerts.js';

export const alertsRouter = Router();

alertsRouter.use(requireAuth);

// GET /api/alerts
alertsRouter.get('/', (req, res) => {
  const familyId = req.familyId!;
  const alerts = getAlertsByFamily(familyId);
  res.json({ alerts });
});

// PATCH /api/alerts/read-all
alertsRouter.patch('/read-all', (req, res) => {
  const familyId = req.familyId!;
  markAllAlertsRead(familyId);
  res.json({ success: true });
});
