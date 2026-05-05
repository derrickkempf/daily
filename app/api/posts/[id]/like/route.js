// Like / unlike a post. Requires email-verified session.
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(_req, { params }) {
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const { id } = await params
  const exists = await query(`SELECT 1 FROM posts WHERE id = $1`, [id])
  if (!exists.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await query(
    `INSERT INTO post_likes (post_id, email)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [id, session.email]
  )
  const [{ count }] = await query(
    `SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1`,
    [id]
  )
  return NextResponse.json({ liked: true, count })
}

export async function DELETE(_req, { params }) {
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const { id } = await params
  await query(`DELETE FROM post_likes WHERE post_id = $1 AND email = $2`, [id, session.email])
  const [{ count }] = await query(
    `SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1`,
    [id]
  )
  return NextResponse.json({ liked: false, count })
}
