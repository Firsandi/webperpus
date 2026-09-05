import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params
  const member = await prisma.member.findUnique({
    where: { id },
    include: { loans: { include: { book: true } } },
  })

  if (!member) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
  return NextResponse.json(member)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const member = await prisma.member.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(member)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  try {
    const { id } = await params

    // Check if member has active borrowed books
    const activeLoans = await prisma.bookLoan.count({
      where: { memberId: id, status: 'borrowed' },
    })

    if (activeLoans > 0) {
      return NextResponse.json(
        { error: 'Anggota masih memiliki pinjaman buku yang belum dikembalikan' },
        { status: 400 }
      )
    }

    // Delete loan history first, then delete member
    await prisma.bookLoan.deleteMany({ where: { memberId: id } })
    await prisma.member.delete({ where: { id } })

    return NextResponse.json({ message: 'Anggota berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json({ error: 'Gagal menghapus anggota' }, { status: 500 })
  }
}
