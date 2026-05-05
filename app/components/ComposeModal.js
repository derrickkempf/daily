'use client'
import { useState, useRef, useCallback } from 'react'

const TAGS = ['Sketch', 'Painting', 'Digital', 'Study', 'Series', 'Experiment', 'Portrait', 'Abstract']

const PLATFORMS = [
  { id: 'x',         label: 'X',        note: 'X_ACCESS_TOKEN' },
  { id: 'instagram', label: 'Instagram', note: 'IG_ACCESS_TOKEN' },
  { id: 'linkedin',  label: 'LinkedIn',  note: 'LINKEDIN_ACCESS_TOKEN' },
  { id: 'pinterest', label: 'Pinterest', note: 'PINTEREST_ACCESS_TOKEN' },
  { id: 'youtube',   label: 'YouTube',   note: 'Coming soon' },
  { id: 'tiktok',    label: 'TikTok',    note: 'Coming soon' },
]

export default function ComposeModal({ open, onClose, onPosted, showToast }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [syndicate, setSyndicate] = useState([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef()

  const reset = () => {
    setTitle(''); setBody(''); setTag(''); setFile(null); setPreview(null)
    setSyndicate([]); setBusy(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }, [])

  const toggleSyn = (id) =>
    setSyndicate(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const submit = async () => {
    if (!title.trim() && !body.trim() && !file) {
      showToast('Add a title, caption, or media', 'err'); return
    }
    setBusy(true)
    try {
      let mediaUrl = null
      let kind = 'text'
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        const up = await fetch('/api/feed/upload', { method: 'POST', body: fd })
        if (!up.ok) throw new Error('Upload failed')
        const j = await up.json()
        mediaUrl = j.url
        kind = file.type.startsWith('video') ? 'video' : 'image'
      }
      const r = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, title: title.trim(), body: body.trim(), tag: tag || null, mediaUrl, syndicate }),
      })
      if (!r.ok) throw new Error('Post failed')
      const { post } = await r.json()
      if (syndicate.length > 0) {
        fetch('/api/syndicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post, platforms: syndicate }),
        }).catch(() => {})
      }
      reset(); onPosted(post)
    } catch (err) {
      showToast(err.message || 'Failed', 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`modal-backdrop${open ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New post</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">

          {/* Drop zone */}
          <div
            className={`drop-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
            {preview ? (
              file?.type.startsWith('video')
                ? <video src={preview} className="drop-preview" controls />
                : <img src={preview} className="drop-preview" alt="preview" />
            ) : (
              <>
                <div className="drop-icon">🎨</div>
                <div className="drop-label">
                  <strong>Drag & drop your art here</strong><br />
                  or click to browse — images & video
                </div>
              </>
            )}
          </div>
          {file && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)', marginBottom: 'var(--space-md)', marginTop: '-8px' }}>
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB{' '}
              <button style={{ color: 'var(--color-accent)' }} onClick={() => { setFile(null); setPreview(null) }}>
                remove
              </button>
            </div>
          )}

          <div className="pd-field">
            <label className="pd-label">Title</label>
            <input className="pd-input" placeholder="e.g. Figure study no. 12" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
          </div>

          <div className="pd-field">
            <label className="pd-label">Caption / Context</label>
            <textarea className="pd-textarea" placeholder="What were you exploring?" value={body} onChange={e => setBody(e.target.value)} maxLength={2000} rows={4} />
          </div>

          <div className="pd-field">
            <label className="pd-label">Tag</label>
            <select className="pd-select" value={tag} onChange={e => setTag(e.target.value)}>
              <option value="">No tag</option>
              {TAGS.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          </div>

          <div className="syndication">
            <div className="syn-label pd-label">Also post to</div>
            <div className="syn-platforms">
              {PLATFORMS.map(p => (
                <label key={p.id} className={`syn-chip${syndicate.includes(p.id) ? ' checked' : ''}`} title={p.note}>
                  <input type="checkbox" checked={syndicate.includes(p.id)} onChange={() => toggleSyn(p.id)} style={{ display: 'none' }} />
                  {p.label}
                </label>
              ))}
            </div>
            {syndicate.length > 0 && (
              <p className="syn-note">Configure API keys in <code>.env.local</code> — see DEPLOY.md.</p>
            )}
          </div>

          <div className="modal-actions">
            <button className="pd-btn pd-btn--ghost" onClick={handleClose}>Cancel</button>
            <button className="pd-btn pd-btn--primary" onClick={submit} disabled={busy}>
              {busy ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
