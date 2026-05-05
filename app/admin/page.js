'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const login = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (r.ok) router.push('/')
    else { setErr('Wrong password'); setBusy(false) }
  }

  return (
    <main className="pd-container" style={{ maxWidth: '400px' }}>
      <div style={{ paddingTop: 'var(--space-2xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-medium)', letterSpacing: '-0.02em', marginBottom: 'var(--space-xl)' }}>
          Admin
        </h1>
        <form onSubmit={login}>
          <div className="pd-field">
            <label className="pd-label">Password</label>
            <input
              type="password"
              className="pd-input"
              value={pw}
              onChange={e => setPw(e.target.value)}
              autoFocus
            />
          </div>
          {err && <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>{err}</p>}
          <button type="submit" className="pd-btn pd-btn--primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
