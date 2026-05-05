// X (Twitter) — OAuth 2.0 PKCE + v2 tweets
// Docs: https://developer.x.com/en/docs/authentication/oauth-2-0
// Note: posting tweets via API requires at minimum the Free tier ($0/mo
// allows ~500 posts/mo as of 2025-Q4). Confirm before relying on this.
import crypto from 'crypto'
import { siteUrl, postUrl } from './index.js'

export const id = 'x'
export const label = 'X'
export const approvalRequired = false
export const supports = ['text', 'image', 'video']

export function credsOk() {
  return !!(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET)
}

const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']

export function redirectUri() {
  return `${siteUrl().replace(/\/$/, '')}/api/social/callback/x`
}

export function getAuthUrl(state) {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.X_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  return {
    url: `https://x.com/i/oauth2/authorize?${params}`,
    verifier,                                // caller must persist for callback
  }
}

export async function exchangeCode({ code, verifier }) {
  const auth = Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  })
  const r = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body,
  })
  if (!r.ok) throw new Error(`X token exchange failed: ${await r.text()}`)
  const t = await r.json()
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token || null,
    expires_at: t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null,
    meta: { scope: t.scope },
  }
}

export async function publish(account, post) {
  // For v1 we tweet caption + link to the timeline post. Image upload via X
  // requires the v1.1 media endpoint (different auth flavor) — kept out of v1.
  const body = {
    text: composeText(post),
  }
  const r = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${account.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`X publish failed: ${await r.text()}`)
  const j = await r.json()
  const tweetId = j.data?.id
  return {
    external_url: tweetId ? `https://x.com/i/web/status/${tweetId}` : null,
  }
}

function composeText(post) {
  const link = postUrl(post.id)
  const cap = (post.caption || '').slice(0, 240)
  return cap ? `${cap}\n\n${link}` : link
}
