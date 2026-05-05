// ═══════════════════════════════════════════════════════
// DATABASE — thin Postgres wrapper for serverless (Vercel).
//
// Uses the same POSTGRES_URL env var as db-setup.mjs.
// Exports a single `query(text, params)` that returns rows.
// Auto-creates tables on first use if they don't exist.
// ═══════════════════════════════════════════════════════
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10_000,
})

// Auto-migration: runs once per cold start
let migrated = false
async function ensureTables() {
  if (migrated) return
  migrated = true
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key         TEXT PRIMARY KEY,
        value       JSONB NOT NULL,
        updated_at  TIMESTAMPTZ DEFAULT now()
      );
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
      CREATE INDEX IF NOT EXISTS idx_verification_codes_email
        ON verification_codes (email, used, expires_at);
    `)
    console.log('[db] tables ensured')
  } catch (err) {
    console.error('[db] auto-migration failed:', err.message)
    migrated = false  // retry next time
  }
}

/**
 * Run a SQL query and return the result rows.
 * @param {string} text  SQL with $1, $2… placeholders
 * @param {any[]}  params  values for the placeholders
 * @returns {Promise<object[]>}
 */
export async function query(text, params = []) {
  await ensureTables()
  const { rows } = await pool.query(text, params)
  return rows
}
