// GET /api/social/status — admin-only listing of provider connection state.
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getAllStatus, disconnect } from '@/lib/social'

export const dynamic = 'force-dynamic'

export async function GET() {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const providers = await getAllStatus()
  return NextResponse.json({ providers })
}

// DELETE /api/social/status?provider=x → disconnect
export async function DELETE(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const id = new URL(request.url).searchParams.get('provider')
  if (!id) return NextResponse.json({ error: 'Missing provider' }, { status: 400 })
  await disconnect(id)
  return NextResponse.json({ ok: true })
}
