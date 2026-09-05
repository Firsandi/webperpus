'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/loans', icon: '📖', label: 'Peminjaman' },
  { href: '/dashboard/members', icon: '👥', label: 'Daftar Anggota' },
  { href: '/dashboard/books', icon: '📚', label: 'Daftar Buku' },
  { href: '/dashboard/categories', icon: '🏷️', label: 'Kategori' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'transparent', width: 44, height: 44 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/himafi-logo.png" alt="Himafi Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1>PENDIDIKAN FISIKA</h1>
          <p>Manajemen Perpustakaan</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
