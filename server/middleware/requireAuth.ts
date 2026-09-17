// server/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import { getUserById } from '../db/queries/auth.js';
import { getMemberByUserId } from '../db/queries/family.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
    return;
  }

  const dbUser = getUserById(userId);
  if (!dbUser) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Session invalid. Please log in again.' });
    return;
  }

  const member = getMemberByUserId(userId);
  if (!member) {
    res.status(403).json({ error: 'No family circle associated with this user.' });
    return;
  }

  req.user = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    elderModeEnabled: Boolean(dbUser.elder_mode_enabled),
    avatarUrl: dbUser.avatar_url,
    phone: dbUser.phone,
  };
  req.familyId = member.family_id;
  req.memberId = member.id;

  next();
}
