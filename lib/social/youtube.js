// YouTube — Google OAuth 2.0 + YouTube Data API v3
// Setup: https://console.cloud.google.com → Enable YouTube Data API v3
//
// Notes:
//   - This handles VIDEO uploads only (the timeline's "video" kind).
//   - For image-only posts the job is skipped.
//   - Quota cost for `videos.insert` is high (1600 units) — the default
//     daily quota of 10k means ~6 uploads/day. Request a quota increase.
import { siteUrl, postUrl } from './index.js'

export const id = 'youtube'
export const label = 'YouTube'
export const approvalRequired = false   // OAuth works on personal accounts

export function credsOk() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

export function redirectUri() {
  return `${siteUrl().replace(/\/$/, '')}/api/social/callback/youtube`
}

export function getAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }
}

export async function exchangeCode({ code }) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri(),
    grant_type: 'authorization_code',
  })
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error(`Google token exchange failed: ${await r.text()}`)
  const t = await r.json()
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token || null,
    expires_at: t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null,
    meta: {},
  }
}

export async function publish(account, post) {
  if (post.kind !== 'video') throw new Error('YouTube requires a video post')
  if (!post.media_url) throw new Error('Missing video URL')

  // Stream the source video into the YouTube resumable upload endpoint.
  const meta = {
    snippet: {
      title: (post.caption || '').slice(0, 90) || 'New work',
      description: composeDescription(post),
    },
    status: { privacyStatus: 'public', madeForKids: false },
  }

  // Initiate resumable upload session
  const init = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/*',
      },
      body: JSON.stringify(meta),
    }
  )
  if (!init.ok) throw new Error(`YouTube init failed: ${await init.text()}`)
  const uploadUrl = init.headers.get('location')
  if (!uploadUrl) throw new Error('YouTube returned no upload URL')

  // Pull the source bytes
  const src = await fetch(post.media_url)
  if (!src.ok) throw new Error('Failed to fetch source video from blob storage')
  const buf = Buffer.from(await src.arrayBuffer())

  const up = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': src.headers.get('content-type') || 'video/mp4' },
    body: buf,
  })
  if (!up.ok) throw new Error(`YouTube upload failed: ${await up.text()}`)
  const j = await up.json()
  return { external_url: j.id ? `https://www.youtube.com/watch?v=${j.id}` : null }
}

function composeDescription(post) {
  const link = postUrl(post.id)
  const cap = (post.caption || '').trim()
  return cap ? `${cap}\n\n${link}` : link
}
