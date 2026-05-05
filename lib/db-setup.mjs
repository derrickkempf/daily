import pg from 'pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    name          TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS verification_codes (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL,
    code          TEXT NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    used          BOOLEAN DEFAULT false,
    created_at    TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_verification_codes_email
    ON verification_codes (email, used, expires_at);

  CREATE TABLE IF NOT EXISTS kv_store (
    key           TEXT PRIMARY KEY,
    value         JSONB NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS post_likes (
    id            SERIAL PRIMARY KEY,
    post_id       TEXT NOT NULL,
    fingerprint   TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, fingerprint)
  );

  CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes (post_id);

  CREATE TABLE IF NOT EXISTS post_comments (
    id            SERIAL PRIMARY KEY,
    post_id       TEXT NOT NULL,
    name          TEXT NOT NULL DEFAULT 'Anonymous',
    body          TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments (post_id);
`

async function setup() {
  console.log('Setting up database...')
  await pool.query(schema)
  console.log('Done.')
  await pool.end()
}

setup().catch(err => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
