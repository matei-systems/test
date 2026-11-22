'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { Icon } from '@/components/icons'
import { formatDuration, formatEuro } from '@/lib/format'
import type { OfferData } from './offer-data'
import styles from './Offer.module.css'

/**
 * „Was kostet mein Fahrzeug?“ – Fahrzeugkategorie wählen, alle Pakete mit Endpreis, regulärem Preis und Dauer sehen
 * und direkt mit vorausgewählter Leistung und Kategorie buchen.
 */
export function PriceExplorer({ data, initialVehicle }: { data: OfferData; initialVehicle?: string }) {
  const first = data.vehicles.find((v) => v.id === initialVehicle)?.id ?? data.vehicles[0]?.id
  const [vehicleId, setVehicleId] = useState(first)
  const labelId = useId()
  // Die Seite ist vorab erzeugt; eine Vorauswahl per Link (?fahrzeug=suv) wird nach dem Laden übernommen.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('fahrzeug')
    if (wanted && data.vehicles.some((v) => v.id === wanted)) setVehicleId(wanted)
  }, [data.vehicles])
  const vehicle = data.vehicles.find((v) => v.id === vehicleId)
  if (!vehicle) return null

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = data.vehicles[(index + delta + data.vehicles.length) % data.vehicles.length]
    setVehicleId(next.id)
    document.getElementById(`${labelId}-${next.id}`)?.focus()
  }

  return (
    <div className={styles.explorer}>
      <div className={styles.explorerHead}>
        <p id={labelId} className={styles.stepLabel}>
          <span>1</span> Fahrzeugkategorie wählen
        </p>
        <div role="radiogroup" aria-labelledby={labelId} className={styles.chips}>
          {data.vehicles.map((v, i) => {
            const active = v.id === vehicleId
            return (
              <button
                key={v.id}
                id={`${labelId}-${v.id}`}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                onClick={() => setVehicleId(v.id)}
                onKeyDown={(e) => onKey(e, i)}
              >
                {v.name}
              </button>
            )
          })}
        </div>
        {vehicle.description && <p className={styles.vehicleHint}>{vehicle.description}</p>}
      </div>

      <p className={styles.stepLabel}>
        <span>2</span> Paket wählen – Endpreise für {vehicle.name}, inklusive Anfahrt
      </p>
      <ul className={styles.offerGrid} aria-live="polite">
        {data.packages.map((p) => {
          const c = p.cells[vehicle.id]
          if (!c) return null
          return (
            <li key={p.id} className={`${styles.offer} ${p.featured ? styles.offerFeatured : ''}`}>
              {p.featured && <span className={`badge ${styles.offerFlag}`}>Beliebteste Wahl</span>}
              <h3 className={styles.offerName}>{p.name}</h3>
              <p className={styles.offerTag}>{p.tagline}</p>
              <div className={styles.offerPrice}>
                {c.priceCents === null ? (
                  <strong>auf Anfrage</strong>
                ) : (
                  <>
                    <strong>{formatEuro(c.priceCents)}</strong>
                    {c.percent !== null && c.regularCents !== null && (
                      <span className={styles.offerRegular}>
                        {c.strike ? (
                          <>
                            <span className="sr-only">regulär </span>
                            <s>{formatEuro(c.regularCents)}</s>
                          </>
                        ) : (
                          <>regulär {formatEuro(c.regularCents)}</>
                        )}{' '}
                        <span className={styles.offerPromo}>
                          {c.promoName} −{c.percent} %
                        </span>
                      </span>
                    )}
                  </>
                )}
              </div>
              <ul className={styles.offerFacts}>
                <li>
                  <Icon name="clock" size={15} /> ca. {formatDuration(c.minutes)}
                </li>
                <li>
                  <Icon name="van" size={15} /> Anfahrt inklusive
                </li>
              </ul>
              <div className={styles.offerActions}>
                <Link href={`/buchen?leistung=${p.id}&fahrzeug=${vehicle.id}`} className={`btn btn--block ${p.featured ? 'btn--primary' : 'btn--light'}`}>
                  Jetzt Termin buchen <Icon name="arrow-right" />
                </Link>
                <Link href={`/leistungen/${p.id}`} className="link-arrow" aria-label={`Was ist enthalten? ${p.name}`}>
                  Was ist enthalten? <Icon name="arrow-right" />
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
