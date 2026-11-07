'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { checkCredentials, clearSessionCookie, isAdminConfigured, requireAdmin, setSessionCookie } from '@/lib/auth'
import { getDb, pgErrorCode, PG_EXCLUSION_VIOLATION } from '@/lib/db'
import { getSettings, invalidateCatalogCache } from '@/lib/catalog'
import { clientIp, rateLimit, resetRateLimit } from '@/lib/rate-limit'
import { customerSchema } from '@/lib/validation'
import { addDays, isValidDateString, isValidTimeString, zonedToUtc } from '@/lib/time'
import { customerRescheduleMail, customerStatusMail, sendMail, type BookingMailData } from '@/lib/email'
import { getBooking, bookingsInRange, type BookingRow } from '@/lib/admin-data'
import { formatDateTime, STATUS_LABELS } from '@/lib/format'
import { getSiteUrl } from '@/config/site'

/**
 * Server-Actions des Admin-Bereichs.
 * JEDE Action prüft zuerst die Admin-Session (requireAdmin) – unabhängig davon, ob die Seite geschützt ist.
 * Next.js prüft bei Server-Actions zusätzlich die Herkunft (Origin) der Anfrage (CSRF-Schutz).
 */

export type ActionState = { ok: boolean; message: string; errors?: Record<string, string> } | null

const fail = (message: string, errors?: Record<string, string>): ActionState => ({ ok: false, message, errors })
const done = (message: string): ActionState => ({ ok: true, message })

function str(fd: FormData, key: string): string {
  const v = fd.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

function refreshPublic() {
  invalidateCatalogCache()
  revalidatePath('/', 'layout')
}

// ─── Login / Logout ─────────────────────────────────────────────────────────────

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!isAdminConfigured()) return fail('Der Admin-Zugang ist noch nicht eingerichtet (siehe README).')
  const ip = clientIp(await headers())
  const limit = await rateLimit('login', ip, 5, 15 * 60)
  if (!limit.allowed) {
    return fail(`Zu viele Anmeldeversuche. Bitte warte ${Math.ceil(limit.retryAfterSeconds / 60)} Minuten.`)
  }
  const ok = await checkCredentials(str(fd, 'username'), String(fd.get('password') ?? ''))
  if (!ok) return fail('Benutzername oder Passwort ist falsch.')
  await resetRateLimit('login', ip)
  await setSessionCookie()
  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie()
  redirect('/admin/login')
}

// ─── Buchungen ──────────────────────────────────────────────────────────────────

const STATUSES = ['neu', 'bestaetigt', 'in_bearbeitung', 'abgeschlossen', 'storniert'] as const

function mailData(b: BookingRow): BookingMailData {
  return {
    reference: b.reference,
    status: b.status,
    serviceName: b.service_name,
    vehicleCategoryName: b.vehicle_category_name,
    addons: b.addons ?? [],
    servicePriceCents: b.service_price_cents,
    totalPriceCents: b.total_price_cents,
    priceIsFrom: b.price_is_from,
    durationMinutes: b.duration_minutes,
    startsAt: new Date(b.starts_at),
    endsAt: new Date(b.ends_at),
    firstName: b.first_name,
    lastName: b.last_name,
    email: b.email,
    phone: b.phone,
    street: b.street,
    postalCode: b.postal_code,
    city: b.city,
    vehicleModel: b.vehicle_model,
    licensePlate: b.license_plate,
    customerMessage: b.customer_message,
  }
}

async function logEvent(bookingId: string, type: string, message: string, data: Record<string, unknown> = {}) {
  const db = await getDb()
  await db.query('INSERT INTO booking_events (booking_id, type, message, data) VALUES ($1, $2, $3, $4::jsonb)', [
    bookingId,
    type,
    message,
    JSON.stringify(data),
  ])
}

