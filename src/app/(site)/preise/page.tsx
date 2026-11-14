import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { Pricing } from '@/components/home/Pricing'
import { AddonList } from '@/components/home/Services'
import { FinalCta } from '@/components/home/Sections'
import { PriceMatrix } from '@/components/pages/PriceMatrix'
import { promoEndLabel } from '@/components/site/PriceTag'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog } from '@/lib/catalog'
import { maxRunningDiscount, serviceFromPrice } from '@/lib/pricing'
import { breadcrumbJsonLd } from '@/lib/seo'
import { formatEuro } from '@/lib/format'
import styles from '@/components/pages/Pages.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getCatalog()
  const now = Date.now()
  const prices = catalog.services
    .filter((s) => !s.requiresAddon)
    .map((s) => serviceFromPrice(catalog, s, now).min.priceCents)
    .filter((p): p is number => p !== null)
  const from = prices.length ? ` ab ${formatEuro(Math.min(...prices))}` : ''
  return {
    title: 'Preise – mobile Autoaufbereitung & Autoreinigung in Graz',
    description: `Transparente Preise für mobile Fahrzeugpflege in Graz & Graz-Umgebung${from}: alle Pakete nach Fahrzeuggröße, Zusatzleistungen und aktuelle Einführungspreise.`,
    alternates: { canonical: '/preise' },
  }
}

export default async function PricesPage() {
  const catalog = await getCatalog()
  const now = Date.now()
  const best = maxRunningDiscount(catalog, now)
  const end = best ? promoEndLabel(best.promotion.endsAt) : null
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
        lead={
          best
            ? `Zum Start von RM Mobile Auto Aufbereitung gilt unser ${best.promotion.name}: ${best.percent} % Preisvorteil auf unsere Pakete${end ? ` – gültig bis ${end}` : ''}. Der reguläre Preis steht immer daneben.`
            : 'Endpreise je Fahrzeugkategorie – inklusive Anfahrt im Einsatzgebiet. Sie sehen vor der Buchung genau, was Sie bezahlen.'
        }
      />

      <Pricing catalog={catalog} now={now} heading={false} />

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="matrix-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow">Preisliste im Detail</p>
            <h2 id="matrix-title" className="h2">
              Alle Pakete, alle <span className="serif accent">Fahrzeuggrößen.</span>
            </h2>
            <p className="lead">Größere Fahrzeuge bedeuten mehr Fläche und mehr Zeit – deshalb staffeln wir Preis und Dauer nach Kategorie.</p>
          </div>
          <PriceMatrix catalog={catalog} now={now} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Zusatzleistungen">
        <div className="container">
          <AddonList catalog={catalog} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="details-title">
        <div className="container">
          <h2 id="details-title" className="h3" style={{ marginBottom: 24 }}>
            Gut zu wissen
          </h2>
          <ul className={styles.details}>
            <li className={styles.detail}>
              <Icon name="tag" size={22} />
              <h3>Endpreise inklusive Anfahrt</h3>
              <p>Alle Preise sind Endpreise. Die Anfahrt innerhalb unseres Einsatzgebiets ist bereits enthalten.</p>
            </li>
            <li className={styles.detail}>
              <Icon name="shield" size={22} />
              <h3>Keine versteckten Kosten</h3>
              <p>
                Die Preise gelten für Fahrzeuge in normalem Pflegezustand. Zusatzleistungen – etwa bei Tierhaaren oder starker Verschmutzung –
                stimmen wir immer vorab mit Ihnen ab.
              </p>
            </li>
            <li className={styles.detail}>
              <Icon name="percent" size={22} />
              <h3>{best ? best.promotion.name : 'Aktionen'}</h3>
              <p>
                {best
                  ? `Der ${best.promotion.name} gilt für Buchungen${end ? ` bis ${end}` : ' in der Startphase'}. Maßgeblich ist der Gesamtpreis, der Ihnen vor dem Absenden in der Buchungsübersicht angezeigt wird.`
                  : 'Aktuell läuft keine Aktion. Es gelten die angezeigten regulären Preise.'}
              </p>
            </li>
          </ul>
          <p style={{ marginTop: 32, color: 'var(--text-muted)' }}>
            Mehrere Fahrzeuge, Firmenflotte oder Autohaus?{' '}
            <Link href="/kontakt" className="link-arrow" style={{ display: 'inline-flex' }}>
              Individuelles Angebot anfragen <Icon name="arrow-right" />
            </Link>
          </p>
        </div>
      </section>
      <FinalCta />
    </>
  )
}
