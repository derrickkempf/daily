// One-shot migration helper: `npm run db:setup`
import pg from 'pg'

const url = process.env.POSTGRES_URL
if (!url) {
  console.error('POSTGRES_URL is not set')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })

const sql = `
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
    kind        TEXT NOT NULL,
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
    email       TEXT,
    target      TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS social_accounts (
    provider    TEXT PRIMARY KEY,
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
    status      TEXT NOT NULL DEFAULT 'pending',
    external_url TEXT,
    error       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_xpost_post
    ON post_crossposts (post_id);
`

try {
  await pool.query(sql)
  console.log('✓ tables ready')
  await pool.end()
  process.exit(0)
} catch (err) {
  console.error('✗ migration failed:', err.message)
  process.exit(1)
}
