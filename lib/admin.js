// ═══════════════════════════════════════════════════════
// ADMIN AUTH — single password gate for /daily writes &
// /feed/admin posting. Cookie is HMAC-signed (same secret
// scheme as lib/auth.js).
// ═══════════════════════════════════════════════════════
import crypto from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const COOKIE_NAME = 'pd-admin'
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

function sign(payload) {
  const data = JSON.stringify(payload)
  const encoded = Buffer.from(data).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

function verify(token) {
  if (!token) return null
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null
  const expected = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url')
  if (sig !== expected) return null
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString())
  } catch {
    return null
  }
}

export function checkPassword(pw) {
  // Compares SHA-256(pw) to ADMIN_HASH — same convention used by /public/app.html
  // (the existing punks tracker). One password gates everything.
  const expected = process.env.ADMIN_HASH
  if (!expected || !pw) return false
  const hashed = crypto.createHash('sha256').update(String(pw)).digest('hex')
  const a = Buffer.from(hashed, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function createAdminSession() {
  const token = sign({ role: 'admin', iat: Date.now() })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',   // Required for cross-origin cookie (Cloudflare proxy → Vercel)
    maxAge: THIRTY_DAYS / 1000,
    path: '/',
  })
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const c = cookieStore.get(COOKIE_NAME)
  if (!c) return null
  const session = verify(c.value)
  if (!session || session.role !== 'admin') return null
  return session
}

export async function destroyAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function requireAdmin() {
  const s = await getAdminSession()
  if (!s) {
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }
  return s
}
