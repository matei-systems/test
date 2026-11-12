import 'server-only'
import { getDb, isDatabaseConfigured, type Queryable } from './db'
import type { Catalog, CatalogAddon, CatalogService, CatalogVehicle, Promotion } from './pricing'
import type { WorkingDay } from './availability'
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
  type BookingRules,
  type BusinessInfo,
  type ServiceArea,
} from '@/config/defaults'

/**
 * Lesezugriffe auf Leistungen, Preise, Aktionen, Galerie und Einstellungen.
 * Ein kurzer In-Memory-Cache (TTL) entlastet die Datenbank; Admin-Änderungen leeren ihn sofort.
 */

const TTL_MS = 15_000
type Entry = { at: number; value: Promise<unknown> }
type GlobalWithCache = typeof globalThis & { __glanzmobilCache?: Map<string, Entry> }
const g = globalThis as GlobalWithCache
const cache = (g.__glanzmobilCache ??= new Map<string, Entry>())

function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>
  const value = load().catch((err) => {
    cache.delete(key)
    throw err
  })
  cache.set(key, { at: Date.now(), value })
  return value
}

export function invalidateCatalogCache(): void {
  cache.clear()
}

interface ServiceRow {
  id: string
  name: string
  tagline: string
  description: string
  includes: string[]
  price_note: string
  requires_addon: boolean
  featured: boolean
  sort: number
  active: boolean
  image_src: string | null
}

interface PromotionRow {
  id: string
  name: string
  service_id: string | null
  vehicle_category_id: string | null
  discount_percent: number | null
  promo_price_cents: number | null
  starts_at: Date | string | null
  ends_at: Date | string | null
  active: boolean
  show_strikethrough: boolean
}

function iso(v: Date | string | null): string | null {
  return v === null ? null : new Date(v).toISOString()
}

export async function loadPromotions(q: Queryable, includeInactive = false): Promise<Promotion[]> {
  const { rows } = await q.query<PromotionRow>(
    `SELECT id, name, service_id, vehicle_category_id, discount_percent, promo_price_cents, starts_at, ends_at, active, show_strikethrough
     FROM promotions ${includeInactive ? '' : 'WHERE active AND (ends_at IS NULL OR ends_at > now())'} ORDER BY created_at`,
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    serviceId: r.service_id,
    vehicleId: r.vehicle_category_id,
    discountPercent: r.discount_percent === null ? null : Number(r.discount_percent),
    promoPriceCents: r.promo_price_cents === null ? null : Number(r.promo_price_cents),
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    active: r.active,
    showStrikethrough: r.show_strikethrough,
  }))
}

