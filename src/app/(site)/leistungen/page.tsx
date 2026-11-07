import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { ServiceCard } from '@/components/home/Services'
import { Pricing } from '@/components/home/Pricing'
import { FinalCta } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog } from '@/lib/catalog'
import { breadcrumbJsonLd } from '@/lib/seo'
import { formatDuration, formatPrice } from '@/lib/format'
import styles from '@/components/home/Services.module.css'

export const metadata: Metadata = {
  title: 'Leistungen & Preise – Innenreinigung, Außenreinigung, Komplettreinigung in Graz',
  description:
    'Alle Leistungen von GLANZMOBIL: Innenraumreinigung, Außenreinigung, Komplettreinigung und Premium-Aufbereitung – mobil in Graz & Graz-Umgebung. Transparente Preise je Fahrzeugkategorie.',
  alternates: { canonical: '/leistungen' },
}

export default async function ServicesPage() {
  const catalog = await getCatalog()
  const packages = catalog.services.filter((s) => !s.requiresAddon)
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
        lead="Mobile Innen- und Außenreinigung in Graz und Graz-Umgebung – zu transparenten Preisen, abgestimmt auf deine Fahrzeugkategorie."
        image="/images/wash.jpg"
        imagePosition="40% 50%"
      />
      <section className="section">
        <div className="container">
          <div className={styles.grid}>
            {packages.map((s, i) => (
              <ServiceCard key={s.id} service={s} catalog={catalog} index={i} />
            ))}
          </div>
          {catalog.addons.length > 0 && (
            <div className={`${styles.addons} reveal`}>
              <div className={styles.addonsHead}>
                <h2 className="h3">Zusatzleistungen</h2>
                <p className="muted">Kombinierbar mit jedem Paket – oder einzeln buchbar, wenn gekennzeichnet.</p>
                <Link href="/buchen?leistung=zusatzleistungen" className="link-arrow" style={{ marginTop: 8 }}>
                  Nur Zusatzleistungen buchen <Icon name="arrow-right" />
                </Link>
              </div>
              <ul className={styles.addonList}>
                {catalog.addons.map((a) => (
                  <li key={a.id}>
                    <span className={styles.addonIcon}>
                      <Icon name="plus" size={18} />
                    </span>
                    <span className={styles.addonText}>
                      <strong>{a.name}</strong>
                      <span>
                        {a.description} · ca. {formatDuration(a.durationMinutes)}
                        {!a.bookableAlone ? ' · nur mit Paket' : ''}
                      </span>
                    </span>
                    <span className={styles.addonPrice}>{formatPrice(a.priceCents, { from: a.priceIsFrom })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
      <Pricing catalog={catalog} />
      <FinalCta />
    </>
  )
}
