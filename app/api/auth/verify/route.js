import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, code } = await request.json()
    const normalizedEmail = email?.toLowerCase().trim()
    if (!normalizedEmail || !code) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 })
    }

    const match = await query(
      `SELECT id FROM verification_codes
       WHERE email = $1 AND code = $2 AND used = false AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, code]
    )
    if (!match.length) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
    }
    await query(`UPDATE verification_codes SET used = true WHERE id = $1`, [match[0].id])
    await createSession(normalizedEmail)
    return NextResponse.json({ ok: true, email: normalizedEmail })
  } catch (err) {
    console.error('verify error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
