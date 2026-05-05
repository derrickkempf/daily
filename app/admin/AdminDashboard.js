'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard({ successProvider, errorMessage }) {
  const router = useRouter()
  const [providers, setProviders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [jobs, setJobs]           = useState([])

  const refresh = async () => {
    const [s, l] = await Promise.all([
      fetch('/api/social/status',         { cache: 'no-store' }),
      fetch('/api/admin/crosspost-log',   { cache: 'no-store' }),
    ])
    if (s.ok) setProviders((await s.json()).providers || [])
    if (l.ok) setJobs((await l.json()).jobs || [])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // Auto-refresh log every 5 seconds (cheap query, helps testing feel live)
    const t = setInterval(() => {
      fetch('/api/admin/crosspost-log', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(j => { if (j) setJobs(j.jobs || []) })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const disconnect = async (id) => {
    await fetch(`/api/social/status?provider=${id}`, { method: 'DELETE' })
    refresh()
  }

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      {successProvider && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          borderLeft: '2px solid var(--color-success)',
          marginBottom: 'var(--space-6)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
        }}>
          Connected to {successProvider}.
        </div>
      )}
      {errorMessage && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          borderLeft: '2px solid var(--color-destructive)',
          marginBottom: 'var(--space-6)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
        }}>
          {errorMessage}
        </div>
      )}

      <section style={{ marginBottom: 'var(--space-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-xl)', fontWeight: 500,
          letterSpacing: 'var(--tracking-tight)',
          margin: '0 0 var(--space-2)',
        }}>Cross-post connections</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
          Wire each platform&apos;s OAuth once. Then check the boxes in the composer to mirror new posts.
        </p>

        {loading ? <p>Loading…</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr>
                <th style={cellHead}>Platform</th>
                <th style={cellHead}>Credentials</th>
                <th style={cellHead}>Connected</th>
                <th style={cellHead}>Status</th>
                <th style={cellHead}></th>
              </tr>
            </thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id}>
                  <td style={cell}><strong>{p.label}</strong></td>
                  <td style={cell}>{p.credsOk ? 'Set' : <span style={{ color: 'var(--color-text-muted)' }}>missing</span>}</td>
                  <td style={cell}>{p.connected ? 'Yes' : 'No'}</td>
                  <td style={cell}>
                    {!p.credsOk ? <span className="tag">env vars</span>
                      : p.approvalRequired ? <span className="tag" title="Platform requires app review">approval</span>
                      : <span className="tag">ready</span>}
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    {p.credsOk && !p.connected && (
                      <a className="btn btn--small" href={`/api/social/connect/${p.id}`}>Connect →</a>
                    )}
                    {p.connected && (
                      <button className="btn btn--small btn--ghost" onClick={() => disconnect(p.id)}>Disconnect</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p style={{
          marginTop: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
        }}>
          <strong>Approval-required platforms</strong> (Instagram, TikTok) finish their OAuth fine, but
          actually publishing requires Meta / TikTok app review. Until approved, those posts are queued
          and skipped — see the post log.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-xl)', fontWeight: 500,
          letterSpacing: 'var(--tracking-tight)',
          margin: '0 0 var(--space-3)',
        }}>Posting</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Use the composer at the top of the <a href="/" style={{ borderBottom: '1px solid var(--color-border-strong)' }}>Timeline</a> to publish.
        </p>
      </section>

      <section style={{ marginBottom: 'var(--space-12)' }}>
        <h2 style={{
          fontSize: 'var(--text-xl)', fontWeight: 500,
          letterSpacing: 'var(--tracking-tight)',
          margin: '0 0 var(--space-3)',
        }}>Cross-post log</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Last 30 cross-post attempts. Auto-refreshes every 5 seconds.
        </p>
        {jobs.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            No cross-post attempts yet.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr>
                <th style={cellHead}>When</th>
                <th style={cellHead}>Provider</th>
                <th style={cellHead}>Status</th>
                <th style={cellHead}>Result</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id}>
                  <td style={cell}>{new Date(j.created_at).toLocaleString()}</td>
                  <td style={cell}><strong>{j.provider}</strong></td>
                  <td style={cell}>
                    <span className="tag" style={{
                      borderColor:
                        j.status === 'sent'    ? 'var(--color-success)' :
                        j.status === 'failed'  ? 'var(--color-destructive)' :
                        j.status === 'skipped' ? 'var(--color-warning)' :
                        'var(--color-border)',
                    }}>{j.status}</span>
                  </td>
                  <td style={{ ...cell, color: 'var(--color-text-secondary)' }}>
                    {j.external_url
                      ? <a href={j.external_url} target="_blank" rel="noopener noreferrer"
                           style={{ borderBottom: '1px solid var(--color-border-strong)' }}>view →</a>
                      : j.error
                        ? <span title={j.error} style={{ color: 'var(--color-destructive)' }}>{(j.error || '').slice(0, 80)}</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <button className="btn btn--ghost btn--small" onClick={logout}>Sign out of admin</button>
      </section>
    </div>
  )
}

const cellHead = {
  textAlign: 'left',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '1px solid var(--color-border)',
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-widest)',
}
const cell = {
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'middle',
}
