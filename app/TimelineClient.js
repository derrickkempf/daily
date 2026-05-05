'use client'
import { useState, useCallback } from 'react'
import PostCard from './components/PostCard'
import ComposeModal from './components/ComposeModal'

function groupByYear(posts) {
  const groups = {}
  for (const p of posts) {
    const year = new Date(p.createdAt).getFullYear()
    if (!groups[year]) groups[year] = []
    groups[year].push(p)
  }
  return Object.entries(groups).sort((a, b) => b[0] - a[0])
}

export default function TimelineClient({ posts: initial, isAdmin }) {
  const [posts, setPosts] = useState(initial)
  const [composeOpen, setComposeOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 2800)
  }, [])

  const handlePosted = useCallback((newPost) => {
    setPosts(prev => [newPost, ...prev])
    setComposeOpen(false)
    showToast('Posted ✓')
  }, [showToast])

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete this post?')) return
    const r = await fetch(`/api/feed?id=${id}`, { method: 'DELETE' })
    if (r.ok) {
      setPosts(prev => prev.filter(p => p.id !== id))
      showToast('Deleted')
    } else {
      showToast('Delete failed', 'err')
    }
  }, [showToast])

  const years = groupByYear(posts)

  return (
    <>
      <main className="pd-container timeline">
        <div className="timeline-header">
          <div>
            <h1 className="timeline-title">Timeline</h1>
            <p className="timeline-sub">A record of the practice — sketches, paintings, and experiments.</p>
          </div>
          {isAdmin && (
            <button className="pd-btn pd-btn--primary" onClick={() => setComposeOpen(true)}>
              + New post
            </button>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="empty">
            <p>Nothing here yet.</p>
            {isAdmin && (
              <p className="empty-sub">
                <button style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }} onClick={() => setComposeOpen(true)}>
                  Post the first piece →
                </button>
              </p>
            )}
          </div>
        ) : (
          years.map(([year, yearPosts]) => (
            <div key={year}>
              <div className="year-marker">
                <span className="year-num">{year}</span>
                <div className="year-line" />
              </div>
              {yearPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  showToast={showToast}
                />
              ))}
            </div>
          ))
        )}
      </main>

      {isAdmin && (
        <ComposeModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onPosted={handlePosted}
          showToast={showToast}
        />
      )}

      {toast && (
        <div className={`pd-toast show ${toast.kind}`}>{toast.msg}</div>
      )}
    </>
  )
}
