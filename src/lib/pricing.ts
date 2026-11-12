/**
 * Preis-, Rabatt- und Dauerberechnung (reine Funktionen).
 * Wird im Browser (Live-Vorschau) UND auf dem Server (verbindliche Berechnung) verwendet.
 * Der Server vertraut niemals Preisen aus dem Browser – er berechnet immer neu.
 *
 * Aktionen (Einführungspreise/Rabatte) gelten nur für den Paketpreis, nicht für Zusatzleistungen.
 *  - Prozent-Aktion: Aktionspreis = regulärer Preis − x %, auf volle Euro ABGERUNDET
 *    (der Kunde erhält also immer mindestens den ausgewiesenen Rabatt, z. B. 149 € − 20 % = 119 €).
 *  - Fixpreis-Aktion: fester Aktionspreis für genau eine Leistung + Fahrzeugkategorie;
 *    der angezeigte Prozentwert wird abgerundet (nie mehr Rabatt versprechen als gewährt).
 */

export interface CatalogVehicle {
  id: string
  name: string
  description: string
  sort: number
  active: boolean
}

export interface ServicePrice {
  /** Regulärer Preis; null = Preis auf Anfrage */
  priceCents: number | null
  durationMinutes: number
}

export interface CatalogService {
  id: string
  name: string
  tagline: string
  description: string
  includes: string[]
  priceNote: string
  requiresAddon: boolean
  featured: boolean
  sort: number
  active: boolean
  imageSrc: string | null
  prices: Record<string, ServicePrice>
}

export interface CatalogAddon {
  id: string
  name: string
  description: string
  priceCents: number
  priceIsFrom: boolean
  durationMinutes: number
  bookableAlone: boolean
  sort: number
  active: boolean
}

export interface Promotion {
  id: string
  name: string
  /** null = alle Leistungen */
  serviceId: string | null
  /** null = alle Fahrzeugkategorien */
  vehicleId: string | null
  discountPercent: number | null
  promoPriceCents: number | null
  /** ISO-Zeitpunkte (null = unbegrenzt) */
  startsAt: string | null
  endsAt: string | null
  active: boolean
  /** Regulären Preis durchgestrichen darstellen (nur wenn rechtlich zulässig) */
  showStrikethrough: boolean
}

export interface Catalog {
  vehicles: CatalogVehicle[]
  services: CatalogService[]
  addons: CatalogAddon[]
  promotions: Promotion[]
}

export interface AppliedPromotion {
  id: string
  name: string
  percent: number
  endsAt: string | null
  showStrikethrough: boolean
}

export interface PriceInfo {
  /** Regulärer Preis (null = auf Anfrage) */
  regularCents: number | null
  /** Tatsächlich zu zahlender Preis */
  priceCents: number | null
  promotion: AppliedPromotion | null
}

export function isPromotionRunning(p: Promotion, now: number): boolean {
  if (!p.active) return false
  if (p.startsAt && new Date(p.startsAt).getTime() > now) return false
  if (p.endsAt && new Date(p.endsAt).getTime() <= now) return false
  return true
}

/** Aktionspreis einer Aktion für einen regulären Preis; null, wenn die Aktion nichts verbilligt. */
export function promotionPrice(p: Promotion, regularCents: number): { priceCents: number; percent: number } | null {
  if (regularCents <= 0) return null
  if (p.discountPercent !== null) {
    const priceCents = Math.floor((regularCents * (100 - p.discountPercent)) / 100 / 100) * 100
    if (priceCents >= regularCents || priceCents <= 0) return null
    return { priceCents, percent: p.discountPercent }
  }
  if (p.promoPriceCents !== null) {
    if (p.promoPriceCents >= regularCents) return null
    return { priceCents: p.promoPriceCents, percent: Math.floor(((regularCents - p.promoPriceCents) / regularCents) * 100) }
  }
  return null
}

