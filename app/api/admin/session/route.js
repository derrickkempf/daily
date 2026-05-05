// GET /api/admin/session → { isAdmin: bool }
import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin'

export async function GET() {
  const s = await getAdminSession()
  return NextResponse.json({ isAdmin: !!s })
}
