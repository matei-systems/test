'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '../icons'
import { DiscountBadge, PriceTag, promoEndLabel } from '../site/PriceTag'
import { maxRunningDiscount, resolvePrice, type Catalog } from '@/lib/pricing'
import { formatDuration } from '@/lib/format'
import styles from './Pricing.module.css'

/**
 * Paketübersicht mit Fahrzeugauswahl – zeigt eindeutig, welcher Preis für welche Fahrzeuggröße gilt.
 * `now` kommt vom Server, damit Server- und Browser-Darstellung (laufende Aktionen) übereinstimmen.
 */
export function Pricing({ catalog, now, heading = true }: { catalog: Catalog; now: number; heading?: boolean }) {
  const [vehicleId, setVehicleId] = useState(catalog.vehicles[0]?.id ?? '')
  const vehicle = catalog.vehicles.find((v) => v.id === vehicleId)
  const packages = catalog.services.filter((s) => !s.requiresAddon && s.prices[vehicleId])
  const best = maxRunningDiscount(catalog, now)
  const bestEnd = best ? promoEndLabel(best.promotion.endsAt) : null

  return (
    <section id="preise" className="section" aria-labelledby="preise-title">
      <div className="container">
        {heading && (
          <div className="section-head section-head--center reveal">
            <p className="eyebrow">Pakete &amp; Preise</p>
            <h2 id="preise-title" className="h2">
              Transparent. <span className="serif accent">Ohne Überraschungen.</span>
            </h2>
            <p className="lead">Wählen Sie Ihre Fahrzeugkategorie – Sie sehen sofort Preis und ungefähre Dauer jedes Pakets.</p>
          </div>
        )}
        {!heading && (
          <h2 id="preise-title" className="sr-only">
            Pakete und Preise nach Fahrzeugkategorie
          </h2>
        )}

        {best && (
          <p className={`${styles.promo} reveal`}>
            <DiscountBadge percent={best.percent} />
            <span>
              <strong>{best.promotion.name}</strong> – {best.percent}&nbsp;% Preisvorteil auf unsere Pakete
              {bestEnd ? `, gültig bis ${bestEnd}` : ' zum Start von RM Mobile Auto Aufbereitung'}.
            </span>
          </p>
        )}

        <div className={`${styles.switcher} reveal`} role="group" aria-label="Fahrzeugkategorie wählen">
          {catalog.vehicles.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === vehicleId}
              className={`${styles.option} ${v.id === vehicleId ? styles.active : ''}`}
              onClick={() => setVehicleId(v.id)}
            >
              {v.name}
            </button>
          ))}
        </div>
        {vehicle?.description && <p className={styles.example}>{vehicle.description}</p>}

        <div className={styles.grid} aria-live="polite">
          {packages.map((s) => {
            const p = s.prices[vehicleId]
            const info = resolvePrice(catalog, s, vehicleId, now)
            return (
              <article key={s.id} className={`${styles.plan} ${s.featured ? styles.planFeatured : ''}`}>
                {s.featured && <span className={`badge ${styles.ribbon}`}>Beliebteste Wahl</span>}
                <h3 className={styles.planName}>{s.name}</h3>
                <p className={styles.planTag}>{s.tagline}</p>
                <div className={styles.planPrice}>
                  <PriceTag info={info} size="lg" showEnd={false} />
                </div>
                <p className={styles.planMeta}>
                  für {vehicle?.name} · <Icon name="clock" size={14} /> ca. {formatDuration(p.durationMinutes)}
                </p>
                <ul className={styles.planList}>
                  {s.includes.map((i) => (
                    <li key={i}>
                      <Icon name="check" size={15} /> {i}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/buchen?leistung=${s.id}&fahrzeug=${vehicleId}`}
                  className={`btn ${s.featured ? 'btn--primary' : 'btn--ghost'} btn--block ${styles.planCta}`}
                >
                  {info.priceCents === null ? 'Termin anfragen' : 'Termin wählen'}
                </Link>
              </article>
            )
          })}
        </div>

        <p className={styles.footnote}>
          <Icon name="info" size={16} />
          <span>
            Alle Preise sind Endpreise inklusive Anfahrt im Einsatzgebiet und gelten für Fahrzeuge in normalem Pflegezustand. Mögliche
            Zusatzkosten (z. B. Tierhaare, starke Verschmutzung) sind als Zusatzleistungen ausgewiesen und werden immer vorab mit Ihnen
            abgestimmt.
          </span>
        </p>
      </div>
    </section>
  )
}
