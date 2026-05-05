import { query } from '@/lib/db'
import { getAdminSession } from '@/lib/admin'
import { getSession } from '@/lib/auth'
import Timeline from './components/Timeline'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Timeline — Derrick Kempf',
  description: 'A chronological feed of art in progress.',
}

async function loadInitialPosts(email) {
  const params = email ? [email] : []
  return query(
    `SELECT p.id, p.kind, p.caption, p.media_url, p.media_type, p.width, p.height, p.created_at,
            COALESCE((SELECT COUNT(*) FROM post_likes l    WHERE l.post_id = p.id), 0)::int  AS like_count,
            COALESCE((SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id), 0)::int  AS comment_count,
            COALESCE((SELECT COUNT(*) FROM post_shares  s  WHERE s.post_id = p.id), 0)::int  AS share_count,
            ${email
              ? `EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.email = $1)`
              : `false`} AS liked
       FROM posts p
       ORDER BY p.created_at DESC
       LIMIT 30`,
    params
  )
}

export default async function HomePage() {
  let posts = []
  let isAdmin = false
  let signedIn = false

  try {
    const [admin, session] = await Promise.all([getAdminSession(), getSession()])
    isAdmin  = !!admin
    signedIn = !!session?.email
    posts = await loadInitialPosts(session?.email || null)
  } catch (err) {
    // If the DB isn't ready yet (no env vars), still render the empty shell.
    console.warn('[home] could not load posts:', err.message)
  }

  return (
    <main className="container container--feed timeline">
      <header className="timeline__head">
        <h1 className="timeline__title">Timeline.</h1>
        <p className="timeline__sub">
          A chronological record of what I&apos;m making. Drag, drop, post, repeat.
        </p>
      </header>
      <Timeline initialPosts={posts} isAdmin={isAdmin} signedIn={signedIn} />
    </main>
  )
}
