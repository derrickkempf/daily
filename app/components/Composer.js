'use client'
import { useEffect, useRef, useState } from 'react'

// Drag-and-drop composer for the admin only.
// Accepts a single image/video, optional caption, and per-platform cross-post toggles.
export default function Composer({ onPosted }) {
  const inputRef = useRef(null)
  const [file, setFile]       = useState(null)
  const [previewUrl, setPv]   = useState(null)
  const [caption, setCaption] = useState('')
  const [drag, setDrag]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const [toast, setToast]     = useState('')

  const [providers, setProviders] = useState([])     // [{id,label,credsOk,connected,approvalRequired,supports}]
  const [selected, setSelected]   = useState({})     // { x:true, linkedin:false }

  useEffect(() => {
    fetch('/api/social/status')
      .then(r => r.ok ? r.json() : { providers: [] })
      .then(j => setProviders(j.providers || []))
      .catch(() => setProviders([]))
  }, [])

  // What kind of post is this right now? Drives which providers are eligible.
  const currentKind = file
    ? (file.type.startsWith('video/') ? 'video' : 'image')
    : 'text'

  const supportsKind = (p) =>
    Array.isArray(p.supports) ? p.supports.includes(currentKind) : true

  // When the kind changes (user added/removed a file), uncheck any selected
  // platforms that no longer support this kind. Prevents silent skips.
  useEffect(() => {
    setSelected(prev => {
      let changed = false
      const next = { ...prev }
      for (const id of Object.keys(prev)) {
        const p = providers.find(pp => pp.id === id)
        if (p && !supportsKind(p) && next[id]) {
          next[id] = false
          changed = true
        }
      }
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKind, providers])

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2200) }

  const setSourceFile = (f) => {
    if (!f) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPv(URL.createObjectURL(f))
  }

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setSourceFile(f)
  }

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null); setPv(null); setCaption('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const submit = async (e) => {
    e?.preventDefault()
    if (busy) return
    if (!file && !caption.trim()) return flash('Add an image, video, or caption')
    setBusy(true)
    try {
      let mediaUrl = null
      let kind     = 'text'
      let mediaType = null
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        const up = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!up.ok) {
          const j = await up.json().catch(() => ({}))
          throw new Error(j.error || 'Upload failed')
        }
        const j = await up.json()
        mediaUrl = j.url
        mediaType = j.type
        kind = (j.type || '').startsWith('video/') ? 'video' : 'image'
      }
      const crosspost = Object.entries(selected).filter(([, v]) => v).map(([k]) => k)
      const r = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind, caption: caption.trim(), mediaUrl, mediaType, crosspost,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Post failed')
      onPosted?.(j.post)
      reset()
      flash('Posted')
    } catch (err) {
      flash(err.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const isVideo = file && file.type.startsWith('video/')

  return (
    <form
      className={`composer ${drag ? 'dragging' : ''}`}
      onSubmit={submit}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
    >
      {previewUrl ? (
        <div className="preview">
          {isVideo
            ? <video src={previewUrl} controls />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={previewUrl} alt="preview" />}
        </div>
      ) : (
        <div className="dropzone" onClick={() => inputRef.current?.click()}>
          Drop an image or video — or click to choose
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={e => setSourceFile(e.target.files?.[0])}
      />

      <div className="field" style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
        <label htmlFor="caption">Caption</label>
        <textarea
          id="caption"
          className="textarea"
          rows={3}
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="What is this? (optional)"
        />
      </div>

      {providers.length > 0 && (
        <>
          <label style={{
            fontSize: 'var(--text-xs)', textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)', color: 'var(--color-text-secondary)',
          }}>
            Cross-post to
          </label>
          <div className="cross-post-grid">
            {providers.map(p => {
              const okKind      = supportsKind(p)
              const unavailable = !p.credsOk || !p.connected || !okKind
              const reason =
                !p.credsOk          ? 'no creds'
                : !p.connected      ? 'not connected'
                : !okKind           ? `needs ${p.supports.join('/')}`
                : p.approvalRequired ? 'pending review'
                : 'ready'
              const tooltip =
                !p.credsOk          ? 'API credentials not configured' :
                !p.connected        ? 'Connect this provider in Admin first' :
                !okKind             ? `${p.label} only accepts ${p.supports.join(' or ')} posts` :
                p.approvalRequired  ? 'Pending platform approval — will be skipped' : ''

              return (
                <label key={p.id}
                  className={`cross-post-toggle ${p.connected ? 'connected' : ''} ${unavailable ? 'unavailable' : ''}`}
                  title={tooltip}
                >
                  <input
                    type="checkbox"
                    disabled={unavailable}
                    checked={!!selected[p.id]}
                    onChange={e => setSelected(s => ({ ...s, [p.id]: e.target.checked }))}
                  />
                  {p.label}
                  <span className="cross-post-status">{reason}</span>
                </label>
              )
            })}
          </div>
        </>
      )}

      <div className="actions-row" style={{ marginTop: 'var(--space-4)' }}>
        {file && <button type="button" className="btn btn--ghost btn--small" onClick={reset}>Remove file</button>}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Posting…' : 'Post →'}
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </form>
  )
}
