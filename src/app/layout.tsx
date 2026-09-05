import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PerpusLib - Sistem Peminjaman Buku',
  description: 'Sistem manajemen peminjaman buku perpustakaan',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
