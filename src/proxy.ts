import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

/**
 * Vorgelagerter Schutz des Admin-Bereichs (zusätzliche Verteidigungslinie).
 * Ohne gültige Admin-Session werden /admin/* und /api/admin/* gar nicht erst gerendert.
 * Die eigentliche Prüfung findet zusätzlich in jeder Admin-Seite, jeder Server-Action und
 * in der Datenzugriffsschicht statt (requireAdmin).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin/login') return NextResponse.next()
  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  return NextResponse.redirect(new URL('/admin/login', request.url))
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
