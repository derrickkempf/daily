// POST /api/posts/[id]/like  { fp, action: 'like'|'unlike' }
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request, { params }) {
  const { id } = await params
  const { fp, action } = await request.json().catch(() => ({}))
  if (!fp || !id) return NextResponse.json({ ok: false })

  try {
    if (action === 'unlike') {
      await query(
        'DELETE FROM post_likes WHERE post_id = $1 AND fingerprint = $2',
        [id, fp]
      )
    } else {
      await query(
        'INSERT INTO post_likes (post_id, fingerprint) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, fp]
      )
    }
    const rows = await query(
      'SELECT COUNT(*) as count FROM post_likes WHERE post_id = $1',
      [id]
    )
    return NextResponse.json({ ok: true, likes: parseInt(rows[0]?.count || 0) })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
