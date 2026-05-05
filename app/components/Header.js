'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import SignInPill from './SignInPill'

export default function Header() {
  const path = usePathname() || '/'
  const [session, setSession] = useState({ user: null, isAdmin: false })

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(r => r.json())
      .then(setSession)
      .catch(() => {})
  }, [path])

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          Derrick Kempf <small>Timeline</small>
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/" className={path === '/' ? 'active' : ''}>Timeline</Link>
          <Link href="/about" className={path.startsWith('/about') ? 'active' : ''}>About</Link>
          {session.isAdmin && <Link href="/admin" className={path.startsWith('/admin') ? 'active' : ''}>Admin</Link>}
          <SignInPill session={session} onChange={setSession} />
        </nav>
      </div>
    </header>
  )
}
