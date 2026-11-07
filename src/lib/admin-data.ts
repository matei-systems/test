import 'server-only'
import { getDb } from './db'
import { addDays, todayInZone, zonedToUtc } from './time'

/** Lesezugriffe für den Admin-Bereich (nur nach requireAdmin() verwenden!). */

export interface BookingRow {
  id: string
  reference: string
  status: string
  service_id: string | null
  service_name: string
  vehicle_category_id: string | null
  vehicle_category_name: string
  addons: Array<{ id: string; name: string; priceCents: number; priceIsFrom: boolean; durationMinutes: number }>
  service_price_cents: number | null
  total_price_cents: number | null
  price_is_from: boolean
  duration_minutes: number
  starts_at: Date
  ends_at: Date
  blocked_until: Date
  first_name: string
  last_name: string
  email: string
  phone: string
  street: string
  postal_code: string
  city: string
  vehicle_model: string
  license_plate: string | null
  customer_message: string | null
  customer_email_status: string
  admin_email_status: string
  admin_note: string | null
  anonymized_at: Date | null
  created_at: Date
  updated_at: Date
}

export type BookingScope = 'kommend' | 'vergangen' | 'alle' | 'heute' | 'woche'

export async function listBookings(opts: { status?: string; q?: string; scope?: BookingScope; limit?: number }) {
  const db = await getDb()
  const where: string[] = []
  const params: unknown[] = []
  const add = (sql: string, value: unknown) => {
    params.push(value)
    where.push(sql.replace('?', `$${params.length}`))
  }
  if (opts.status) add('status = ?', opts.status)
  if (opts.q) {
    const q = `%${opts.q.trim().toLowerCase()}%`
    params.push(q)
    const i = params.length
    where.push(
      `(lower(reference) LIKE $${i} OR lower(first_name || ' ' || last_name) LIKE $${i} OR lower(email) LIKE $${i} OR phone LIKE $${i} OR lower(coalesce(license_plate,'')) LIKE $${i} OR lower(city) LIKE $${i})`,
    )
  }
  const today = todayInZone()
  const startToday = zonedToUtc(today, '00:00')
  let order = 'starts_at ASC'
  switch (opts.scope ?? 'kommend') {
    case 'kommend':
      add('ends_at >= ?', startToday)
      break
    case 'vergangen':
      add('ends_at < ?', startToday)
      order = 'starts_at DESC'
      break
    case 'heute':
      add('starts_at >= ?', startToday)
      add('starts_at < ?', zonedToUtc(addDays(today, 1), '00:00'))
      break
    case 'woche':
      add('starts_at >= ?', startToday)
      add('starts_at < ?', zonedToUtc(addDays(today, 7), '00:00'))
      break
    case 'alle':
      order = 'starts_at DESC'
      break
  }
  const sql = `SELECT * FROM bookings ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order} LIMIT ${Math.min(opts.limit ?? 200, 500)}`
  const { rows } = await db.query<BookingRow>(sql, params)
  return rows
}

export async function getBooking(id: string): Promise<BookingRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const db = await getDb()
  const { rows } = await db.query<BookingRow>('SELECT * FROM bookings WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function getBookingEvents(id: string) {
  const db = await getDb()
  const { rows } = await db.query<{ id: number; type: string; message: string; created_at: Date }>(
    'SELECT id, type, message, created_at FROM booking_events WHERE booking_id = $1 ORDER BY created_at DESC, id DESC',
    [id],
  )
  return rows
}