export async function loadCatalog(q: Queryable, includeInactive = false): Promise<Catalog> {
  const where = includeInactive ? '' : 'WHERE active'
  // Nacheinander statt parallel: innerhalb einer Transaktion steht nur eine Verbindung zur Verfügung
  const vehicles = await q.query<{ id: string; name: string; description: string; sort: number; active: boolean }>(
    `SELECT id, name, description, sort, active FROM vehicle_categories ${where} ORDER BY sort, name`,
  )
  const services = await q.query<ServiceRow>(
    `SELECT id, name, tagline, description, includes, price_note, requires_addon, featured, sort, active, image_src
     FROM services ${where} ORDER BY sort, name`,
  )
  const prices = await q.query<{ service_id: string; vehicle_category_id: string; price_cents: number | null; duration_minutes: number }>(
    'SELECT service_id, vehicle_category_id, price_cents, duration_minutes FROM service_prices',
  )
  const addons = await q.query<{
    id: string
    name: string
    description: string
    price_cents: number
    price_is_from: boolean
    duration_minutes: number
    bookable_alone: boolean
    sort: number
    active: boolean
  }>(
    `SELECT id, name, description, price_cents, price_is_from, duration_minutes, bookable_alone, sort, active
     FROM addons ${where} ORDER BY sort, name`,
  )
  const promotions = await loadPromotions(q, includeInactive)

  const catalogVehicles: CatalogVehicle[] = vehicles.rows.map((v) => ({ ...v, sort: Number(v.sort) }))
  const catalogServices: CatalogService[] = services.rows.map((s) => ({
    id: s.id,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    includes: Array.isArray(s.includes) ? s.includes : [],
    priceNote: s.price_note,
    requiresAddon: s.requires_addon,
    featured: s.featured,
    sort: Number(s.sort),
    active: s.active,
    imageSrc: s.image_src,
    prices: Object.fromEntries(
      prices.rows
        .filter((p) => p.service_id === s.id)
        .map((p) => [
          p.vehicle_category_id,
          { priceCents: p.price_cents === null ? null : Number(p.price_cents), durationMinutes: Number(p.duration_minutes) },
        ]),
    ),
  }))
  const catalogAddons: CatalogAddon[] = addons.rows.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    priceCents: Number(a.price_cents),
    priceIsFrom: a.price_is_from,
    durationMinutes: Number(a.duration_minutes),
    bookableAlone: a.bookable_alone,
    sort: Number(a.sort),
    active: a.active,
  }))
  return { vehicles: catalogVehicles, services: catalogServices, addons: catalogAddons, promotions }
}

/**
 * Startwerte als Katalog – wird nur verwendet, solange in Produktion noch keine Datenbank
 * verbunden ist (Website bleibt erreichbar, die Online-Buchung ist dann deaktiviert).
 */
export function defaultCatalog(): Catalog {
  return {
    vehicles: DEFAULT_VEHICLE_CATEGORIES.map((v, i) => ({ ...v, sort: (i + 1) * 10, active: true })),
    services: DEFAULT_SERVICES.map((s, i) => ({
      id: s.id,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      includes: s.includes,
      priceNote: s.priceNote,
      requiresAddon: Boolean(s.requiresAddon),
      featured: Boolean(s.featured),
      sort: (i + 1) * 10,
      active: true,
      imageSrc: s.imageSrc ?? null,
      prices: Object.fromEntries(Object.entries(s.prices).map(([k, p]) => [k, { priceCents: p.price, durationMinutes: p.minutes }])),
    })),
    addons: DEFAULT_ADDONS.map((a, i) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      priceCents: a.priceCents,
      priceIsFrom: Boolean(a.priceIsFrom),
      durationMinutes: a.minutes,
      bookableAlone: a.bookableAlone,
      sort: (i + 1) * 10,
      active: true,
    })),
    promotions: DEFAULT_PROMOTIONS.map((p, i) => ({
      id: `default-${i}`,
      name: p.name,
      serviceId: p.serviceId,
      vehicleId: p.vehicleId,
      discountPercent: p.discountPercent,
      promoPriceCents: p.promoPriceCents,
      startsAt: null,
      endsAt: null,
      active: true,
      showStrikethrough: p.showStrikethrough,
    })),
  }
}

/** Öffentlicher Katalog (nur aktive Einträge), gecacht. */
export function getCatalog(): Promise<Catalog> {
  if (!isDatabaseConfigured()) return Promise.resolve(defaultCatalog())
  return memo('catalog', async () => loadCatalog(await getDb()))
}

export async function loadWorkingHours(q: Queryable): Promise<WorkingDay[]> {
  const { rows } = await q.query<{ weekday: number; is_open: boolean; open_time: string; close_time: string }>(
    'SELECT weekday, is_open, open_time::text AS open_time, close_time::text AS close_time FROM working_hours ORDER BY weekday',
  )
  return rows.map((r) => ({
    weekday: Number(r.weekday),
    isOpen: r.is_open,
    open: r.open_time.slice(0, 5),
    close: r.close_time.slice(0, 5),
  }))
}

