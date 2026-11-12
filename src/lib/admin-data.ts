import 'server-only'
import { getDb } from './db'
import { requireAdmin } from './auth'
import { addDays, todayInZone, zonedToUtc } from './time'
import type { BookingRecord } from './bookings'

/**
 * Lesezugriffe für den Admin-Bereich.
 * Jede Funktion prüft die Admin-Session selbst (requireAdmin) – unabhängig davon, von wo sie aufgerufen wird.
 * Hintergrund: Layouts werden bei Seitenwechseln nicht erneut ausgeführt und schützen eine Seite daher nicht allein.
 */

export type BookingRow = BookingRecord

export type BookingScope = 'kommend' | 'vergangen' | 'alle' | 'heute' | 'woche'

export async function listBookings(opts: { status?: string; q?: string; scope?: BookingScope; limit?: number }) {
  await requireAdmin()
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
  await requireAdmin()
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const db = await getDb()
  const { rows } = await db.query<BookingRow>('SELECT * FROM bookings WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function getBookingEvents(id: string) {
  await requireAdmin()
  const db = await getDb()
  const { rows } = await db.query<{ id: number; type: string; message: string; created_at: Date }>(
    'SELECT id, type, message, created_at FROM booking_events WHERE booking_id = $1 ORDER BY created_at DESC, id DESC',
    [id],
  )
  return rows
}

export async function dashboardStats() {
  await requireAdmin()
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
  const inq = await db.query<{ n: number }>("SELECT count(*) AS n FROM inquiries WHERE status = 'neu'")
  return {
    anfragen: Number(inq.rows[0].n),
    neu: Number(r.neu),
    heute: Number(r.heute),
    woche: Number(r.woche),
    monatVolumen: r.monat_volumen === null ? 0 : Number(r.monat_volumen),
    monatAnzahl: Number(r.monat_anzahl),
    emailProbleme: Number(r.email_probleme),
  }
}

export async function upcomingAgenda(days = 14) {
  await requireAdmin()
  const db = await getDb()
  const today = todayInZone()
  const { rows } = await db.query<BookingRow>(
    `SELECT * FROM bookings WHERE status <> 'storniert' AND ends_at >= $1 AND starts_at < $2 ORDER BY starts_at ASC LIMIT 100`,
    [zonedToUtc(today, '00:00'), zonedToUtc(addDays(today, days), '00:00')],
  )
  return rows
}

export async function listCustomers(q?: string) {
  await requireAdmin()
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
    marketing: boolean
  }>(
    `SELECT lower(email) AS email,
            (array_agg(first_name || ' ' || last_name ORDER BY created_at DESC))[1] AS name,
            (array_agg(phone ORDER BY created_at DESC))[1] AS phone,
            (array_agg(city ORDER BY created_at DESC))[1] AS city,
            count(*) AS bookings,
            count(*) FILTER (WHERE status <> 'storniert') AS active_bookings,
            sum(total_price_cents) FILTER (WHERE status = 'abgeschlossen') AS total_cents,
            max(starts_at) AS last_booking,
            (array_agg(id::text ORDER BY starts_at DESC))[1] AS last_id,
            bool_or(marketing_consent_at IS NOT NULL) AS marketing
     FROM bookings ${where}
     GROUP BY lower(email)
     ORDER BY max(starts_at) DESC
     LIMIT 300`,
    params,
  )
  return rows
}

export async function listBlockedPeriods() {
  await requireAdmin()
  const db = await getDb()
  const { rows } = await db.query<{ id: string; starts_at: Date; ends_at: Date; reason: string }>(
    `SELECT id, starts_at, ends_at, reason FROM blocked_periods WHERE ends_at >= now() - interval '1 day' ORDER BY starts_at ASC`,
  )
  return rows
}

/** Aktive Buchungen, die mit einem Zeitraum kollidieren (z. B. beim Eintragen von Urlaub). */
export async function bookingsInRange(from: Date, to: Date) {
  await requireAdmin()
  const db = await getDb()
  const { rows } = await db.query<{ id: string; reference: string; starts_at: Date; first_name: string; last_name: string }>(
    `SELECT id, reference, starts_at, first_name, last_name FROM bookings
     WHERE status <> 'storniert' AND starts_at < $2 AND ends_at > $1 ORDER BY starts_at`,
    [from, to],
  )
  return rows
}

/** Aktive Buchungen und Sperrzeiten in einem Zeitraum (Kalender). */
export async function calendarData(from: Date, to: Date) {
  await requireAdmin()
  const db = await getDb()
  const bookings = await db.query<BookingRow>(
    `SELECT * FROM bookings WHERE status <> 'storniert' AND starts_at < $2 AND blocked_until > $1 ORDER BY starts_at`,
    [from, to],
  )
  const blocked = await db.query<{ id: string; starts_at: Date; ends_at: Date; reason: string }>(
    'SELECT id, starts_at, ends_at, reason FROM blocked_periods WHERE starts_at < $2 AND ends_at > $1 ORDER BY starts_at',
    [from, to],
  )
  return { bookings: bookings.rows, blocked: blocked.rows }
}

// ─── Anfragen (Kontaktformular) ─────────────────────────────────────────────────

