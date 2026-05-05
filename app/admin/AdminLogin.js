'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLogin() {
  const router = useRouter()
  const [pw, setPw]     = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error || 'Wrong password')
      }
      router.refresh()
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 420 }}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
        Enter the admin password to manage the timeline.
      </p>
      <div className="field">
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" className="input" value={pw} onChange={e => setPw(e.target.value)} required autoFocus />
      </div>
      {err && <p style={{ color: 'var(--color-destructive)', fontSize: 'var(--text-sm)' }}>{err}</p>}
      <button className="btn btn--primary" disabled={busy} type="submit">
        {busy ? 'Signing in…' : 'Sign in →'}
      </button>
    </form>
  )
}