export async function updateStatusAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(fd, 'id')
  const status = str(fd, 'status')
  const notify = fd.get('notify') === 'on'
  const reason = str(fd, 'reason').slice(0, 500)
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return fail('Ungültiger Status.')
  const booking = await getBooking(id)
  if (!booking) return fail('Buchung nicht gefunden.')
  if (booking.anonymized_at) return fail('Anonymisierte Buchungen können nicht mehr geändert werden.')
  if (booking.status === status) return done('Status unverändert.')

  const db = await getDb()
  try {
    await db.query('UPDATE bookings SET status = $2, updated_at = now() WHERE id = $1', [id, status])
  } catch (err) {
    if (pgErrorCode(err) === PG_EXCLUSION_VIOLATION) {
      return fail('Der Zeitraum ist inzwischen durch eine andere Buchung belegt. Bitte zuerst den Termin verschieben.')
    }
    throw err
  }
  await logEvent(id, 'status', `Status: ${STATUS_LABELS[booking.status]} → ${STATUS_LABELS[status]}${reason ? ` (${reason})` : ''}`)

  let mailInfo = ''
  if (notify) {
    const settings = await getSettings()
    const mail = customerStatusMail({ ...mailData(booking), status }, settings.business, reason || undefined)
    if (mail) {
      const res = await sendMail(mail)
      await logEvent(id, 'email', `Statusinfo an Kunden: ${res.status}`, { error: res.error })
      mailInfo =
        res.status === 'gesendet'
          ? ' Kunde wurde per E-Mail informiert.'
          : res.status === 'nicht_konfiguriert'
            ? ' Hinweis: E-Mail-Versand ist nicht konfiguriert – Kunde bitte selbst informieren.'
            : ' Achtung: E-Mail an den Kunden konnte nicht gesendet werden.'
    }
  }
  revalidatePath('/admin', 'layout')
  return done(`Status auf „${STATUS_LABELS[status]}“ gesetzt.${mailInfo}`)
}

const rescheduleSchema = z.object({
  id: z.string().uuid(),
  date: z.string().refine(isValidDateString, 'Ungültiges Datum.'),
  time: z.string().refine(isValidTimeString, 'Ungültige Uhrzeit.'),
  duration: z.coerce.number().int().min(15, 'Mindestens 15 Minuten.').max(720, 'Maximal 12 Stunden.'),
})

export async function rescheduleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = rescheduleSchema.safeParse({ id: str(fd, 'id'), date: str(fd, 'date'), time: str(fd, 'time'), duration: str(fd, 'duration') })
  if (!parsed.success) return fail(parsed.error.issues[0].message)
  const { id, date, time, duration } = parsed.data
  const booking = await getBooking(id)
  if (!booking) return fail('Buchung nicht gefunden.')
  if (booking.anonymized_at) return fail('Anonymisierte Buchungen können nicht mehr geändert werden.')
  const settings = await getSettings()
  const startsAt = zonedToUtc(date, time)
  const endsAt = new Date(startsAt.getTime() + duration * 60_000)
  const blockedUntil = new Date(endsAt.getTime() + settings.rules.bufferMinutes * 60_000)

  const db = await getDb()
  try {
    await db.transaction(async (tx) => {
      await tx.query('SELECT pg_advisory_xact_lock(72110002)')
      await tx.query('UPDATE bookings SET starts_at = $2, ends_at = $3, blocked_until = $4, duration_minutes = $5, updated_at = now() WHERE id = $1', [
        id,
        startsAt,
        endsAt,
        blockedUntil,
        duration,
      ])
    })
  } catch (err) {
    if (pgErrorCode(err) === PG_EXCLUSION_VIOLATION) {
      return fail('Dieser Zeitraum überschneidet sich (inkl. Pufferzeit) mit einer anderen Buchung.')
    }
    throw err
  }
  await logEvent(id, 'termin', `Termin geändert: ${formatDateTime(booking.starts_at)} → ${formatDateTime(startsAt)} (${duration} Min.)`)

  let mailInfo = ''
  if (fd.get('notify') === 'on') {
    const updated = await getBooking(id)
    if (updated) {
      const res = await sendMail(customerRescheduleMail(mailData(updated), settings.business))
      await logEvent(id, 'email', `Terminänderung an Kunden: ${res.status}`, { error: res.error })
      mailInfo = res.status === 'gesendet' ? ' Kunde wurde informiert.' : ' Hinweis: Kunde wurde NICHT per E-Mail informiert.'
    }
  }
  const blocked = await db.query<{ n: number }>('SELECT count(*) AS n FROM blocked_periods WHERE starts_at < $2 AND ends_at > $1', [startsAt, endsAt])
  const warn = Number(blocked.rows[0].n) > 0 ? ' Achtung: Der Termin liegt in einer gesperrten Zeit.' : ''
  revalidatePath('/admin', 'layout')
  return done(`Termin gespeichert.${mailInfo}${warn}`)
}

