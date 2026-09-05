import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { id } = await params
  const member = await prisma.member.findUnique({
    where: { id },
    include: { loans: { where: { status: 'borrowed' }, include: { book: true } } },
  })

  if (!member) return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
  return NextResponse.json(member)
}
