import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(_req, { params }) {
  const { id } = await params
  const rows = await query(
    `SELECT id, email, body, created_at
       FROM post_comments
      WHERE post_id = $1
      ORDER BY created_at ASC
      LIMIT 200`,
    [id]
  )
  // anonymise email a bit — first letter + domain — to avoid scraping
  const comments = rows.map(r => ({
    ...r,
    author: maskEmail(r.email),
    email: undefined,
  }))
  return NextResponse.json({ comments })
}

export async function POST(request, { params }) {
  const session = await getSession()
  if (!session?.email) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const text = String(body?.body || '').trim()
  if (!text)             return NextResponse.json({ error: 'Empty comment' }, { status: 400 })
  if (text.length > 1000) return NextResponse.json({ error: 'Too long' }, { status: 400 })

  const exists = await query(`SELECT 1 FROM posts WHERE id = $1`, [id])
  if (!exists.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [row] = await query(
    `INSERT INTO post_comments (post_id, email, body)
     VALUES ($1, $2, $3)
     RETURNING id, body, created_at, email`,
    [id, session.email, text]
  )
  return NextResponse.json({
    comment: { ...row, author: maskEmail(row.email), email: undefined },
  })
}

function maskEmail(e) {
  if (!e) return 'someone'
  const [user, dom] = String(e).split('@')
  if (!dom) return 'someone'
  return `${(user || '').slice(0, 2)}…@${dom}`
}
