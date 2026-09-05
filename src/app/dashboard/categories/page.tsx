'use client'
import { useEffect, useState, useCallback } from 'react'
import UserHeader from '@/components/UserHeader'

interface Category {
  id: string
  name: string
  createdAt: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [bookCounts, setBookCounts] = useState<Record<string, number>>({})

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const [catRes, bookRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/books'),
    ])
    const cats: Category[] = await catRes.json()
    const books: { category: string }[] = await bookRes.json()

    // Count books per category
    const counts: Record<string, number> = {}
    books.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1 })
    setBookCounts(counts)
    setCategories(Array.isArray(cats) ? cats : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  function openAdd() {
    setEditCat(null); setName(''); setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditCat(cat); setName(cat.name); setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editCat ? `/api/categories/${editCat.id}` : '/api/categories'
      const method = editCat ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) showToast(data.error, 'error')
      else {
        showToast(editCat ? 'Kategori diperbarui' : 'Kategori ditambahkan')
        setShowModal(false)
        fetchCategories()
      }
    } finally { setSubmitting(false) }
  }

  async function handleDelete(cat: Category) {
    const count = bookCounts[cat.name] || 0
    const msg = count > 0
      ? `Hapus kategori "${cat.name}"?\n\n${count} buku akan dipindahkan ke "Tidak Berkategori".`
      : `Hapus kategori "${cat.name}"?`
    if (!confirm(msg)) return
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) { showToast('Kategori dihapus'); fetchCategories() }
    else showToast(data.error, 'error')
  }

  return (
    <>
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div className="topbar">
        <div className="topbar-title">Manajemen Kategori</div>
        <div className="topbar-right">
          <button id="add-category-btn" className="btn btn-primary" onClick={openAdd}>
            + Tambah Kategori
          </button>
          <UserHeader />
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="table-wrapper">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 12px', width: 32, height: 32 }} />
                <p style={{ color: 'var(--gray-400)' }}>Memuat data...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏷️</div>
                <h3>Belum ada kategori</h3>
                <p>Klik &quot;Tambah Kategori&quot; untuk menambahkan kategori buku</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama Kategori</th>
                    <th style={{ textAlign: 'center' }}>Jumlah Buku</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => (
                    <tr key={cat.id}>
                      <td className="text-muted">{idx + 1}</td>
                      <td>
                        <span className="badge badge-lilac" style={{ fontSize: 13 }}>
                          🏷️ {cat.name}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {bookCounts[cat.name]
                          ? <span className="badge badge-yellow">{bookCounts[cat.name]} buku</span>
                          : <span className="text-muted">0 buku</span>}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(cat)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(cat)}
                          >
                            🗑️ Hapus
                          </button>
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
              <h3>{editCat ? '✏️ Edit Kategori' : '➕ Tambah Kategori'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="cat-name">Nama Kategori</label>
                  <input
                    id="cat-name"
                    type="text"
                    placeholder="Contoh: Teknologi, Sastra, Sains..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Batal
                </button>
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
