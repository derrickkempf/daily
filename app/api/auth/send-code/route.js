// POST /api/auth/send-code
// Accepts { email }, generates a 6-digit code, stores it, sends it.
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateCode } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit: max 3 codes per email per hour
    const recent = await query(
      `SELECT COUNT(*) as cnt FROM verification_codes
       WHERE email = $1 AND created_at > now() - interval '1 hour'`,
      [normalizedEmail]
    )
    if (parseInt(recent[0].cnt) >= 3) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
    }

    // Generate and store code (10-minute expiry)
    const code = generateCode()
    await query(
      `INSERT INTO verification_codes (email, code, expires_at)
       VALUES ($1, $2, now() + interval '10 minutes')`,
      [normalizedEmail, code]
    )

    // Upsert user — create if new, do nothing if exists
    await query(
      `INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [normalizedEmail]
    )

    // Send email
    await sendVerificationEmail(normalizedEmail, code)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('send-code error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
