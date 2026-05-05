// TikTok — Content Posting API
// Setup: https://developers.tiktok.com/apps
//
// IMPORTANT: TikTok requires app review for the
// `video.publish` scope (or even `video.upload` to inbox).
// Until approval comes through, this provider is marked
// `approvalRequired` and jobs are skipped with reason
// 'pending platform approval'.
import { siteUrl, postUrl } from './index.js'

export const id = 'tiktok'
export const label = 'TikTok'
export const approvalRequired = true

export function credsOk() {
  return !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET)
}

const SCOPES = ['user.info.basic', 'video.upload']

export function redirectUri() {
  return `${siteUrl().replace(/\/$/, '')}/api/social/callback/tiktok`
}

export function getAuthUrl(state) {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    response_type: 'code',
    scope: SCOPES.join(','),
    redirect_uri: redirectUri(),
    state,
  })
  return { url: `https://www.tiktok.com/v2/auth/authorize/?${params}` }
}

export async function exchangeCode({ code }) {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri(),
  })
  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error(`TikTok token exchange failed: ${await r.text()}`)
  const t = await r.json()
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token || null,
    expires_at: t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null,
    meta: { open_id: t.open_id, publish_approved: false },
  }
}

export async function publish(account, post) {
  if (post.kind !== 'video') throw new Error('TikTok requires a video post')
  // Uses the inbox endpoint (URL-pull mode) — only available after
  // app review unlocks `video.publish`.
  const r = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: post.media_url,
      },
      post_info: { title: composeTitle(post) },
    }),
  })
  if (!r.ok) throw new Error(`TikTok publish failed: ${await r.text()}`)
  const j = await r.json()
  // TikTok returns a publish_id; the user has to finalize in the app.
  return { external_url: null, raw: j }
}

function composeTitle(post) {
  const link = postUrl(post.id)
  const cap = (post.caption || '').slice(0, 100)
  return cap ? `${cap} ${link}` : link
}
