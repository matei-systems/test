import 'server-only'
import { createHash, randomBytes, randomInt } from 'node:crypto'
import { getDb, isDatabaseConfigured, pgErrorCode, PG_EXCLUSION_VIOLATION, PG_UNIQUE_VIOLATION, type Queryable } from './db'
import { computeDaySlotCandidates, computeDaySlots, dayBoundsUtc, eachDate, type BusyInterval, type Interval } from './availability'
import { calculateQuote, type Quote, type QuoteInput } from './pricing'
import { getCatalog, getSettings, getWorkingHours, isPostalCodeAllowed, loadCatalog, loadSettings, loadWorkingHours } from './catalog'
import { addDays, todayInZone, zonedToUtc } from './time'
import type { BookingRequest } from './validation'
import {
  adminCancelledMail,
  adminNewBookingMail,
  customerBookingMail,
  customerCancelledMail,
  customerReminderMail,
  sendMail,
  type BookingMailData,
} from './email'
import { notifyWebhook } from './notify'
import { getSiteUrl } from '@/config/site'
import { checkCoupon, type AppliedCoupon } from './coupons'

/** Lädt belegte Zeiten (aktive Buchungen inkl. Puffer, je Team) und gesperrte Zeiten in einem Zeitraum. */
export async function loadOccupancy(
  q: Queryable,
  from: number,
  to: number,
  excludeBookingId?: string,
): Promise<{ busy: BusyInterval[]; blocked: Interval[] }> {
  const b = await q.query<{ starts_at: Date; blocked_until: Date; team: number }>(
    `SELECT starts_at, blocked_until, team FROM bookings
     WHERE status <> 'storniert' AND starts_at < $2 AND blocked_until > $1 ${excludeBookingId ? 'AND id <> $3' : ''}`,
    excludeBookingId ? [new Date(from), new Date(to), excludeBookingId] : [new Date(from), new Date(to)],
  )
  const p = await q.query<{ starts_at: Date; ends_at: Date }>(
    'SELECT starts_at, ends_at FROM blocked_periods WHERE starts_at < $2 AND ends_at > $1',
    [new Date(from), new Date(to)],
  )
  return {
    busy: b.rows.map((r) => ({ start: new Date(r.starts_at).getTime(), end: new Date(r.blocked_until).getTime(), team: Number(r.team) })),
    blocked: p.rows.map((r) => ({ start: new Date(r.starts_at).getTime(), end: new Date(r.ends_at).getTime() })),
  }
}

export type AvailabilityResult = { ok: true; quote: Quote; slots: string[] } | { ok: false; error: string }

/** Freie Startzeiten für einen Tag und eine konkrete Auswahl. */
export async function getDayAvailability(date: string, input: QuoteInput, now = Date.now()): Promise<AvailabilityResult> {
  const [catalog, settings, hours] = await Promise.all([getCatalog(), getSettings(), getWorkingHours()])
  const q = calculateQuote(catalog, input, now)
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
  const q = calculateQuote(catalog, input, now)
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
  return `RM-${block()}-${block()}`
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
      kind: 'buchung' | 'anfrage'
      startsAt: Date
      customerEmailStatus: string
    }
  | {
      ok: false
      code: 'invalid' | 'slot_unavailable' | 'outside_area' | 'price_changed' | 'coupon_invalid' | 'server'
      error: string
      fields?: Record<string, string>
    }

interface CreatedBooking {
  id: string
  reference: string
  status: string
  kind: 'buchung' | 'anfrage'
  quote: Quote
  coupon: AppliedCoupon | null
  totalPriceCents: number | null
  startsAt: Date
  endsAt: Date
}

