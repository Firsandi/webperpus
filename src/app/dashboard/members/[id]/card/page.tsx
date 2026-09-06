'use client'
import { useEffect, useState } from 'react'

interface Member {
  id: string; name: string; nim: string; photo: string | null
  address?: string; phone?: string; expiredAt?: string; active: boolean
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MemberCardPage({ params }: { params: Promise<{ id: string }> }) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState('')

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/members/${id}`)
      .then(r => r.json())
      .then(d => { setMember(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
      Memuat kartu...
    </div>
  )

  if (!member) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
      Anggota tidak ditemukan.
    </div>
  )

  const today = new Date()
  const dateStr = today.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #e8e8e8; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', Arial, sans-serif; padding: 20px; }
        .print-btn { margin-bottom: 20px; padding: 10px 28px; background: #5b4ccc; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(91,76,204,0.3); }
        .print-btn:hover { background: #4a3cb5; }
        .card-wrapper { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 100%; }

        /* FRONT & BACK CARDS */
        .card-front, .card-back { width: 428px; height: 270px; background: #ffffff; padding: 16px 18px 12px; display: flex; flex-direction: column; position: relative; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); flex-shrink: 0; }
        .front-top { display: flex; align-items: flex-start; gap: 10px; }
        .front-logo-area { display: flex; gap: 6px; align-items: center; }
        .front-header-text { flex: 1; }
        .front-header-text .org-label { font-size: 9px; color: #555; letter-spacing: 0.5px; text-transform: uppercase; }
        .front-header-text .org-name { font-size: 12px; font-weight: 900; color: #1a1a2e; letter-spacing: 0.3px; }
        .member-photo { width: 68px; height: 85px; object-fit: cover; border: 2px solid #ddd; border-radius: 4px; flex-shrink: 0; }
        .photo-placeholder { width: 68px; height: 85px; background: #dde; border: 2px solid #ccc; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #999; flex-shrink: 0; }
        
        .front-middle { display: flex; gap: 12px; margin-top: 8px; flex: 1; }
        .member-info { flex: 1; display: flex; flex-direction: column; }
        .member-name { font-size: 16px; font-weight: 900; color: #1a1a2e; line-height: 1.15; text-transform: uppercase; }
        .member-nim { font-size: 11px; font-weight: 700; color: #5b4ccc; margin-top: 2px; }
        .member-label { font-size: 9px; color: #888; margin-top: 4px; }
        .member-address { font-size: 10px; color: #444; margin-top: 1px; line-height: 1.2; }
        .member-phone { font-size: 10px; color: #444; margin-top: 2px; }
        .exp-line { font-size: 9px; color: #555; margin-top: auto; }
        .exp-line strong { color: #1a1a2e; }

        /* SIGN SECTION ON FRONT */
        .sign-section-front { width: 140px; display: flex; flex-direction: column; align-items: flex-end; text-align: right; justify-content: flex-end; }
        .sign-date { font-size: 9px; color: #555; }
        .sign-title { font-size: 9px; font-weight: 700; color: #1a1a2e; line-height: 1.1; }

        /* BACK */
        .rules-title { font-size: 12px; font-weight: 700; color: #1a1a2e; margin-bottom: 10px; }
        .rules-list { list-style: disc; padding-left: 16px; }
        .rules-list li { font-size: 11px; color: #444; margin-bottom: 6px; line-height: 1.4; }
        .back-bottom { margin-top: auto; }
        .footer-bar { display: flex; align-items: flex-end; gap: 10px; border-top: 1px solid #e0e0e0; padding-top: 10px; }
        .footer-org { font-size: 10px; font-weight: 700; color: #1a1a2e; }
        .footer-addr { font-size: 9px; color: #888; }

        @media (max-width: 480px) {
          .card-front, .card-back { width: 100%; max-width: 428px; transform: scale(0.92); transform-origin: center; margin: -10px 0; }
        }

        @media print {
          body { background: white; padding: 0; }
          .print-btn { display: none !important; }
          .card-wrapper { gap: 0; }
          .card-front, .card-back { box-shadow: none; border-radius: 0; transform: none; }
          .card-front { border-right: 1.5px dashed #ccc; }
        }
      `}</style>

      <button className="print-btn" onClick={() => window.print()}>🖨️ Cetak Kartu</button>

      <div className="card-wrapper">
        {/* DEPAN */}
        <div className="card-front">
          <div className="front-top">
            <div className="front-logo-area">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/himafi-logo.png" alt="Himafi" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'contain' }} />
            </div>
            <div className="front-header-text">
              <div className="org-label">Kartu Anggota Perpustakaan</div>
              <div className="org-name">PHYSICS EDU DIGILIB</div>
            </div>
            <div>
              {member.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photo} alt={member.name} className="member-photo" />
              ) : (
                <div className="photo-placeholder">👤</div>
              )}
            </div>
          </div>

          <div className="front-middle">
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-nim">NIM: {member.nim}</div>

              <div className="member-label">Alamat:</div>
              <div className="member-address">{member.address || 'Universitas Jember'}</div>

              {member.phone && (
                <div className="member-phone">HP: {member.phone}</div>
              )}

              {member.expiredAt && (
                <div className="exp-line">Exp: <strong>{formatDate(member.expiredAt)}</strong></div>
              )}
            </div>

            {/* Tanda tangan dipindah ke halaman depan di samping data diri */}
            <div className="sign-section-front">
              <div className="sign-date">Jember, {dateStr}</div>
              <div className="sign-title">Koordinator Pendidikan Fisika</div>
              <div style={{ height: 40, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '2px 0' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ttd.jpeg" alt="TTD" style={{ maxHeight: 38, objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 8, fontWeight: 700, borderTop: '1px solid #333', paddingTop: 2, textTransform: 'none', width: '100%' }}>
                Rayendra Wahyu Bachtiar, S.Pd., M.Pd., Ph.D.
              </div>
              <div style={{ fontSize: 7.5, color: '#555' }}>
                NIP. 198901192012121001
              </div>
            </div>
          </div>
        </div>

        {/* BELAKANG */}
        <div className="card-back">
          <div className="rules-title">Aturan Perpustakaan</div>
          <ul className="rules-list">
            <li>Kartu ini diterbitkan oleh Himafi Neutron.</li>
            <li>Apabila menemukan kartu ini di jalan, dimohon untuk dikembalikan ke yang bersangkutan.</li>
            <li>Kartu ini tidak dapat dipindahtangankan.</li>
            <li>Wajib menunjukkan kartu ini saat meminjam buku.</li>
          </ul>

          <div className="back-bottom">
            <div className="footer-bar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/unej-logo.png" alt="UNEJ" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain' }} />
              <div style={{ flex: 1 }}>
                <div className="footer-org">PHYSICS EDU DIGILIB</div>
                <div className="footer-addr">Jl. Kalimantan Tegalboto No.37, Jember</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
