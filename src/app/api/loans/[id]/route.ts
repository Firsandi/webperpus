import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

function calculateFine(dueDate: Date, returnedAt?: Date | null): number {
  const checkDate = returnedAt || new Date()
  const due = new Date(dueDate)
  const diff = Math.floor((checkDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff * 500 : 0
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params
  const loan = await prisma.bookLoan.findUnique({
    where: { id },
    include: { member: true, book: true },
  })

  if (!loan) return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 })

  return NextResponse.json({ ...loan, fine: calculateFine(loan.dueDate, loan.returnedAt) })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const existingLoan = await prisma.bookLoan.findUnique({ where: { id } })
    if (!existingLoan) return NextResponse.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 })

    if (body.action === 'extend') {
      if (existingLoan.status === 'returned') {
        return NextResponse.json({ error: 'Buku yang sudah dikembalikan tidak dapat diperpanjang' }, { status: 400 })
      }

      // Add 7 days to the current due date
      const currentDue = new Date(existingLoan.dueDate)
      const newDueDate = new Date(currentDue.getTime() + 7 * 24 * 60 * 60 * 1000)

      const updatedLoan = await prisma.bookLoan.update({
        where: { id },
        data: {
          dueDate: newDueDate,
          status: 'borrowed',
        },
        include: { member: true, book: true },
      })

      return NextResponse.json({ ...updatedLoan, fine: calculateFine(updatedLoan.dueDate, updatedLoan.returnedAt) })
    }

    const loan = await prisma.bookLoan.update({
      where: { id },
      data: {
        returnedAt: body.returnedAt ? new Date(body.returnedAt) : new Date(),
        status: 'returned',
      },
      include: { member: true, book: true },
    })

    return NextResponse.json({ ...loan, fine: calculateFine(loan.dueDate, loan.returnedAt) })
  } catch (error) {
    console.error('Error updating loan:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params
  await prisma.bookLoan.delete({ where: { id } })
  return NextResponse.json({ message: 'Peminjaman dihapus' })
}
