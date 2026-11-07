import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '../icons'
import type { Catalog, CatalogService } from '@/lib/pricing'
import { minStandaloneAddonPrice, serviceDurationRange, servicePriceRange } from '@/lib/pricing'
import { formatDurationRange, formatPrice } from '@/lib/format'
import { serviceImage } from '@/content/media'
import styles from './Services.module.css'

export function ServiceCard({ service, catalog, index = 0 }: { service: CatalogService; catalog: Catalog; index?: number }) {
  const range = servicePriceRange(service, catalog.vehicles)
  const duration = serviceDurationRange(service, catalog.vehicles)
  const img = serviceImage(service.id)
  const multiplePrices = range.min !== range.max
  return (
    <article className={`card ${styles.card} ${service.featured ? styles.featured : ''} reveal`} style={{ ['--reveal-delay' as string]: `${index * 0.08}s` }}>
      <div className={styles.media}>
        <Image src={img.src} alt={img.alt} fill sizes="(max-width: 900px) 100vw, 33vw" quality={70} style={{ objectFit: 'cover', objectPosition: img.position }} />
        {service.featured && <span className={`badge ${styles.flag}`}>Beliebteste Wahl</span>}
      </div>
      <div className={styles.body}>
        <h3 className="h3">{service.name}</h3>
        <p className={styles.tagline}>{service.tagline}</p>

        <div className={styles.priceRow}>
          <p className={styles.price}>
            {range.onRequest ? (
              'Preis auf Anfrage'
            ) : (
              <>
                {multiplePrices && <span className={styles.from}>ab</span>}
                {formatPrice(range.min)}
              </>
            )}
          </p>
          {duration.max > 0 && (
            <p className={styles.duration}>
              <Icon name="clock" size={15} /> {formatDurationRange(duration.min, duration.max)}
            </p>
          )}
        </div>
        {!range.onRequest && range.minVehicles.length > 0 && (
          <p className={styles.validFor}>
            {multiplePrices
              ? `Preis gilt für ${range.minVehicles.join(' & ')} – größere Fahrzeuge siehe Preisliste`
              : 'Einheitspreis für alle Fahrzeugkategorien'}
          </p>
        )}

        <ul className={styles.includes}>
          {service.includes.slice(0, 5).map((item) => (
            <li key={item}>
              <Icon name="check" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {service.priceNote && <p className={styles.note}>{service.priceNote}</p>}

        <div className={styles.actions}>
          <Link href={`/buchen?leistung=${service.id}`} className={`btn ${service.featured ? 'btn--primary' : 'btn--ghost'} btn--block`}>
            Jetzt buchen
          </Link>
          <Link href={`/leistungen/${service.id}`} className="link-arrow">
            Details <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function Services({ catalog }: { catalog: Catalog }) {
  const main = catalog.services.filter((s) => !s.requiresAddon && s.id !== 'premium-aufbereitung').slice(0, 3)
  const premium = catalog.services.find((s) => s.id === 'premium-aufbereitung')
  const others = catalog.services.filter((s) => !s.requiresAddon && !main.includes(s) && s !== premium)
  const addonsOnly = catalog.services.find((s) => s.requiresAddon)
  const minAddon = minStandaloneAddonPrice(catalog.addons)

  return (
    <section id="leistungen" className="section" aria-labelledby="leistungen-title">
      <div className="container">
        <div className="section-head section-head--split reveal">
          <div style={{ display: 'grid', gap: 20 }}>
            <p className="eyebrow">Leistungen</p>
            <h2 id="leistungen-title" className="h2">
              Pflege auf Premium-Niveau. <span className="serif accent">Direkt bei dir.</span>
            </h2>
          </div>
          <p className="lead">
            Ob Innenraum, Außenreinigung oder beides: Wir bringen alles mit und arbeiten mit Sorgfalt, Ruhe und Blick fürs Detail – zu
            Hause, am Arbeitsplatz oder an deinem Wunschort.
          </p>
        </div>

        <div className={styles.grid}>
          {[...main, ...others].map((s, i) => (
            <ServiceCard key={s.id} service={s} catalog={catalog} index={i} />
          ))}
        </div>

        {premium && <PremiumBand service={premium} catalog={catalog} />}

        {catalog.addons.length > 0 && (
          <div className={`${styles.addons} reveal`}>
            <div className={styles.addonsHead}>
              <h3 className="h3">Zusatzleistungen</h3>
              <p className="muted">
                Individuell kombinierbar – direkt bei der Buchung wählbar.
                {addonsOnly && minAddon !== null && <> Auch einzeln buchbar ab {formatPrice(minAddon)}.</>}
              </p>
            </div>
            <ul className={styles.addonList}>
              {catalog.addons.map((a) => (
                <li key={a.id}>
                  <span className={styles.addonIcon}>
                    <Icon name={a.id.includes('tier') ? 'paw' : a.id.includes('polster') ? 'seat' : a.id.includes('verschmutz') ? 'droplet' : 'sparkle'} size={18} />
                  </span>
                  <span className={styles.addonText}>
                    <strong>{a.name}</strong>
                    <span>{a.description}</span>
                  </span>
                  <span className={styles.addonPrice}>{formatPrice(a.priceCents, { from: a.priceIsFrom })}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function PremiumBand({ service, catalog }: { service: CatalogService; catalog: Catalog }) {
  const img = serviceImage(service.id)
  const duration = serviceDurationRange(service, catalog.vehicles)
  const range = servicePriceRange(service, catalog.vehicles)
  return (
    <article className={`${styles.premium} reveal`}>
      <Image src={img.src} alt={img.alt} fill sizes="100vw" quality={70} style={{ objectFit: 'cover', objectPosition: img.position }} />
      <div className={styles.premiumShade} />
      <div className={styles.premiumContent}>
        <span className="badge">Für höchste Ansprüche</span>
        <h3 className="h2" style={{ fontSize: 'clamp(1.8rem, 3.6vw, 2.8rem)' }}>
          {service.name}
        </h3>
        <p className="lead">{service.description}</p>
        <ul className={styles.premiumList}>
          {service.includes.map((i) => (
            <li key={i}>
              <Icon name="check" size={16} /> {i}
            </li>
          ))}
        </ul>
        <div className={styles.premiumFoot}>
          <p className={styles.premiumPrice}>
            {range.onRequest ? 'Preis auf Anfrage' : `ab ${formatPrice(range.min)}`}
            {duration.max > 0 && <span> · {formatDurationRange(duration.min, duration.max)}</span>}
          </p>
          <Link href={`/buchen?leistung=${service.id}`} className="btn btn--light">
            Termin anfragen <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </article>
  )
}
