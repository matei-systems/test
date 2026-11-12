import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHero } from '@/components/site/PageHero'
import { FinalCta } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog, getSettings } from '@/lib/catalog'
import { serviceDurationRange, serviceFromPrice } from '@/lib/pricing'
import { formatDurationRange, formatEuro, formatPrice, formatVehicleList } from '@/lib/format'
import { PriceTag } from '@/components/site/PriceTag'
import { PriceTable } from '@/components/pages/PriceMatrix'
import pageStyles from '@/components/pages/Pages.module.css'
import { breadcrumbJsonLd } from '@/lib/seo'
import { serviceImage } from '@/content/media'
import { SERVICE_SEO } from '@/content/seo'
import { getSiteUrl } from '@/config/site'
import styles from './page.module.css'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const catalog = await getCatalog()
  const s = catalog.services.find((x) => x.id === slug)
  if (!s) return { title: 'Leistung nicht gefunden' }
  const from = serviceFromPrice(catalog, s, Date.now())
  const seo = SERVICE_SEO[s.id]
  const price = s.requiresAddon
    ? 'Preis je nach Auswahl'
    : from.min.priceCents === null
      ? 'Preis auf Anfrage'
      : `${from.varies ? 'ab ' : ''}${formatEuro(from.min.priceCents)}`
  return {
    title: seo?.title ?? `${s.name} in Graz`,
    description: `${s.name} von GLANZMOBIL – ${s.tagline} Mobil in Graz & Graz-Umgebung, ${price}. Jetzt online Termin buchen.`,
    alternates: { canonical: `/leistungen/${s.id}` },
    openGraph: { images: [{ url: serviceImage(s).src }] },
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()])
  const s = catalog.services.find((x) => x.id === slug)
  if (!s) notFound()
  const now = Date.now()
  const img = serviceImage(s)
  const from = serviceFromPrice(catalog, s, now)
  const duration = serviceDurationRange(s, catalog.vehicles)
  const addons = s.requiresAddon ? catalog.addons.filter((a) => a.bookableAlone) : catalog.addons
  const others = catalog.services.filter((x) => x.id !== s.id && !x.requiresAddon).slice(0, 3)
  const url = getSiteUrl()

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: s.name,
          description: s.description,
          serviceType: SERVICE_SEO[s.id]?.keyword ?? s.name,
          areaServed: settings.area.regions.map((r) => ({ '@type': 'AdministrativeArea', name: r })),
          provider: { '@id': `${url}/#business` },
          ...(from.min.priceCents !== null && !s.requiresAddon
            ? {
                offers: {
                  '@type': 'AggregateOffer',
                  priceCurrency: 'EUR',
                  lowPrice: from.min.priceCents / 100,
                  ...(from.maxCents !== null ? { highPrice: from.maxCents / 100 } : {}),
                  url: `${url}/buchen?leistung=${s.id}`,
                },
              }
            : {}),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Start', path: '/' },
          { name: 'Leistungen', path: '/leistungen' },
          { name: s.name, path: `/leistungen/${s.id}` },
        ])}
      />
      <PageHero
        eyebrow={`Leistungen · ${settings.area.regions.join(' & ')}`}
        title={s.name}
        lead={s.tagline}
        image={s.requiresAddon || img.unoptimized ? undefined : img.src}
        imagePosition={img.position}
      />

      <section className="section">
        <div className={`container ${styles.grid}`}>
          <div className={styles.content}>
            <p className={styles.description}>{s.description}</p>
            <h2 className="h3">Das ist enthalten</h2>
            <ul className={styles.includes}>
              {s.includes.map((i) => (
                <li key={i}>
                  <Icon name="check" size={18} /> {i}
                </li>
              ))}
            </ul>

            {!s.requiresAddon && (
              <>
                <h2 className="h3">Preise &amp; Dauer nach Fahrzeug</h2>
                <div className={pageStyles.matrixCard}>
                  <PriceTable catalog={catalog} service={s} now={now} />
                </div>
              </>
            )}

            {s.priceNote && (
              <p className={styles.note}>
                <Icon name="info" size={16} /> {s.priceNote}
              </p>
            )}

            {addons.length > 0 && (
              <>
                <h2 className="h3">{s.requiresAddon ? 'Einzeln buchbare Leistungen' : 'Passende Zusatzleistungen'}</h2>
                <ul className={styles.addons}>
                  {addons.map((a) => (
                    <li key={a.id}>
                      <span>
                        <strong>{a.name}</strong>
                        <small>{a.description}</small>
                      </span>
                      <span>{formatPrice(a.priceCents, { from: a.priceIsFrom })}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className={styles.aside}>
            <div className={styles.box}>
              <p className="eyebrow">Auf einen Blick</p>
              {s.requiresAddon ? <p className={styles.price}>je nach Auswahl</p> : <PriceTag info={from.min} from={from.varies} size="lg" />}
              {!s.requiresAddon && !from.onRequest && from.varies && from.minVehicles.length > 0 && (
                <p className={styles.small}>gilt für {formatVehicleList(from.minVehicles)}</p>
              )}
              <ul className={styles.facts}>
                {duration.max > 0 && (
                  <li>
                    <Icon name="clock" size={16} /> {formatDurationRange(duration.min, duration.max)}
                  </li>
                )}
                <li>
                  <Icon name="van" size={16} /> Mobil – wir kommen zu dir
                </li>
                <li>
                  <Icon name="pin" size={16} /> {settings.area.regions.join(' & ')}
                </li>
              </ul>
              <Link href={`/buchen?leistung=${s.id}`} className="btn btn--primary btn--block">
                Jetzt Termin buchen <Icon name="arrow-right" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section section--tight" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2 className="h3" style={{ marginBottom: 20 }}>
              Weitere Leistungen
            </h2>
            <ul className={styles.others}>
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/leistungen/${o.id}`}>
                    <span>
                      <strong>{o.name}</strong>
                      <small>{o.tagline}</small>
                    </span>
                    <Icon name="arrow-right" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <FinalCta />
    </>
  )
}
