import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { PriceTag } from '@/components/site/PriceTag'
import { AddonList } from '@/components/home/Services'
import { FinalCta } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog } from '@/lib/catalog'
import { serviceDurationRange, serviceFromPrice } from '@/lib/pricing'
import { breadcrumbJsonLd } from '@/lib/seo'
import { formatDurationRange, formatVehicleList } from '@/lib/format'
import { serviceImage } from '@/content/media'
import styles from '@/components/pages/Pages.module.css'

export const metadata: Metadata = {
  title: 'Leistungen – Innenraumreinigung, Außenpflege & Komplettpaket in Graz',
  description:
    'Alle Leistungen von GLANZMOBIL: Innenraum Basic, Innenraum Premium, Außenpflege, Komplettpaket und Zusatzleistungen – mobil in Graz & Graz-Umgebung, mit transparenten Preisen je Fahrzeugkategorie.',
  alternates: { canonical: '/leistungen' },
}

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
        lead="Mobile Innenraumreinigung und Außenpflege in Graz und Graz-Umgebung – zu transparenten Preisen, abgestimmt auf deine Fahrzeugkategorie."
        image="/images/wash.jpg"
        imagePosition="40% 50%"
      />
      <section className="section">
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
                  <ul className={styles.rowList}>
                    {s.includes.map((item) => (
                      <li key={item}>
                        <Icon name="check" size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.rowFoot}>
                    <div>
                      <PriceTag info={from.min} from={from.varies} size="lg" />
                      {duration.max > 0 && (
                        <p className={styles.rowMeta}>
                          <Icon name="clock" size={14} /> {formatDurationRange(duration.min, duration.max)}
                          {from.varies && from.minVehicles.length > 0 ? ` · Preis für ${formatVehicleList(from.minVehicles)}` : ''}
                        </p>
                      )}
                    </div>
                    <div className={styles.rowActions}>
                      <Link href={`/buchen?leistung=${s.id}`} className={`btn ${s.featured ? 'btn--primary' : 'btn--light'}`}>
                        Termin buchen <Icon name="arrow-right" />
                      </Link>
                      <Link href={`/leistungen/${s.id}`} className="link-arrow" aria-label={`Details und Preise zu ${s.name}`}>
                        Details &amp; Preise <Icon name="arrow-right" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-label="Zusatzleistungen">
        <div className="container">
          <AddonList catalog={catalog} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px', justifyContent: 'center', marginTop: 40 }}>
            {addonsOnly && (
              <Link href={`/buchen?leistung=${addonsOnly.id}`} className="link-arrow">
                Nur Zusatzleistungen buchen <Icon name="arrow-right" />
              </Link>
            )}
            <Link href="/preise" className="link-arrow">
              Komplette Preisliste <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>
      <FinalCta />
    </>
  )
}
