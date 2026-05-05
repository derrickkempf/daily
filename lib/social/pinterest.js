// Pinterest — OAuth 2.0 + Pins v5
// Setup: https://developers.pinterest.com/apps/
import { siteUrl, postUrl } from './index.js'

export const id = 'pinterest'
export const label = 'Pinterest'
export const approvalRequired = false
export const supports = ['image']

export function credsOk() {
  return !!(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET)
}

const SCOPES = ['boards:read', 'pins:read', 'pins:write']

export function redirectUri() {
  return `${siteUrl().replace(/\/$/, '')}/api/social/callback/pinterest`
}

export function getAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.PINTEREST_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: SCOPES.join(','),
    state,
  })
  return { url: `https://www.pinterest.com/oauth/?${params}` }
}

export async function exchangeCode({ code }) {
  const auth = Buffer.from(
    `${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`
  ).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
  })
  const r = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  if (!r.ok) throw new Error(`Pinterest token exchange failed: ${await r.text()}`)
  const t = await r.json()
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token || null,
    expires_at: t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null,
    meta: { scope: t.scope },
  }
}

export async function publish(account, post) {
  if (post.kind !== 'image') throw new Error('Pinterest requires an image')
  const board = process.env.PINTEREST_BOARD_ID
  if (!board) throw new Error('PINTEREST_BOARD_ID env var not set')

  const body = {
    board_id: board,
    title: (post.caption || '').slice(0, 100) || 'New work',
    description: (post.caption || '').slice(0, 500),
    link: postUrl(post.id),
    media_source: {
      source_type: 'image_url',
      url: post.media_url,
    },
  }
  const r = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`Pinterest publish failed: ${await r.text()}`)
  const j = await r.json()
  return {
    external_url: j.id ? `https://www.pinterest.com/pin/${j.id}/` : null,
  }
}
