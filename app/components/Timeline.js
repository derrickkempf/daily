'use client'
import { useEffect, useState } from 'react'
import PostCard from './PostCard'
import Composer from './Composer'

export default function Timeline({ initialPosts, isAdmin, signedIn }) {
  const [posts, setPosts] = useState(initialPosts || [])

  // Re-fetch posts after a new one is created so its `liked` flag etc. is correct.
  const refresh = async () => {
    try {
      const r = await fetch('/api/posts?limit=30', { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        setPosts(j.posts || [])
      }
    } catch {}
  }

  // On client mount, sync with the server (handy after sign-in)
  useEffect(() => { refresh() }, [signedIn])

  const onPosted = (post) => {
    setPosts(p => [{ ...post, like_count: 0, comment_count: 0, share_count: 0, liked: false }, ...p])
    refresh()
  }

  return (
    <>
      {isAdmin && <Composer onPosted={onPosted} />}

      {posts.length === 0 ? (
        <div className="empty">
          <p>The timeline is quiet. {isAdmin ? 'Drag in your first piece above.' : 'Check back soon.'}</p>
        </div>
      ) : (
        <div>
          {posts.map(p => (
            <PostCard
              key={p.id}
              post={p}
              isAdmin={isAdmin}
              signedIn={signedIn}
              onDeleted={() => setPosts(prev => prev.filter(x => x.id !== p.id))}
            />
          ))}
        </div>
      )}
    </>
  )
}
