import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalBorrowed, activeMembers, overdueBooks, recentLoans] = await Promise.all([
    prisma.bookLoan.count({ where: { status: 'borrowed' } }),
    prisma.member.count({ where: { active: true } }),
    prisma.bookLoan.count({
      where: {
        status: 'borrowed',
        dueDate: { lt: new Date() },
      },
    }),
    prisma.bookLoan.findMany({
      where: { status: 'borrowed' },
      include: {
        member: true,
        book: true,
      },
      orderBy: { borrowedAt: 'desc' },
      take: 5,
    }),
  ])

  return NextResponse.json({
    totalBorrowed,
    activeMembers,
    overdueBooks,
    recentLoans,
  })
}
