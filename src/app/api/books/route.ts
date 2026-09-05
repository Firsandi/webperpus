import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const category = searchParams.get('category')

  const books = await prisma.book.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        category ? { category: { equals: category, mode: 'insensitive' } } : {},
      ],
    },
    include: {
      loans: {
        where: { status: 'borrowed' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const booksWithStats = books.map((book) => ({
    ...book,
    borrowedCount: book.loans.length,
    availableCopies: book.totalCopies - book.loans.length,
  }))

  return NextResponse.json(booksWithStats)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  try {
    const { bookCode, title, category, totalCopies } = await req.json()

    if (!bookCode || !title || !category) {
      return NextResponse.json({ error: 'Kode buku, judul, dan kategori diperlukan' }, { status: 400 })
    }

    // Check if bookCode already exists
    const existing = await prisma.book.findUnique({
      where: { bookCode: bookCode.trim() },
    })
    if (existing) {
      return NextResponse.json({ error: 'Kode buku sudah digunakan' }, { status: 400 })
    }

    const book = await prisma.book.create({
      data: { bookCode: bookCode.trim(), title, category, totalCopies: totalCopies || 1 },
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
