import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(_req, { params }) {
  const { id } = await params
  const rows = await query(
    `SELECT id, kind, caption, media_url, media_type, width, height, created_at FROM posts WHERE id = $1`,
    [id]
  )
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ post: rows[0] })
}

export async function DELETE(_req, { params }) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { id } = await params
  await query(`DELETE FROM posts WHERE id = $1`, [id])
  return NextResponse.json({ ok: true })
}
