// server/db/client.ts
// better-sqlite3 singleton — import this everywhere you need DB access.
// Swap DATABASE_PATH for an external Postgres driver in production via DATABASE_URL.

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'scamshield.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    // Enable WAL mode for better concurrent read performance
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}
