import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getAvailableDays, getDayAvailability } from '@/lib/bookings'
import { DatabaseNotConfiguredError } from '@/lib/db'
import { dateSchema, quoteSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  service: quoteSchema.shape.serviceId,
  vehicle: quoteSchema.shape.vehicleId,
  addons: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : []))
    .pipe(z.array(z.string().regex(/^[a-z0-9-]{1,64}$/)).max(12)),
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
})

/**
 * GET /api/availability?service=…&vehicle=…&addons=a,b&date=YYYY-MM-DD   → freie Uhrzeiten eines Tages
 * GET /api/availability?service=…&vehicle=…&addons=a,b&from=…&to=…        → Tage mit freien Terminen
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  const { service, vehicle, addons, date, from, to } = parsed.data
  const input = { serviceId: service, vehicleId: vehicle, addonIds: addons }

  try {
    if (date) {
      const res = await getDayAvailability(date, input)
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 })
      return NextResponse.json({ date, slots: res.slots, durationMinutes: res.quote.durationMinutes })
    }
    if (from && to) {
      if (to < from) return NextResponse.json({ error: 'Ungültiger Zeitraum.' }, { status: 400 })
      const res = await getAvailableDays(from, to, input)
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 })
      return NextResponse.json(res)
    }
    return NextResponse.json({ error: 'Bitte date oder from/to angeben.' }, { status: 400 })
  } catch (err) {
    console.error('[api/availability]', err)
    const status = err instanceof DatabaseNotConfiguredError ? 503 : 500
    return NextResponse.json({ error: 'Die Verfügbarkeit konnte nicht geladen werden. Bitte versuchen Sie es später erneut.' }, { status })
  }
}
