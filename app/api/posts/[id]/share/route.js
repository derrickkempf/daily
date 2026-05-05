import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

const VALID_TARGETS = new Set(['copy', 'native', 'x', 'facebook', 'linkedin', 'pinterest', 'email', 'other'])

// POST /api/posts/[id]/share — record a share event. Sign-in required.
export async function POST(request, { params }) {
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const target = VALID_TARGETS.has(body?.target) ? body.target : 'other'

  const exists = await query(`SELECT 1 FROM posts WHERE id = $1`, [id])
  if (!exists.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await query(
    `INSERT INTO post_shares (post_id, email, target) VALUES ($1, $2, $3)`,
    [id, session.email, target]
  )
  const [{ count }] = await query(
    `SELECT COUNT(*)::int AS count FROM post_shares WHERE post_id = $1`,
    [id]
  )
  return NextResponse.json({ count })
}
