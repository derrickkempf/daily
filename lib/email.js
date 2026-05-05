// ═══════════════════════════════════════════════════════
// EMAIL — send verification codes via Resend
// ═══════════════════════════════════════════════════════
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL || 'Punk Dewds <onboarding@resend.dev>'

export async function sendVerificationEmail(email, code) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} — your Punk Dewds verification code`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:400px;margin:0 auto;padding:40px 0">
        <p style="font-size:14px;color:#999;margin:0 0 24px">Punk Dewds</p>
        <p style="font-size:16px;color:#111;margin:0 0 8px">Your verification code:</p>
        <p style="font-size:32px;font-weight:500;color:#111;letter-spacing:8px;margin:0 0 24px;font-family:monospace">${code}</p>
        <p style="font-size:13px;color:#999;margin:0">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  })

  if (error) {
    console.error('Email send failed:', error)
    throw new Error('Failed to send verification email')
  }
}
