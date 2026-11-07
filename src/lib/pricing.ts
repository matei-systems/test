/**
 * Preis- und Dauerberechnung (reine Funktionen).
 * Wird im Browser (Live-Vorschau) UND auf dem Server (verbindliche Berechnung) verwendet.
 * Der Server vertraut niemals Preisen aus dem Browser – er berechnet immer neu.
 */

export interface CatalogVehicle {
  id: string
  name: string
  description: string
  sort: number
  active: boolean
}

export interface ServicePrice {
  /** null = Preis auf Anfrage */
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

export interface Catalog {
  vehicles: CatalogVehicle[]
  services: CatalogService[]
  addons: CatalogAddon[]
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
  servicePriceCents: number | null
  addons: QuoteLineAddon[]
  /** null = Preis auf Anfrage */
  totalPriceCents: number | null
  /** true, wenn mindestens ein Posten ein "ab"-Preis ist */
  priceIsFrom: boolean
  durationMinutes: number
}

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string }

export function calculateQuote(catalog: Catalog, input: QuoteInput): QuoteResult {
  const service = catalog.services.find((s) => s.id === input.serviceId && s.active)
  if (!service) return { ok: false, error: 'Die gewählte Leistung ist nicht verfügbar.' }

  const vehicle = catalog.vehicles.find((v) => v.id === input.vehicleId && v.active)
  if (!vehicle) return { ok: false, error: 'Die gewählte Fahrzeugkategorie ist nicht verfügbar.' }

  const price = service.prices[vehicle.id]
  if (!price) return { ok: false, error: 'Für diese Fahrzeugkategorie ist die Leistung nicht buchbar.' }

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

  const durationMinutes = price.durationMinutes + addons.reduce((sum, a) => sum + a.durationMinutes, 0)
  if (durationMinutes <= 0) return { ok: false, error: 'Für diese Auswahl ist keine Dauer hinterlegt.' }

  const addonSum = addons.reduce((sum, a) => sum + a.priceCents, 0)
  const totalPriceCents = price.priceCents === null ? null : price.priceCents + addonSum

  return {
    ok: true,
    quote: {
      serviceId: service.id,
      serviceName: service.name,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      servicePriceCents: price.priceCents,
      addons,
      totalPriceCents,
      priceIsFrom: addons.some((a) => a.priceIsFrom),
      durationMinutes,
    },
  }
}

function sortIndex(list: CatalogAddon[], id: string): number {
  const i = list.findIndex((a) => a.id === id)
  return i === -1 ? 999 : i
}

/** Niedrigster und höchster Preis einer Leistung über alle aktiven Fahrzeugkategorien. */
export function servicePriceRange(
  service: CatalogService,
  vehicles: CatalogVehicle[],
): { min: number | null; max: number | null; minVehicles: string[]; onRequest: boolean } {
  const active = vehicles.filter((v) => v.active && service.prices[v.id])
  const priced = active.filter((v) => service.prices[v.id].priceCents !== null)
  if (priced.length === 0) return { min: null, max: null, minVehicles: [], onRequest: true }
  const values = priced.map((v) => service.prices[v.id].priceCents as number)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return {
    min,
    max,
    minVehicles: priced.filter((v) => service.prices[v.id].priceCents === min).map((v) => v.name),
    onRequest: false,
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
