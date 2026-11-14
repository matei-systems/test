import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '../icons'
import { PriceTag } from '../site/PriceTag'
import type { Catalog, CatalogService } from '@/lib/pricing'
import { minStandaloneAddonPrice, serviceDurationRange, serviceFromPrice } from '@/lib/pricing'
import { formatDurationRange, formatPrice, formatVehicleList } from '@/lib/format'
import { serviceImage } from '@/content/media'
import styles from './Services.module.css'

export function ServiceCard({ service, catalog, index = 0, now }: { service: CatalogService; catalog: Catalog; index?: number; now: number }) {
  const from = serviceFromPrice(catalog, service, now)
  const duration = serviceDurationRange(service, catalog.vehicles)
  const img = serviceImage(service)
  return (
    <article className={`card ${styles.card} ${service.featured ? styles.featured : ''} reveal`} style={{ ['--reveal-delay' as string]: `${(index % 4) * 0.08}s` }}>
      <div className={styles.media}>
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
          quality={70}
          unoptimized={img.unoptimized}
          style={{ objectFit: 'cover', objectPosition: img.position }}
        />
        {service.featured && (
          <span className={`badge ${styles.flag}`}>
            <span className={styles.flagLong}>Beliebteste Wahl</span>
            <span className={styles.flagShort}>Beliebt</span>
          </span>
        )}
      </div>
      <div className={styles.body}>
        <h3 className="h3">{service.name}</h3>
        <p className={styles.tagline}>{service.tagline}</p>

        <div className={styles.priceRow}>
          <PriceTag info={from.min} from={from.varies} showEnd={false} />
          {duration.max > 0 && (
            <p className={styles.duration}>
              <Icon name="clock" size={15} /> {formatDurationRange(duration.min, duration.max)}
            </p>
          )}
        </div>
        {!from.onRequest && from.minVehicles.length > 0 && (
          <p className={styles.validFor}>
            {from.varies ? `Preis für ${formatVehicleList(from.minVehicles)} – alle Fahrzeuggrößen in der Preisliste` : 'Einheitspreis für alle Fahrzeugkategorien'}
          </p>
        )}

        <ul className={styles.includes}>
          {service.includes.slice(0, 4).map((item) => (
            <li key={item}>
              <Icon name="check" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <Link href={`/buchen?leistung=${service.id}`} className={`btn ${service.featured ? 'btn--primary' : 'btn--ghost'} btn--block`}>
            Jetzt buchen
          </Link>
          <Link href={`/leistungen/${service.id}`} className="link-arrow" aria-label={`Details zu ${service.name}`}>
            Details <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function AddonList({ catalog }: { catalog: Catalog }) {
  const addonsOnly = catalog.services.find((s) => s.requiresAddon)
  const minAddon = minStandaloneAddonPrice(catalog.addons)
  if (catalog.addons.length === 0) return null
  return (
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
  )
}

export function Services({ catalog, now }: { catalog: Catalog; now: number }) {
  const packages = catalog.services.filter((s) => !s.requiresAddon)
  return (
    <section id="leistungen" className="section" aria-labelledby="leistungen-title">
      <div className="container">
        <div className="section-head section-head--split reveal">
          <div style={{ display: 'grid', gap: 20 }}>
            <p className="eyebrow">Leistungen</p>
            <h2 id="leistungen-title" className="h2">
              Pflege auf Premium-Niveau. <span className="serif accent">Direkt bei Ihnen.</span>
            </h2>
          </div>
          <p className="lead">
            Ob Innenraum, Außenpflege oder beides: Wir bringen alles mit und arbeiten mit Sorgfalt, Ruhe und Blick fürs Detail – zu Hause,
            am Arbeitsplatz oder an Ihrem Wunschort.
          </p>
        </div>

        <div className={`${styles.grid} ${packages.length === 4 ? styles.grid4 : ''}`}>
          {packages.map((s, i) => (
            <ServiceCard key={s.id} service={s} catalog={catalog} index={i} now={now} />
          ))}
        </div>

        <AddonList catalog={catalog} />
      </div>
    </section>
  )
}
