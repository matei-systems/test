import 'server-only'
import { createHash, randomBytes, randomInt } from 'node:crypto'
import { getDb, isDatabaseConfigured, pgErrorCode, PG_EXCLUSION_VIOLATION, PG_UNIQUE_VIOLATION, type Queryable } from './db'
import { computeDaySlots, dayBoundsUtc, eachDate, type Interval } from './availability'
import { calculateQuote, type Quote, type QuoteInput } from './pricing'
import { getCatalog, getSettings, getWorkingHours, isPostalCodeAllowed, loadCatalog, loadSettings, loadWorkingHours } from './catalog'
import { addDays, todayInZone, zonedToUtc } from './time'
import type { BookingRequest } from './validation'
import { adminNewBookingMail, customerBookingMail, sendMail, type BookingMailData } from './email'
import { getSiteUrl } from '@/config/site'

/** Lädt belegte Zeiten (aktive Buchungen inkl. Puffer) und gesperrte Zeiten in einem Zeitraum. */
export async function loadOccupancy(
  q: Queryable,
  from: number,
  to: number,
  excludeBookingId?: string,
): Promise<{ busy: Interval[]; blocked: Interval[] }> {
  const [b, p] = await Promise.all([
    q.query<{ starts_at: Date; blocked_until: Date }>(
      `SELECT starts_at, blocked_until FROM bookings
       WHERE status <> 'storniert' AND starts_at < $2 AND blocked_until > $1 ${excludeBookingId ? 'AND id <> $3' : ''}`,
      excludeBookingId ? [new Date(from), new Date(to), excludeBookingId] : [new Date(from), new Date(to)],
    ),
    q.query<{ starts_at: Date; ends_at: Date }>(
      'SELECT starts_at, ends_at FROM blocked_periods WHERE starts_at < $2 AND ends_at > $1',
      [new Date(from), new Date(to)],
    ),
  ])
  return {
    busy: b.rows.map((r) => ({ start: new Date(r.starts_at).getTime(), end: new Date(r.blocked_until).getTime() })),
    blocked: p.rows.map((r) => ({ start: new Date(r.starts_at).getTime(), end: new Date(r.ends_at).getTime() })),
  }
}

export type AvailabilityResult =
  | { ok: true; quote: Quote; slots: string[] }
  | { ok: false; error: string }

/** Freie Startzeiten für einen Tag und eine konkrete Auswahl. */
export async function getDayAvailability(date: string, input: QuoteInput, now = Date.now()): Promise<AvailabilityResult> {
  const [catalog, settings, hours] = await Promise.all([getCatalog(), getSettings(), getWorkingHours()])
  const q = calculateQuote(catalog, input)
  if (!q.ok) return q
  const bounds = dayBoundsUtc(date)
  // Puffer und lange Termine vom Vortag berücksichtigen
  const db = await getDb()
  const occ = await loadOccupancy(db, bounds.start - 86400_000, bounds.end + 86400_000)
  const slots = computeDaySlots({
    date,
    durationMinutes: q.quote.durationMinutes,
    workingHours: hours,
    rules: settings.rules,
    busy: occ.busy,
    blocked: occ.blocked,
    now,
  })
  return { ok: true, quote: q.quote, slots }
}

/** Tage mit mindestens einem freien Termin in [from, to]. */
export async function getAvailableDays(
  from: string,
  to: string,
  input: QuoteInput,
  now = Date.now(),
): Promise<{ ok: true; days: string[]; firstDate: string; lastDate: string } | { ok: false; error: string }> {
  const [catalog, settings, hours] = await Promise.all([getCatalog(), getSettings(), getWorkingHours()])
  const q = calculateQuote(catalog, input)
  if (!q.ok) return q
  const today = todayInZone(now)
  const lastDate = addDays(today, settings.rules.maxAdvanceDays)
  const start = from < today ? today : from
  const end = to > lastDate ? lastDate : to
  if (start > end) return { ok: true, days: [], firstDate: today, lastDate }

  const db = await getDb()
  const occ = await loadOccupancy(db, dayBoundsUtc(start).start - 86400_000, dayBoundsUtc(end).end + 86400_000)
  const days = eachDate(start, end).filter(
    (date) =>
      computeDaySlots({
        date,
        durationMinutes: q.quote.durationMinutes,
        workingHours: hours,
        rules: settings.rules,
        busy: occ.busy,
        blocked: occ.blocked,
        now,
      }).length > 0,
  )
  return { ok: true, days, firstDate: today, lastDate }
}

// ─── Buchung anlegen ────────────────────────────────────────────────────────────

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateReference(): string {
  const pick = () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]
  const block = () => Array.from({ length: 4 }, pick).join('')
  return `GM-${block()}-${block()}`
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export type CreateBookingResult =
  | {
      ok: true
      reference: string
      token: string
      status: string
      startsAt: Date
      customerEmailStatus: string
    }
  | { ok: false; code: 'invalid' | 'slot_unavailable' | 'outside_area' | 'server'; error: string; fields?: Record<string, string> }

