import { Icon, type IconName } from '@/components/icons'
import { ADDON_DETAILS } from '@/content/addons'
import { formatDuration, formatEuro, formatPrice } from '@/lib/format'
import type { Catalog } from '@/lib/pricing'
import type { OfferData } from './offer-data'
import styles from './Offer.module.css'

/** Alle Pakete × alle Fahrzeugkategorien in einer Tabelle (Preis, regulärer Preis, Dauer). */
export function PriceCompare({ data }: { data: OfferData }) {
  const anyPromo = data.packages.some((p) => Object.values(p.cells).some((c) => c.percent !== null))
  return (
    <>
    <p className={styles.swipeHint} aria-hidden="true">
      <Icon name="arrow-right" size={14} /> Seitlich wischen, um alle Pakete zu sehen
    </p>
    <div className={styles.compareWrap} tabIndex={0} role="region" aria-label="Preisvergleich – auf kleinen Bildschirmen seitlich scrollbar">
      <table className={styles.compare}>
        <caption className="sr-only">Endpreise und ungefähre Dauer aller Pakete je Fahrzeugkategorie{anyPromo ? ', inklusive Einführungspreis' : ''}</caption>
        <thead>
          <tr>
            <th scope="col">Fahrzeug</th>
            {data.packages.map((p) => (
              <th key={p.id} scope="col" className={p.featured ? styles.compareFeatured : undefined}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.vehicles.map((v) => (
            <tr key={v.id}>
              <th scope="row">
                {v.name}
                {v.description && <small>{v.description}</small>}
              </th>
              {data.packages.map((p) => {
                const c = p.cells[v.id]
                return (
                  <td key={p.id} className={p.featured ? styles.compareFeatured : undefined}>
                    {!c ? (
                      '–'
                    ) : (
                      <>
                        <strong>{c.priceCents === null ? 'auf Anfrage' : formatEuro(c.priceCents)}</strong>
                        {c.percent !== null && c.regularCents !== null && (
                          <small>{c.strike ? <s aria-label={`regulär ${formatEuro(c.regularCents)}`}>{formatEuro(c.regularCents)}</s> : <>regulär {formatEuro(c.regularCents)}</>}</small>
                        )}
                        <small className={styles.compareTime}>ca. {formatDuration(c.minutes)}</small>
                      </>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  )
}

function addonIcon(id: string): IconName {
  if (id.includes('tier')) return 'paw'
  if (id.includes('polster')) return 'seat'
  if (id.includes('verschmutz')) return 'droplet'
  return 'sparkle'
}

/** Zusatzleistungen mit Preis, Dauer, Kurzbeschreibung und aufklappbarer genauer Abgrenzung. */
export function AddonCards({ catalog, onlyBookableAlone = false }: { catalog: Catalog; onlyBookableAlone?: boolean }) {
  const addons = catalog.addons.filter((a) => !onlyBookableAlone || a.bookableAlone)
  if (addons.length === 0) return null
  return (
    <ul className={styles.addons}>
      {addons.map((a) => {
        const d = ADDON_DETAILS[a.id]
        return (
          <li key={a.id} className={styles.addon}>
            <div className={styles.addonHead}>
              <span className={styles.addonIcon} aria-hidden="true">
                <Icon name={addonIcon(a.id)} size={18} />
              </span>
              <h3>{a.name}</h3>
              <strong className={styles.addonPrice}>{formatPrice(a.priceCents, { from: a.priceIsFrom })}</strong>
            </div>
            <p className={styles.addonMeta}>
              {a.durationMinutes > 0 && <span>ca. {formatDuration(a.durationMinutes)} zusätzlich</span>}
              <span>{a.bookableAlone ? 'auch einzeln buchbar' : 'nur zusammen mit einem Paket'}</span>
            </p>
            <p className={styles.addonText}>{a.description}</p>
            {d && (
              <details className={styles.addonDetails}>
                <summary>
                  Genau erklärt <Icon name="chevron-down" size={16} />
                </summary>
                <div>
                  <h4>{d.scope.title}</h4>
                  <ul>
                    {d.scope.items.map((i) => (
                      <li key={i}>
                        <Icon name="check" size={15} /> {i}
                      </li>
                    ))}
                  </ul>
                  {d.examples && (
                    <>
                      <h4>{d.examples.title}</h4>
                      <ul>
                        {d.examples.items.map((i) => (
                          <li key={i}>
                            <Icon name="check" size={15} /> {i}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {d.process && <p className={styles.addonProcess}>{d.process}</p>}
                  <h4>Grenzen &amp; nicht enthalten</h4>
                  <ul className={styles.addonLimits}>
                    {d.limits.map((i) => (
                      <li key={i}>
                        <Icon name="minus" size={15} /> {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Verantwortungsvolle Außenwäsche: zulässige Standorte, Abwasser, Prüfung vor der Bestätigung, Alternative. */
export function ExteriorNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`${styles.exterior} ${compact ? styles.exteriorCompact : ''}`} aria-labelledby="aussenwaesche-hinweis">
      <span className={styles.exteriorIcon} aria-hidden="true">
        <Icon name="droplet" size={20} />
      </span>
      <div>
        <h3 id="aussenwaesche-hinweis">Außenwäsche – nur an geeigneten Standorten</h3>
        <ul>
          <li>Wir waschen nur an geeigneten und zulässigen Standorten: befestigte Fläche mit ordnungsgemäßer Abwasserableitung.</li>
          <li>Keine unzulässige Einleitung von Waschwasser – nicht auf öffentlichen Straßen oder unbefestigtem Untergrund.</li>
          <li>Wir prüfen Ihren Standort vor der Terminbestätigung.</li>
          <li>Ist er nicht geeignet, schlagen wir eine Alternative vor – etwa einen anderen geeigneten Standort oder eine reine Innenraumleistung.</li>
          <li>Innenraumleistungen sind davon nicht betroffen.</li>
        </ul>
      </div>
    </aside>
  )
}

/** Was zusätzlich kosten kann – und was nie ohne Zustimmung passiert. */
export function ExtraCostsExplainer({ catalog }: { catalog: Catalog }) {
  const dirt = catalog.addons.find((a) => a.id === 'starke-verschmutzung')
  return (
    <div className={styles.costs}>
      <div className={styles.costsCol}>
        <h3>
          <Icon name="check" size={18} /> Immer im Preis enthalten
        </h3>
        <ul>
          <li>Das gewählte Paket für Ihre Fahrzeugkategorie zum angezeigten Endpreis</li>
          <li>Anfahrt innerhalb des Einsatzgebiets</li>
          <li>Reinigungsmittel und Ausrüstung</li>
        </ul>
      </div>
      <div className={styles.costsCol}>
        <h3>
          <Icon name="plus" size={18} /> Nur wenn Sie es wählen oder zustimmen
        </h3>
        <ul>
          <li>Zusatzleistungen, die Sie bei der Buchung auswählen – mit festem Preis</li>
          {dirt && (
            <li>
              {dirt.name} ({formatPrice(dirt.priceCents, { from: dirt.priceIsFrom })}): Den konkreten Betrag nennen wir Ihnen vor Beginn der
              zusätzlichen Arbeit – erst nach Ihrer Zustimmung wird sie durchgeführt.
            </li>
          )}
          <li>Standorte außerhalb des Einsatzgebiets: nur nach vorheriger Absprache</li>
        </ul>
      </div>
      <p className={styles.costsNote}>
        <Icon name="shield" size={16} /> Vor dem Absenden sehen Sie in der Buchungsübersicht den Gesamtpreis mit allen gewählten Leistungen. Ohne
        Ihre Zustimmung entstehen keine weiteren Kosten.
      </p>
    </div>
  )
}
