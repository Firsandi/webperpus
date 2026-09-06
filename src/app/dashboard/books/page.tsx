'use client'
import { useEffect, useState, useCallback } from 'react'
import UserHeader from '@/components/UserHeader'

interface Book {
  id: string; bookCode?: string; title: string; category: string; totalCopies: number
  borrowedCount: number; availableCopies: number
}

interface Category { id: string; name: string }

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [form, setForm] = useState({ bookCode: '', title: '', category: '', totalCopies: 1 })

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (catFilter) params.set('category', catFilter)
    const res = await fetch(`/api/books?${params}`)
    const data = await res.json()
    setBooks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, catFilter])

  useEffect(() => {
    let ignore = false
    async function loadCategories() {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (!ignore) {
        setCategories(Array.isArray(data) ? data : [])
      }
    }
    loadCategories()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchBooks, 300)
    return () => clearTimeout(t)
  }, [fetchBooks])

  function openAdd() {
    setEditBook(null)
    setForm({ bookCode: '', title: '', category: '', totalCopies: 1 })
    setShowModal(true)
  }

  function openEdit(book: Book) {
    setEditBook(book)
    setForm({ bookCode: book.bookCode || '', title: book.title, category: book.category, totalCopies: book.totalCopies })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editBook ? `/api/books/${editBook.id}` : '/api/books'
      const method = editBook ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) showToast(data.error, 'error')
      else {
        showToast(editBook ? 'Buku berhasil diperbarui' : 'Buku berhasil ditambahkan')
        setShowModal(false)
        fetchBooks()
      }
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Hapus buku "${title}"?`)) return
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) { showToast('Buku dihapus'); fetchBooks() }
    else showToast(data.error, 'error')
  }

  const getAvailColor = (avail: number, total: number) => {
    if (avail === 0) return 'var(--danger)'
    if (avail < total / 2) return 'var(--warning)'
    return 'var(--success)'
  }

  return (
    <>
      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}

      <div className="topbar">
        <div className="topbar-title">Daftar Buku</div>
        <div className="topbar-right">
          <button id="add-book-btn" className="btn btn-primary" onClick={openAdd}>
            + Tambah Buku
          </button>
          <UserHeader />
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <span>🔍</span>
            <input placeholder="Cari judul, kode, atau kategori..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ width: 'auto', padding: '9px 14px' }}
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <span className="text-sm text-muted">{books.length} buku</span>
        </div>

        <div className="card">
          <div className="table-wrapper">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 12px', width: 32, height: 32 }} />
                <p style={{ color: 'var(--gray-400)' }}>Memuat data...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>Belum ada buku</h3>
                <p>Klik &quot;Tambah Buku&quot; untuk menambahkan buku baru</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Kode Buku</th>
                    <th>Nama Buku</th>
                    <th>Jenis / Kategori</th>
                    <th>Total Buku</th>
                    <th>Dipinjam</th>
                    <th>Sisa Buku</th>
                    <th>Ketersediaan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(book => (
                    <tr key={book.id}>
                      <td>
                        <span className="badge badge-gray" style={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                          {book.bookCode || '–'}
                        </span>
                      </td>
                      <td className="font-semibold">{book.title}</td>
                      <td><span className="badge badge-lilac">{book.category}</span></td>
                      <td style={{ textAlign: 'center' }}>{book.totalCopies}</td>
                      <td style={{ textAlign: 'center' }}>
                        {book.borrowedCount > 0
                          ? <span className="badge badge-yellow">{book.borrowedCount}</span>
                          : <span className="text-muted">0</span>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: getAvailColor(book.availableCopies, book.totalCopies) }}>
                        {book.availableCopies}
                      </td>
                      <td>
                        <div style={{
                          background: 'var(--gray-100)', borderRadius: 99,
                          height: 8, width: 100, overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${(book.availableCopies / book.totalCopies) * 100}%`,
                            background: getAvailColor(book.availableCopies, book.totalCopies),
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(book)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(book.id, book.title)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editBook ? '✏️ Edit Buku' : '➕ Tambah Buku'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="book-code">Kode Buku</label>
                  <input id="book-code" type="text" placeholder="Masukkan kode buku"
                    value={form.bookCode} onChange={e => setForm(f => ({ ...f, bookCode: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label htmlFor="book-title">Judul Buku</label>
                  <input id="book-title" type="text" placeholder="Masukkan judul buku"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label htmlFor="book-cat">Kategori / Jenis</label>
                  <select id="book-cat" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                    <option value="">Pilih kategori...</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="book-copies">Jumlah Total Eksemplar</label>
                  <input id="book-copies" type="number" min={1} max={100}
                    value={form.totalCopies} onChange={e => setForm(f => ({ ...f, totalCopies: parseInt(e.target.value, 10) || 1 }))} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="loading-spinner" />Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
