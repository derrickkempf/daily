import { readJSON } from '@/lib/storage'
import { getAdminSession } from '@/lib/admin'
import TimelineClient from './TimelineClient'

export const metadata = {
  title: 'Timeline — The Work',
  description: 'A living record of creative evolution.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const posts = (await readJSON('feed', [])) || []
  posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const adminSession = await getAdminSession()

  return <TimelineClient posts={posts} isAdmin={!!adminSession} />
}
