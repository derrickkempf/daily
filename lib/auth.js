// ═══════════════════════════════════════════════════════
// AUTH — HMAC-signed cookie sessions, no password
// Four functions. One file.
// ═══════════════════════════════════════════════════════
import crypto from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const COOKIE_NAME = 'pd-session'
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

// ── Sign / verify ──

function sign(payload) {
  const data = JSON.stringify(payload)
  const encoded = Buffer.from(data).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

function verify(token) {
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

// ── Public API ──

export async function createSession(email) {
  const token = sign({ email, iat: Date.now() })
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS / 1000,
    path: '/',
  })
  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie) return null
  return verify(cookie.value)
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export function generateCode() {
  return String(crypto.randomInt(100000, 999999))
}
