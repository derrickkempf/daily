import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAdminSession } from '@/lib/admin'

export async function GET() {
  const [s, a] = await Promise.all([getSession(), getAdminSession()])
  return NextResponse.json({
    user: s ? { email: s.email } : null,
    isAdmin: !!a,
  })
}
