// ═══════════════════════════════════════════════════════
// STORAGE — Postgres-backed key/value for daily + feed,
// Vercel Blob (production) or local filesystem (dev) for media.
//
// API is unchanged from the JSON-file version:
//   readJSON(key, fallback)
//   writeJSON(key, value)
//   saveUpload(buffer, filename) → returns public URL
//
// Schema:
//   kv_store(key TEXT PK, value JSONB, updated_at TIMESTAMPTZ)
//   Run `npm run db:setup` to create it.
//
// Env:
//   POSTGRES_URL              — required
//   BLOB_READ_WRITE_TOKEN     — set in production (Vercel Blob)
//                               unset in dev → falls back to public/uploads/feed
// ═══════════════════════════════════════════════════════
import { promises as fs } from 'fs'
import path from 'path'
import { query } from './db.js'

const TABLE = 'kv_store'

export async function readJSON(key, fallback) {
  try {
    const rows = await query(
      `SELECT value FROM ${TABLE} WHERE key = $1 LIMIT 1`,
      [key]
    )
    if (!rows.length) return fallback
    return rows[0].value
  } catch (err) {
    // Soft-fail: return fallback so a DB hiccup doesn't 500 a public page.
    // Common cases:
    //   42P01  → kv_store table missing (run `npm run db:setup`)
    //   ECONNREFUSED → Postgres unreachable
    if (err.code === '42P01') {
      console.warn(`[storage] ${TABLE} table missing — run \`npm run db:setup\``)
    } else {
      console.error(`[storage] readJSON("${key}") failed:`, err.message)
    }
    return fallback
  }
}

export async function writeJSON(key, value) {
  await query(
    `INSERT INTO ${TABLE} (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  )
}

export async function saveUpload(buffer, filename) {
  const safe = String(filename || 'upload').replace(/[^a-z0-9.\-_]/gi, '_')
  const stamped = `${Date.now()}-${safe}`

  // Production path: Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`feed/${stamped}`, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: detectContentType(safe),
    })
    return blob.url
  }

  // Dev path: local filesystem
  const dir = path.join(process.cwd(), 'public', 'uploads', 'feed')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, stamped), buffer)
  return `/uploads/feed/${stamped}`
}

function detectContentType(name) {
  const ext = name.toLowerCase().split('.').pop()
  return ({
    png:  'image/png',
    jpg:  'image/jpeg', jpeg: 'image/jpeg',
    gif:  'image/gif',
    webp: 'image/webp',
    svg:  'image/svg+xml',
    mp4:  'video/mp4',
    mov:  'video/quicktime',
    webm: 'video/webm',
  })[ext] || 'application/octet-stream'
}
