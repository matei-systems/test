import { NextResponse, type NextRequest } from 'next/server'
import { createBooking } from '@/lib/bookings'
import { DatabaseNotConfiguredError } from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { bookingRequestSchema, fieldErrors } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings – verbindliche Buchung.
 * Antwortet nur dann mit 201, wenn die Buchung dauerhaft in der Datenbank gespeichert wurde.
 */
export async function POST(request: NextRequest) {
  // Schutz vor Cross-Site-Requests: Nur Anfragen von der eigenen Website annehmen
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host || new URL(origin).host !== host) {
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
    return NextResponse.json({ error: 'Bitte prüfe deine Angaben.', fields: fieldErrors(parsed.error) }, { status: 422 })
  }

  try {
    const limit = await rateLimit('booking', clientIp(request.headers), 10, 60 * 60)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Buchungsversuche. Bitte versuche es später erneut oder kontaktiere uns direkt.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      )
    }

    const result = await createBooking(parsed.data)
    if (!result.ok) {
      const status = result.code === 'slot_unavailable' ? 409 : result.code === 'server' ? 500 : 422
      return NextResponse.json({ error: result.error, code: result.code, fields: result.fields }, { status })
    }
    return NextResponse.json(
      {
        reference: result.reference,
        token: result.token,
        status: result.status,
        startsAt: result.startsAt.toISOString(),
        customerEmailStatus: result.customerEmailStatus,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[api/bookings]', err)
    const status = err instanceof DatabaseNotConfiguredError ? 503 : 500
    return NextResponse.json(
      { error: 'Die Buchung konnte technisch nicht gespeichert werden. Bitte versuche es erneut oder kontaktiere uns direkt.' },
      { status },
    )
  }
}
