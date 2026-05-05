// GET /api/social/callback/[provider] — OAuth landing.
// Verifies signed state cookie, exchanges code, persists tokens, redirects.
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { getProvider, saveAccount } from '@/lib/social'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'

function verify(token) {
  if (!token) return null
  const [enc, sig] = token.split('.')
  if (!enc || !sig) return null
  const expected = crypto.createHmac('sha256', SECRET).update(enc).digest('base64url')
  if (sig !== expected) return null
  try { return JSON.parse(Buffer.from(enc, 'base64url').toString()) } catch { return null }
}

export async function GET(request, { params }) {
  const { provider: pid } = await params
  const provider = getProvider(pid)
  if (!provider) return NextResponse.json({ error: 'Unknown provider' }, { status: 404 })

  const url = new URL(request.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  if (error) return NextResponse.redirect(`${url.origin}/admin?social_error=${encodeURIComponent(error)}`)
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const c = await cookies()
  const stored = verify(c.get(`oauth-${pid}`)?.value)
  if (!stored || stored.state !== state) {
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 })
  }

  try {
    const tokens = await provider.exchangeCode({ code, verifier: stored.verifier })
    await saveAccount(pid, tokens)
  } catch (err) {
    console.error(`[social:${pid}] callback error:`, err.message)
    return NextResponse.redirect(`${url.origin}/admin?social_error=${encodeURIComponent(err.message)}`)
  }

  c.delete(`oauth-${pid}`)
  return NextResponse.redirect(`${url.origin}/admin?social_connected=${pid}`)
}
