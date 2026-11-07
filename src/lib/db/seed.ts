import type { Queryable } from './index'
import {
  DEFAULT_ADDONS,
  DEFAULT_BOOKING_RULES,
  DEFAULT_BUSINESS,
  DEFAULT_SERVICE_AREA,
  DEFAULT_SERVICES,
  DEFAULT_VEHICLE_CATEGORIES,
  DEFAULT_WORKING_HOURS,
} from '@/config/defaults'

/**
 * Spielt die Startwerte genau einmal ein (Marker: settings.seed_version).
 * Spätere Änderungen/Löschungen im Admin-Bereich werden dadurch nie überschrieben.
 */
export async function seedDefaults(tx: Queryable): Promise<void> {
  const { rows } = await tx.query<{ value: unknown }>("SELECT value FROM settings WHERE key = 'seed_version'")
  if (rows.length > 0) return

  for (const [i, v] of DEFAULT_VEHICLE_CATEGORIES.entries()) {
    await tx.query(
      `INSERT INTO vehicle_categories (id, name, description, sort) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
      [v.id, v.name, v.description, (i + 1) * 10],
    )
  }

  for (const [i, s] of DEFAULT_SERVICES.entries()) {
    await tx.query(
      `INSERT INTO services (id, name, tagline, description, includes, price_note, requires_addon, featured, sort)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
      [s.id, s.name, s.tagline, s.description, JSON.stringify(s.includes), s.priceNote, Boolean(s.requiresAddon), Boolean(s.featured), (i + 1) * 10],
    )
    for (const [vehicleId, p] of Object.entries(s.prices)) {
      await tx.query(
        `INSERT INTO service_prices (service_id, vehicle_category_id, price_cents, duration_minutes)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [s.id, vehicleId, p.price, p.minutes],
      )
    }
  }

  for (const [i, a] of DEFAULT_ADDONS.entries()) {
    await tx.query(
      `INSERT INTO addons (id, name, description, price_cents, price_is_from, duration_minutes, bookable_alone, sort)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
      [a.id, a.name, a.description, a.priceCents, Boolean(a.priceIsFrom), a.minutes, a.bookableAlone, (i + 1) * 10],
    )
  }

  for (const w of DEFAULT_WORKING_HOURS) {
    await tx.query(
      `INSERT INTO working_hours (weekday, is_open, open_time, close_time) VALUES ($1, $2, $3, $4) ON CONFLICT (weekday) DO NOTHING`,
      [w.weekday, w.isOpen, w.open, w.close],
    )
  }

  const settings: Record<string, unknown> = {
    booking_rules: DEFAULT_BOOKING_RULES,
    business: DEFAULT_BUSINESS,
    service_area: DEFAULT_SERVICE_AREA,
    seed_version: 1,
  }
  for (const [key, value] of Object.entries(settings)) {
    await tx.query(`INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING`, [key, JSON.stringify(value)])
  }
}
