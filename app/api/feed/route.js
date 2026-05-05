// GET    /api/feed          → list posts (public), enriched with like/comment counts
// POST   /api/feed          → create post (admin only)
// DELETE /api/feed?id=...   → delete post (admin only)
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { readJSON, writeJSON } from '@/lib/storage'
import { requireAdmin } from '@/lib/admin'
import { query } from '@/lib/db'

const FILE = 'feed'
const VALID_KINDS = new Set(['image', 'video', 'text'])

function isOurMedia(url) {
  if (typeof url !== 'string') return false
  if (url.startsWith('/uploads/feed/')) return true
  try {
    const u = new URL(url)
    return u.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

async function enrichPosts(posts) {
  if (!posts.length) return posts

  try {
    const ids = posts.map(p => p.id)

    const likesRows = await query(
      `SELECT post_id, COUNT(*) as count FROM post_likes WHERE post_id = ANY($1) GROUP BY post_id`,
      [ids]
    )
    const likesMap = {}
    for (const r of likesRows) likesMap[r.post_id] = parseInt(r.count)

    const commentRows = await query(
      `SELECT id, post_id, name, body, created_at FROM post_comments WHERE post_id = ANY($1) ORDER BY created_at ASC`,
      [ids]
    )
    const commentsMap = {}
    for (const r of commentRows) {
      if (!commentsMap[r.post_id]) commentsMap[r.post_id] = []
      commentsMap[r.post_id].push({
        id: r.id, name: r.name, body: r.body, createdAt: r.created_at,
      })
    }

    return posts.map(p => ({
      ...p,
      likes: likesMap[p.id] || 0,
      comments: commentsMap[p.id] || [],
    }))
  } catch {
    return posts
  }
}

export async function GET() {
  const posts = (await readJSON(FILE, [])) || []
  posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const enriched = await enrichPosts(posts)
  return NextResponse.json({ posts: enriched })
}

export async function POST(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { kind, title, body: text, tag, mediaUrl } = body || {}
  const safeKind = VALID_KINDS.has(kind) ? kind : (mediaUrl ? 'image' : 'text')
  const safeTitle = String(title || '').slice(0, 200).trim()
  const safeBody  = String(text  || '').slice(0, 4000).trim()
  const safeTag   = String(tag || '').slice(0, 40).trim().toLowerCase() || null
  const safeMedia = isOurMedia(mediaUrl) ? mediaUrl : null

  if (!safeTitle && !safeBody && !safeMedia) {
    return NextResponse.json({ error: 'Empty post' }, { status: 400 })
  }

  const post = {
    id: crypto.randomUUID(),
    kind: safeKind,
    title: safeTitle,
    body: safeBody,
    tag: safeTag,
    mediaUrl: safeMedia,
    createdAt: new Date().toISOString(),
  }

  const all = (await readJSON(FILE, [])) || []
  all.unshift(post)
  await writeJSON(FILE, all)
  return NextResponse.json({ post })
}

export async function DELETE(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const all = (await readJSON(FILE, [])) || []
  const next = all.filter(p => p.id !== id)
  if (next.length === all.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await writeJSON(FILE, next)
  return NextResponse.json({ ok: true })
}
