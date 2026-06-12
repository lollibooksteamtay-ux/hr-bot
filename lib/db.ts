import { createClient, type Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const g = global as typeof global & { _db?: Client; _dbReady?: boolean };

const client: Client = g._db ?? (g._db = createClient({
  url: `file:${DATA_DIR}/recruit.db`,
}));

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    requirements TEXT DEFAULT '',
    location TEXT DEFAULT '',
    salary TEXT DEFAULT '',
    company TEXT DEFAULT '',
    contact TEXT DEFAULT '',
    fb_post_id TEXT,
    fb_group_content TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    cover_letter TEXT DEFAULT '',
    cv_path TEXT,
    cv_filename TEXT,
    cv_text TEXT,
    cv_score INTEGER,
    cv_summary TEXT,
    cv_strengths TEXT,
    cv_weaknesses TEXT,
    cv_recommendation TEXT,
    status TEXT DEFAULT 'received',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export async function getDb(): Promise<Client> {
  if (!g._dbReady) {
    await client.executeMultiple(SCHEMA);
    g._dbReady = true;
  }
  return client;
}

export { UPLOADS_DIR as UPLOADS_DIR_PATH };
