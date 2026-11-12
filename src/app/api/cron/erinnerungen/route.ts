import { NextResponse, type NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { sendDueReminders } from '@/lib/bookings'
import { isDatabaseConfigured } from '@/lib/db'
import { notifyAdminError } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/erinnerungen – sendet Terminerinnerungen für den Folgetag.
 * Wird von Vercel Cron täglich aufgerufen (vercel.json). Geschützt über CRON_SECRET:
 * Vercel sendet automatisch "Authorization: Bearer <CRON_SECRET>". Ohne CRON_SECRET ist der Endpunkt gesperrt.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET ist nicht gesetzt.' }, { status: 503 })
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Keine Datenbank verbunden.' }, { status: 503 })
  try {
    return NextResponse.json({ ok: true, ...(await sendDueReminders()) })
  } catch (err) {
    console.error('[cron/erinnerungen]', err)
    void notifyAdminError('Terminerinnerungen', err)
    return NextResponse.json({ error: 'Fehler beim Versand.' }, { status: 500 })
  }
}