export async function updateDetailsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(fd, 'id')
  const booking = await getBooking(id)
  if (!booking) return fail('Buchung nicht gefunden.')
  if (booking.anonymized_at) return fail('Anonymisierte Buchungen können nicht mehr geändert werden.')
  const parsed = customerSchema.safeParse({
    firstName: str(fd, 'firstName'),
    lastName: str(fd, 'lastName'),
    phone: str(fd, 'phone'),
    email: str(fd, 'email'),
    street: str(fd, 'street'),
    postalCode: str(fd, 'postalCode'),
    city: str(fd, 'city'),
    vehicleModel: str(fd, 'vehicleModel'),
    licensePlate: str(fd, 'licensePlate'),
    message: str(fd, 'message'),
  })
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message
    return fail('Bitte Eingaben prüfen.', errors)
  }
  const priceRaw = str(fd, 'totalPrice').replace(',', '.')
  let totalCents: number | null = booking.total_price_cents
  if (priceRaw === '') totalCents = null
  else {
    const n = Number(priceRaw)
    if (!Number.isFinite(n) || n < 0 || n > 100000) return fail('Ungültiger Preis.', { totalPrice: 'Bitte einen gültigen Betrag eingeben.' })
    totalCents = Math.round(n * 100)
  }
  const c = parsed.data
  const db = await getDb()
  await db.query(
    `UPDATE bookings SET first_name=$2, last_name=$3, phone=$4, email=$5, street=$6, postal_code=$7, city=$8,
       vehicle_model=$9, license_plate=$10, customer_message=$11, admin_note=$12, total_price_cents=$13, updated_at=now()
     WHERE id=$1`,
    [id, c.firstName, c.lastName, c.phone, c.email.toLowerCase(), c.street, c.postalCode, c.city, c.vehicleModel, c.licensePlate || null, c.message || null, str(fd, 'adminNote').slice(0, 2000) || null, totalCents],
  )
  if (totalCents !== booking.total_price_cents) {
    await logEvent(id, 'preis', `Preis geändert: ${booking.total_price_cents ?? 'auf Anfrage'} → ${totalCents ?? 'auf Anfrage'} (Cent)`)
  }
  await logEvent(id, 'daten', 'Kunden-/Buchungsdaten bearbeitet')
  revalidatePath('/admin', 'layout')
  return done('Änderungen gespeichert.')
}

export async function resendMailAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const booking = await getBooking(str(fd, 'id'))
  if (!booking) return fail('Buchung nicht gefunden.')
  if (booking.anonymized_at) return fail('Anonymisierte Buchung.')
  const settings = await getSettings()
  const { customerBookingMail } = await import('@/lib/email')
  const res = await sendMail(customerBookingMail(mailData(booking), settings.business))
  const db = await getDb()
  await db.query('UPDATE bookings SET customer_email_status = $2 WHERE id = $1', [booking.id, res.status])
  await logEvent(booking.id, 'email', `Buchungsbestätigung erneut gesendet: ${res.status}`, { error: res.error })
  revalidatePath('/admin', 'layout')
  if (res.status === 'gesendet') return done('E-Mail wurde gesendet.')
  if (res.status === 'nicht_konfiguriert') return fail('E-Mail-Versand ist nicht konfiguriert (SMTP-Einstellungen fehlen).')
  return fail(`E-Mail konnte nicht gesendet werden: ${res.error ?? 'unbekannter Fehler'}`)
}

/** DSGVO: Personenbezogene Daten entfernen, Buchungsdaten (Leistung, Preis, Datum) für die Buchhaltung behalten. */
export async function anonymizeAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const booking = await getBooking(str(fd, 'id'))
  if (!booking) return fail('Buchung nicht gefunden.')
  if (!['storniert', 'abgeschlossen'].includes(booking.status)) {
    return fail('Nur stornierte oder abgeschlossene Buchungen können anonymisiert werden.')
  }
  const db = await getDb()
  await db.query(
    `UPDATE bookings SET first_name='Anonymisiert', last_name='', email='anonymisiert@invalid', phone='-', street='-', postal_code='0000', city='-',
       vehicle_model='-', license_plate=NULL, customer_message=NULL, admin_note=NULL, anonymized_at=now(), updated_at=now()
     WHERE id=$1`,
    [booking.id],
  )
  await logEvent(booking.id, 'dsgvo', 'Personenbezogene Daten anonymisiert')
  revalidatePath('/admin', 'layout')
  return done('Personenbezogene Daten wurden anonymisiert.')
}

