import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params
  const book = await prisma.book.findUnique({
    where: { id },
    include: { loans: { include: { member: true } } },
  })

  if (!book) return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 })
  return NextResponse.json(book)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.bookCode) {
    body.bookCode = body.bookCode.trim()
    const existing = await prisma.book.findFirst({
      where: { bookCode: body.bookCode, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Kode buku sudah digunakan' }, { status: 400 })
    }
  }

  const book = await prisma.book.update({ where: { id }, data: body })
  return NextResponse.json(book)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params

  // Check for active loans
  const activeLoans = await prisma.bookLoan.count({ where: { bookId: id, status: 'borrowed' } })
  if (activeLoans > 0) {
    return NextResponse.json({ error: 'Buku masih dipinjam, tidak bisa dihapus' }, { status: 400 })
  }

  await prisma.book.delete({ where: { id } })
  return NextResponse.json({ message: 'Buku dihapus' })
}
