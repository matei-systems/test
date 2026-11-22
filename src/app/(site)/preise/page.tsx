import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { FinalCta } from '@/components/home/Sections'
import { PriceExplorer } from '@/components/pages/PriceExplorer'
import { AddonCards, ExteriorNotice, ExtraCostsExplainer, PriceCompare } from '@/components/pages/OfferBlocks'
import { buildOfferData } from '@/components/pages/offer-data'
import { promoEndLabel } from '@/components/site/PriceTag'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog } from '@/lib/catalog'
import { maxRunningDiscount, serviceFromPrice } from '@/lib/pricing'
import { breadcrumbJsonLd, withOg } from '@/lib/seo'
import { formatEuro } from '@/lib/format'
import offer from '@/components/pages/Offer.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getCatalog()
  const now = Date.now()
  const prices = catalog.services
    .filter((s) => !s.requiresAddon)
    .map((s) => serviceFromPrice(catalog, s, now).min.priceCents)
    .filter((p): p is number => p !== null)
  const from = prices.length ? ` ab ${formatEuro(Math.min(...prices))}` : ''
  return withOg({
    title: 'Preise – mobile Autoaufbereitung & Autoreinigung in Graz',
    description: `Preise für mobile Autoaufbereitung in Graz${from}: Endpreise inkl. Anfahrt für alle Fahrzeugkategorien, Dauer je Paket, Zusatzleistungen und Einführungspreis.`,
    alternates: { canonical: '/preise' },
  })
}

export default async function PricesPage() {
  const catalog = await getCatalog()
  const now = Date.now()
  const data = buildOfferData(catalog, now)
  const best = maxRunningDiscount(catalog, now)
  const end = best ? promoEndLabel(best.promotion.endsAt) : null
  const promoForAll = catalog.promotions.some((p) => p.active && p.serviceId === null && p.vehicleId === null && p.id === best?.promotion.id)
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Preise', path: '/preise' }])} />
      <PageHero
        eyebrow="Preise"
        title={
          <>
            Klare Preise. <span className="serif accent">Ohne Überraschungen.</span>
          </>
        }
        lead={`Endpreise für ${data.vehicles.length} Fahrzeugkategorien – inklusive Anfahrt im Einsatzgebiet. Sie sehen vor dem Absenden genau, was Sie bezahlen.${
          best ? ` Während der Startphase gilt unser ${best.promotion.name} mit ${best.percent} % Preisvorteil${end ? ` bis ${end}` : ''}.` : ''
        }`}
      />

      <section className="section" aria-labelledby="rechner-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Preis in 10 Sekunden</p>
            <h2 id="rechner-title" className="h2">
              Was kostet die Pflege <span className="serif accent">für Ihr Fahrzeug?</span>
            </h2>
          </div>
          <PriceExplorer data={data} />
        </div>
      </section>

      {best && (
        <section className="section" style={{ paddingTop: 0 }} aria-labelledby="aktion-title">
          <div className="container">
            <div className={offer.promo}>
              <span className={offer.promoBadge} aria-hidden="true">
                −{best.percent} %
              </span>
              <div>
                <h2 id="aktion-title" className="h3">
                  {best.promotion.name} zum Start
                </h2>
                <p className="muted">
                  Wir sind neu in Graz und möchten überzeugen: Deshalb bieten wir unsere Pakete in der Startphase günstiger an.
                </p>
                <ul>
                  <li>
                    <Icon name="check" size={16} />
                    <span>{promoForAll ? `${best.percent} % auf alle Pakete und alle Fahrzeugkategorien.` : `Bis zu ${best.percent} % auf ausgewählte Pakete – der Nachlass steht direkt beim Preis.`}</span>
                  </li>
                  <li>
                    <Icon name="check" size={16} />
                    <span>
                      {best.promotion.showStrikethrough
                        ? 'Der reguläre Preis wird zum Vergleich angezeigt.'
                        : 'Der reguläre Preis steht immer daneben – so sehen Sie, was die Leistung später regulär kostet.'}
                    </span>
                  </li>
                  <li>
                    <Icon name="check" size={16} />
                    <span>Zusatzleistungen gelten zum angegebenen Festpreis.</span>
                  </li>
                  <li>
                    <Icon name="clock" size={16} />
                    <span>
                      {end
                        ? `Gültig für Buchungen bis ${end}.`
                        : 'Gültig während der Startphase. Ein festes Enddatum gibt es derzeit nicht – maßgeblich ist der Gesamtpreis in Ihrer Buchungsübersicht.'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="vergleich-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Preisliste im Detail</p>
            <h2 id="vergleich-title" className="h2">
              Alle Pakete, alle <span className="serif accent">Fahrzeuggrößen.</span>
            </h2>
            <p className="lead">Endpreis und ungefähre Dauer je Paket und Fahrzeugkategorie. Größere Fahrzeuge bedeuten mehr Fläche und mehr Zeit.</p>
          </div>
          <PriceCompare data={data} />
          <p className="dim" style={{ marginTop: 14, fontSize: '0.86rem' }}>
            Was in welchem Paket enthalten ist:{' '}
            {data.packages.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ' · '}
                <Link href={`/leistungen/${p.id}`} style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  {p.name}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="zusatz-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Zusatzleistungen</p>
            <h2 id="zusatz-title" className="h2">
              Feste Preise, <span className="serif accent">klar abgegrenzt.</span>
            </h2>
          </div>
          <AddonCards catalog={catalog} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="kosten-title">
        <div className="container" style={{ display: 'grid', gap: 24 }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">Keine Überraschungen</p>
            <h2 id="kosten-title" className="h2">
              Wann zusätzliche Kosten <span className="serif accent">entstehen können.</span>
            </h2>
          </div>
          <ExtraCostsExplainer catalog={catalog} />
          <ExteriorNotice compact />
          <p style={{ color: 'var(--text-muted)' }}>
            Mehrere Fahrzeuge, Firmenflotte oder Autohaus?{' '}
            <Link href="/kontakt?anliegen=angebot" className="link-arrow" style={{ display: 'inline-flex' }}>
              Individuelles Angebot anfragen <Icon name="arrow-right" />
            </Link>
          </p>
        </div>
      </section>
      <FinalCta />
    </>
  )
}
