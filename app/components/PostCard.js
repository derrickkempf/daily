'use client'
import { useEffect, useState } from 'react'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelative(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60)        return 'just now'
  if (s < 3600)      return `${Math.floor(s / 60)}m`
  if (s < 86400)     return `${Math.floor(s / 3600)}h`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`
  return formatDate(iso)
}

export default function PostCard({ post, isAdmin, signedIn, onDeleted }) {
  const [likeCount,   setLikeCount]   = useState(post.like_count || 0)
  const [shareCount,  setShareCount]  = useState(post.share_count || 0)
  const [liked,       setLiked]       = useState(!!post.liked)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(null)
  const [commentCount, setCommentCount] = useState(post.comment_count || 0)
  const [draft, setDraft] = useState('')
  const [busy, setBusy]   = useState(false)
  const [toast, setToast] = useState('')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800) }

  const toggleLike = async () => {
    if (!signedIn) return flash('Sign in to like')
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(c => c + (wasLiked ? -1 : 1))
    try {
      const r = await fetch(`/api/posts/${post.id}/like`, {
        method: wasLiked ? 'DELETE' : 'POST',
      })
      if (!r.ok) throw new Error()
      const j = await r.json()
      setLiked(j.liked); setLikeCount(j.count)
    } catch {
      // Roll back optimistic update
      setLiked(wasLiked)
      setLikeCount(c => c + (wasLiked ? 1 : -1))
      flash('Could not save')
    }
  }

  const loadComments = async () => {
    if (comments) return
    try {
      const r = await fetch(`/api/posts/${post.id}/comments`, { cache: 'no-store' })
      const j = await r.json()
      setComments(j.comments || [])
    } catch {
      setComments([])
    }
  }

  const onToggleComments = () => {
    setShowComments(o => {
      const opening = !o
      if (opening) loadComments()
      return opening
    })
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!signedIn) return flash('Sign in to comment')
    if (!draft.trim() || busy) return
    setBusy(true)
    try {
      const r = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed')
      setComments(c => [...(c || []), j.comment])
      setCommentCount(n => n + 1)
      setDraft('')
    } catch (e) {
      flash(e.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    if (!signedIn) return flash('Sign in to share')
    const shareUrl = `${window.location.origin}/?p=${post.id}`
    let target = 'copy'
    try {
      if (navigator.share) {
        target = 'native'
        await navigator.share({
          title: 'Timeline',
          text: post.caption || 'New work',
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        flash('Link copied')
      }
    } catch {
      // Native share dismissed; ignore silently.
      return
    }
    try {
      const r = await fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      })
      const j = await r.json()
      if (r.ok) setShareCount(j.count)
    } catch {}
  }

  const remove = async () => {
    if (!confirm('Delete this post?')) return
    const r = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
    if (r.ok) onDeleted?.()
  }

  return (
    <article className="post">
      <div className="post__date">
        <time dateTime={post.created_at} title={formatDate(post.created_at)}>
          {formatRelative(post.created_at)}
        </time>
        {isAdmin && (
          <button onClick={remove}
            style={{ float: 'right', background: 'none', border: 0, color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 'inherit' }}
            title="Delete post">×</button>
        )}
      </div>

      {post.media_url && (post.kind === 'video' ? (
        <div className="post__media">
          <video src={post.media_url} controls preload="metadata" />
        </div>
      ) : (
        <div className="post__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.media_url} alt={post.caption || 'post'} loading="lazy" />
        </div>
      ))}

      {post.caption && <p className="post__caption">{post.caption}</p>}

      <div className="post__actions">
        <button className={`action ${liked ? 'action--liked' : ''}`} onClick={toggleLike} aria-label="Like">
          <svg className="action__icon" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{likeCount}</span>
        </button>

        <button className="action" onClick={onToggleComments} aria-label="Comments">
          <svg className="action__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{commentCount}</span>
        </button>

        <button className="action" onClick={share} aria-label="Share">
          <svg className="action__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </svg>
          <span>{shareCount}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments">
          {comments === null ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</p>
          ) : comments.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Be the first to comment.</p>
          ) : (
            comments.map(c => (
              <div className="comment" key={c.id}>
                <div className="comment__head">
                  <span>{c.author}</span>
                  <span>{formatRelative(c.created_at)}</span>
                </div>
                <div className="comment__body">{c.body}</div>
              </div>
            ))
          )}
          <form className="comment-form" onSubmit={submitComment}>
            <input
              className="input"
              placeholder={signedIn ? 'Add a comment…' : 'Sign in to comment'}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              disabled={!signedIn || busy}
              maxLength={1000}
            />
            <button className="btn btn--primary btn--small" type="submit" disabled={!signedIn || busy || !draft.trim()}>
              {busy ? '…' : 'Post'}
            </button>
          </form>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </article>
  )
}
