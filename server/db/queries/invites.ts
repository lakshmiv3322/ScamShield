// server/db/queries/invites.ts
import { getDb } from '../client.js';

export interface DbInvite {
  id: string;
  family_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  redeemed_by?: string;
  redeemed_at?: string;
  created_at: string;
}

export function createInvite(invite: {
  id: string;
  familyId: string;
  token: string;
  createdBy: string;
  expiresAt: string;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO invites (id, family_id, token, created_by, expires_at, created_at)
    VALUES (@id, @familyId, @token, @createdBy, @expiresAt, datetime('now'))
  `);

  stmt.run({
    id: invite.id,
    familyId: invite.familyId,
    token: invite.token,
    createdBy: invite.createdBy,
    expiresAt: invite.expiresAt,
  });
}

export function getInviteByToken(token: string): DbInvite | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM invites WHERE token = ?');
  return (stmt.get(token) as DbInvite) || null;
}

export function redeemInvite(token: string, redeemedBy: string) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE invites 
    SET redeemed_by = ?, redeemed_at = datetime('now')
    WHERE token = ?
  `);
  stmt.run(redeemedBy, token);
}