export async function createBooking(req: BookingRequest, now = Date.now()): Promise<CreateBookingResult> {
  const db = await getDb()
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const acceptedAt = new Date(now)

  let created: CreatedBooking | null = null

  for (let attempt = 0; attempt < 3 && !created; attempt++) {
    try {
      created = await db.transaction(async (tx) => {
        // Serialisiert alle Buchungsvorgänge → keine Race Conditions zwischen Prüfung und Speichern
        await tx.query('SELECT pg_advisory_xact_lock(72110002)')

        const catalog = await loadCatalog(tx)
        const settings = await loadSettings(tx)
        const hours = await loadWorkingHours(tx)

        if (!isPostalCodeAllowed(req.customer.postalCode, settings.area.postalCodes)) {
          throw new BookingError(
            'outside_area',
            'Diese Postleitzahl liegt außerhalb unseres Einsatzgebiets. Kontaktieren Sie uns gerne für eine individuelle Anfrage.',
            { 'customer.postalCode': 'Außerhalb unseres Einsatzgebiets (Graz & Graz-Umgebung).' },
          )
        }

        const q = calculateQuote(catalog, { serviceId: req.serviceId, vehicleId: req.vehicleId, addonIds: req.addonIds }, now)
        if (!q.ok) throw new BookingError('invalid', q.error)
        const quote = q.quote

        // Gutschein verbindlich prüfen (innerhalb der serialisierten Transaktion → keine Mehrfacheinlösung)
        let coupon: AppliedCoupon | null = null
        if (req.couponCode) {
          const check = await checkCoupon(tx, { code: req.couponCode, quote, email: req.customer.email, phone: req.customer.phone }, now)
          if (!check.ok) throw new BookingError('coupon_invalid', check.error)
          coupon = check.coupon
        }
        const totalPriceCents = coupon ? coupon.totalCents : quote.totalPriceCents

        // Der Kunde muss genau den Preis bestätigt haben, den der Server berechnet (z. B. Aktion inzwischen abgelaufen)
        if (totalPriceCents !== req.expectedTotalCents) {
          throw new BookingError(
            'price_changed',
            'Der Preis hat sich inzwischen geändert. Bitte prüfen Sie die aktualisierte Übersicht und bestätigen Sie erneut.',
          )
        }

        const startsAt = zonedToUtc(req.date, req.time)
        const bounds = dayBoundsUtc(req.date)
        const occ = await loadOccupancy(tx, bounds.start - 86400_000, bounds.end + 86400_000)
        const candidates = computeDaySlotCandidates({
          date: req.date,
          durationMinutes: quote.durationMinutes,
          workingHours: hours,
          rules: settings.rules,
          busy: occ.busy,
          blocked: occ.blocked,
          now,
        })
        const slot = candidates.find((c) => c.time === req.time)
        if (!slot) {
          throw new BookingError('slot_unavailable', 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie eine andere Uhrzeit.')
        }
        const endsAt = new Date(slot.end)
        const blockedUntil = new Date(slot.end + settings.rules.bufferMinutes * 60_000)

        const kind: 'buchung' | 'anfrage' = quote.isRequest ? 'anfrage' : 'buchung'
        // Terminanfragen (ohne festen Preis) werden nie automatisch bestätigt
        const status = kind === 'buchung' && settings.rules.autoConfirm ? 'bestaetigt' : 'neu'
        const reference = generateReference()
        const c = req.customer
        const { rows } = await tx.query<{ id: string }>(
          `INSERT INTO bookings (
             reference, access_token_hash, status, kind, team,
             service_id, service_name, vehicle_category_id, vehicle_category_name, addons,
             service_price_cents, regular_price_cents, discount_cents, promotion_name, promotion_percent,
             total_price_cents, price_is_from, duration_minutes,
             starts_at, ends_at, blocked_until,
             first_name, last_name, email, phone, street, house_number, postal_code, city, location_note,
             vehicle_model, license_plate, customer_message,
             privacy_accepted_at, terms_accepted_at, marketing_consent_at,
             coupon_code, coupon_discount_cents
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
                     $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$34,$35,$36,$37)
           RETURNING id`,
          [
            reference,
            tokenHash,
            status,
            kind,
            slot.team,
            quote.serviceId,
            quote.serviceName,
            quote.vehicleId,
            quote.vehicleName,
            JSON.stringify(quote.addons),
            quote.servicePriceCents,
            quote.regularTotalCents,
            quote.discountCents,
            quote.promotion?.name ?? null,
            quote.promotion?.percent ?? null,
            totalPriceCents,
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
            c.houseNumber,
            c.postalCode,
            c.city,
            c.locationNote || null,
            c.vehicleModel,
            c.licensePlate || null,
            c.message || null,
            acceptedAt,
            req.marketingConsent ? acceptedAt : null,
            coupon?.code ?? null,
            coupon?.discountCents ?? 0,
          ],
        )
        const id = rows[0].id
        await tx.query(`INSERT INTO booking_events (booking_id, type, message) VALUES ($1, 'erstellt', $2)`, [
          id,
          kind === 'anfrage'
            ? 'Terminanfrage online gestellt (Preis auf Anfrage)'
            : status === 'bestaetigt'
              ? 'Online gebucht und automatisch bestätigt'
              : 'Online gebucht',
        ])
        if (coupon) {
          await tx.query(`INSERT INTO booking_events (booking_id, type, message) VALUES ($1, 'notiz', $2)`, [
            id,
            `Gutschein ${coupon.code} eingelöst (−${(coupon.discountCents / 100).toFixed(2).replace('.', ',')} €)`,
          ])
        }
        return { id, reference, status, kind, quote, coupon, totalPriceCents, startsAt, endsAt }
      })
    } catch (err) {
      if (err instanceof BookingError) return { ok: false, code: err.code, error: err.message, fields: err.fields }
      const code = pgErrorCode(err)
      if (code === PG_EXCLUSION_VIOLATION) {
        return { ok: false, code: 'slot_unavailable', error: 'Dieser Termin wurde soeben vergeben. Bitte wählen Sie eine andere Uhrzeit.' }
      }
      if (code === PG_UNIQUE_VIOLATION) continue // Buchungsnummer-Kollision → neuer Versuch
      console.error('[booking] Speichern fehlgeschlagen', err)
      throw err
    }
  }
  if (!created) {
    return { ok: false, code: 'server', error: 'Die Buchung konnte technisch nicht gespeichert werden. Bitte versuchen Sie es erneut.' }
  }

  // Ab hier ist die Buchung dauerhaft gespeichert. E-Mail-Fehler ändern daran nichts,
  // werden aber protokolliert und sind im Admin-Bereich sichtbar.
  const settings = await getSettings()
  const siteUrl = getSiteUrl()
  const c = req.customer
  const mailData: BookingMailData = {
    reference: created.reference,
    status: created.status,
    kind: created.kind,
    serviceName: created.quote.serviceName,
    vehicleCategoryName: created.quote.vehicleName,
    addons: created.quote.addons,
    servicePriceCents: created.quote.servicePriceCents,
    regularPriceCents: created.quote.regularTotalCents,
    discountCents: created.quote.discountCents,
    promotionName: created.quote.promotion?.name ?? null,
    couponCode: created.coupon?.code ?? null,
    couponDiscountCents: created.coupon?.discountCents ?? 0,
    totalPriceCents: created.totalPriceCents,
    priceIsFrom: created.quote.priceIsFrom,
    durationMinutes: created.quote.durationMinutes,
    startsAt: created.startsAt,
    endsAt: created.endsAt,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    street: c.street,
    houseNumber: c.houseNumber,
    postalCode: c.postalCode,
    city: c.city,
    locationNote: c.locationNote || null,
    vehicleModel: c.vehicleModel,
    licensePlate: c.licensePlate || null,
    customerMessage: c.message || null,
    confirmationUrl: `${siteUrl}/buchen/bestaetigung/${token}`,
  }

  const adminUrl = `${siteUrl}/admin/buchungen/${created.id}`
  const [customerRes, adminRes] = await Promise.all([
    sendMail(customerBookingMail(mailData, settings.business)),
    (async () => {
      const mail = adminNewBookingMail(mailData, adminUrl)
      return mail ? sendMail(mail) : { status: 'nicht_konfiguriert' as const }
    })(),
    notifyWebhook(created.kind === 'anfrage' ? 'anfrage.neu' : 'buchung.neu', {
      reference: created.reference,
      status: created.status,
      startsAt: created.startsAt.toISOString(),
      service: created.quote.serviceName,
      vehicle: created.quote.vehicleName,
      totalPriceCents: created.totalPriceCents,
      couponCode: created.coupon?.code ?? null,
      customer: `${c.firstName} ${c.lastName}`,
      phone: c.phone,
      city: c.city,
      adminUrl,
    }),
  ])
  await recordEmailStatus(created.id, customerRes, adminRes).catch((err) => console.error('[booking] E-Mail-Status', err))

  return {
    ok: true,
    reference: created.reference,
    token,
    status: created.status,
    kind: created.kind,
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
  await db.query(`INSERT INTO booking_events (booking_id, type, message, data) VALUES ($1, 'email', $2, $3::jsonb)`, [
    bookingId,
    `Bestätigung an Kunden: ${customer.status}; Benachrichtigung an Admin: ${admin.status}`,
    JSON.stringify({ customerError: customer.error, adminError: admin.error }),
  ])
}

class BookingError extends Error {
  constructor(
    public code: 'invalid' | 'slot_unavailable' | 'outside_area' | 'price_changed' | 'coupon_invalid',
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

// ─── Zeilen ↔ E-Mail-Daten ──────────────────────────────────────────────────────

export interface BookingRecord {
  id: string
  reference: string
  status: string
  kind: 'buchung' | 'anfrage'
  team: number
  service_id: string | null
  service_name: string
  vehicle_category_id: string | null
  vehicle_category_name: string
  addons: Array<{ id: string; name: string; priceCents: number; priceIsFrom: boolean; durationMinutes: number }>
  service_price_cents: number | null
  regular_price_cents: number | null
  discount_cents: number
  promotion_name: string | null
  promotion_percent: number | null
  coupon_code: string | null
  coupon_discount_cents: number
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
  house_number: string
  postal_code: string
  city: string
  location_note: string | null
  vehicle_model: string
  license_plate: string | null
  customer_message: string | null
  customer_email_status: string
  admin_email_status: string
  admin_note: string | null
  marketing_consent_at: Date | null
  reminder_sent_at: Date | null
  cancelled_by: string | null
  anonymized_at: Date | null
  created_at: Date
  updated_at: Date
}

export function recordToMailData(b: BookingRecord): BookingMailData {
  return {
    reference: b.reference,
    status: b.status,
    kind: b.kind,
    serviceName: b.service_name,
    vehicleCategoryName: b.vehicle_category_name,
    addons: b.addons ?? [],
    servicePriceCents: b.service_price_cents === null ? null : Number(b.service_price_cents),
    regularPriceCents: b.regular_price_cents === null ? null : Number(b.regular_price_cents),
    discountCents: Number(b.discount_cents ?? 0),
    promotionName: b.promotion_name,
    couponCode: b.coupon_code ?? null,
    couponDiscountCents: Number(b.coupon_discount_cents ?? 0),
    totalPriceCents: b.total_price_cents === null ? null : Number(b.total_price_cents),
    priceIsFrom: b.price_is_from,
    durationMinutes: Number(b.duration_minutes),
    startsAt: new Date(b.starts_at),
    endsAt: new Date(b.ends_at),
    firstName: b.first_name,
    lastName: b.last_name,
    email: b.email,
    phone: b.phone,
    street: b.street,
    houseNumber: b.house_number,
    postalCode: b.postal_code,
    city: b.city,
    locationNote: b.location_note,
    vehicleModel: b.vehicle_model,
    licensePlate: b.license_plate,
    customerMessage: b.customer_message,
  }
}

// ─── Öffentliche Bestätigungsseite ──────────────────────────────────────────────

export interface PublicBooking {
  reference: string
  status: string
  kind: 'buchung' | 'anfrage'
  serviceName: string
  vehicleCategoryName: string
  addons: Array<{ name: string; priceCents: number; priceIsFrom: boolean }>
  servicePriceCents: number | null
  regularPriceCents: number | null
  discountCents: number
  promotionName: string | null
  promotionPercent: number | null
  couponCode: string | null
  couponDiscountCents: number
  totalPriceCents: number | null
  priceIsFrom: boolean
  durationMinutes: number
  startsAt: Date
  firstName: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  vehicleModel: string
  customerEmailStatus: string
  email: string
  /** Online-Stornierung möglich bis (null = nicht möglich) */
  cancellableUntil: Date | null
}

async function findByToken(q: Queryable, token: string): Promise<BookingRecord | null> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null
  const { rows } = await q.query<BookingRecord>('SELECT * FROM bookings WHERE access_token_hash = $1', [hashToken(token)])
  const r = rows[0]
  if (!r || r.anonymized_at) return null
  return r
}

function cancellableUntil(b: BookingRecord, cancelHours: number, now: number): Date | null {
  if (cancelHours <= 0) return null
  if (!['neu', 'bestaetigt'].includes(b.status)) return null
  const limit = new Date(b.starts_at).getTime() - cancelHours * 3600_000
  return limit > now ? new Date(limit) : null
}

export async function getBookingByToken(token: string, now = Date.now()): Promise<PublicBooking | null> {
  if (!isDatabaseConfigured()) return null
  const db = await getDb()
  const r = await findByToken(db, token)
  if (!r) return null
  const settings = await getSettings()
  return {
    reference: r.reference,
    status: r.status,
    kind: r.kind,
    serviceName: r.service_name,
    vehicleCategoryName: r.vehicle_category_name,
    addons: r.addons ?? [],
    servicePriceCents: r.service_price_cents === null ? null : Number(r.service_price_cents),
    regularPriceCents: r.regular_price_cents === null ? null : Number(r.regular_price_cents),
    discountCents: Number(r.discount_cents ?? 0),
    promotionName: r.promotion_name,
    promotionPercent: r.promotion_percent === null ? null : Number(r.promotion_percent),
    couponCode: r.coupon_code ?? null,
    couponDiscountCents: Number(r.coupon_discount_cents ?? 0),
    totalPriceCents: r.total_price_cents === null ? null : Number(r.total_price_cents),
    priceIsFrom: r.price_is_from,
    durationMinutes: Number(r.duration_minutes),
    startsAt: new Date(r.starts_at),
    firstName: r.first_name,
    street: r.street,
    houseNumber: r.house_number,
    postalCode: r.postal_code,
    city: r.city,
    vehicleModel: r.vehicle_model,
    customerEmailStatus: r.customer_email_status,
    email: r.email,
    cancellableUntil: cancellableUntil(r, settings.rules.cancelHours, now),
  }
}

// ─── Online-Stornierung durch den Kunden ────────────────────────────────────────

export type CancelResult = { ok: true; reference: string } | { ok: false; code: 'not_found' | 'too_late' | 'not_allowed'; error: string }

export async function cancelBookingByToken(token: string, now = Date.now()): Promise<CancelResult> {
  const db = await getDb()
  const settings = await getSettings()
  const result = await db.transaction(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(72110002)')
    const b = await findByToken(tx, token)
    if (!b) return { ok: false as const, code: 'not_found' as const, error: 'Buchung nicht gefunden.' }
    if (b.status === 'storniert') return { ok: true as const, booking: b, already: true }
    if (!['neu', 'bestaetigt'].includes(b.status)) {
      return { ok: false as const, code: 'not_allowed' as const, error: 'Dieser Termin kann nicht mehr online storniert werden.' }
    }
    if (!cancellableUntil(b, settings.rules.cancelHours, now)) {
      return {
        ok: false as const,
        code: 'too_late' as const,
        error: 'Die Frist für die Online-Stornierung ist abgelaufen. Bitte kontaktieren Sie uns direkt.',
      }
    }
    await tx.query(`UPDATE bookings SET status = 'storniert', cancelled_by = 'kunde', updated_at = now() WHERE id = $1`, [b.id])
    await tx.query(`INSERT INTO booking_events (booking_id, type, message) VALUES ($1, 'status', 'Vom Kunden online storniert')`, [b.id])
    return { ok: true as const, booking: b, already: false }
  })
  if (!result.ok) return result
  if (!result.already) {
    const data = recordToMailData(result.booking)
    const adminUrl = `${getSiteUrl()}/admin/buchungen/${result.booking.id}`
    const adminMail = adminCancelledMail(data, adminUrl)
    const [customerRes] = await Promise.all([
      sendMail(customerCancelledMail(data, settings.business)),
      adminMail ? sendMail(adminMail) : Promise.resolve(null),
      notifyWebhook('buchung.storniert', { reference: result.booking.reference, startsAt: data.startsAt.toISOString(), by: 'kunde', adminUrl }),
    ])
    await db
      .query(`INSERT INTO booking_events (booking_id, type, message) VALUES ($1, 'email', $2)`, [
        result.booking.id,
        `Stornobestätigung an Kunden: ${customerRes.status}`,
      ])
      .catch(() => undefined)
  }
  return { ok: true, reference: result.booking.reference }
}

// ─── Terminerinnerungen ─────────────────────────────────────────────────────────

/**
 * Sendet Erinnerungen für bestätigte Termine, die innerhalb der nächsten `hoursAhead` Stunden beginnen.
 * Jede Buchung wird höchstens einmal erinnert (reminder_sent_at).
 */
export async function sendDueReminders(now = Date.now(), hoursAhead = 30): Promise<{ due: number; sent: number; failed: number; skipped: number }> {
  const db = await getDb()
  const settings = await getSettings()
  const { rows } = await db.query<BookingRecord>(
    `SELECT * FROM bookings
     WHERE status = 'bestaetigt' AND reminder_sent_at IS NULL AND anonymized_at IS NULL
       AND starts_at > $1 AND starts_at <= $2
     ORDER BY starts_at LIMIT 100`,
    [new Date(now + 2 * 3600_000), new Date(now + hoursAhead * 3600_000)],
  )
  let sent = 0
  let failed = 0
  let skipped = 0
  for (const b of rows) {
    const res = await sendMail(customerReminderMail(recordToMailData(b), settings.business))
    if (res.status === 'gesendet') {
      sent++
      await db.query('UPDATE bookings SET reminder_sent_at = now() WHERE id = $1', [b.id])
      await db.query(`INSERT INTO booking_events (booking_id, type, message) VALUES ($1, 'email', 'Terminerinnerung gesendet')`, [b.id])
    } else if (res.status === 'nicht_konfiguriert') {
      skipped++
    } else {
      failed++
      await db.query(`INSERT INTO booking_events (booking_id, type, message, data) VALUES ($1, 'email', 'Terminerinnerung fehlgeschlagen', $2::jsonb)`, [
        b.id,
        JSON.stringify({ error: res.error }),
      ])
    }
  }
  return { due: rows.length, sent, failed, skipped }
}