export async function createBooking(req: BookingRequest, now = Date.now()): Promise<CreateBookingResult> {
  const db = await getDb()
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const privacyAt = new Date(now)

  let created: { id: string; reference: string; status: string; quote: Quote; startsAt: Date; endsAt: Date } | null = null

  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    try {
      created = await db.transaction(async (tx) => {
        // Serialisiert alle Buchungsvorgänge → keine Race Conditions zwischen Prüfung und Speichern
        await tx.query('SELECT pg_advisory_xact_lock(72110002)')

        const [catalog, settings, hours] = await Promise.all([loadCatalog(tx), loadSettings(tx), loadWorkingHours(tx)])

        if (!isPostalCodeAllowed(req.customer.postalCode, settings.area.postalCodes)) {
          throw new BookingError(
            'outside_area',
            'Diese Postleitzahl liegt außerhalb unseres Einsatzgebiets. Kontaktiere uns gerne für eine individuelle Anfrage.',
            { 'customer.postalCode': 'Außerhalb unseres Einsatzgebiets (Graz & Graz-Umgebung).' },
          )
        }

        const q = calculateQuote(catalog, { serviceId: req.serviceId, vehicleId: req.vehicleId, addonIds: req.addonIds })
        if (!q.ok) throw new BookingError('invalid', q.error)
        const quote = q.quote

        const startsAt = zonedToUtc(req.date, req.time)
        const endsAt = new Date(startsAt.getTime() + quote.durationMinutes * 60_000)
        const blockedUntil = new Date(endsAt.getTime() + settings.rules.bufferMinutes * 60_000)

        const bounds = dayBoundsUtc(req.date)
        const occ = await loadOccupancy(tx, bounds.start - 86400_000, bounds.end + 86400_000)
        const slots = computeDaySlots({
          date: req.date,
          durationMinutes: quote.durationMinutes,
          workingHours: hours,
          rules: settings.rules,
          busy: occ.busy,
          blocked: occ.blocked,
          now,
        })
        if (!slots.includes(req.time)) {
          throw new BookingError('slot_unavailable', 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wähle eine andere Uhrzeit.')
        }

        const status = settings.rules.autoConfirm ? 'bestaetigt' : 'neu'
        const reference = generateReference()
        const c = req.customer
        const { rows } = await tx.query<{ id: string }>(
          `INSERT INTO bookings (
             reference, access_token_hash, status,
             service_id, service_name, vehicle_category_id, vehicle_category_name, addons,
             service_price_cents, total_price_cents, price_is_from, duration_minutes,
             starts_at, ends_at, blocked_until,
             first_name, last_name, email, phone, street, postal_code, city,
             vehicle_model, license_plate, customer_message,
             privacy_accepted_at, terms_accepted_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$26)
           RETURNING id`,
          [
            reference,
            tokenHash,
            status,
            quote.serviceId,
            quote.serviceName,
            quote.vehicleId,
            quote.vehicleName,
            JSON.stringify(quote.addons),
            quote.servicePriceCents,
            quote.totalPriceCents,
            quote.priceIsFrom,
            quote.durationMinutes,
            startsAt,
            endsAt,
            blockedUntil,
            c.firstName,
            c.lastName,
            c.email.toLowerCase(),
            c.phone,
            c.street,
            c.postalCode,
            c.city,
            c.vehicleModel,
            c.licensePlate || null,
            c.message || null,
            privacyAt,
          ],
        )
        const id = rows[0].id
        await tx.query(`INSERT INTO booking_events (booking_id, type, message) VALUES ($1, 'erstellt', $2)`, [
          id,
          status === 'bestaetigt' ? 'Online gebucht und automatisch bestätigt' : 'Online gebucht',
        ])
        return { id, reference, status, quote, startsAt, endsAt }
      })
    } catch (err) {
      if (err instanceof BookingError) return { ok: false, code: err.code, error: err.message, fields: err.fields }
      const code = pgErrorCode(err)
      if (code === PG_EXCLUSION_VIOLATION) {
        return { ok: false, code: 'slot_unavailable', error: 'Dieser Termin wurde soeben vergeben. Bitte wähle eine andere Uhrzeit.' }
      }
      if (code === PG_UNIQUE_VIOLATION) continue // Buchungsnummer-Kollision → neuer Versuch
      console.error('[booking] Speichern fehlgeschlagen', err)
      return { ok: false, code: 'server', error: 'Die Buchung konnte technisch nicht gespeichert werden. Bitte versuche es erneut oder kontaktiere uns direkt.' }
    }
  }
  if (!created) {
    return { ok: false, code: 'server', error: 'Die Buchung konnte technisch nicht gespeichert werden. Bitte versuche es erneut.' }
  }

  // Ab hier ist die Buchung dauerhaft gespeichert. E-Mail-Fehler ändern daran nichts,
  // werden aber protokolliert und sind im Admin-Bereich sichtbar.
  const settings = await getSettings()
  const siteUrl = getSiteUrl()
  const mailData: BookingMailData = {
    reference: created.reference,
    status: created.status,
    serviceName: created.quote.serviceName,
    vehicleCategoryName: created.quote.vehicleName,
    addons: created.quote.addons,
    servicePriceCents: created.quote.servicePriceCents,
    totalPriceCents: created.quote.totalPriceCents,
    priceIsFrom: created.quote.priceIsFrom,
    durationMinutes: created.quote.durationMinutes,
    startsAt: created.startsAt,
    endsAt: created.endsAt,
    firstName: req.customer.firstName,
    lastName: req.customer.lastName,
    email: req.customer.email,
    phone: req.customer.phone,
    street: req.customer.street,
    postalCode: req.customer.postalCode,
    city: req.customer.city,
    vehicleModel: req.customer.vehicleModel,
    licensePlate: req.customer.licensePlate || null,
    customerMessage: req.customer.message || null,
    confirmationUrl: `${siteUrl}/buchen/bestaetigung/${token}`,
  }

  const [customerRes, adminRes] = await Promise.all([
    sendMail(customerBookingMail(mailData, settings.business)),
    (async () => {
      const mail = adminNewBookingMail(mailData, `${siteUrl}/admin/buchungen/${created!.id}`)
      return mail ? sendMail(mail) : { status: 'nicht_konfiguriert' as const }
    })(),
  ])
  await recordEmailStatus(created.id, customerRes, adminRes).catch((err) => console.error('[booking] E-Mail-Status', err))

  return {
    ok: true,
    reference: created.reference,
    token,
    status: created.status,
    startsAt: created.startsAt,
    customerEmailStatus: customerRes.status,
  }
}

