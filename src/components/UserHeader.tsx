'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function UserHeader() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <div className="user-chip">
        <div className="user-avatar">AD</div>
        <span>Admin</span>
      </div>
      <button
        className="btn btn-danger btn-sm"
        onClick={handleLogout}
        disabled={loggingOut}
        id="logout-btn"
        title="Keluar dari sistem"
      >
        <span>{loggingOut ? '⏳' : '🚪'}</span>
        {loggingOut ? 'Keluar...' : 'Keluar'}
      </button>
    </div>
  )
}
