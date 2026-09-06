import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

function calculateFine(dueDate: Date, returnedAt?: Date | null): number {
  const checkDate = returnedAt || new Date()
  const due = new Date(dueDate)
  const diff = Math.floor((checkDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff * 500 : 0
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  if (search) {
    where.OR = [
      { book: { bookCode: { contains: search, mode: 'insensitive' } } },
      { member: { nim: { contains: search, mode: 'insensitive' } } },
      { member: { name: { contains: search, mode: 'insensitive' } } },
      { book: { title: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const loans = await prisma.bookLoan.findMany({
    where,
    include: { member: true, book: true },
    orderBy: { borrowedAt: 'desc' },
  })

  const loansWithFine = loans.map((loan) => ({
    ...loan,
    fine: calculateFine(loan.dueDate, loan.returnedAt),
  }))

  return NextResponse.json(loansWithFine)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  try {
    const body = (await req.json()) as { memberId?: string; bookId?: string; dueDate?: string }
    const { memberId, bookId } = body
    let { dueDate } = body

    if (!memberId || !bookId) {
      return NextResponse.json({ error: 'Anggota dan Buku wajib dipilih' }, { status: 400 })
    }

    // Default to 7 days from now if not explicitly passed
    if (!dueDate) {
      const defaultDue = new Date()
      defaultDue.setDate(defaultDue.getDate() + 7)
      dueDate = defaultDue.toISOString().split('T')[0]
    }

    // Check book availability
    const book = await prisma.book.findUnique({ where: { id: bookId } })
    if (!book) return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 })

    const activeLoanCount = await prisma.bookLoan.count({
      where: { bookId, status: 'borrowed' },
    })

    if (activeLoanCount >= book.totalCopies) {
      return NextResponse.json({ error: 'Stok buku tidak tersedia' }, { status: 400 })
    }

    const loan = await prisma.bookLoan.create({
      data: {
        memberId,
        bookId,
        dueDate: new Date(dueDate),
        status: 'borrowed',
      },
      include: { member: true, book: true },
    })

    return NextResponse.json(loan, { status: 201 })
  } catch (error) {
    console.error('Error creating loan:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
