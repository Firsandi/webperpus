'use client'
import { useEffect, useState } from 'react'
import UserHeader from '@/components/UserHeader'

interface DashboardStats {
  totalBorrowed: number
  activeMembers: number
  overdueBooks: number
  recentLoans: Array<{
    id: string
    borrowedAt: string
    dueDate: string
    status: string
    member: { name: string; nim: string }
    book: { title: string; category: string }
  }>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function calcFine(dueDate: string) {
  const due = new Date(dueDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff * 500 : 0
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Dashboard</div>
        </div>
        <div className="topbar-right">
          <UserHeader />
        </div>
      </div>

      <div className="page-body">
        <div className="page-header">
          <div>
            <h2>Selamat Datang 👋</h2>
            <p>Ringkasan aktivitas perpustakaan hari ini</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'var(--gray-400)' }}>
            <div className="loading-spinner" style={{ margin:'0 auto 12px', width:32, height:32 }} />
            <p>Memuat data...</p>
          </div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-card lilac">
                <div className="stat-icon">📖</div>
                <div className="stat-value">{stats?.totalBorrowed ?? 0}</div>
                <div className="stat-label">Buku Dipinjam</div>
              </div>
              <div className="stat-card green">
                <div className="stat-icon">👥</div>
                <div className="stat-value">{stats?.activeMembers ?? 0}</div>
                <div className="stat-label">Anggota Aktif</div>
              </div>
              <div className="stat-card red">
                <div className="stat-icon">⚠️</div>
                <div className="stat-value">{stats?.overdueBooks ?? 0}</div>
                <div className="stat-label">Terlambat Dikembalikan</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>📋 Peminjaman Terkini</h2>
                <a href="/dashboard/loans" className="btn btn-outline btn-sm">Lihat Semua</a>
              </div>
              <div className="table-wrapper">
                {!stats?.recentLoans?.length ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>Belum ada peminjaman</h3>
                    <p>Belum ada buku yang sedang dipinjam</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Anggota</th>
                        <th>Buku</th>
                        <th>Kategori</th>
                        <th>Tgl Pinjam</th>
                        <th>Jatuh Tempo</th>
                        <th>Denda</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentLoans.map(loan => {
                        const fine = calcFine(loan.dueDate)
                        const isOverdue = new Date(loan.dueDate) < new Date()
                        return (
                          <tr key={loan.id}>
                            <td>
                              <div className="font-semibold">{loan.member.name}</div>
                              <div className="text-sm text-muted">{loan.member.nim}</div>
                            </td>
                            <td>{loan.book.title}</td>
                            <td><span className="badge badge-lilac">{loan.book.category}</span></td>
                            <td>{formatDate(loan.borrowedAt)}</td>
                            <td style={{ color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                              {formatDate(loan.dueDate)}
                            </td>
                            <td>
                              {fine > 0
                                ? <span className="fine-amount">Rp {fine.toLocaleString('id-ID')}</span>
                                : <span className="fine-zero">-</span>}
                            </td>
                            <td>
                              <span className={`badge ${isOverdue ? 'badge-red' : 'badge-green'}`}>
                                {isOverdue ? '⚠ Terlambat' : '✓ Aktif'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
