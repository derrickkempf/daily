'use client'
import { useState } from 'react'

// Email-code sign-in: required for liking, commenting, and sharing.
export default function SignInPill({ session, onChange }) {
  const [open, setOpen]   = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode]   = useState('')
  const [stage, setStage] = useState('email')   // email | code
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState('')

  const close = () => { setOpen(false); setStage('email'); setEmail(''); setCode(''); setErr('') }

  const sendCode = async (e) => {
    e?.preventDefault()
    if (busy) return
    setErr(''); setBusy(true)
    try {
      const r = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error || 'Could not send code')
      }
      setStage('code')
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  const verify = async (e) => {
    e?.preventDefault()
    if (busy) return
    setErr(''); setBusy(true)
    try {
      const r = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Invalid code')
      onChange?.({ ...(j || {}), user: { email: j.email }, isAdmin: false })
      close()
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    onChange?.({ user: null, isAdmin: false })
  }

  if (session?.user) {
    return (
      <button className="btn btn--small" onClick={logout} title={session.user.email}>
        Sign out
      </button>
    )
  }

  return (
    <>
      <button className="btn btn--small" onClick={() => setOpen(true)}>Sign in</button>
      {open && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="modal" role="dialog" aria-modal="true">
            <h2>{stage === 'email' ? 'Sign in' : 'Enter your code'}</h2>
            <p>
              {stage === 'email'
                ? 'Email address. We’ll send a one-time code.'
                : `Code sent to ${email}.`}
            </p>
            {stage === 'email' ? (
              <form onSubmit={sendCode}>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email" className="input" type="email" required autoFocus
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                {err && <p style={{ color: 'var(--color-destructive)', fontSize: 'var(--text-sm)' }}>{err}</p>}
                <div className="actions-row">
                  <button type="button" className="btn btn--ghost" onClick={close}>Cancel</button>
                  <button type="submit" className="btn btn--primary" disabled={busy}>
                    {busy ? 'Sending…' : 'Send code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={verify}>
                <div className="field">
                  <label htmlFor="code">Code</label>
                  <input
                    id="code" className="input" required autoFocus
                    inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                  />
                </div>
                {err && <p style={{ color: 'var(--color-destructive)', fontSize: 'var(--text-sm)' }}>{err}</p>}
                <div className="actions-row">
                  <button type="button" className="btn btn--ghost" onClick={() => setStage('email')}>Back</button>
                  <button type="submit" className="btn btn--primary" disabled={busy}>
                    {busy ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