export async function deleteBookingAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const booking = await getBooking(str(fd, 'id'))
  if (!booking) return fail('Buchung nicht gefunden.')
  if (booking.status !== 'storniert') return fail('Nur stornierte Buchungen können gelöscht werden.')
  const db = await getDb()
  await db.query('DELETE FROM bookings WHERE id = $1', [booking.id])
  revalidatePath('/admin', 'layout')
  redirect('/admin/buchungen?geloescht=1')
}

// ─── Verfügbarkeit ──────────────────────────────────────────────────────────────

export async function saveWorkingHoursAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const rows: Array<{ weekday: number; open: boolean; from: string; to: string }> = []
  for (let d = 1; d <= 7; d++) {
    const open = fd.get(`open_${d}`) === 'on'
    const from = str(fd, `from_${d}`) || '08:00'
    const to = str(fd, `to_${d}`) || '18:00'
    if (!isValidTimeString(from) || !isValidTimeString(to)) return fail('Bitte gültige Uhrzeiten (HH:MM) eingeben.')
    if (to <= from) return fail('Das Ende muss nach dem Beginn liegen.')
    rows.push({ weekday: d, open, from, to })
  }
  const db = await getDb()
  await db.transaction(async (tx) => {
    for (const r of rows) {
      await tx.query(
        `INSERT INTO working_hours (weekday, is_open, open_time, close_time) VALUES ($1,$2,$3,$4)
         ON CONFLICT (weekday) DO UPDATE SET is_open=EXCLUDED.is_open, open_time=EXCLUDED.open_time, close_time=EXCLUDED.close_time`,
        [r.weekday, r.open, r.from, r.to],
      )
    }
  })
  refreshPublic()
  return done('Arbeitszeiten gespeichert. Neue Buchungen berücksichtigen sie sofort.')
}

export async function addBlockedPeriodAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const fromDate = str(fd, 'fromDate')
  const toDate = str(fd, 'toDate') || fromDate
  const allDay = fd.get('allDay') === 'on'
  const fromTime = str(fd, 'fromTime')
  const toTime = str(fd, 'toTime')
  const reason = str(fd, 'reason').slice(0, 200)
  if (!isValidDateString(fromDate) || !isValidDateString(toDate)) return fail('Bitte gültige Daten angeben.')
  if (toDate < fromDate) return fail('Das Enddatum muss nach dem Startdatum liegen.')
  let startsAt: Date
  let endsAt: Date
  if (allDay) {
    startsAt = zonedToUtc(fromDate, '00:00')
    endsAt = zonedToUtc(addDays(toDate, 1), '00:00')
  } else {
    if (!isValidTimeString(fromTime) || !isValidTimeString(toTime)) return fail('Bitte Uhrzeiten angeben oder „Ganztägig“ wählen.')
    startsAt = zonedToUtc(fromDate, fromTime)
    endsAt = zonedToUtc(toDate, toTime)
    if (endsAt <= startsAt) return fail('Das Ende muss nach dem Beginn liegen.')
  }
  const db = await getDb()
  await db.query('INSERT INTO blocked_periods (starts_at, ends_at, reason) VALUES ($1, $2, $3)', [startsAt, endsAt, reason])
  const conflicts = await bookingsInRange(startsAt, endsAt)
  refreshPublic()
  revalidatePath('/admin', 'layout')
  if (conflicts.length) {
    return {
      ok: true,
      message: `Sperrzeit gespeichert. Achtung: ${conflicts.length} bestehende Buchung(en) liegen in diesem Zeitraum (${conflicts
        .map((c) => c.reference)
        .join(', ')}) – bitte verschieben oder stornieren.`,
    }
  }
  return done('Sperrzeit gespeichert. In diesem Zeitraum sind keine Online-Buchungen mehr möglich.')
}

export async function deleteBlockedPeriodAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(fd, 'id')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Ungültige Sperrzeit.')
  const db = await getDb()
  await db.query('DELETE FROM blocked_periods WHERE id = $1', [id])
  refreshPublic()
  revalidatePath('/admin', 'layout')
  return done('Sperrzeit entfernt.')
}

