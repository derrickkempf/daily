// Instagram — Graph API (NOT the Basic Display API; that one cannot publish).
// Requires:
//   1. A Facebook Page connected to your IG Business/Creator account
//   2. A Meta App with the "Instagram Graph API" product
//   3. App Review approval for `instagram_content_publish` (multi-week)
//
// This module wires OAuth + publish() but real posting only works after
// Meta approves the app for content publishing. Until then, jobs are
// marked `skipped` with reason 'pending platform approval'.
import { siteUrl, postUrl } from './index.js'

export const id = 'instagram'
export const label = 'Instagram'
export const approvalRequired = true

export function credsOk() {
  return !!(process.env.META_CLIENT_ID && process.env.META_CLIENT_SECRET)
}

const SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_show_list',
  'business_management',
]

export function redirectUri() {
  return `${siteUrl().replace(/\/$/, '')}/api/social/callback/instagram`
}

export function getAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.META_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: SCOPES.join(','),
    state,
  })
  return { url: `https://www.facebook.com/v20.0/dialog/oauth?${params}` }
}

export async function exchangeCode({ code }) {
  const params = new URLSearchParams({
    client_id: process.env.META_CLIENT_ID,
    client_secret: process.env.META_CLIENT_SECRET,
    redirect_uri: redirectUri(),
    code,
  })
  const r = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?${params}`)
  if (!r.ok) throw new Error(`Meta token exchange failed: ${await r.text()}`)
  const t = await r.json()
  return {
    access_token: t.access_token,
    expires_at: t.expires_in ? new Date(Date.now() + t.expires_in * 1000) : null,
    // publish_approved is set manually once Meta App Review approves the app.
    meta: { publish_approved: false, ig_account_id: process.env.INSTAGRAM_ACCOUNT_ID || null },
  }
}

export async function publish(account, post) {
  if (post.kind !== 'image') throw new Error('Instagram (v1) requires an image')
  const igId = account.meta?.ig_account_id || process.env.INSTAGRAM_ACCOUNT_ID
  if (!igId) throw new Error('INSTAGRAM_ACCOUNT_ID not set')

  // Two-step: create container, then publish
  const create = await fetch(
    `https://graph.facebook.com/v20.0/${igId}/media?` + new URLSearchParams({
      image_url: post.media_url,
      caption: composeCaption(post),
      access_token: account.access_token,
    }),
    { method: 'POST' }
  )
  if (!create.ok) throw new Error(`IG container create failed: ${await create.text()}`)
  const { id: containerId } = await create.json()

  const pub = await fetch(
    `https://graph.facebook.com/v20.0/${igId}/media_publish?` + new URLSearchParams({
      creation_id: containerId,
      access_token: account.access_token,
    }),
    { method: 'POST' }
  )
  if (!pub.ok) throw new Error(`IG publish failed: ${await pub.text()}`)
  const { id: mediaId } = await pub.json()
  return { external_url: mediaId ? `https://www.instagram.com/p/${mediaId}/` : null }
}

function composeCaption(post) {
  const link = postUrl(post.id)
  const cap = (post.caption || '').slice(0, 2000)
  return cap ? `${cap}\n\n${link}` : link
}
