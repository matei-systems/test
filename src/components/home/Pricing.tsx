'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '../icons'
import type { Catalog } from '@/lib/pricing'
import { formatDuration, formatPrice } from '@/lib/format'
import styles from './Pricing.module.css'

/** Preisliste mit Fahrzeugauswahl – zeigt eindeutig, welcher Preis für welche Fahrzeuggröße gilt. */
export function Pricing({ catalog }: { catalog: Catalog }) {
  const [vehicleId, setVehicleId] = useState(catalog.vehicles[0]?.id ?? '')
  const vehicle = catalog.vehicles.find((v) => v.id === vehicleId)
  const packages = catalog.services.filter((s) => !s.requiresAddon && s.prices[vehicleId])

  return (
    <section id="preise" className="section" aria-labelledby="preise-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="eyebrow">Beliebte Pakete &amp; Preise</p>
          <h2 id="preise-title" className="h2">
            Transparent. <span className="serif accent">Ohne Überraschungen.</span>
          </h2>
          <p className="lead">Wähle deine Fahrzeugkategorie – du siehst sofort Preis und ungefähre Dauer jedes Pakets.</p>
        </div>

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
            return (
              <article key={s.id} className={`${styles.plan} ${s.featured ? styles.planFeatured : ''}`}>
                {s.featured && <span className={`badge ${styles.ribbon}`}>Beliebteste Wahl</span>}
                <h3 className={styles.planName}>{s.name}</h3>
                <p className={styles.planTag}>{s.tagline}</p>
                <p className={styles.planPrice}>{p.priceCents === null ? 'auf Anfrage' : formatPrice(p.priceCents)}</p>
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
                  Termin wählen
                </Link>
              </article>
            )
          })}
        </div>

        <p className={styles.footnote}>
          <Icon name="info" size={16} />
          Alle Preise sind Endpreise und gelten für Fahrzeuge in normalem Pflegezustand. Mögliche Zusatzkosten (z. B. Tierhaare, starke
          Verschmutzung) sind oben bei den Zusatzleistungen ausgewiesen und werden immer vorab mit dir abgestimmt.
        </p>
      </div>
    </section>
  )
}