export interface InquiryRow {
  id: string
  name: string
  email: string
  phone: string
  topic: string
  message: string
  status: 'neu' | 'erledigt'
  admin_email_status: string
  created_at: Date
}

export async function listInquiries(status?: string) {
  await requireAdmin()
  const db = await getDb()
  const { rows } = await db.query<InquiryRow>(
    `SELECT id, name, email, phone, topic, message, status, admin_email_status, created_at FROM inquiries
     ${status === 'neu' || status === 'erledigt' ? 'WHERE status = $1' : ''} ORDER BY created_at DESC LIMIT 300`,
    status === 'neu' || status === 'erledigt' ? [status] : [],
  )
  return rows
}

// ─── Statistiken ────────────────────────────────────────────────────────────────

export interface MonthStat {
  month: string // YYYY-MM
  bookings: number
  cancelled: number
  completed: number
  revenueCents: number
  plannedCents: number
}

export async function statistics(months = 12) {
  await requireAdmin()
  const db = await getDb()
  const today = todayInZone()
  const [y, m] = today.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - months, 1))
  const from = zonedToUtc(`${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, '0')}-01`, '00:00')
  const next = new Date(Date.UTC(y, m, 1))
  const to = zonedToUtc(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`, '00:00')

  const monthly = await db.query<{ month: string; bookings: number; cancelled: number; completed: number; revenue: number | null; planned: number | null }>(
    `SELECT to_char(starts_at AT TIME ZONE 'Europe/Vienna', 'YYYY-MM') AS month,
            count(*) FILTER (WHERE status <> 'storniert') AS bookings,
            count(*) FILTER (WHERE status = 'storniert') AS cancelled,
            count(*) FILTER (WHERE status = 'abgeschlossen') AS completed,
            sum(total_price_cents) FILTER (WHERE status = 'abgeschlossen') AS revenue,
            sum(total_price_cents) FILTER (WHERE status IN ('neu','bestaetigt','in_bearbeitung')) AS planned
     FROM bookings WHERE starts_at >= $1 AND starts_at < $2
     GROUP BY 1 ORDER BY 1`,
    [from, to],
  )
  const byMonth = new Map(monthly.rows.map((r) => [r.month, r]))
  const series: MonthStat[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const r = byMonth.get(key)
    series.push({
      month: key,
      bookings: r ? Number(r.bookings) : 0,
      cancelled: r ? Number(r.cancelled) : 0,
      completed: r ? Number(r.completed) : 0,
      revenueCents: r && r.revenue !== null ? Number(r.revenue) : 0,
      plannedCents: r && r.planned !== null ? Number(r.planned) : 0,
    })
  }

  const services = await db.query<{ name: string; n: number; revenue: number | null }>(
    `SELECT service_name AS name, count(*) AS n, sum(total_price_cents) AS revenue
     FROM bookings WHERE status <> 'storniert' AND starts_at >= $1 AND starts_at < $2
     GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
    [from, to],
  )
  const addons = await db.query<{ name: string; n: number }>(
    `SELECT a->>'name' AS name, count(*) AS n
     FROM bookings b CROSS JOIN LATERAL jsonb_array_elements(b.addons) AS a
     WHERE b.status <> 'storniert' AND b.starts_at >= $1 AND b.starts_at < $2
     GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
    [from, to],
  )
  const vehicles = await db.query<{ name: string; n: number }>(
    `SELECT vehicle_category_name AS name, count(*) AS n
     FROM bookings WHERE status <> 'storniert' AND starts_at >= $1 AND starts_at < $2
     GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
    [from, to],
  )
  const totals = await db.query<{ n: number; completed: number; revenue: number | null; avg: number | null; discount: number | null; with_addons: number }>(
    `SELECT count(*) FILTER (WHERE status <> 'storniert') AS n,
            count(*) FILTER (WHERE status = 'abgeschlossen') AS completed,
            sum(total_price_cents) FILTER (WHERE status = 'abgeschlossen') AS revenue,
            avg(total_price_cents) FILTER (WHERE status <> 'storniert' AND total_price_cents IS NOT NULL) AS avg,
            sum(discount_cents) FILTER (WHERE status <> 'storniert') AS discount,
            count(*) FILTER (WHERE status <> 'storniert' AND jsonb_array_length(addons) > 0) AS with_addons
     FROM bookings WHERE starts_at >= $1 AND starts_at < $2`,
    [from, to],
  )
  const t = totals.rows[0]
  return {
    series,
    services: services.rows.map((r) => ({ name: r.name, count: Number(r.n), revenueCents: r.revenue === null ? 0 : Number(r.revenue) })),
    addons: addons.rows.map((r) => ({ name: r.name, count: Number(r.n) })),
    vehicles: vehicles.rows.map((r) => ({ name: r.name, count: Number(r.n) })),
    totals: {
      bookings: Number(t.n),
      completed: Number(t.completed),
      revenueCents: t.revenue === null ? 0 : Number(t.revenue),
      avgOrderCents: t.avg === null ? null : Math.round(Number(t.avg)),
      discountCents: t.discount === null ? 0 : Number(t.discount),
      withAddons: Number(t.with_addons),
    },
  }
}
