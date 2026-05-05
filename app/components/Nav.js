'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function Nav() {
  const pathname = usePathname() || ''
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y > lastY.current && y > 80) setHidden(true)
      else setHidden(false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={hidden ? 'nav-hidden' : ''}>
      <div className="nav-left">
        <Link href="/" className="nav-wordmark">The Work</Link>
        <span className="nav-tagline">A creative timeline by Derrick Kempf.</span>
      </div>
      <div className="nav-right">
        <Link href="/" className={`nav-pill${pathname === '/' ? ' active' : ''}`}>Timeline</Link>
        <Link href="/about" className={`nav-pill${pathname === '/about' ? ' active' : ''}`}>About</Link>
      </div>
    </nav>
  )
}
