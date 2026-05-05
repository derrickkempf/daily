import { getAdminSession } from '@/lib/admin'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Admin — Timeline',
}

export default async function AdminPage({ searchParams }) {
  const sp = (await searchParams) || {}
  const isAdmin = !!(await getAdminSession())
  return (
    <main className="container container--prose" style={{ padding: 'var(--space-12) 0 var(--space-20)' }}>
      <h1 style={{
        fontSize: 'var(--text-3xl)',
        fontWeight: 500,
        letterSpacing: 'var(--tracking-tight)',
        margin: '0 0 var(--space-8)',
      }}>Admin</h1>
      {isAdmin
        ? <AdminDashboard
            successProvider={sp.social_connected || null}
            errorMessage={sp.social_error || null}
          />
        : <AdminLogin />}
    </main>
  )
}
