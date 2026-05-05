// POST /api/syndicate  { post, platforms: string[] }
// Handles cross-posting to social platforms.
// Each platform needs its API keys set in .env.local.
// See DEPLOY.md for setup instructions.
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function POST(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { post, platforms } = await request.json().catch(() => ({}))
  if (!post || !Array.isArray(platforms)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const results = {}

  for (const platform of platforms) {
    try {
      switch (platform) {
        case 'x':
          results.x = await postToX(post)
          break
        case 'instagram':
          results.instagram = await postToInstagram(post)
          break
        case 'linkedin':
          results.linkedin = await postToLinkedIn(post)
          break
        case 'pinterest':
          results.pinterest = await postToPinterest(post)
          break
        default:
          results[platform] = { status: 'unsupported' }
      }
    } catch (err) {
      results[platform] = { status: 'error', message: err.message }
    }
  }

  return NextResponse.json({ results })
}

// ─── X / Twitter ───────────────────────────────────────────────────────────
async function postToX(post) {
  const token = process.env.X_BEARER_TOKEN
  const key = process.env.X_API_KEY
  const secret = process.env.X_API_SECRET
  const accessToken = process.env.X_ACCESS_TOKEN
  const accessSecret = process.env.X_ACCESS_TOKEN_SECRET

  if (!token && !accessToken) {
    return { status: 'skipped', reason: 'X_ACCESS_TOKEN not configured' }
  }

  const text = [post.title, post.body].filter(Boolean).join('\n\n').slice(0, 280)

  // Uses Twitter API v2
  const resp = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`X API error: ${err}`)
  }

  const data = await resp.json()
  return { status: 'ok', id: data.data?.id }
}

// ─── Instagram ──────────────────────────────────────────────────────────────
// Requires a Facebook Page linked to an Instagram Business/Creator account.
// Set IG_ACCESS_TOKEN and IG_USER_ID in .env.local.
async function postToInstagram(post) {
  const token = process.env.IG_ACCESS_TOKEN
  const userId = process.env.IG_USER_ID

  if (!token || !userId) {
    return { status: 'skipped', reason: 'IG_ACCESS_TOKEN / IG_USER_ID not configured' }
  }

  if (!post.mediaUrl) {
    return { status: 'skipped', reason: 'Instagram requires an image or video' }
  }

  const caption = [post.title, post.body].filter(Boolean).join('\n\n').slice(0, 2200)

  // Step 1: Create media container
  const containerResp = await fetch(
    `https://graph.facebook.com/v19.0/${userId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: post.mediaUrl,
        caption,
        access_token: token,
      }),
    }
  )
  const container = await containerResp.json()
  if (!container.id) throw new Error('IG container creation failed')

  // Step 2: Publish
  const pubResp = await fetch(
    `https://graph.facebook.com/v19.0/${userId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id, access_token: token }),
    }
  )
  const pub = await pubResp.json()
  return { status: 'ok', id: pub.id }
}

// ─── LinkedIn ───────────────────────────────────────────────────────────────
async function postToLinkedIn(post) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN
  const urn = process.env.LINKEDIN_PERSON_URN // e.g. urn:li:person:XXXXXXX

  if (!token || !urn) {
    return { status: 'skipped', reason: 'LINKEDIN_ACCESS_TOKEN / LINKEDIN_PERSON_URN not configured' }
  }

  const text = [post.title, post.body].filter(Boolean).join('\n\n').slice(0, 3000)

  const body = {
    author: urn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }

  const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) throw new Error(`LinkedIn error: ${await resp.text()}`)
  return { status: 'ok' }
}

// ─── Pinterest ──────────────────────────────────────────────────────────────
async function postToPinterest(post) {
  const token = process.env.PINTEREST_ACCESS_TOKEN
  const boardId = process.env.PINTEREST_BOARD_ID

  if (!token || !boardId) {
    return { status: 'skipped', reason: 'PINTEREST_ACCESS_TOKEN / PINTEREST_BOARD_ID not configured' }
  }

  const resp = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      board_id: boardId,
      title: post.title || '',
      description: post.body || '',
      media_source: post.mediaUrl
        ? { source_type: 'image_url', url: post.mediaUrl }
        : undefined,
    }),
  })

  if (!resp.ok) throw new Error(`Pinterest error: ${await resp.text()}`)
  const data = await resp.json()
  return { status: 'ok', id: data.id }
}
