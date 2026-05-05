'use client'
import { useState, useEffect, useRef } from 'react'

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = 60000, h = 3600000, d = 86400000
  if (diff < m)  return 'just now'
  if (diff < h)  return `${Math.floor(diff / m)}m ago`
  if (diff < d)  return `${Math.floor(diff / h)}h ago`
  if (diff < 7*d) return `${Math.floor(diff / d)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFingerprint() {
  if (typeof window === 'undefined') return 'anon'
  let fp = localStorage.getItem('tl-fp')
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('tl-fp', fp)
  }
  return fp
}

const SHARE_PLATFORMS = [
  {
    id: 'copy', label: 'Copy link',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  },
  {
    id: 'x', label: 'Share on X',
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  },
  {
    id: 'instagram', label: 'Share to Instagram',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
  },
  {
    id: 'linkedin', label: 'Share on LinkedIn',
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  },
  {
    id: 'pinterest', label: 'Share on Pinterest',
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
  },
]

export default function PostCard({ post, isAdmin, onDelete, showToast }) {
  const [likes, setLikes] = useState(post.likes || 0)
  const [liked, setLiked] = useState(false)
  const [comments, setComments] = useState(post.comments || [])
  const [showComments, setShowComments] = useState(false)
  const [commentName, setCommentName] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef(null)

  useEffect(() => {
    const fp = getFingerprint()
    const key = `tl-liked-${post.id}`
    if (localStorage.getItem(key) === 'y') setLiked(true)
  }, [post.id])

  useEffect(() => {
    function onClick(e) {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false)
      }
    }
    if (shareOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [shareOpen])

  const handleLike = async () => {
    const fp = getFingerprint()
    const key = `tl-liked-${post.id}`
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikes(l => wasLiked ? l - 1 : l + 1)
    if (wasLiked) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, 'y')
    }
    await fetch(`/api/posts/${post.id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fp, action: wasLiked ? 'unlike' : 'like' }),
    })
  }

  const handleShare = async (platform) => {
    setShareOpen(false)
    const url = `${window.location.origin}/?post=${post.id}`
    const text = post.title || 'Check out this piece'

    if (platform === 'copy') {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!')
      return
    }
    if (platform === 'x') {
      window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
      return
    }
    if (platform === 'instagram') {
      await navigator.clipboard.writeText(url)
      showToast('Link copied — paste it in your Instagram story or post!')
      return
    }
    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
      return
    }
    if (platform === 'pinterest') {
      const img = post.mediaUrl || ''
      window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(img)}&description=${encodeURIComponent(text)}`, '_blank')
      return
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setSubmittingComment(true)
    try {
      const r = await fetch(`/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: commentName.trim() || 'Anonymous',
          body: commentBody.trim()
        }),
      })
      if (r.ok) {
        const { comment } = await r.json()
        setComments(prev => [...prev, comment])
        setCommentBody('')
        showToast('Comment added')
      }
    } finally {
      setSubmittingComment(false)
    }
  }

  const initials = (name) => name ? name.slice(0, 2).toUpperCase() : '?'

  return (
    <article className="post">
      {post.mediaUrl && (
        <div className="post-media-wrap">
          {post.kind === 'video'
            ? <video src={post.mediaUrl} controls preload="metadata" />
            : <img src={post.mediaUrl} alt={post.title || 'artwork'} loading="lazy" />
          }
        </div>
      )}

      <div className="post-body-wrap">
        <div className="post-meta">
          <div className="post-author">
            <div className="post-avatar">DK</div>
            <span className="post-author-name">Derrick Kempf</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {post.tag && <span className="post-tag">{post.tag}</span>}
            <span className="post-time">{relativeTime(post.createdAt)}</span>
            {isAdmin && (
              <button
                onClick={() => onDelete(post.id)}
                style={{ fontSize: '11px', color: 'var(--muted)', opacity: .6 }}
                title="Delete post"
              >✕</button>
            )}
          </div>
        </div>

        {post.title && <h2 className="post-title">{post.title}</h2>}
        {post.body && <p className="post-caption">{post.body}</p>}
      </div>

      {/* Actions bar */}
      <div className="post-actions">
        <button className={`action-btn${liked ? ' liked' : ''}`} onClick={handleLike}>
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likes > 0 && <span>{likes}</span>}
        </button>

        <button
          className="action-btn"
          onClick={() => setShowComments(s => !s)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {comments.length > 0 && <span>{comments.length}</span>}
        </button>

        <div className="action-sep" />

        <div className="action-share-menu" ref={shareRef}>
          <button className="action-btn" onClick={() => setShareOpen(s => !s)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>Share</span>
          </button>
          <div className={`share-dropdown${shareOpen ? ' open' : ''}`}>
            {SHARE_PLATFORMS.map(p => (
              <div key={p.id} className="share-item" onClick={() => handleShare(p.id)}>
                {p.icon}
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="comments-wrap">
          {comments.length > 0 && (
            <div className="comments-list">
              {comments.map((c, i) => (
                <div key={c.id || i} className="comment">
                  <div className="comment-avatar">{initials(c.name)}</div>
                  <div className="comment-content">
                    <div className="comment-name">{c.name}</div>
                    <div className="comment-body">{c.body}</div>
                    <div className="comment-time">{relativeTime(c.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form className="comment-form" onSubmit={handleComment}>
            <div className="comment-form-fields">
              <input
                className="comment-name-input"
                placeholder="Your name"
                value={commentName}
                onChange={e => setCommentName(e.target.value)}
                maxLength={60}
              />
              <textarea
                className="comment-input"
                placeholder="Add a comment…"
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                maxLength={600}
                rows={2}
              />
            </div>
            <button
              type="submit"
              className="comment-submit"
              disabled={!commentBody.trim() || submittingComment}
            >
              {submittingComment ? '…' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
