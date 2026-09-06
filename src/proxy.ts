import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  // Allow static files (images, fonts, icons, etc.)
  if (req.nextUrl.pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$/)) {
    return NextResponse.next()
  }

  const isLoginPage = req.nextUrl.pathname === '/login'
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')

  // Allow auth API routes without authentication
  if (isApiAuth) return NextResponse.next()

  if (!token) {
    if (isLoginPage) return NextResponse.next()
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = await verifyToken(token)

  if (!payload) {
    if (isLoginPage) return NextResponse.next()
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.set('token', '', { maxAge: 0 })
    return response
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
