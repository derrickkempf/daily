// GET  /api/posts/[id]/comment  → list comments
// POST /api/posts/[id]/comment  { name, body } → add comment
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request, { params }) {
  const { id } = await params
  try {
    const rows = await query(
      'SELECT id, name, body, created_at FROM post_comments WHERE post_id = $1 ORDER BY created_at ASC',
      [id]
    )
    return NextResponse.json({ comments: rows.map(r => ({
      id: r.id,
      name: r.name,
      body: r.body,
      createdAt: r.created_at,
    }))})
  } catch {
    return NextResponse.json({ comments: [] })
  }
}

export async function POST(request, { params }) {
  const { id } = await params
  const { name, body } = await request.json().catch(() => ({}))
  if (!body?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 })

  const safeName = String(name || 'Anonymous').slice(0, 80).trim()
  const safeBody = String(body).slice(0, 1000).trim()

  try {
    const rows = await query(
      'INSERT INTO post_comments (post_id, name, body) VALUES ($1, $2, $3) RETURNING id, name, body, created_at',
      [id, safeName, safeBody]
    )
    const r = rows[0]
    return NextResponse.json({ comment: {
      id: r.id,
      name: r.name,
      body: r.body,
      createdAt: r.created_at,
    }})
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
