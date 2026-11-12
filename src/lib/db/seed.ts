import type { Queryable } from './index'
import {
  DEFAULT_ADDONS,
  DEFAULT_BOOKING_RULES,
  DEFAULT_BUSINESS,
  DEFAULT_GALLERY,
  DEFAULT_PROMOTIONS,
  DEFAULT_SERVICE_AREA,
  DEFAULT_SERVICES,
  DEFAULT_VEHICLE_CATEGORIES,
  DEFAULT_WORKING_HOURS,
} from '@/config/defaults'

const SEED_VERSION = 2

/**
 * Spielt die Startwerte genau einmal ein (Marker: settings.seed_version).
 * Spätere Änderungen/Löschungen im Admin-Bereich werden dadurch nie überschrieben.
 */
export async function seedDefaults(tx: Queryable): Promise<void> {
  const { rows } = await tx.query<{ value: unknown }>("SELECT value FROM settings WHERE key = 'seed_version'")
  const current = rows.length ? Number(rows[0].value) : 0
  if (current >= SEED_VERSION) return

  if (current === 0) {
    await seedCatalog(tx)
  }
  // Neu in Version 2 (auch für bestehende Installationen): Galerie-Demos und Einführungsaktion
  await seedGallery(tx)
  await seedPromotions(tx)

  await tx.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('seed_version', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(SEED_VERSION)],
  )
}

async function seedCatalog(tx: Queryable): Promise<void> {
  for (const [i, v] of DEFAULT_VEHICLE_CATEGORIES.entries()) {
    await tx.query(
      `INSERT INTO vehicle_categories (id, name, description, sort) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
      [v.id, v.name, v.description, (i + 1) * 10],
    )
  }

  for (const [i, s] of DEFAULT_SERVICES.entries()) {
    await tx.query(
      `INSERT INTO services (id, name, tagline, description, includes, price_note, requires_addon, featured, sort, image_src)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
      [
        s.id,
        s.name,
        s.tagline,
        s.description,
        JSON.stringify(s.includes),
        s.priceNote,
        Boolean(s.requiresAddon),
        Boolean(s.featured),
        (i + 1) * 10,
        s.imageSrc ?? null,
      ],
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
  }
  for (const [key, value] of Object.entries(settings)) {
    await tx.query(`INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO NOTHING`, [key, JSON.stringify(value)])
  }
}

async function seedGallery(tx: Queryable): Promise<void> {
  const { rows } = await tx.query<{ n: number }>('SELECT count(*) AS n FROM gallery_items')
  if (Number(rows[0].n) > 0) return
  for (const [i, g] of DEFAULT_GALLERY.entries()) {
    await tx.query(
      `INSERT INTO gallery_items (kind, title, description, category, before_src, after_src, image_src, alt, is_demo, sort)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)`,
      [g.kind, g.title, g.description, g.category, g.beforeSrc ?? null, g.afterSrc ?? null, g.imageSrc ?? null, g.alt, (i + 1) * 10],
    )
  }
}

async function seedPromotions(tx: Queryable): Promise<void> {
  const { rows } = await tx.query<{ n: number }>('SELECT count(*) AS n FROM promotions')
  if (Number(rows[0].n) > 0) return
  for (const p of DEFAULT_PROMOTIONS) {
    await tx.query(
      `INSERT INTO promotions (name, service_id, vehicle_category_id, discount_percent, promo_price_cents, show_strikethrough)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [p.name, p.serviceId, p.vehicleId, p.discountPercent, p.promoPriceCents, p.showStrikethrough],
    )
  }
}