/** Regulärer Preis und ggf. Aktionspreis einer Leistung für eine Fahrzeugkategorie. */
export function resolvePrice(catalog: Catalog, service: CatalogService, vehicleId: string, now: number): PriceInfo {
  const base = service.prices[vehicleId]
  const regularCents = base ? base.priceCents : null
  if (regularCents === null || regularCents <= 0 || service.requiresAddon) {
    return { regularCents, priceCents: regularCents, promotion: null }
  }
  let best: { priceCents: number; percent: number; promo: Promotion; specificity: number } | null = null
  for (const promo of catalog.promotions) {
    if (!isPromotionRunning(promo, now)) continue
    if (promo.serviceId && promo.serviceId !== service.id) continue
    if (promo.vehicleId && promo.vehicleId !== vehicleId) continue
    const result = promotionPrice(promo, regularCents)
    if (!result) continue
    const specificity = (promo.serviceId ? 2 : 0) + (promo.vehicleId ? 1 : 0)
    if (!best || specificity > best.specificity || (specificity === best.specificity && result.priceCents < best.priceCents)) {
      best = { ...result, promo, specificity }
    }
  }
  if (!best) return { regularCents, priceCents: regularCents, promotion: null }
  return {
    regularCents,
    priceCents: best.priceCents,
    promotion: {
      id: best.promo.id,
      name: best.promo.name,
      percent: best.percent,
      endsAt: best.promo.endsAt,
      showStrikethrough: best.promo.showStrikethrough,
    },
  }
}

export interface QuoteInput {
  serviceId: string
  vehicleId: string
  addonIds: string[]
}

export interface QuoteLineAddon {
  id: string
  name: string
  priceCents: number
  priceIsFrom: boolean
  durationMinutes: number
}

export interface Quote {
  serviceId: string
  serviceName: string
  vehicleId: string
  vehicleName: string
  /** Regulärer Paketpreis (null = auf Anfrage) */
  serviceRegularCents: number | null
  /** Paketpreis nach Aktion */
  servicePriceCents: number | null
  promotion: AppliedPromotion | null
  addons: QuoteLineAddon[]
  /** Summe ohne Aktion (null = auf Anfrage) */
  regularTotalCents: number | null
  /** Ersparnis durch die Aktion */
  discountCents: number
  /** Endpreis (null = Preis auf Anfrage) */
  totalPriceCents: number | null
  /** true, wenn mindestens ein Posten ein "ab"-Preis ist */
  priceIsFrom: boolean
  durationMinutes: number
  /** true = kein fester Preis → unverbindliche Terminanfrage statt verbindlicher Buchung */
  isRequest: boolean
}

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string }

export function calculateQuote(catalog: Catalog, input: QuoteInput, now: number = Date.now()): QuoteResult {
  const service = catalog.services.find((s) => s.id === input.serviceId && s.active)
  if (!service) return { ok: false, error: 'Die gewählte Leistung ist nicht verfügbar.' }

  const vehicle = catalog.vehicles.find((v) => v.id === input.vehicleId && v.active)
  if (!vehicle) return { ok: false, error: 'Die gewählte Fahrzeugkategorie ist nicht verfügbar.' }

  const base = service.prices[vehicle.id]
  if (!base) return { ok: false, error: 'Für diese Fahrzeugkategorie ist die Leistung nicht buchbar.' }

  const uniqueIds = Array.from(new Set(input.addonIds))
  if (uniqueIds.length !== input.addonIds.length) return { ok: false, error: 'Zusatzleistungen sind doppelt ausgewählt.' }

  const addons: QuoteLineAddon[] = []
  for (const id of uniqueIds) {
    const addon = catalog.addons.find((a) => a.id === id && a.active)
    if (!addon) return { ok: false, error: 'Eine gewählte Zusatzleistung ist nicht verfügbar.' }
    if (service.requiresAddon && !addon.bookableAlone) {
      return { ok: false, error: `„${addon.name}“ ist nur in Kombination mit einem Paket buchbar.` }
    }
    addons.push({
      id: addon.id,
      name: addon.name,
      priceCents: addon.priceCents,
      priceIsFrom: addon.priceIsFrom,
      durationMinutes: addon.durationMinutes,
    })
  }
  addons.sort((a, b) => sortIndex(catalog.addons, a.id) - sortIndex(catalog.addons, b.id))

  if (service.requiresAddon && addons.length === 0) {
    return { ok: false, error: 'Bitte wähle mindestens eine Zusatzleistung.' }
  }

  const durationMinutes = base.durationMinutes + addons.reduce((sum, a) => sum + a.durationMinutes, 0)
  if (durationMinutes <= 0) return { ok: false, error: 'Für diese Auswahl ist keine Dauer hinterlegt.' }

  const price = resolvePrice(catalog, service, vehicle.id, now)
  const addonSum = addons.reduce((sum, a) => sum + a.priceCents, 0)
  const isRequest = price.priceCents === null
  const regularTotalCents = price.regularCents === null ? null : price.regularCents + addonSum
  const totalPriceCents = price.priceCents === null ? null : price.priceCents + addonSum
  const discountCents = regularTotalCents !== null && totalPriceCents !== null ? regularTotalCents - totalPriceCents : 0

  return {
    ok: true,
    quote: {
      serviceId: service.id,
      serviceName: service.name,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      serviceRegularCents: price.regularCents,
      servicePriceCents: price.priceCents,
      promotion: discountCents > 0 ? price.promotion : null,
      addons,
      regularTotalCents,
      discountCents,
      totalPriceCents,
      priceIsFrom: addons.some((a) => a.priceIsFrom),
      durationMinutes,
      isRequest,
    },
  }
}