export function getWorkingHours(): Promise<WorkingDay[]> {
  if (!isDatabaseConfigured()) {
    return Promise.resolve(DEFAULT_WORKING_HOURS.map((w) => ({ weekday: w.weekday, isOpen: w.isOpen, open: w.open, close: w.close })))
  }
  return memo('working_hours', async () => loadWorkingHours(await getDb()))
}

export interface SiteSettings {
  rules: BookingRules
  business: BusinessInfo
  area: ServiceArea
}

export async function loadSettings(q: Queryable): Promise<SiteSettings> {
  const { rows } = await q.query<{ key: string; value: unknown }>(
    "SELECT key, value FROM settings WHERE key IN ('booking_rules', 'business', 'service_area')",
  )
  const get = (key: string) => (rows.find((r) => r.key === key)?.value ?? {}) as Record<string, unknown>
  return {
    rules: { ...DEFAULT_BOOKING_RULES, ...(get('booking_rules') as Partial<BookingRules>) },
    business: { ...DEFAULT_BUSINESS, ...(get('business') as Partial<BusinessInfo>) },
    area: { ...DEFAULT_SERVICE_AREA, ...(get('service_area') as Partial<ServiceArea>) },
  }
}

export function getSettings(): Promise<SiteSettings> {
  if (!isDatabaseConfigured()) {
    return Promise.resolve({ rules: DEFAULT_BOOKING_RULES, business: DEFAULT_BUSINESS, area: DEFAULT_SERVICE_AREA })
  }
  return memo('settings', async () => loadSettings(await getDb()))
}

// ─── Galerie ────────────────────────────────────────────────────────────────────

export interface GalleryItem {
  id: string
  kind: 'vergleich' | 'bild'
  title: string
  description: string
  category: string
  beforeSrc: string | null
  afterSrc: string | null
  imageSrc: string | null
  alt: string
  isDemo: boolean
  published: boolean
  sort: number
}

export async function loadGallery(q: Queryable, includeUnpublished = false): Promise<GalleryItem[]> {
  const { rows } = await q.query<{
    id: string
    kind: 'vergleich' | 'bild'
    title: string
    description: string
    category: string
    before_src: string | null
    after_src: string | null
    image_src: string | null
    alt: string
    is_demo: boolean
    published: boolean
    sort: number
  }>(
    `SELECT id, kind, title, description, category, before_src, after_src, image_src, alt, is_demo, published, sort
     FROM gallery_items ${includeUnpublished ? '' : 'WHERE published'} ORDER BY sort, created_at`,
  )
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    description: r.description,
    category: r.category,
    beforeSrc: r.before_src,
    afterSrc: r.after_src,
    imageSrc: r.image_src,
    alt: r.alt,
    isDemo: r.is_demo,
    published: r.published,
    sort: Number(r.sort),
  }))
}

export function defaultGallery(): GalleryItem[] {
  return DEFAULT_GALLERY.map((d, i) => ({
    id: `default-${i}`,
    kind: d.kind,
    title: d.title,
    description: d.description,
    category: d.category,
    beforeSrc: d.beforeSrc ?? null,
    afterSrc: d.afterSrc ?? null,
    imageSrc: d.imageSrc ?? null,
    alt: d.alt,
    isDemo: true,
    published: true,
    sort: (i + 1) * 10,
  }))
}

/** Veröffentlichte Galerie-Einträge, gecacht. */
export function getGallery(): Promise<GalleryItem[]> {
  if (!isDatabaseConfigured()) return Promise.resolve(defaultGallery())
  return memo('gallery', async () => loadGallery(await getDb()))
}

/** Prüft eine Postleitzahl gegen die konfigurierten Bereiche ("8010-8077, 8501"). Leer = alles erlaubt. */
export function isPostalCodeAllowed(postalCode: string, ranges: string): boolean {
  return postalCodeInRanges(postalCode, ranges)
}

export { postalCodeInRanges } from './postal'
import { postalCodeInRanges } from './postal'
