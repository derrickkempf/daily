// Postgres pool + auto-migration. Single entry point: query(text, params).
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10_000,
})

let migrated = false
async function ensureTables() {
  if (migrated) return
  migrated = true
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        email       TEXT UNIQUE NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS verification_codes (
        id          SERIAL PRIMARY KEY,
        email       TEXT NOT NULL,
        code        TEXT NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        used        BOOLEAN DEFAULT false,
        created_at  TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_verif_email
        ON verification_codes (email, used, expires_at);

      CREATE TABLE IF NOT EXISTS posts (
        id          TEXT PRIMARY KEY,
        kind        TEXT NOT NULL,                  -- 'image' | 'video' | 'text'
        caption     TEXT DEFAULT '',
        media_url   TEXT,
        media_type  TEXT,
        width       INTEGER,
        height      INTEGER,
        created_at  TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_posts_created
        ON posts (created_at DESC);

      CREATE TABLE IF NOT EXISTS post_likes (
        post_id     TEXT REFERENCES posts(id) ON DELETE CASCADE,
        email       TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (post_id, email)
      );

      CREATE TABLE IF NOT EXISTS post_comments (
        id          SERIAL PRIMARY KEY,
        post_id     TEXT REFERENCES posts(id) ON DELETE CASCADE,
        email       TEXT NOT NULL,
        body        TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_comments_post
        ON post_comments (post_id, created_at);

      CREATE TABLE IF NOT EXISTS post_shares (
        id          SERIAL PRIMARY KEY,
        post_id     TEXT REFERENCES posts(id) ON DELETE CASCADE,
        email       TEXT,                           -- nullable: anon share
        target      TEXT,                           -- 'copy' | 'native' | 'x' | ...
        created_at  TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS social_accounts (
        provider    TEXT PRIMARY KEY,               -- 'x' | 'linkedin' | ...
        access_token  TEXT,
        refresh_token TEXT,
        expires_at    TIMESTAMPTZ,
        meta          JSONB DEFAULT '{}'::jsonb,
        connected_at  TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS post_crossposts (
        id          SERIAL PRIMARY KEY,
        post_id     TEXT REFERENCES posts(id) ON DELETE CASCADE,
        provider    TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed | skipped
        external_url TEXT,
        error       TEXT,
        created_at  TIMESTAMPTZ DEFAULT now(),
        updated_at  TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_xpost_post
        ON post_crossposts (post_id);
    `)
  } catch (err) {
    console.error('[db] auto-migration failed:', err.message)
    migrated = false
  }
}

export async function query(text, params = []) {
  await ensureTables()
  const { rows } = await pool.query(text, params)
  return rows
}
