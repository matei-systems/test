import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { loadCatalog } from '@/lib/catalog'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Icon } from '@/components/icons'
import { deleteServiceAction, saveServiceAction } from '../../../actions'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Leistung bearbeiten' }

export default async function ServiceEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ neu?: string }> }) {
  await requireAdmin()
  const { id } = await params
  const sp = await searchParams
  const catalog = await loadCatalog(await getDb(), true)
  const s = catalog.services.find((x) => x.id === id)
  if (!s) notFound()

  return (
    <>
      <Link href="/admin/leistungen" className="adm-crumb">
        <Icon name="arrow-left" size={14} /> Leistungen &amp; Preise
      </Link>
      <header className="adm-head">
        <div>
          <h1>{s.name}</h1>
          <p>
            Öffentliche Seite:{' '}
            <a href={`/leistungen/${s.id}`} target="_blank" style={{ textDecoration: 'underline' }}>
              /leistungen/{s.id}
            </a>
          </p>
        </div>
      </header>
      {sp.neu && (
        <p className="adm-msg adm-msg--ok" style={{ marginBottom: 16 }}>
          Leistung angelegt (inaktiv). Texte, Preise und Dauer ausfüllen und dann aktivieren.
        </p>
      )}

      <ActionForm action={saveServiceAction} className="adm-form">
        <input type="hidden" name="id" value={s.id} />
        <div className="adm-grid adm-grid--2">
          <section className="adm-card">
            <h2>Texte</h2>
            <p className="adm-card-desc">Erscheinen auf der Startseite, der Leistungsseite und in der Buchung.</p>
            <div className="adm-form-grid">
              <div className="field full">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" className="input" defaultValue={s.name} required />
              </div>
              <div className="field full">
                <label htmlFor="tagline">Kurzbeschreibung (eine Zeile)</label>
                <input id="tagline" name="tagline" className="input" defaultValue={s.tagline} />
              </div>
              <div className="field full">
                <label htmlFor="description">Beschreibung</label>
                <textarea id="description" name="description" className="textarea" defaultValue={s.description} />
              </div>
              <div className="field full">
                <label htmlFor="includes">Enthaltene Leistungen (eine pro Zeile)</label>
                <textarea id="includes" name="includes" className="textarea" style={{ minHeight: 160 }} defaultValue={s.includes.join('\n')} />
              </div>
              <div className="field full">
                <label htmlFor="priceNote">Hinweis zu möglichen Zusatzkosten</label>
                <input id="priceNote" name="priceNote" className="input" defaultValue={s.priceNote} />
              </div>
            </div>
          </section>

          <div className="adm-stack">
            <section className="adm-card">
              <h2>Sichtbarkeit</h2>
              <div className="adm-stack" style={{ gap: 10, marginTop: 12 }}>
                <label className="adm-check">
                  <input type="checkbox" name="active" defaultChecked={s.active} /> Aktiv (auf Website &amp; in Buchung sichtbar)
                </label>
                <label className="adm-check">
                  <input type="checkbox" name="featured" defaultChecked={s.featured} /> Als „Beliebteste Wahl“ hervorheben
                </label>
                <label className="adm-check">
                  <input type="checkbox" name="requiresAddon" defaultChecked={s.requiresAddon} /> Nur Zusatzleistungen (Preis ergibt sich aus Extras)
                </label>
                <div className="field">
                  <label htmlFor="sort">Reihenfolge</label>
                  <input id="sort" name="sort" type="number" className="input" defaultValue={s.sort} />
                </div>
              </div>
            </section>

            <section className="adm-card">
              <h2>Bild</h2>
              <p className="adm-card-desc">Erscheint auf den Leistungskarten, der Leistungsseite und in der Buchung.</p>
              <ImageUpload name="imageSrc" label="Bild der Leistung" defaultValue={s.imageSrc ?? ''} hint="Querformat empfohlen (mind. 1600 px breit). Ohne Bild wird ein Standardmotiv verwendet." allowRemove />
            </section>

            <section className="adm-card">
              <h2>Reguläre Preise &amp; Dauer je Fahrzeug</h2>
              <p className="adm-card-desc">
                Preis leer lassen = „auf Anfrage“ (Kunden stellen dann eine unverbindliche Terminanfrage). Dauer in Minuten (ohne Pufferzeit).
                Rabatte und Einführungspreise unter „Aktionen“.
              </p>
              <table className="adm-matrix">
                <thead>
                  <tr>
                    <th>Fahrzeug</th>
                    <th>Regulärer Preis (€)</th>
                    <th>Dauer (Min.)</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.vehicles.map((v) => {
                    const p = s.prices[v.id]
                    return (
                      <tr key={v.id}>
                        <td>
                          {v.name}
                          {!v.active && <span className="adm-pill adm-pill--off" style={{ marginLeft: 6 }}>inaktiv</span>}
                        </td>
                        <td>
                          <input
                            aria-label={`Preis ${v.name}`}
                            name={`price_${v.id}`}
                            className="input"
                            inputMode="decimal"
                            placeholder="auf Anfrage"
                            defaultValue={p?.priceCents == null ? '' : (p.priceCents / 100).toFixed(2).replace('.', ',')}
                          />
                        </td>
                        <td>
                          <input
                            aria-label={`Dauer ${v.name}`}
                            name={`minutes_${v.id}`}
                            type="number"
                            min={0}
                            max={720}
                            step={5}
                            className="input"
                            defaultValue={p?.durationMinutes ?? 120}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          </div>
        </div>
        <div className="adm-actions" style={{ marginTop: 16 }}>
          <SubmitButton className="btn btn--primary">Leistung speichern</SubmitButton>
        </div>
      </ActionForm>

      <section className="adm-card" style={{ marginTop: 24 }}>
        <h2>Leistung entfernen</h2>
        <p className="adm-card-desc">
          Bestehende Buchungen bleiben erhalten (Name und Preis sind dort gespeichert). Alternativ kannst du die Leistung einfach deaktivieren.
        </p>
        <ActionForm action={deleteServiceAction} confirm={`Leistung „${s.name}“ endgültig löschen?`}>
          <input type="hidden" name="id" value={s.id} />
          <SubmitButton className="adm-btn adm-btn--danger" pendingText="…">
            <Icon name="trash" size={15} /> Leistung löschen
          </SubmitButton>
        </ActionForm>
      </section>
    </>
  )
}
