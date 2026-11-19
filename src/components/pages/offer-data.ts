import type { Catalog } from '@/lib/pricing'
import { resolvePrice } from '@/lib/pricing'

/** Preis einer Leistung für eine Fahrzeugkategorie – serialisierbar für Client-Komponenten. */
export interface OfferCell {
  priceCents: number | null
  regularCents: number | null
  minutes: number
  promoName: string | null
  percent: number | null
  strike: boolean
}

export interface OfferPackage {
  id: string
  name: string
  tagline: string
  featured: boolean
  cells: Record<string, OfferCell>
}

export interface OfferData {
  vehicles: Array<{ id: string; name: string; description: string }>
  packages: OfferPackage[]
}

/**
 * Preise aller Pakete je Fahrzeugkategorie – exakt dieselbe Berechnung wie im Buchungssystem (resolvePrice),
 * damit Leistungsseite, Preisseite und Buchung immer übereinstimmen.
 */
export function buildOfferData(catalog: Catalog, now: number): OfferData {
  const packages = catalog.services.filter((s) => !s.requiresAddon)
  const vehicles = catalog.vehicles.filter((v) => packages.some((s) => s.prices[v.id]))
  return {
    vehicles: vehicles.map((v) => ({ id: v.id, name: v.name, description: v.description })),
    packages: packages.map((s) => ({
      id: s.id,
      name: s.name,
      tagline: s.tagline,
      featured: s.featured,
      cells: Object.fromEntries(
        vehicles
          .filter((v) => s.prices[v.id])
          .map((v) => {
            const info = resolvePrice(catalog, s, v.id, now)
            return [
              v.id,
              {
                priceCents: info.priceCents,
                regularCents: info.regularCents,
                minutes: s.prices[v.id].durationMinutes,
                promoName: info.promotion?.name ?? null,
                percent: info.promotion?.percent ?? null,
                strike: info.promotion?.showStrikethrough ?? false,
              } satisfies OfferCell,
            ]
          }),
      ),
    })),
  }
}
