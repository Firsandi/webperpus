'use client'
import { useEffect, useState, useCallback } from 'react'
import UserHeader from '@/components/UserHeader'

interface Member { id: string; name: string; nim: string }
interface Book { id: string; bookCode?: string; title: string; category: string; availableCopies?: number }
interface Loan {
  id: string
  borrowedAt: string
  dueDate: string
  returnedAt: string | null
  status: string
  fine: number
  member: Member
  book: Book
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
}

function formatRupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ memberId:'', bookId:'', dueDate:'' })

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchLoans = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    if (search) params.set('search', search)
    const res = await fetch(`/api/loans?${params}`)
    const data = await res.json()
    setLoans(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [filter, search])

  useEffect(() => {
    const t = setTimeout(fetchLoans, 300)
    return () => clearTimeout(t)
  }, [fetchLoans])

  useEffect(() => {
    fetch('/api/members').then(r=>r.json()).then(d => setMembers(Array.isArray(d) ? d : []))
    fetch('/api/books').then(r=>r.json()).then(d => setBooks(Array.isArray(d) ? d : []))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/loans', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) showToast(data.error, 'error')
      else { showToast('Peminjaman berhasil ditambahkan'); setShowModal(false); setForm({memberId:'',bookId:'',dueDate:''}); fetchLoans() }
    } finally { setSubmitting(false) }
  }

  async function handleReturn(id: string) {
    if (!confirm('Tandai buku ini sudah dikembalikan?')) return
    const res = await fetch(`/api/loans/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:'{}' })
    if (res.ok) { showToast('Buku berhasil dikembalikan'); fetchLoans() }
    else showToast('Gagal mengembalikan buku', 'error')
  }

  async function handleExtend(id: string) {
    if (!confirm('Perpanjang durasi peminjaman buku ini sebanyak 7 hari?')) return
    const res = await fetch(`/api/loans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'extend' }),
    })
    const data = await res.json()
    if (res.ok) {
      showToast('Peminjaman berhasil diperpanjang 7 hari')
      fetchLoans()
    } else {
      showToast(data.error || 'Gagal memperpanjang peminjaman', 'error')
    }
  }

  function openAddModal() {
    const defaultDue = new Date()
    defaultDue.setDate(defaultDue.getDate() + 7)
    setForm({
      memberId: '',
      bookId: '',
      dueDate: defaultDue.toISOString().split('T')[0],
    })
    setShowModal(true)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div className="topbar">
        <div className="topbar-title">Peminjaman</div>
        <div className="topbar-right">
          <button id="add-loan-btn" className="btn btn-primary" onClick={openAddModal}>
            + Tambah Peminjaman
          </button>
          <UserHeader />
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
            <span>🔍</span>
            <input
              placeholder="Cari kode buku, NIM, nama, judul..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2" style={{ flexShrink: 0 }}>
            {['all','borrowed','returned'].map(s => (
              <button
                key={s}
                className={`btn ${filter===s ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setFilter(s)}
              >
                {s==='all'?'Semua':s==='borrowed'?'Dipinjam':'Dikembalikan'}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted">{loans.length} data</span>
        </div>

        <div className="card">
          <div className="table-wrapper">
            {loading ? (
              <div style={{textAlign:'center',padding:'60px'}}>
                <div className="loading-spinner" style={{margin:'0 auto 12px',width:32,height:32}}/>
                <p style={{color:'var(--gray-400)'}}>Memuat data...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>Tidak ada data peminjaman</h3>
                {search && <p>Tidak ditemukan untuk pencarian &quot;{search}&quot;</p>}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Kode Buku</th>
                    <th>Nama Peminjam</th>
                    <th>Nama Buku</th>
                    <th>Jenis Buku</th>
                    <th>Tgl Pinjam</th>
                    <th>Jatuh Tempo</th>
                    <th>Status</th>
                    <th>Denda</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => {
                    const overdue = loan.status==='borrowed' && new Date(loan.dueDate)<new Date()
                    return (
                      <tr key={loan.id}>
                        <td>
                          <span className="badge badge-gray" style={{fontFamily:'monospace',letterSpacing:1}}>
                            {loan.book.bookCode || '-'}
                          </span>
                        </td>
                        <td>
                          <div className="font-semibold">{loan.member.name}</div>
                          <div className="text-sm text-muted">NIM: {loan.member.nim}</div>
                        </td>
                        <td>{loan.book.title}</td>
                        <td><span className="badge badge-lilac">{loan.book.category}</span></td>
                        <td>{formatDate(loan.borrowedAt)}</td>
                        <td style={{color: overdue?'var(--danger)':'inherit', fontWeight: overdue?600:400}}>
                          {formatDate(loan.dueDate)}
                        </td>
                        <td>
                          {loan.status==='returned'
                            ? <span className="badge badge-green">✓ Dikembalikan</span>
                            : overdue
                              ? <span className="badge badge-red">⚠ Terlambat</span>
                              : <span className="badge badge-yellow">📖 Dipinjam</span>}
                        </td>
                        <td>
                          {loan.fine > 0
                            ? <span className="fine-amount">{formatRupiah(loan.fine)}</span>
                            : <span className="fine-zero">-</span>}
                        </td>
                        <td>
                          {loan.status==='borrowed' && (
                            <div className="flex gap-2">
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleExtend(loan.id)}
                                title="Perpanjang 7 Hari"
                              >
                                ⏳ Perpanjang
                              </button>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleReturn(loan.id)}
                              >
                                ✓ Kembalikan
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>➕ Tambah Peminjaman</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="loan-member">Anggota</label>
                  <select id="loan-member" value={form.memberId} onChange={e=>setForm(f=>({...f,memberId:e.target.value}))} required>
                    <option value="">Pilih anggota...</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} - {m.nim}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="loan-book">Buku</label>
                  <select id="loan-book" value={form.bookId} onChange={e=>setForm(f=>({...f,bookId:e.target.value}))} required>
                    <option value="">Pilih buku...</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bookCode ? `[${b.bookCode}] ` : ''}{b.title} ({b.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="loan-due">Tanggal Jatuh Tempo (Default 7 Hari)</label>
                  <input id="loan-due" type="date" min={today} value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="loading-spinner"/>Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
