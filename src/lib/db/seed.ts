import { createHash } from 'node:crypto'
import type { Queryable } from './index'
import {
  DEFAULT_ADDONS,
  DEFAULT_BOOKING_RULES,
  DEFAULT_BUSINESS,
  DEFAULT_COUPONS,
  DEFAULT_GALLERY,
  DEFAULT_PROMOTIONS,
  DEFAULT_SERVICE_AREA,
  DEFAULT_SERVICES,
  DEFAULT_VEHICLE_CATEGORIES,
  DEFAULT_WORKING_HOURS,
} from '@/config/defaults'

const SEED_VERSION = 3

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
  if (current < 2) {
    await seedGallery(tx)
    await seedPromotions(tx)
  }
  // Neu in Version 3: Gutscheine, Leistungsumfang („nicht enthalten“, Voraussetzungen), Texte in Sie-Form
  await upgradeCatalogTexts(tx)
  await seedCoupons(tx)

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
      `INSERT INTO services (id, name, tagline, description, includes, price_note, requires_addon, featured, sort, image_src, excludes, requirements)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb) ON CONFLICT (id) DO NOTHING`,
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
        JSON.stringify(s.excludes),
        JSON.stringify(s.requirements),
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

/**
 * Fingerabdrücke der Starttexte aus Seed-Version 2. Nur Einträge, die noch exakt diesen Starttexten
 * entsprechen, werden auf die neuen Texte gehoben – im Admin-Bereich geänderte Texte bleiben unangetastet.
 */
const LEGACY_SERVICE_TEXTS: Record<string, string> = {
  'innenraum-basic': 'f0cb880c71e33587',
  'innenraum-premium': '0bbe7f2dc635bba8',
  aussenpflege: 'c2242fe23c3f844b',
  komplettpaket: '5c35631989451574',
  zusatzleistungen: '85a7fe37a2508005',
}
const LEGACY_ADDON_TEXTS: Record<string, string> = {
  detailreinigung: '804adb4b28f7d806',
}

export function textFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)
}

async function upgradeCatalogTexts(tx: Queryable): Promise<void> {
  for (const s of DEFAULT_SERVICES) {
    const { rows } = await tx.query<{ tagline: string; description: string; includes: unknown; price_note: string; excludes: unknown; requirements: unknown }>(
      'SELECT tagline, description, includes, price_note, excludes, requirements FROM services WHERE id = $1',
      [s.id],
    )
    const row = rows[0]
    if (!row) continue
    if (textFingerprint([row.tagline, row.description, row.includes, row.price_note]) === LEGACY_SERVICE_TEXTS[s.id]) {
      await tx.query('UPDATE services SET tagline = $2, description = $3, includes = $4::jsonb, price_note = $5, updated_at = now() WHERE id = $1', [
        s.id,
        s.tagline,
        s.description,
        JSON.stringify(s.includes),
        s.priceNote,
      ])
    }
    // Die neuen Felder sind bei bestehenden Installationen leer → mit den Startwerten füllen
    if (Array.isArray(row.excludes) && row.excludes.length === 0) {
      await tx.query('UPDATE services SET excludes = $2::jsonb WHERE id = $1', [s.id, JSON.stringify(s.excludes)])
    }
    if (Array.isArray(row.requirements) && row.requirements.length === 0) {
      await tx.query('UPDATE services SET requirements = $2::jsonb WHERE id = $1', [s.id, JSON.stringify(s.requirements)])
    }
  }
  for (const a of DEFAULT_ADDONS) {
    const legacy = LEGACY_ADDON_TEXTS[a.id]
    if (!legacy) continue
    const { rows } = await tx.query<{ name: string; description: string }>('SELECT name, description FROM addons WHERE id = $1', [a.id])
    if (rows[0] && textFingerprint([rows[0].name, rows[0].description]) === legacy) {
      await tx.query('UPDATE addons SET description = $2 WHERE id = $1', [a.id, a.description])
    }
  }
}

async function seedCoupons(tx: Queryable): Promise<void> {
  const { rows } = await tx.query<{ n: number }>('SELECT count(*) AS n FROM coupons')
  if (Number(rows[0].n) > 0) return
  for (const c of DEFAULT_COUPONS) {
    await tx.query(
      `INSERT INTO coupons (code, label, amount_cents, min_order_cents, first_booking_only, once_per_customer)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING`,
      [c.code, c.label, c.amountCents, c.minOrderCents, c.firstBookingOnly, c.oncePerCustomer],
    )
  }
}
