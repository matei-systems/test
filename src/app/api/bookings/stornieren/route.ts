import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { cancelBookingByToken } from '@/lib/bookings'
import { notifyAdminError } from '@/lib/email'
import { isSameOrigin } from '@/lib/http'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const schema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{40,60}$/) })

/** POST /api/bookings/stornieren – Online-Stornierung über den persönlichen Bestätigungslink. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Ungültige Herkunft der Anfrage.' }, { status: 403 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  try {
    const limit = await rateLimit('cancel', clientIp(request.headers), 10, 60 * 60)
    if (!limit.allowed) return NextResponse.json({ error: 'Zu viele Versuche. Bitte später erneut versuchen.' }, { status: 429 })
    const result = await cancelBookingByToken(parsed.data.token)
    if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: result.code === 'not_found' ? 404 : 409 })
    return NextResponse.json({ ok: true, reference: result.reference })
  } catch (err) {
    console.error('[api/bookings/stornieren]', err)
    void notifyAdminError('Online-Stornierung', err)
    return NextResponse.json({ error: 'Die Stornierung konnte nicht durchgeführt werden. Bitte kontaktieren Sie uns direkt.' }, { status: 500 })
  }
}
