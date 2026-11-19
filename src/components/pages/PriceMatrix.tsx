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
