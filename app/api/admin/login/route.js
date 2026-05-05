// POST   /api/admin/login   { password }  → set admin cookie
// DELETE /api/admin/login                  → clear admin cookie
import { NextResponse } from 'next/server'
import { checkPassword, createAdminSession, destroyAdminSession } from '@/lib/admin'

export async function POST(request) {
  let body
  try { body = await request.json() } catch { body = {} }
  const { password } = body || {}
  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }
  await createAdminSession()
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await destroyAdminSession()
  return NextResponse.json({ ok: true })
}
