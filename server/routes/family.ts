// server/routes/family.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  getFamilyById,
  getFamilyMembers,
  updateMemberAlerts,
  getFamilyStats,
  updateFamilyRetention,
  cleanupFamilyRetention,
} from '../db/queries/family.js';

export const familyRouter = Router();

familyRouter.use(requireAuth);

// GET /api/family
familyRouter.get('/', (req, res) => {
  const familyId = req.familyId!;
  const dbFamily = getFamilyById(familyId);
  if (!dbFamily) {
    res.status(404).json({ error: 'Family not found.' });
    return;
  }

  const rawMembers = getFamilyMembers(familyId);
  const members = rawMembers.map((m) => ({
    id: m.id,
    familyId: m.family_id,
    userId: m.user_id,
    name: m.name,
    relation: m.relation,
    role: m.role as 'admin' | 'member' | 'viewer',
    avatarUrl: m.avatar_url,
    phone: m.phone || undefined,
    receiveAlerts: Boolean(m.receive_alerts),
    messagesAnalyzedThisWeek: m.messages_analyzed_this_week,
    threatStatus: m.threat_status as 'high_target' | 'moderate' | 'protected',
    joinedAt: m.joined_at,
  }));

  const stats = getFamilyStats(familyId);

  res.json({
    family: {
      id: dbFamily.id,
      name: dbFamily.name,
      code: dbFamily.code,
      adminUserId: dbFamily.admin_user_id,
      elderModeDefault: Boolean(dbFamily.elder_mode_default),
      retentionDays: dbFamily.retention_days || 90,
      createdAt: dbFamily.created_at,
    },
    members,
    stats,
  });
});

// GET /api/family/members
familyRouter.get('/members', (req, res) => {
  const familyId = req.familyId!;
  const rawMembers = getFamilyMembers(familyId);
  const members = rawMembers.map((m) => ({
    id: m.id,
    familyId: m.family_id,
    userId: m.user_id,
    name: m.name,
    relation: m.relation,
    role: m.role as 'admin' | 'member' | 'viewer',
    avatarUrl: m.avatar_url,
    phone: m.phone || undefined,
    receiveAlerts: Boolean(m.receive_alerts),
    messagesAnalyzedThisWeek: m.messages_analyzed_this_week,
    threatStatus: m.threat_status as 'high_target' | 'moderate' | 'protected',
    joinedAt: m.joined_at,
  }));

  res.json({ members });
});

// PATCH /api/family/members/:id/alerts
familyRouter.patch('/members/:id/alerts', (req, res) => {
  const familyId = req.familyId!;
  const memberId = req.params.id;
  const { receiveAlerts } = req.body;

  updateMemberAlerts(memberId, familyId, Boolean(receiveAlerts));
  res.json({ success: true, memberId, receiveAlerts: Boolean(receiveAlerts) });
});

// PATCH /api/family/retention — Update family data retention policy
familyRouter.patch('/retention', (req, res) => {
  const familyId = req.familyId!;
  const { retentionDays } = req.body;
  const days = parseInt(retentionDays, 10);
  if (isNaN(days) || days < 1) {
    res.status(400).json({ error: 'Valid retentionDays integer is required.' });
    return;
  }

  updateFamilyRetention(familyId, days);
  res.json({ success: true, retentionDays: days });
});

// POST /api/family/cleanup — Manually prune data older than retention_days
familyRouter.post('/cleanup', (req, res) => {
  const familyId = req.familyId!;
  const result = cleanupFamilyRetention(familyId);
  res.json({ success: true, ...result });
});

