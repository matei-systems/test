import { NextResponse, type NextRequest } from 'next/server'
import { createBooking } from '@/lib/bookings'
import { DatabaseNotConfiguredError } from '@/lib/db'
import { notifyAdminError } from '@/lib/email'
import { isSameOrigin } from '@/lib/http'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { bookingRequestSchema, fieldErrors } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings – Buchung bzw. Terminanfrage.
 * Antwortet nur dann mit 201, wenn der Termin geprüft und dauerhaft in der Datenbank gespeichert wurde.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Ungültige Herkunft der Anfrage.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const parsed = bookingRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bitte prüfen Sie Ihre Angaben.', fields: fieldErrors(parsed.error) }, { status: 422 })
  }

  try {
    const limit = await rateLimit('booking', clientIp(request.headers), 10, 60 * 60)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Buchungsversuche. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      )
    }

    const result = await createBooking(parsed.data)
    if (!result.ok) {
      const status = result.code === 'slot_unavailable' || result.code === 'price_changed' ? 409 : result.code === 'server' ? 500 : 422
      return NextResponse.json({ error: result.error, code: result.code, fields: result.fields }, { status })
    }
    return NextResponse.json(
      {
        reference: result.reference,
        token: result.token,
        status: result.status,
        kind: result.kind,
        startsAt: result.startsAt.toISOString(),
        customerEmailStatus: result.customerEmailStatus,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[api/bookings]', err)
    const notConfigured = err instanceof DatabaseNotConfiguredError
    if (!notConfigured) void notifyAdminError('Buchung speichern', err)
    return NextResponse.json(
      { error: 'Die Buchung konnte technisch nicht gespeichert werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.', code: 'server' },
      { status: notConfigured ? 503 : 500 },
    )
  }
}
