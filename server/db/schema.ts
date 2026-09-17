// server/db/schema.ts
// CREATE TABLE statements for all 7 tables.
// All columns mirror src/types.ts shapes.
// SQLite-compatible; use TEXT for JSON arrays, INTEGER for booleans.

import { getDb } from './client.js';

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      email               TEXT UNIQUE NOT NULL,
      password_hash       TEXT NOT NULL,
      phone               TEXT,
      role                TEXT NOT NULL DEFAULT 'admin',
      relation            TEXT,
      avatar_url          TEXT,
      elder_mode_enabled  INTEGER NOT NULL DEFAULT 0,
      created_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS families (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      code                TEXT UNIQUE NOT NULL,
      admin_user_id       TEXT NOT NULL,
      elder_mode_default  INTEGER NOT NULL DEFAULT 0,
      retention_days      INTEGER NOT NULL DEFAULT 90,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (admin_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id                          TEXT PRIMARY KEY,
      family_id                   TEXT NOT NULL,
      user_id                     TEXT NOT NULL,
      name                        TEXT NOT NULL,
      relation                    TEXT NOT NULL,
      role                        TEXT NOT NULL DEFAULT 'member',
      avatar_url                  TEXT,
      phone                       TEXT,
      receive_alerts              INTEGER NOT NULL DEFAULT 1,
      messages_analyzed_this_week INTEGER NOT NULL DEFAULT 0,
      threat_status               TEXT NOT NULL DEFAULT 'protected',
      joined_at                   TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (family_id) REFERENCES families(id),
      FOREIGN KEY (user_id)   REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id                    TEXT PRIMARY KEY,
      family_id             TEXT NOT NULL,
      sender_member_id      TEXT NOT NULL,
      sender_name           TEXT NOT NULL,
      sender_relation       TEXT NOT NULL,
      sender_contact        TEXT,
      original_text         TEXT,
      link_url              TEXT,
      screenshot_url        TEXT,
      content_source        TEXT NOT NULL DEFAULT 'whatsapp',
      content_sender_number TEXT,
      user_feedback         TEXT,
      status                TEXT NOT NULL DEFAULT 'analyzing',
      received_at           TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (family_id) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id                          TEXT PRIMARY KEY,
      message_id                  TEXT NOT NULL UNIQUE,
      risk_score                  INTEGER NOT NULL,
      risk_level                  TEXT NOT NULL,
      scam_type                   TEXT NOT NULL,
      scam_type_label             TEXT NOT NULL,
      plain_language_title        TEXT NOT NULL,
      explanation_bullets         TEXT NOT NULL DEFAULT '[]',
      plain_language_explanation  TEXT,
      safe_action_advice          TEXT NOT NULL DEFAULT '[]',
      actionable_advice           TEXT,
      family_cross_match_count    INTEGER NOT NULL DEFAULT 0,
      matched_pattern_name        TEXT NOT NULL DEFAULT '',
      ai_model_version            TEXT NOT NULL,
      confidence_score            REAL NOT NULL DEFAULT 0.75,
      created_at                  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id                        TEXT PRIMARY KEY,
      analysis_id               TEXT NOT NULL,
      message_id                TEXT NOT NULL,
      family_id                 TEXT NOT NULL,
      risk_level                TEXT NOT NULL,
      title                     TEXT NOT NULL,
      description               TEXT NOT NULL,
      affected_member_name      TEXT NOT NULL,
      affected_member_relation  TEXT NOT NULL,
      scam_type                 TEXT NOT NULL,
      timestamp                 TEXT NOT NULL DEFAULT (datetime('now')),
      is_read                   INTEGER NOT NULL DEFAULT 0,
      acknowledged_by           TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (family_id)  REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS invites (
      id           TEXT PRIMARY KEY,
      family_id    TEXT NOT NULL,
      token        TEXT UNIQUE NOT NULL,
      created_by   TEXT NOT NULL,
      expires_at   TEXT NOT NULL,
      redeemed_by  TEXT,
      redeemed_at  TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (family_id)  REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      endpoint    TEXT UNIQUE NOT NULL,
      p256dh      TEXT NOT NULL,
      auth        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_family   ON messages  (family_id, received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_family     ON alerts    (family_id, timestamp   DESC);
    CREATE INDEX IF NOT EXISTS idx_members_family    ON family_members (family_id);
    CREATE INDEX IF NOT EXISTS idx_members_user      ON family_members (user_id);
    CREATE INDEX IF NOT EXISTS idx_push_user         ON push_subscriptions (user_id);
  `);

  console.log('✅ Database schema initialized');
}
