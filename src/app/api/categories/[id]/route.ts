import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  try {
    const { id } = await params
    const { name } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama kategori tidak boleh kosong' }, { status: 400 })
    }

    // Check if name already exists on another record
    const existing = await prisma.category.findFirst({
      where: { name: name.trim(), NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 409 })
    }

    const old = await prisma.category.findUnique({ where: { id } })
    if (!old) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })

    // Update category name and cascade update books that use this category
    const [category] = await prisma.$transaction([
      prisma.category.update({ where: { id }, data: { name: name.trim() } }),
      prisma.book.updateMany({ where: { category: old.name }, data: { category: name.trim() } }),
    ])

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  try {
    const { id } = await params
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })

    // Move books using this category to "Tidak Berkategori" then delete
    await prisma.$transaction([
      prisma.book.updateMany({
        where: { category: category.name },
        data: { category: 'Tidak Berkategori' },
      }),
      prisma.category.delete({ where: { id } }),
    ])

    return NextResponse.json({ message: 'Kategori dihapus' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
