// LinkedIn — OAuth 2.0 + UGC Post API
// Setup: https://www.linkedin.com/developers/apps
// Required products: "Sign In with LinkedIn using OpenID Connect" + "Share on LinkedIn"
import { siteUrl, postUrl } from './index.js'

export const id = 'linkedin'
export const label = 'LinkedIn'
export const approvalRequired = false
export const supports = ['text', 'image', 'video']

export function credsOk() {
  return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
}

const SCOPES = ['openid', 'profile', 'w_member_social']

export function redirectUri() {
  return `${siteUrl().replace(/\/$/, '')}/api/social/callback/linkedin`
}

export function getAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: SCOPES.join(' '),
    state,
  })
  return { url: `https://www.linkedin.com/oauth/v2/authorization?${params}` }
}

export async function exchangeCode({ code }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
  })
  const r = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error(`LinkedIn token exchange failed: ${await r.text()}`)
  const t = await r.json()

  // We need the member URN for posting — fetch userinfo with the token.
  const u = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${t.access_token}` },
  })
  const profile = u.ok ? await u.json() : {}

  return {
    access_token: t.access_token,
    expires_at: t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null,
    meta: { sub: profile.sub, name: profile.name },
  }
}

export async function publish(account, post) {
  const sub = account.meta?.sub
  if (!sub) throw new Error('Missing LinkedIn member URN — re-connect to refresh')

  const body = {
    author: `urn:li:person:${sub}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: composeText(post) },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }
  const r = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`LinkedIn publish failed: ${await r.text()}`)
  const headerId = r.headers.get('x-restli-id')
  return {
    external_url: headerId ? `https://www.linkedin.com/feed/update/${headerId}/` : null,
  }
}

function composeText(post) {
  const link = postUrl(post.id)
  const cap = (post.caption || '').trim()
  return cap ? `${cap}\n\n${link}` : `New work on the timeline → ${link}`
}