const rulesSchema = z.object({
  bufferMinutes: z.coerce.number().int().min(0).max(240),
  slotIntervalMinutes: z.coerce.number().int().refine((n) => [15, 20, 30, 45, 60].includes(n), 'Raster: 15, 20, 30, 45 oder 60 Minuten'),
  minLeadHours: z.coerce.number().int().min(0).max(24 * 14),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
})

export async function saveRulesAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const parsed = rulesSchema.safeParse({
    bufferMinutes: str(fd, 'bufferMinutes'),
    slotIntervalMinutes: str(fd, 'slotIntervalMinutes'),
    minLeadHours: str(fd, 'minLeadHours'),
    maxAdvanceDays: str(fd, 'maxAdvanceDays'),
  })
  if (!parsed.success) return fail(parsed.error.issues[0].message)
  const rules = { ...parsed.data, autoConfirm: fd.get('autoConfirm') === 'on' }
  const db = await getDb()
  await db.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('booking_rules', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(rules)],
  )
  refreshPublic()
  return done('Buchungsregeln gespeichert.')
}

// ─── Leistungen, Preise, Zusatzleistungen, Fahrzeugkategorien ───────────────────

function parseEuro(raw: string): number | null | 'invalid' {
  const v = raw.trim().replace(/\s|€/g, '').replace(',', '.')
  if (v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > 100000) return 'invalid'
  return Math.round(n * 100)
}

const slugSchema = z
  .string()
  .trim()
  .min(2, 'Kürzel zu kurz')
  .max(48)
  .regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche')

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export async function saveServiceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(fd, 'id')
  const name = str(fd, 'name')
  if (name.length < 2 || name.length > 80) return fail('Bitte einen Namen (2–80 Zeichen) angeben.', { name: 'Pflichtfeld' })
  const includes = str(fd, 'includes')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
  const db = await getDb()
  const vehicles = await db.query<{ id: string; name: string }>('SELECT id, name FROM vehicle_categories ORDER BY sort')
  const prices: Array<{ vehicle: string; price: number | null; minutes: number }> = []
  for (const v of vehicles.rows) {
    const price = parseEuro(str(fd, `price_${v.id}`))
    if (price === 'invalid') return fail(`Ungültiger Preis bei ${v.name}.`)
    const minutes = Number(str(fd, `minutes_${v.id}`))
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 720) return fail(`Ungültige Dauer bei ${v.name} (0–720 Minuten).`)
    prices.push({ vehicle: v.id, price, minutes })
  }
  const requiresAddon = fd.get('requiresAddon') === 'on'
  if (!requiresAddon && prices.some((p) => p.minutes < 15)) return fail('Die Dauer muss bei Paketen mindestens 15 Minuten betragen.')

  await db.transaction(async (tx) => {
    const res = await tx.query(
      `UPDATE services SET name=$2, tagline=$3, description=$4, includes=$5::jsonb, price_note=$6, featured=$7, active=$8,
         requires_addon=$9, sort=$10, updated_at=now() WHERE id=$1`,
      [
        id,
        name,
        str(fd, 'tagline').slice(0, 160),
        str(fd, 'description').slice(0, 1000),
        JSON.stringify(includes),
        str(fd, 'priceNote').slice(0, 300),
        fd.get('featured') === 'on',
        fd.get('active') === 'on',
        requiresAddon,
        Number(str(fd, 'sort')) || 0,
      ],
    )
    if (res.rowCount === 0) throw new Error('not_found')
    for (const p of prices) {
      await tx.query(
        `INSERT INTO service_prices (service_id, vehicle_category_id, price_cents, duration_minutes) VALUES ($1,$2,$3,$4)
         ON CONFLICT (service_id, vehicle_category_id) DO UPDATE SET price_cents=EXCLUDED.price_cents, duration_minutes=EXCLUDED.duration_minutes`,
        [id, p.vehicle, p.price, p.minutes],
      )
    }
  })
  refreshPublic()
  revalidatePath('/admin', 'layout')
  return done('Leistung gespeichert – Änderungen sind sofort auf der Website sichtbar.')
}

