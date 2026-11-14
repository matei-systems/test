import type { Queryable } from './db'
import type { Quote } from './pricing'
import { formatEuro } from './format'

/**
 * Gutscheine: fester Betrag ab einem Mindestauftragswert, einlösbar in der Online-Buchung.
 *
 * Geprüft wird ausschließlich auf dem Server (bei der Vorab-Prüfung und verbindlich beim Speichern der
 * Buchung, dort innerhalb der Buchungs-Transaktion → keine Mehrfacheinlösung durch parallele Anfragen).
 * Stornierte Buchungen geben den Gutschein wieder frei.
 */

export const COUPON_CODE_PATTERN = /^[A-Z0-9]{3,24}$/

/** „danke 20“ / „Danke-20“ → „DANKE20“ */
export function normalizeCouponCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, '')
}

export interface Coupon {
  id: string
  code: string
  label: string
  amountCents: number
  minOrderCents: number
  firstBookingOnly: boolean
  oncePerCustomer: boolean
  maxRedemptions: number | null
  startsAt: string | null
  endsAt: string | null
  active: boolean
}

export interface CouponRow {
  id: string
  code: string
  label: string
  amount_cents: number
  min_order_cents: number
  first_booking_only: boolean
  once_per_customer: boolean
  max_redemptions: number | null
  starts_at: Date | string | null
  ends_at: Date | string | null
  active: boolean
}

export function rowToCoupon(r: CouponRow): Coupon {
  const iso = (v: Date | string | null) => (v === null ? null : new Date(v).toISOString())
  return {
    id: r.id,
    code: r.code,
    label: r.label,
    amountCents: Number(r.amount_cents),
    minOrderCents: Number(r.min_order_cents),
    firstBookingOnly: r.first_booking_only,
    oncePerCustomer: r.once_per_customer,
    maxRedemptions: r.max_redemptions === null ? null : Number(r.max_redemptions),
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    active: r.active,
  }
}

export const COUPON_COLUMNS =
  'id, code, label, amount_cents, min_order_cents, first_booking_only, once_per_customer, max_redemptions, starts_at, ends_at, active'

/** Ergebnis einer erfolgreichen Prüfung – genau das, was dem Kunden angezeigt und gespeichert wird. */
export interface AppliedCoupon {
  code: string
  label: string
  /** Tatsächlich abgezogener Betrag */
  discountCents: number
  minOrderCents: number
  /** Zu zahlender Betrag nach Abzug */
  totalCents: number
}

export type CouponCheck = { ok: true; coupon: AppliedCoupon } | { ok: false; error: string }

export interface CouponCheckInput {
  code: string
  quote: Quote
  /** Kontaktdaten des Kunden – ohne sie werden die personenbezogenen Regeln erst beim Buchen geprüft */
  email?: string
  phone?: string
}

/** Letzte 8 Ziffern einer Telefonnummer (unabhängig von +43 / 0043 / 0 und Leerzeichen). */
function phoneKey(phone: string | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '')
  return digits.length >= 8 ? digits.slice(-8) : null
}

const INVALID = 'Dieser Gutscheincode ist ungültig oder nicht mehr aktiv.'

export async function checkCoupon(q: Queryable, input: CouponCheckInput, now: number = Date.now()): Promise<CouponCheck> {
  const code = normalizeCouponCode(input.code)
  if (!COUPON_CODE_PATTERN.test(code)) return { ok: false, error: INVALID }

  const { rows } = await q.query<CouponRow>(`SELECT ${COUPON_COLUMNS} FROM coupons WHERE code = $1`, [code])
  if (!rows[0]) return { ok: false, error: INVALID }
  const coupon = rowToCoupon(rows[0])
  if (!coupon.active) return { ok: false, error: INVALID }
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return { ok: false, error: 'Dieser Gutschein ist noch nicht gültig.' }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() <= now) return { ok: false, error: 'Dieser Gutschein ist abgelaufen.' }

  const total = input.quote.totalPriceCents
  if (total === null) {
    return {
      ok: false,
      error: 'Bei einem Preis auf Anfrage kann der Gutschein nicht online eingelöst werden. Bitte nennen Sie den Code in Ihrer Nachricht.',
    }
  }
  if (total < coupon.minOrderCents) {
    return {
      ok: false,
      error: `Der Gutschein gilt ab einem Auftragswert von ${formatEuro(coupon.minOrderCents)}. Ihr Auftragswert beträgt derzeit ${formatEuro(total)}.`,
    }
  }

  if (coupon.maxRedemptions !== null) {
    const used = await q.query<{ n: number }>(`SELECT count(*) AS n FROM bookings WHERE coupon_code = $1 AND status <> 'storniert'`, [code])
    if (Number(used.rows[0].n) >= coupon.maxRedemptions) return { ok: false, error: 'Dieser Gutschein wurde bereits vollständig eingelöst.' }
  }

  const email = input.email?.trim().toLowerCase() || null
  const phone = phoneKey(input.phone)
  if (email || phone) {
    // Derselbe Kunde = gleiche E-Mail-Adresse oder gleiche Telefonnummer
    const sameCustomer = `(($2::text IS NOT NULL AND lower(email) = $2) OR ($3::text IS NOT NULL AND right(regexp_replace(phone, '[^0-9]', '', 'g'), 8) = $3))`
    if (coupon.oncePerCustomer) {
      const r = await q.query<{ n: number }>(
        `SELECT count(*) AS n FROM bookings WHERE coupon_code = $1 AND status <> 'storniert' AND anonymized_at IS NULL AND ${sameCustomer}`,
        [code, email, phone],
      )
      if (Number(r.rows[0].n) > 0) return { ok: false, error: 'Dieser Gutschein wurde mit Ihren Kontaktdaten bereits eingelöst.' }
    }
    if (coupon.firstBookingOnly) {
      const r = await q.query<{ n: number }>(
        `SELECT count(*) AS n FROM bookings WHERE $1::text IS NOT NULL AND status <> 'storniert' AND anonymized_at IS NULL AND ${sameCustomer}`,
        [code, email, phone],
      )
      if (Number(r.rows[0].n) > 0) return { ok: false, error: 'Dieser Gutschein gilt nur für die erste Buchung neuer Kundinnen und Kunden.' }
    }
  }

  const discountCents = Math.min(coupon.amountCents, total)
  return {
    ok: true,
    coupon: { code, label: coupon.label, discountCents, minOrderCents: coupon.minOrderCents, totalCents: total - discountCents },
  }
}

/** Kurzbeschreibung der Bedingungen für Anzeige und E-Mails. */
export function couponTerms(c: Pick<Coupon, 'amountCents' | 'minOrderCents' | 'firstBookingOnly' | 'oncePerCustomer' | 'endsAt'>): string {
  const parts = [`${formatEuro(c.amountCents)} Nachlass`]
  if (c.minOrderCents > 0) parts.push(`ab ${formatEuro(c.minOrderCents)} Auftragswert`)
  if (c.firstBookingOnly) parts.push('nur für die erste Buchung')
  else if (c.oncePerCustomer) parts.push('einmal je Kunde')
  return parts.join(' · ')
}
