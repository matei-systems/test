import type { Metadata } from 'next'
import type { BusinessInfo, ServiceArea } from '@/config/defaults'
import { getSiteUrl, SITE } from '@/config/site'
import type { WorkingDay } from './availability'
import type { Catalog } from './pricing'
import { serviceFromPrice } from './pricing'
import type { FaqItem } from '@/content/faq'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/**
 * LocalBusiness-Schema – enthält ausschließlich tatsächlich hinterlegte Unternehmensdaten.
 * Leere Felder (Adresse, Telefon …) werden weggelassen statt erfunden.
 */
export function localBusinessJsonLd(opts: { business: BusinessInfo; area: ServiceArea; catalog: Catalog; hours: WorkingDay[] }) {
  const { business, area, catalog, hours } = opts
  const url = getSiteUrl()
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutomotiveBusiness',
    '@id': `${url}/#business`,
    name: business.companyName || SITE.name,
    description: SITE.description,
    url,
    image: `${url}/og-image.jpg`,
    logo: `${url}/icon-512.png`,
    areaServed: area.regions.map((r) => ({ '@type': 'AdministrativeArea', name: r })),
    openingHoursSpecification: hours
      .filter((h) => h.isOpen)
      .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_NAMES[h.weekday - 1], opens: h.open, closes: h.close })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Leistungen',
      itemListElement: catalog.services
        .filter((s) => !s.requiresAddon)
        .map((s) => {
          const from = serviceFromPrice(catalog, s, Date.now())
          return {
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: s.name, description: s.description, url: `${url}/leistungen/${s.id}` },
            ...(from.min.priceCents !== null
              ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: from.min.priceCents / 100, priceCurrency: 'EUR' } }
              : {}),
          }
        }),
    },
  }
  if (business.phone) data.telephone = business.phone
  if (business.email) data.email = business.email
  if (business.street && business.postalCode && business.city) {
    data.address = {
      '@type': 'PostalAddress',
      streetAddress: business.street,
      postalCode: business.postalCode,
      addressLocality: business.city,
      addressCountry: 'AT',
    }
  }
  if (business.vatId) data.vatID = business.vatId
  return data
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const url = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${url}${it.path}` })),
  }
}

/** JSON sicher in ein <script>-Tag einbetten (verhindert </script>-Injection). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * Ergänzt Seiten-Metadaten um seitenspezifische Open-Graph- und Twitter-Daten (Titel, Beschreibung, URL).
 * Ohne diese Ergänzung würden alle Unterseiten beim Teilen den Titel der Startseite zeigen.
 */
export function withOg(meta: Metadata): Metadata {
  const t = meta.title
  const absolute = t && typeof t === 'object' && 'absolute' in t ? t.absolute : null
  const plain = typeof t === 'string' ? t : null
  const title = absolute ?? (plain ? `${plain} | ${SITE.name}` : `${SITE.name} – ${SITE.claim}`)
  const description = meta.description ?? SITE.description
  const canonical = meta.alternates?.canonical
  const url = typeof canonical === 'string' ? canonical : undefined
  const fallback = { url: '/og-image.jpg', width: 1200, height: 630, alt: `${SITE.name} – ${SITE.claim} in Graz` }
  // Eigene Bilder der Seite (z. B. Leistungsfoto) behalten, sonst das Standardbild
  const custom = meta.openGraph?.images
  const first = Array.isArray(custom) ? custom[0] : custom
  const imageUrl = !first ? fallback.url : typeof first === 'string' ? first : first instanceof URL ? first.href : String(first.url)
  return {
    ...meta,
    openGraph: { type: 'website', locale: SITE.locale, siteName: SITE.name, title, description, ...(url ? { url } : {}), images: custom ?? [fallback] },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  }
}
