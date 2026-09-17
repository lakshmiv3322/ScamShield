// server/routes/invites.ts
import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/requireAuth.js';
import { createInvite, getInviteByToken, redeemInvite } from '../db/queries/invites.js';
import { getFamilyById, addFamilyMember } from '../db/queries/family.js';
import { inviteRateLimit } from '../middleware/rateLimiter.js';
import { sanitizeString } from '../middleware/sanitize.js';

export const invitesRouter = Router();

// POST /api/invites/generate (Requires authentication)
invitesRouter.post('/generate', requireAuth, inviteRateLimit, (req, res) => {
  const familyId = req.familyId!;
  const token = crypto.randomBytes(8).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  createInvite({
    id: `inv_${Date.now()}`,
    familyId,
    token,
    createdBy: req.user!.id,
    expiresAt,
  });

  const family = getFamilyById(familyId);

  res.json({
    token,
    expiresAt,
    code: family?.code || '',
    invitePath: `/join/${token}`,
  });
});

// GET /api/invites/:token (Public - token validation)
invitesRouter.get('/:token', (req, res) => {
  const invite = getInviteByToken(req.params.token);
  if (!invite) {
    res.status(404).json({ error: 'Invite link is invalid or has expired.' });
    return;
  }

  if (new Date(invite.expires_at) < new Date()) {
    res.status(410).json({ error: 'This invite link has expired. Please request a new one.' });
    return;
  }

  const family = getFamilyById(invite.family_id);
  if (!family) {
    res.status(404).json({ error: 'Family circle no longer exists.' });
    return;
  }

  res.json({
    valid: true,
    familyName: family.name,
    code: family.code,
    expiresAt: invite.expires_at,
  });
});

// POST /api/invites/:token/join (Authenticated user joining a family)
invitesRouter.post('/:token/join', requireAuth, (req, res) => {
  const invite = getInviteByToken(req.params.token);
  if (!invite) {
    res.status(404).json({ error: 'Invalid invite token.' });
    return;
  }

  if (new Date(invite.expires_at) < new Date()) {
    res.status(410).json({ error: 'Invite link has expired.' });
    return;
  }

  const rawRelation = typeof req.body?.relation === 'string' ? req.body.relation : '';
  const relation = sanitizeString(rawRelation, 50) || 'Family Member';
  const user = req.user!;

  const newMember = addFamilyMember({
    id: `mem_${Date.now()}`,
    familyId: invite.family_id,
    userId: user.id,
    name: user.name,
    relation: relation || 'Family Member',
    role: 'member',
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    receiveAlerts: true,
    threatStatus: 'protected',
  });

  redeemInvite(invite.token, user.id);

  const family = getFamilyById(invite.family_id);

  res.json({
    success: true,
    family,
    member: newMember,
  });
});
