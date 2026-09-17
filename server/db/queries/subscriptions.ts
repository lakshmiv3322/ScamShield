// server/db/queries/subscriptions.ts
import { getDb } from '../client.js';

export interface DbPushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export function savePushSubscription(params: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
    VALUES (@id, @userId, @endpoint, @p256dh, @auth, datetime('now'))
    ON CONFLICT(endpoint) DO UPDATE SET
      user_id = excluded.user_id,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      created_at = datetime('now')
  `);

  stmt.run({
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    endpoint: params.endpoint,
    p256dh: params.p256dh,
    auth: params.auth,
  });
}

export function getPushSubscriptionsByUserId(userId: string): DbPushSubscription[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?');
  return stmt.all(userId) as DbPushSubscription[];
}

export function getPushSubscriptionsByUserIds(userIds: string[]): DbPushSubscription[] {
  if (!userIds || userIds.length === 0) return [];
  const db = getDb();
  const placeholders = userIds.map(() => '?').join(',');
  const stmt = db.prepare(`SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`);
  return stmt.all(...userIds) as DbPushSubscription[];
}

export function deletePushSubscription(endpoint: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?');
  stmt.run(endpoint);
}
