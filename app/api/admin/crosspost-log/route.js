// GET /api/admin/crosspost-log — last 30 cross-post attempts, newest first.
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const rows = await query(
    `SELECT cp.id, cp.post_id, cp.provider, cp.status, cp.external_url, cp.error,
            cp.created_at, cp.updated_at,
            p.caption, p.kind, p.media_url
       FROM post_crossposts cp
       LEFT JOIN posts p ON p.id = cp.post_id
       ORDER BY cp.created_at DESC
       LIMIT 30`
  )
  return NextResponse.json({ jobs: rows })
}
