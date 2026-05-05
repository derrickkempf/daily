import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'
import { getSession } from '@/lib/auth'
import { enqueueCrosspost } from '@/lib/social'

export const dynamic = 'force-dynamic'

const VALID_KINDS = new Set(['image', 'video', 'text'])

function isOurMedia(url) {
  if (typeof url !== 'string') return false
  if (url.startsWith('/uploads/')) return true
  try {
    const u = new URL(url)
    return u.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch { return false }
}

// GET /api/posts → recent posts with counts and (if signed in) liked flag
export async function GET(request) {
  const url = new URL(request.url)
  const limit  = Math.min(parseInt(url.searchParams.get('limit')  || '50'), 200)
  const before = url.searchParams.get('before')

  const session = await getSession().catch(() => null)
  const email = session?.email || null

  const params = email ? [email] : []
  let where = ''
  if (before) {
    params.push(before)
    where = `WHERE p.created_at < $${params.length}::timestamptz`
  }
  params.push(limit)

  const rows = await query(
    `SELECT p.id, p.kind, p.caption, p.media_url, p.media_type, p.width, p.height, p.created_at,
            COALESCE((SELECT COUNT(*) FROM post_likes l    WHERE l.post_id = p.id), 0)::int  AS like_count,
            COALESCE((SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id), 0)::int  AS comment_count,
            COALESCE((SELECT COUNT(*) FROM post_shares  s  WHERE s.post_id = p.id), 0)::int  AS share_count,
            ${email
              ? `EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.email = $1)`
              : `false`} AS liked
       FROM posts p
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length}`,
    params,
  )

  return NextResponse.json({ posts: rows })
}

// POST /api/posts → admin-only
export async function POST(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const {
    kind, caption, mediaUrl, mediaType, width, height,
    crosspost = [],   // ['x','linkedin',...]
  } = body || {}

  if (!VALID_KINDS.has(kind)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }
  const safeCaption = String(caption || '').slice(0, 4000).trim()
  const safeMedia   = isOurMedia(mediaUrl) ? mediaUrl : null

  if (!safeCaption && !safeMedia) {
    return NextResponse.json({ error: 'Empty post' }, { status: 400 })
  }
  if (kind !== 'text' && !safeMedia) {
    return NextResponse.json({ error: 'Media required for image/video posts' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await query(
    `INSERT INTO posts (id, kind, caption, media_url, media_type, width, height)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, kind, safeCaption, safeMedia, mediaType || null, width || null, height || null]
  )

  // Fire cross-post jobs (best-effort; don't block creation on failure)
  if (Array.isArray(crosspost) && crosspost.length) {
    enqueueCrosspost(id, crosspost).catch(err =>
      console.error('[crosspost] enqueue failed:', err.message)
    )
  }

  const [post] = await query(
    `SELECT id, kind, caption, media_url, media_type, width, height, created_at FROM posts WHERE id = $1`,
    [id]
  )
  return NextResponse.json({ post })
}