export async function createServiceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const name = str(fd, 'name')
  if (name.length < 2) return fail('Bitte einen Namen angeben.')
  const slug = slugSchema.safeParse(str(fd, 'slug') || slugify(name))
  if (!slug.success) return fail(slug.error.issues[0].message)
  const db = await getDb()
  const exists = await db.query('SELECT 1 FROM services WHERE id = $1', [slug.data])
  if (exists.rowCount) return fail('Diese Leistung (Kürzel) existiert bereits.')
  await db.transaction(async (tx) => {
    const sort = await tx.query<{ s: number }>('SELECT coalesce(max(sort), 0) + 10 AS s FROM services')
    await tx.query(`INSERT INTO services (id, name, active, sort) VALUES ($1, $2, false, $3)`, [slug.data, name, Number(sort.rows[0].s)])
    await tx.query(
      `INSERT INTO service_prices (service_id, vehicle_category_id, price_cents, duration_minutes)
       SELECT $1, id, NULL, 120 FROM vehicle_categories`,
      [slug.data],
    )
  })
  refreshPublic()
  revalidatePath('/admin', 'layout')
  redirect(`/admin/leistungen/${slug.data}?neu=1`)
}

export async function deleteServiceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(fd, 'id')
  const db = await getDb()
  // Buchungen speichern eine Momentaufnahme (Name, Preis) – bestehende Buchungen bleiben unverändert.
  await db.query('DELETE FROM services WHERE id = $1', [id])
  refreshPublic()
  revalidatePath('/admin', 'layout')
  redirect('/admin/leistungen?geloescht=1')
}

