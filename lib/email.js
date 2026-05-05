// Verification-code email via Resend. Soft-fails in dev if no API key set.
import { Resend } from 'resend'

const FROM = process.env.FROM_EMAIL || 'Timeline <onboarding@resend.dev>'

export async function sendVerificationEmail(email, code) {
  if (!process.env.RESEND_API_KEY) {
    // Dev fallback: log the code so you can sign in without email setup.
    console.log(`[email] code for ${email}: ${code}`)
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} — your sign-in code`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:400px;margin:0 auto;padding:40px 0">
        <p style="font-size:14px;color:#999;margin:0 0 24px">Timeline</p>
        <p style="font-size:16px;color:#111;margin:0 0 8px">Your sign-in code:</p>
        <p style="font-size:32px;font-weight:500;color:#111;letter-spacing:8px;margin:0 0 24px;font-family:monospace">${code}</p>
        <p style="font-size:13px;color:#999;margin:0">Expires in 10 minutes. If you didn't request this, ignore.</p>
      </div>
    `,
  })
  if (error) {
    console.error('Email send failed:', error)
    throw new Error('Failed to send email')
  }
}
