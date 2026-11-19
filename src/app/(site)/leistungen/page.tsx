import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { PriceTag } from '@/components/site/PriceTag'
import { AddonCards, ExteriorNotice } from '@/components/pages/OfferBlocks'
import { FinalCta } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog } from '@/lib/catalog'
import { serviceDurationRange, serviceFromPrice } from '@/lib/pricing'
import { breadcrumbJsonLd, withOg } from '@/lib/seo'
import { formatDurationRange, formatEuro, formatVehicleList } from '@/lib/format'
import { serviceImage } from '@/content/media'
import styles from '@/components/pages/Pages.module.css'
import offer from '@/components/pages/Offer.module.css'

export const metadata: Metadata = withOg({
  title: 'Leistungen – Innenraumreinigung, Außenpflege & Komplettpaket in Graz',
  description:
    'Innenraum Basic & Premium, Außenpflege, Komplettpaket und Zusatzleistungen von RM6 Autoaufbereitung – mobil in Graz & Umgebung, Preise je Fahrzeugkategorie.',
  alternates: { canonical: '/leistungen' },
})

export default async function ServicesPage() {
  const catalog = await getCatalog()
  const now = Date.now()
  const packages = catalog.services.filter((s) => !s.requiresAddon)
  const addonsOnly = catalog.services.find((s) => s.requiresAddon)
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Leistungen', path: '/leistungen' }])} />
      <PageHero
        eyebrow="Leistungen"
        title={
          <>
            Fahrzeugpflege, die man <span className="serif accent">sieht und spürt.</span>
          </>
        }
        lead="Mobile Innenraumreinigung und Außenpflege in Graz und Graz-Umgebung – zu transparenten Preisen, abgestimmt auf Ihre Fahrzeugkategorie."
        image="/images/wash.jpg"
        imagePosition="40% 50%"
      />
      <section className="section section--tight" aria-label="So setzen sich unsere Preise zusammen">
        <div className="container">
          <div className={offer.priceStrip}>
            <div>
              <p>
                <strong>Preise nach Fahrzeugkategorie:</strong> Größere Fahrzeuge brauchen mehr Zeit – deshalb staffeln wir Preis und Dauer in{' '}
                {catalog.vehicles.length} Kategorien. Alle Preise sind Endpreise inklusive Anfahrt im Einsatzgebiet.
              </p>
              <ul className={offer.vehicleList} aria-label="Fahrzeugkategorien">
                {catalog.vehicles.map((v) => (
                  <li key={v.id}>{v.name}</li>
                ))}
              </ul>
            </div>
            <Link href="/preise" className="btn btn--light">
              Komplette Preisliste ansehen <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className={`container ${styles.rows}`}>
          {packages.map((s, i) => {
            const img = serviceImage(s)
            const from = serviceFromPrice(catalog, s, now)
            const duration = serviceDurationRange(s, catalog.vehicles)
            return (
              <article key={s.id} id={s.id} className={`${styles.row} ${i > 0 ? 'reveal' : ''}`}>
                <div className={styles.rowMedia}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 960px) 100vw, 50vw"
                    quality={80}
                    priority={i === 0}
                    unoptimized={img.unoptimized}
                    style={{ objectPosition: img.position }}
                  />
                  {s.featured && <span className={`badge ${styles.rowFlag}`}>Beliebteste Wahl</span>}
                  <span className={styles.rowIndex} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')} / {String(packages.length).padStart(2, '0')}
                  </span>
                </div>
                <div className={styles.rowBody}>
                  <p className="eyebrow">{s.tagline}</p>
                  <h2 className="h2">{s.name}</h2>
                  <p className={styles.rowLead}>{s.description}</p>
                  <ul className={styles.rowList} aria-label={`Enthalten in ${s.name}`}>
                    {s.includes.map((item) => (
                      <li key={item}>
                        <Icon name="check" size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {s.excludes.length > 0 && (
                    <details className={styles.rowExcludes}>
                      <summary>
                        Nicht enthalten ({s.excludes.length}) <Icon name="chevron-down" size={16} />
                      </summary>
                      <ul>
                        {s.excludes.map((item) => (
                          <li key={item}>
                            <Icon name="minus" size={16} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className={styles.rowFoot}>
                    <div>
                      <PriceTag info={from.min} from={from.varies} size="lg" />
                      {duration.max > 0 && (
                        <p className={styles.rowMeta}>
                          <Icon name="clock" size={14} /> {formatDurationRange(duration.min, duration.max)}
                        </p>
                      )}
                      {from.varies && from.min.priceCents !== null && from.maxCents !== null && (
                        <p className={styles.rowMeta}>
                          <Icon name="car" size={14} /> {formatEuro(from.min.priceCents)} ({formatVehicleList(from.minVehicles)}) bis {formatEuro(from.maxCents)} je nach Fahrzeug
                        </p>
                      )}
                    </div>
                    <div className={styles.rowActions}>
                      <Link href={`/buchen?leistung=${s.id}`} className={`btn ${s.featured ? 'btn--primary' : 'btn--light'}`}>
                        Jetzt Termin buchen <Icon name="arrow-right" />
                      </Link>
                      <Link href={`/leistungen/${s.id}`} className="link-arrow" aria-label={`Details & alle Preise: ${s.name}`}>
                        Details &amp; alle Preise <Icon name="arrow-right" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Hinweis zur Außenwäsche">
        <div className="container">
          <ExteriorNotice />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="zusatz-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow">Zusatzleistungen</p>
            <h2 id="zusatz-title" className="h2">
              Genau das, was Ihr Fahrzeug <span className="serif accent">zusätzlich braucht.</span>
            </h2>
            <p className="lead">Fester Preis, klar abgegrenzt – direkt bei der Buchung wählbar. Unter „Genau erklärt“ sehen Sie, was dazugehört und wo die Grenzen liegen.</p>
          </div>
          <AddonCards catalog={catalog} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px', justifyContent: 'center', marginTop: 40 }}>
            {addonsOnly && (
              <Link href={`/buchen?leistung=${addonsOnly.id}`} className="link-arrow">
                Nur Zusatzleistungen buchen <Icon name="arrow-right" />
              </Link>
            )}
            <Link href="/preise" className="link-arrow">
              Komplette Preisliste nach Fahrzeug <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>
      <FinalCta />
    </>
  )
}
