// server/db/queries/auth.ts
import { getDb } from '../client.js';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone?: string;
  role: string;
  relation?: string;
  avatar_url?: string;
  elder_mode_enabled: number;
  created_at: string;
}

export function createUser(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role?: string;
  relation?: string;
  avatarUrl?: string;
  elderModeEnabled?: boolean;
}): DbUser {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, relation, avatar_url, elder_mode_enabled, created_at)
    VALUES (@id, @name, @email, @passwordHash, @phone, @role, @relation, @avatarUrl, @elderModeEnabled, datetime('now'))
  `);

  stmt.run({
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase().trim(),
    passwordHash: user.passwordHash,
    phone: user.phone || null,
    role: user.role || 'admin',
    relation: user.relation || null,
    avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
    elderModeEnabled: user.elderModeEnabled ? 1 : 0,
  });

  return getUserById(user.id)!;
}

export function getUserByEmail(email: string): DbUser | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return (stmt.get(email.toLowerCase().trim()) as DbUser) || null;
}

export function getUserById(id: string): DbUser | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return (stmt.get(id) as DbUser) || null;
}

export function updateUserElderMode(id: string, enabled: boolean): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE users SET elder_mode_enabled = ? WHERE id = ?');
  stmt.run(enabled ? 1 : 0, id);
}