async function recordEmailStatus(
  bookingId: string,
  customer: { status: string; error?: string },
  admin: { status: string; error?: string },
) {
  const db = await getDb()
  await db.query('UPDATE bookings SET customer_email_status = $2, admin_email_status = $3 WHERE id = $1', [
    bookingId,
    customer.status,
    admin.status,
  ])
  await db.query(
    `INSERT INTO booking_events (booking_id, type, message, data) VALUES ($1, 'email', $2, $3::jsonb)`,
    [
      bookingId,
      `Bestätigung an Kunden: ${customer.status}; Benachrichtigung an Admin: ${admin.status}`,
      JSON.stringify({ customerError: customer.error, adminError: admin.error }),
    ],
  )
}

class BookingError extends Error {
  constructor(
    public code: 'invalid' | 'slot_unavailable' | 'outside_area',
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

// ─── Öffentliche Bestätigungsseite ──────────────────────────────────────────────

export interface PublicBooking {
  reference: string
  status: string
  serviceName: string
  vehicleCategoryName: string
  addons: Array<{ name: string; priceCents: number; priceIsFrom: boolean }>
  servicePriceCents: number | null
  totalPriceCents: number | null
  priceIsFrom: boolean
  durationMinutes: number
  startsAt: Date
  firstName: string
  street: string
  postalCode: string
  city: string
  vehicleModel: string
  customerEmailStatus: string
  email: string
}

export async function getBookingByToken(token: string): Promise<PublicBooking | null> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token) || !isDatabaseConfigured()) return null
  const db = await getDb()
  const { rows } = await db.query<Record<string, unknown>>(
    `SELECT reference, status, service_name, vehicle_category_name, addons, service_price_cents, total_price_cents,
            price_is_from, duration_minutes, starts_at, first_name, street, postal_code, city, vehicle_model,
            customer_email_status, email, anonymized_at
     FROM bookings WHERE access_token_hash = $1`,
    [hashToken(token)],
  )
  const r = rows[0]
  if (!r || r.anonymized_at) return null
  return {
    reference: String(r.reference),
    status: String(r.status),
    serviceName: String(r.service_name),
    vehicleCategoryName: String(r.vehicle_category_name),
    addons: (r.addons as PublicBooking['addons']) ?? [],
    servicePriceCents: r.service_price_cents === null ? null : Number(r.service_price_cents),
    totalPriceCents: r.total_price_cents === null ? null : Number(r.total_price_cents),
    priceIsFrom: Boolean(r.price_is_from),
    durationMinutes: Number(r.duration_minutes),
    startsAt: new Date(r.starts_at as string),
    firstName: String(r.first_name),
    street: String(r.street),
    postalCode: String(r.postal_code),
    city: String(r.city),
    vehicleModel: String(r.vehicle_model),
    customerEmailStatus: String(r.customer_email_status),
    email: String(r.email),
  }
}