export async function dashboardStats() {
  const db = await getDb()
  const today = todayInZone()
  const startToday = zonedToUtc(today, '00:00')
  const startTomorrow = zonedToUtc(addDays(today, 1), '00:00')
  const in7 = zonedToUtc(addDays(today, 7), '00:00')
  const monthStart = zonedToUtc(`${today.slice(0, 7)}-01`, '00:00')
  const [y, m] = today.split('-').map(Number)
  const nextMonth = zonedToUtc(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`, '00:00')
  const { rows } = await db.query<{
    neu: number
    heute: number
    woche: number
    monat_volumen: number | null
    monat_anzahl: number
    email_probleme: number
  }>(
    `SELECT
       count(*) FILTER (WHERE status = 'neu' AND ends_at >= $1) AS neu,
       count(*) FILTER (WHERE status <> 'storniert' AND starts_at >= $1 AND starts_at < $2) AS heute,
       count(*) FILTER (WHERE status <> 'storniert' AND starts_at >= $1 AND starts_at < $3) AS woche,
       sum(total_price_cents) FILTER (WHERE status <> 'storniert' AND starts_at >= $4 AND starts_at < $5) AS monat_volumen,
       count(*) FILTER (WHERE status <> 'storniert' AND starts_at >= $4 AND starts_at < $5) AS monat_anzahl,
       count(*) FILTER (WHERE customer_email_status = 'fehlgeschlagen' AND ends_at >= $1) AS email_probleme
     FROM bookings`,
    [startToday, startTomorrow, in7, monthStart, nextMonth],
  )
  const r = rows[0]
  return {
    neu: Number(r.neu),
    heute: Number(r.heute),
    woche: Number(r.woche),
    monatVolumen: r.monat_volumen === null ? 0 : Number(r.monat_volumen),
    monatAnzahl: Number(r.monat_anzahl),
    emailProbleme: Number(r.email_probleme),
  }
}

export async function upcomingAgenda(days = 14) {
  const db = await getDb()
  const today = todayInZone()
  const { rows } = await db.query<BookingRow>(
    `SELECT * FROM bookings WHERE status <> 'storniert' AND ends_at >= $1 AND starts_at < $2 ORDER BY starts_at ASC LIMIT 100`,
    [zonedToUtc(today, '00:00'), zonedToUtc(addDays(today, days), '00:00')],
  )
  return rows
}

export async function listCustomers(q?: string) {
  const db = await getDb()
  const params: unknown[] = []
  let where = 'WHERE anonymized_at IS NULL'
  if (q) {
    params.push(`%${q.trim().toLowerCase()}%`)
    where += ` AND (lower(first_name || ' ' || last_name) LIKE $1 OR lower(email) LIKE $1 OR phone LIKE $1)`
  }
  const { rows } = await db.query<{
    email: string
    name: string
    phone: string
    city: string
    bookings: number
    active_bookings: number
    total_cents: number | null
    last_booking: Date
    last_id: string
  }>(
    `SELECT lower(email) AS email,
            (array_agg(first_name || ' ' || last_name ORDER BY created_at DESC))[1] AS name,
            (array_agg(phone ORDER BY created_at DESC))[1] AS phone,
            (array_agg(city ORDER BY created_at DESC))[1] AS city,
            count(*) AS bookings,
            count(*) FILTER (WHERE status <> 'storniert') AS active_bookings,
            sum(total_price_cents) FILTER (WHERE status = 'abgeschlossen') AS total_cents,
            max(starts_at) AS last_booking,
            (array_agg(id::text ORDER BY starts_at DESC))[1] AS last_id
     FROM bookings ${where}
     GROUP BY lower(email)
     ORDER BY max(starts_at) DESC
     LIMIT 300`,
    params,
  )
  return rows
}

export async function listBlockedPeriods() {
  const db = await getDb()
  const { rows } = await db.query<{ id: string; starts_at: Date; ends_at: Date; reason: string }>(
    `SELECT id, starts_at, ends_at, reason FROM blocked_periods WHERE ends_at >= now() - interval '1 day' ORDER BY starts_at ASC`,
  )
  return rows
}

/** Aktive Buchungen, die mit einem Zeitraum kollidieren (z. B. beim Eintragen von Urlaub). */
export async function bookingsInRange(from: Date, to: Date) {
  const db = await getDb()
  const { rows } = await db.query<{ id: string; reference: string; starts_at: Date; first_name: string; last_name: string }>(
    `SELECT id, reference, starts_at, first_name, last_name FROM bookings
     WHERE status <> 'storniert' AND starts_at < $2 AND ends_at > $1 ORDER BY starts_at`,
    [from, to],
  )
  return rows
}
