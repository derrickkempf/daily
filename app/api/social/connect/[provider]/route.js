// GET /api/social/connect/[provider] → redirect to OAuth provider.
// Stores any provider-specific state (e.g. PKCE verifier for X) in a
// short-lived signed cookie so the callback can recover it.
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/admin'
import { getProvider } from '@/lib/social'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const TEN_MIN = 10 * 60

function sign(o) {
  const enc = Buffer.from(JSON.stringify(o)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(enc).digest('base64url')
  return `${enc}.${sig}`
}

export async function GET(_req, { params }) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { provider: pid } = await params
  const provider = getProvider(pid)
  if (!provider) return NextResponse.json({ error: 'Unknown provider' }, { status: 404 })
  if (!provider.credsOk()) {
    return NextResponse.json({
      error: `${provider.label} client credentials are not configured. See .env.example.`,
    }, { status: 400 })
  }

  const state = crypto.randomBytes(16).toString('base64url')
  const result = provider.getAuthUrl(state)

  const c = await cookies()
  c.set(`oauth-${pid}`, sign({ state, verifier: result.verifier || null }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TEN_MIN,
  })

  return NextResponse.redirect(result.url)
}
