// server/routes/auth.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createUser, getUserByEmail, getUserById, updateUserElderMode } from '../db/queries/auth.js';
import { createFamily, getFamilyById, addFamilyMember, getMemberByUserId } from '../db/queries/family.js';
import { registerRateLimit, loginRateLimit } from '../middleware/rateLimiter.js';
import { validateRegisterBody, validateLoginBody } from '../middleware/sanitize.js';

export const authRouter = Router();

function generateCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SHIELD-${num}`;
}

// POST /api/auth/register
authRouter.post('/register', registerRateLimit, async (req, res) => {
  try {
    const { errors, cleaned } = validateRegisterBody(req.body);
    if (errors.length > 0) {
      res.status(400).json({ error: errors[0].message, details: errors });
      return;
    }

    const { name, email, password, phone, circleName, relation } = cleaned;

    const existing = getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `usr_${crypto.randomBytes(6).toString('hex')}`;
    const familyId = `fam_${crypto.randomBytes(6).toString('hex')}`;
    const memberId = `mem_${crypto.randomBytes(6).toString('hex')}`;

    const dbUser = createUser({
      id: userId,
      name: name.trim(),
      email: email.trim(),
      passwordHash,
      phone: phone?.trim() || undefined,
      role: 'admin',
      relation: relation || 'Guardian (Admin)',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      elderModeEnabled: false,
    });

    const dbFamily = createFamily({
      id: familyId,
      name: circleName?.trim() || `${name}'s Family Circle`,
      code: generateCode(),
      adminUserId: userId,
      elderModeDefault: false,
    });

    const dbMember = addFamilyMember({
      id: memberId,
      familyId: dbFamily.id,
      userId: dbUser.id,
      name: dbUser.name,
      relation: relation || 'Self (Admin)',
      role: 'admin',
      avatarUrl: dbUser.avatar_url,
      phone: dbUser.phone,
      receiveAlerts: true,
      threatStatus: 'protected',
    });

    req.session.userId = dbUser.id;

    res.status(201).json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        relation: dbUser.relation,
        avatarUrl: dbUser.avatar_url,
        elderModeEnabled: Boolean(dbUser.elder_mode_enabled),
        createdAt: dbUser.created_at,
      },
      family: {
        id: dbFamily.id,
        name: dbFamily.name,
        code: dbFamily.code,
        adminUserId: dbFamily.admin_user_id,
        elderModeDefault: Boolean(dbFamily.elder_mode_default),
        createdAt: dbFamily.created_at,
      },
      member: {
        id: dbMember.id,
        familyId: dbMember.family_id,
        userId: dbMember.user_id,
        name: dbMember.name,
        relation: dbMember.relation,
        role: dbMember.role,
        avatarUrl: dbMember.avatar_url,
        phone: dbMember.phone,
        receiveAlerts: Boolean(dbMember.receive_alerts),
        messagesAnalyzedThisWeek: dbMember.messages_analyzed_this_week,
        threatStatus: dbMember.threat_status,
        joinedAt: dbMember.joined_at,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account.', details: err.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { errors, cleaned } = validateLoginBody(req.body);
    if (errors.length > 0) {
      res.status(400).json({ error: errors[0].message, details: errors });
      return;
    }

    const { email, password } = cleaned;

    const dbUser = getUserByEmail(email);
    if (!dbUser) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const valid = await bcrypt.compare(password, dbUser.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const member = getMemberByUserId(dbUser.id);
    const dbFamily = member ? getFamilyById(member.family_id) : null;

    req.session.userId = dbUser.id;

    res.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        relation: dbUser.relation,
        avatarUrl: dbUser.avatar_url,
        elderModeEnabled: Boolean(dbUser.elder_mode_enabled),
        createdAt: dbUser.created_at,
      },
      family: dbFamily ? {
        id: dbFamily.id,
        name: dbFamily.name,
        code: dbFamily.code,
        adminUserId: dbFamily.admin_user_id,
        elderModeDefault: Boolean(dbFamily.elder_mode_default),
        createdAt: dbFamily.created_at,
      } : null,
      member: member ? {
        id: member.id,
        familyId: member.family_id,
        userId: member.user_id,
        name: member.name,
        relation: member.relation,
        role: member.role,
        avatarUrl: member.avatar_url,
        phone: member.phone,
        receiveAlerts: Boolean(member.receive_alerts),
        messagesAnalyzedThisWeek: member.messages_analyzed_this_week,
        threatStatus: member.threat_status,
        joinedAt: member.joined_at,
      } : null,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.', details: err.message });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed.' });
      return;
    }
    res.clearCookie('scamshield_sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me
authRouter.get('/me', (req, res) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const dbUser = getUserById(userId);
  if (!dbUser) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Session invalid' });
    return;
  }

  const member = getMemberByUserId(dbUser.id);
  const dbFamily = member ? getFamilyById(member.family_id) : null;

  res.json({
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      relation: dbUser.relation,
      avatarUrl: dbUser.avatar_url,
      elderModeEnabled: Boolean(dbUser.elder_mode_enabled),
      createdAt: dbUser.created_at,
    },
    family: dbFamily ? {
      id: dbFamily.id,
      name: dbFamily.name,
      code: dbFamily.code,
      adminUserId: dbFamily.admin_user_id,
      elderModeDefault: Boolean(dbFamily.elder_mode_default),
      createdAt: dbFamily.created_at,
    } : null,
    member: member ? {
      id: member.id,
      familyId: member.family_id,
      userId: member.user_id,
      name: member.name,
      relation: member.relation,
      role: member.role,
      avatarUrl: member.avatar_url,
      phone: member.phone,
      receiveAlerts: Boolean(member.receive_alerts),
      messagesAnalyzedThisWeek: member.messages_analyzed_this_week,
      threatStatus: member.threat_status,
      joinedAt: member.joined_at,
    } : null,
  });
});

// PATCH /api/auth/elder-mode
authRouter.patch('/elder-mode', (req, res) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }
  const { enabled } = req.body;
  updateUserElderMode(userId, Boolean(enabled));
  res.json({ success: true, elderModeEnabled: Boolean(enabled) });
});
