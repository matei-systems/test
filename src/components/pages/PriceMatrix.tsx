import Link from 'next/link'
import { Icon } from '../icons'
import { DiscountBadge } from '../site/PriceTag'
import { resolvePrice, type Catalog, type CatalogService } from '@/lib/pricing'
import { formatDuration, formatEuro } from '@/lib/format'
import styles from './Pages.module.css'

/** Preis, Dauer und ggf. regulärer Preis einer Leistung für jede Fahrzeugkategorie. */
export function PriceTable({ catalog, service, now }: { catalog: Catalog; service: CatalogService; now: number }) {
  const rows = catalog.vehicles
    .filter((v) => service.prices[v.id])
    .map((v) => ({ vehicle: v, base: service.prices[v.id], info: resolvePrice(catalog, service, v.id, now) }))
  const anyPromo = rows.some((r) => r.info.promotion)
  return (
    <table className={styles.matrixTable}>
      <caption className="sr-only">
        {service.name}: Preise und Dauer je Fahrzeugkategorie{anyPromo ? ' (inklusive aktueller Aktion)' : ''}
      </caption>
      <thead>
        <tr>
          <th scope="col">Fahrzeug</th>
          <th scope="col" className={styles.num}>
            Dauer ca.
          </th>
          <th scope="col" className={styles.num}>
            Preis
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ vehicle, base, info }) => (
          <tr key={vehicle.id}>
            <th scope="row">
              {vehicle.name}
              {vehicle.description && <small>{vehicle.description}</small>}
            </th>
            <td className={styles.num}>{formatDuration(base.durationMinutes)}</td>
            <td className={`${styles.num} ${styles.pay}`}>
              {info.priceCents === null ? 'auf Anfrage' : formatEuro(info.priceCents)}
              {info.promotion && info.regularCents !== null && (
                <span className={styles.matrixRegular}>
                  {info.promotion.showStrikethrough ? (
                    <>
                      <span className="sr-only">Regulärer Preis: </span>
                      <s>{formatEuro(info.regularCents)}</s>
                    </>
                  ) : (
                    <>regulär {formatEuro(info.regularCents)}</>
                  )}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Vollständige Preisliste: je Paket eine Karte mit allen Fahrzeugkategorien. */
export function PriceMatrix({ catalog, now }: { catalog: Catalog; now: number }) {
  const packages = catalog.services.filter((s) => !s.requiresAddon)
  return (
    <div className={styles.matrix}>
      {packages.map((s) => {
        const promo = catalog.vehicles.map((v) => resolvePrice(catalog, s, v.id, now).promotion).find(Boolean)
        return (
          <article key={s.id} className={`${styles.matrixCard} ${s.featured ? styles.matrixFeatured : ''} reveal`}>
            <div className={styles.matrixHead}>
              <h3>{s.name}</h3>
              {promo && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  {promo.name} <DiscountBadge percent={promo.percent} />
                </span>
              )}
            </div>
            <p className={styles.matrixTag}>{s.tagline}</p>
            <PriceTable catalog={catalog} service={s} now={now} />
            <div className={styles.matrixCta}>
              <Link href={`/buchen?leistung=${s.id}`} className="link-arrow">
                {s.name} buchen <Icon name="arrow-right" />
              </Link>
            </div>
          </article>
        )
      })}
    </div>
  )
}