function sortIndex(list: CatalogAddon[], id: string): number {
  const i = list.findIndex((a) => a.id === id)
  return i === -1 ? 999 : i
}

export interface ServiceFromPrice {
  /** true = keine Kategorie mit festem Preis */
  onRequest: boolean
  /** Günstigste Kategorie (nach tatsächlich zu zahlendem Preis) */
  min: PriceInfo
  /** Höchster zu zahlender Preis über alle Kategorien */
  maxCents: number | null
  /** Preise unterscheiden sich je Kategorie → „ab“ */
  varies: boolean
  /** Namen der Kategorien, für die der „ab“-Preis gilt */
  minVehicles: string[]
}

/** „ab“-Preis einer Leistung über alle aktiven Fahrzeugkategorien (inkl. laufender Aktion). */
export function serviceFromPrice(catalog: Catalog, service: CatalogService, now: number): ServiceFromPrice {
  const rows = catalog.vehicles
    .filter((v) => v.active && service.prices[v.id])
    .map((v) => ({ vehicle: v, info: resolvePrice(catalog, service, v.id, now) }))
    .filter((r) => r.info.priceCents !== null)
  if (rows.length === 0) {
    return { onRequest: true, min: { regularCents: null, priceCents: null, promotion: null }, maxCents: null, varies: false, minVehicles: [] }
  }
  const prices = rows.map((r) => r.info.priceCents as number)
  const minCents = Math.min(...prices)
  const maxCents = Math.max(...prices)
  const minRows = rows.filter((r) => r.info.priceCents === minCents)
  return {
    onRequest: false,
    min: minRows[0].info,
    maxCents,
    varies: minCents !== maxCents,
    minVehicles: minRows.map((r) => r.vehicle.name),
  }
}

/** Dauer-Spanne einer Leistung in Minuten. */
export function serviceDurationRange(service: CatalogService, vehicles: CatalogVehicle[]): { min: number; max: number } {
  const d = vehicles
    .filter((v) => v.active && service.prices[v.id])
    .map((v) => service.prices[v.id].durationMinutes)
    .filter((n) => n > 0)
  if (d.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...d), max: Math.max(...d) }
}

/** Günstigster Preis einer allein buchbaren Zusatzleistung (für "Nur Zusatzleistungen"). */
export function minStandaloneAddonPrice(addons: CatalogAddon[]): number | null {
  const prices = addons.filter((a) => a.active && a.bookableAlone).map((a) => a.priceCents)
  return prices.length ? Math.min(...prices) : null
}

/** Größter aktuell laufender Rabatt in Prozent über alle Pakete (für Hinweise wie „bis zu −20 %“). */
export function maxRunningDiscount(catalog: Catalog, now: number): { percent: number; promotion: AppliedPromotion } | null {
  let best: { percent: number; promotion: AppliedPromotion } | null = null
  for (const s of catalog.services) {
    if (!s.active || s.requiresAddon) continue
    for (const v of catalog.vehicles) {
      if (!v.active) continue
      const info = resolvePrice(catalog, s, v.id, now)
      if (info.promotion && (!best || info.promotion.percent > best.percent)) best = { percent: info.promotion.percent, promotion: info.promotion }
    }
  }
  return best
}
