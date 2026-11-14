import { getBookingByToken } from '@/lib/bookings'
import { SITE } from '@/config/site'

export const dynamic = 'force-dynamic'

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** Kalendereintrag (.ics) für die eigene Buchung */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const b = await getBookingByToken(token)
  if (!b || b.status === 'storniert') return new Response('Nicht gefunden', { status: 404 })
  const end = new Date(b.startsAt.getTime() + b.durationMinutes * 60_000)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RM Mobile Auto Aufbereitung//Buchung//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${b.reference}@rm-autoaufbereitung`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(b.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(`${SITE.name}: ${b.serviceName}`)}`,
    `LOCATION:${esc(`${b.street} ${b.houseNumber}, ${b.postalCode} ${b.city}`.replace(/\s+,/, ','))}`,
    `DESCRIPTION:${esc(`Buchungsnummer ${b.reference}\nFahrzeug: ${b.vehicleCategoryName} – ${b.vehicleModel}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="rm-termin-${b.reference}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}
