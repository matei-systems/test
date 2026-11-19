import type { FaqCategory } from './faq'
import { formatDuration, formatEuro, formatPrice } from '@/lib/format'
import { resolvePrice, type Catalog } from '@/lib/pricing'

const list = (items: string[]) => items.join('; ')

/**
 * FAQ-Antworten, die direkt aus dem Leistungskatalog (Admin → Leistungen) erzeugt werden.
 * So können FAQ, Preisliste und Buchungssystem einander nie widersprechen.
 */
export function catalogFaq(catalog: Catalog, now: number): FaqCategory {
  const packages = catalog.services.filter((s) => !s.requiresAddon)
  const basic = packages.find((s) => s.id === 'innenraum-basic')
  const premium = packages.find((s) => s.id === 'innenraum-premium')
  const items: FaqCategory['items'] = []

  if (packages.length > 0) {
    items.push({
      q: 'Was ist in jeder Reinigung enthalten?',
      a: `${packages.map((s) => `${s.name}: ${list(s.includes)}.`).join(' ')} Was ausdrücklich nicht enthalten ist, steht bei jeder Leistung unter „Nicht enthalten“.`,
      top: true,
    })
  }

  if (basic && premium) {
    const extra = premium.includes.filter((i) => !basic.includes.includes(i) && !i.startsWith('Alle Leistungen'))
    const first = catalog.vehicles.find((v) => basic.prices[v.id] && premium.prices[v.id])
    const pb = first ? resolvePrice(catalog, basic, first.id, now).priceCents : null
    const pp = first ? resolvePrice(catalog, premium, first.id, now).priceCents : null
    items.push({
      q: `Wie unterscheiden sich ${basic.name} und ${premium.name}?`,
      a: `${basic.name} ist die gründliche Innenreinigung für zwischendurch: ${list(basic.includes)}. ${premium.name} enthält alles aus ${basic.name} und zusätzlich: ${list(extra)}.${
        first && pb !== null && pp !== null
          ? ` Für ${first.name} kostet ${basic.name} aktuell ${formatEuro(pb)} (ca. ${formatDuration(basic.prices[first.id].durationMinutes)}), ${premium.name} ${formatEuro(pp)} (ca. ${formatDuration(premium.prices[first.id].durationMinutes)}).`
          : ''
      }`,
    })
  }

  if (catalog.vehicles.length > 0) {
    items.push({
      q: 'Welche Fahrzeugkategorien gibt es?',
      a: `Wir unterscheiden ${catalog.vehicles.length} Kategorien: ${catalog.vehicles
        .map((v) => (v.description ? `${v.name} (${v.description})` : v.name))
        .join(', ')}. Größere Fahrzeuge haben mehr Fläche und brauchen mehr Zeit – deshalb richten sich Preis und Dauer nach der Kategorie. Sind Sie unsicher, wählen Sie die passendste Kategorie oder schreiben Sie uns kurz.`,
    })
  }

  if (catalog.addons.length > 0) {
    items.push({
      q: 'Wie werden Zusatzkosten berechnet?',
      a: `Zusatzleistungen haben feste Preise: ${catalog.addons
        .map((a) => `${a.name} ${formatPrice(a.priceCents, { from: a.priceIsFrom })}`)
        .join(', ')}. Sie wählen sie bei der Buchung selbst und sehen den Gesamtpreis vor dem Absenden. Bei Preisen mit „ab“ nennen wir Ihnen vor Beginn der zusätzlichen Arbeit den konkreten Betrag – durchgeführt wird sie erst nach Ihrer Zustimmung. Ohne Ihre Zustimmung entstehen keine weiteren Kosten.`,
    })
  }

  return { id: 'leistungen', title: 'Leistungen & Fahrzeuge', items }
}