export async function saveAddonAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(fd, 'id')
  const name = str(fd, 'name')
  if (name.length < 2) return fail('Bitte einen Namen angeben.')
  const price = parseEuro(str(fd, 'price'))
  if (price === 'invalid' || price === null) return fail('Bitte einen gültigen Preis angeben.')
  const minutes = Number(str(fd, 'minutes'))
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 480) return fail('Ungültige Dauer (0–480 Minuten).')
  const db = await getDb()
  const values = [
    name,
    str(fd, 'description').slice(0, 300),
    price,
    fd.get('priceIsFrom') === 'on',
    minutes,
    fd.get('bookableAlone') === 'on',
    fd.get('active') === 'on',
    Number(str(fd, 'sort')) || 0,
  ]
  if (id) {
    await db.query(
      `UPDATE addons SET name=$2, description=$3, price_cents=$4, price_is_from=$5, duration_minutes=$6, bookable_alone=$7, active=$8, sort=$9 WHERE id=$1`,
      [id, ...values],
    )
  } else {
    const slug = slugify(name)
    if (!slug) return fail('Ungültiger Name.')
    const exists = await db.query('SELECT 1 FROM addons WHERE id = $1', [slug])
    if (exists.rowCount) return fail('Eine Zusatzleistung mit diesem Namen existiert bereits.')
    await db.query(
      `INSERT INTO addons (id, name, description, price_cents, price_is_from, duration_minutes, bookable_alone, active, sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [slug, ...values],
    )
  }
  refreshPublic()
  revalidatePath('/admin', 'layout')
  return done(id ? 'Zusatzleistung gespeichert.' : 'Zusatzleistung angelegt.')
}

export async function deleteAddonAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const db = await getDb()
  await db.query('DELETE FROM addons WHERE id = $1', [str(fd, 'id')])
  refreshPublic()
  revalidatePath('/admin', 'layout')
  return done('Zusatzleistung gelöscht.')
}

export async function saveVehicleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(fd, 'id')
  const name = str(fd, 'name')
  if (name.length < 2) return fail('Bitte einen Namen angeben.')
  const db = await getDb()
  if (id) {
    await db.query('UPDATE vehicle_categories SET name=$2, description=$3, active=$4, sort=$5 WHERE id=$1', [
      id,
      name,
      str(fd, 'description').slice(0, 200),
      fd.get('active') === 'on',
      Number(str(fd, 'sort')) || 0,
    ])
  } else {
    const slug = slugify(name)
    const exists = await db.query('SELECT 1 FROM vehicle_categories WHERE id = $1', [slug])
    if (!slug || exists.rowCount) return fail('Diese Fahrzeugkategorie existiert bereits.')
    await db.transaction(async (tx) => {
      const sort = await tx.query<{ s: number }>('SELECT coalesce(max(sort), 0) + 10 AS s FROM vehicle_categories')
      await tx.query('INSERT INTO vehicle_categories (id, name, description, sort, active) VALUES ($1,$2,$3,$4,false)', [
        slug,
        name,
        str(fd, 'description').slice(0, 200),
        Number(sort.rows[0].s),
      ])
      // Preise der neuen Kategorie vorerst "auf Anfrage", Dauer von der größten bestehenden Kategorie übernehmen
      await tx.query(
        `INSERT INTO service_prices (service_id, vehicle_category_id, price_cents, duration_minutes)
         SELECT s.id, $1, NULL, coalesce((SELECT max(duration_minutes) FROM service_prices p WHERE p.service_id = s.id), 120)
         FROM services s`,
        [slug],
      )
    })
    refreshPublic()
    revalidatePath('/admin', 'layout')
    return done(`Kategorie „${name}“ angelegt (inaktiv). Bitte Preise in den Leistungen pflegen und dann aktivieren.`)
  }
  refreshPublic()
  revalidatePath('/admin', 'layout')
  return done('Fahrzeugkategorie gespeichert.')
}

// ─── Einstellungen ──────────────────────────────────────────────────────────────

const businessSchema = z.object({
  companyName: z.string().max(120),
  ownerName: z.string().max(120),
  legalForm: z.string().max(80),
  street: z.string().max(120),
  postalCode: z.string().max(10),
  city: z.string().max(80),
  country: z.string().max(60),
  phone: z.string().max(40).regex(/^[+\d\s/()-]*$/, 'Telefonnummer: nur Ziffern, Leerzeichen, +, /, ( ) und -'),
  whatsapp: z.string().max(40).regex(/^[+\d\s/()-]*$/, 'WhatsApp: nur Ziffern, Leerzeichen, +, /, ( ) und -'),
  email: z.union([z.literal(''), z.email('Ungültige E-Mail-Adresse')]),
  vatId: z.string().max(40),
  companyRegister: z.string().max(120),
  tradeAuthority: z.string().max(160),
  chamber: z.string().max(160),
  trade: z.string().max(200),
})

export async function saveBusinessAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const raw = Object.fromEntries(Object.keys(businessSchema.shape).map((k) => [k, str(fd, k)]))
  const parsed = businessSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message
    return fail(parsed.error.issues[0].message, errors)
  }
  const db = await getDb()
  await db.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('business', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(parsed.data)],
  )
  refreshPublic()
  return done('Unternehmens- und Kontaktdaten gespeichert.')
}

export async function saveAreaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const regions = str(fd, 'regions')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
  const communities = str(fd, 'communities')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 60)
  const postalCodes = str(fd, 'postalCodes')
  if (postalCodes && !/^(\s*\d{4}(\s*-\s*\d{4})?\s*)(,\s*\d{4}(\s*-\s*\d{4})?\s*)*$/.test(postalCodes)) {
    return fail('Postleitzahlen bitte im Format „8010-8077, 8501“ angeben.')
  }
  if (regions.length === 0) return fail('Bitte mindestens eine Region angeben.')
  const db = await getDb()
  await db.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('service_area', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify({ regions, communities, postalCodes: postalCodes.replace(/\s*-\s*/g, '-').replace(/\s*,\s*/g, ', ') })],
  )
  refreshPublic()
  return done('Einsatzgebiet gespeichert.')
}

export async function sendTestMailAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin()
  const to = str(fd, 'to')
  if (!z.email().safeParse(to).success) return fail('Bitte eine gültige E-Mail-Adresse angeben.')
  const res = await sendMail({
    to,
    subject: 'GLANZMOBIL – Test-E-Mail',
    text: `Diese Test-E-Mail bestätigt, dass der E-Mail-Versand der Website (${getSiteUrl()}) funktioniert.`,
    html: `<p>Diese Test-E-Mail bestätigt, dass der E-Mail-Versand der Website (${getSiteUrl()}) funktioniert.</p>`,
  })
  if (res.status === 'gesendet') return done(`Test-E-Mail an ${to} gesendet.`)
  if (res.status === 'nicht_konfiguriert') return fail('SMTP ist nicht konfiguriert (siehe README → E-Mail-Versand).')
  return fail(`Versand fehlgeschlagen: ${res.error}`)
}
