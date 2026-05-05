// Single-author admin gate (only you can post).
import crypto from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const COOKIE_NAME = 'tl-admin'
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
  try { return JSON.parse(Buffer.from(encoded, 'base64url').toString()) } catch { return null }
}

export function checkPassword(pw) {
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
  const c = await cookies()
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS / 1000,
    path: '/',
  })
}

export async function getAdminSession() {
  const c = await cookies()
  const cookie = c.get(COOKIE_NAME)
  if (!cookie) return null
  const session = verify(cookie.value)
  if (!session || session.role !== 'admin') return null
  return session
}

export async function destroyAdminSession() {
  const c = await cookies()
  c.delete(COOKIE_NAME)
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
