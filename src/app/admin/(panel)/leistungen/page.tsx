import Link from 'next/link'
import { getDb } from '@/lib/db'
import { loadCatalog } from '@/lib/catalog'
import { formatDuration, formatPrice } from '@/lib/format'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { Icon } from '@/components/icons'
import { createServiceAction, deleteAddonAction, saveAddonAction, saveVehicleAction } from '../../actions'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Leistungen & Preise' }

export default async function ServicesAdminPage({ searchParams }: { searchParams: Promise<{ geloescht?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const catalog = await loadCatalog(await getDb(), true)
  const activeVehicles = catalog.vehicles.filter((v) => v.active)
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Leistungen &amp; Preise</h1>
          <p>Alle Änderungen sind sofort auf der Website und in der Online-Buchung wirksam. Bestehende Buchungen bleiben unverändert.</p>
        </div>
      </header>
      {sp.geloescht && <p className="adm-msg adm-msg--ok" style={{ marginBottom: 16 }}>Leistung wurde gelöscht.</p>}

      <section className="adm-card" style={{ marginBottom: 16 }}>
        <h2>Leistungen</h2>
        <p className="adm-card-desc">
          Hier pflegst du die <strong>regulären Preise</strong> je Fahrzeugkategorie. Einführungspreise und Rabatte legst du unter{' '}
          <Link href="/admin/aktionen" style={{ textDecoration: 'underline' }}>
            Aktionen
          </Link>{' '}
          fest – sie werden automatisch vom regulären Preis berechnet.
        </p>
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--cards">
            <thead>
              <tr>
                <th>Leistung</th>
                <th>Reguläre Preise</th>
                <th>Dauer</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {catalog.services.map((s) => {
                const regular = activeVehicles.map((v) => s.prices[v.id]?.priceCents).filter((p): p is number => typeof p === 'number')
                const durations = activeVehicles.map((v) => s.prices[v.id]?.durationMinutes ?? 0).filter(Boolean)
                return (
                  <tr key={s.id}>
                    <td data-label="Leistung">
                      <Link href={`/admin/leistungen/${s.id}`} className="row-link">
                        {s.name}
                      </Link>
                      <span className="sub">
                        /{s.id}
                        {s.featured ? ' · hervorgehoben' : ''}
                        {s.requiresAddon ? ' · nur Zusatzleistungen' : ''}
                      </span>
                    </td>
                    <td data-label="Reguläre Preise">
                      {s.requiresAddon
                        ? 'aus Zusatzleistungen'
                        : regular.length === 0
                          ? 'auf Anfrage'
                          : Math.min(...regular) === Math.max(...regular)
                            ? formatPrice(regular[0])
                            : `${formatPrice(Math.min(...regular))} – ${formatPrice(Math.max(...regular))}`}
                    </td>
                    <td data-label="Dauer">{durations.length ? `${formatDuration(Math.min(...durations))} – ${formatDuration(Math.max(...durations))}` : '–'}</td>
                    <td data-label="Status">
                      <span className={`adm-pill ${s.active ? 'adm-pill--on' : 'adm-pill--off'}`}>{s.active ? 'aktiv' : 'inaktiv'}</span>
                    </td>
                    <td className="num">
                      <Link href={`/admin/leistungen/${s.id}`} className="adm-btn">
                        <Icon name="edit" size={15} /> Bearbeiten
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <ActionForm action={createServiceAction} className="adm-form" >
          <div className="adm-filters" style={{ marginTop: 16, marginBottom: 0 }}>
            <label htmlFor="new-service" className="sr-only">
              Name der neuen Leistung
            </label>
            <input id="new-service" name="name" className="input" placeholder="Neue Leistung, z. B. „Lederpflege“" required />
            <SubmitButton className="adm-btn">
              <Icon name="plus" size={16} /> Leistung hinzufügen
            </SubmitButton>
          </div>
        </ActionForm>
      </section>

      <div className="adm-grid adm-grid--halves">
        <section className="adm-card">
          <h2>Zusatzleistungen</h2>
          <p className="adm-card-desc">Optional in Schritt 3 der Buchung wählbar. „ab“-Preis = Endpreis nach Aufwand.</p>
          <div className="adm-stack">
            {catalog.addons.map((a) => (
              <details key={a.id} className="adm-card" style={{ padding: 14, background: 'transparent' }}>
                <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>
                    {a.name} {!a.active && <span className="adm-pill adm-pill--off">inaktiv</span>}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {formatPrice(a.priceCents, { from: a.priceIsFrom })} · {formatDuration(a.durationMinutes)}
                  </span>
                </summary>
                <AddonForm addon={a} />
                <ActionForm action={deleteAddonAction} confirm={`Zusatzleistung „${a.name}“ löschen?`}>
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton className="adm-btn adm-btn--danger" pendingText="…">
                    <Icon name="trash" size={15} /> Löschen
                  </SubmitButton>
                </ActionForm>
              </details>
            ))}
            <details className="adm-card" style={{ padding: 14, background: 'transparent' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>+ Neue Zusatzleistung</summary>
              <AddonForm />
            </details>
          </div>
        </section>

        <section className="adm-card">
          <h2>Fahrzeugkategorien</h2>
          <p className="adm-card-desc">Für jede Kategorie werden in den Leistungen eigene Preise und Dauern gepflegt.</p>
          <div className="adm-stack">
            {catalog.vehicles.map((v) => (
              <details key={v.id} className="adm-card" style={{ padding: 14, background: 'transparent' }}>
                <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{v.name}</span>
                  <span className={`adm-pill ${v.active ? 'adm-pill--on' : 'adm-pill--off'}`}>{v.active ? 'aktiv' : 'inaktiv'}</span>
                </summary>
                <ActionForm action={saveVehicleAction} className="adm-form" >
                  <input type="hidden" name="id" value={v.id} />
                  <div className="adm-form-grid" style={{ marginTop: 12 }}>
                    <div className="field">
                      <label htmlFor={`vn-${v.id}`}>Name</label>
                      <input id={`vn-${v.id}`} name="name" className="input" defaultValue={v.name} />
                    </div>
                    <div className="field">
                      <label htmlFor={`vs-${v.id}`}>Reihenfolge</label>
                      <input id={`vs-${v.id}`} name="sort" type="number" className="input" defaultValue={v.sort} />
                    </div>
                    <div className="field full">
                      <label htmlFor={`vd-${v.id}`}>Beispiele / Beschreibung</label>
                      <input id={`vd-${v.id}`} name="description" className="input" defaultValue={v.description} />
                    </div>
                  </div>
                  <label className="adm-check">
                    <input type="checkbox" name="active" defaultChecked={v.active} /> Aktiv (in der Buchung wählbar)
                  </label>
                  <div className="adm-actions">
                    <SubmitButton className="adm-btn">Speichern</SubmitButton>
                  </div>
                </ActionForm>
              </details>
            ))}
            <details className="adm-card" style={{ padding: 14, background: 'transparent' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--accent)' }}>+ Neue Fahrzeugkategorie</summary>
              <ActionForm action={saveVehicleAction} className="adm-form" resetOnSuccess>
                <div className="adm-form-grid" style={{ marginTop: 12 }}>
                  <div className="field">
                    <label htmlFor="vn-new">Name</label>
                    <input id="vn-new" name="name" className="input" required />
                  </div>
                  <div className="field">
                    <label htmlFor="vd-new">Beispiele</label>
                    <input id="vd-new" name="description" className="input" />
                  </div>
                </div>
                <div className="adm-actions">
                  <SubmitButton className="adm-btn">Anlegen</SubmitButton>
                </div>
              </ActionForm>
            </details>
          </div>
        </section>
      </div>
    </>
  )
}

function AddonForm({ addon }: { addon?: { id: string; name: string; description: string; priceCents: number; priceIsFrom: boolean; durationMinutes: number; bookableAlone: boolean; active: boolean; sort: number } }) {
  const key = addon?.id ?? 'new'
  return (
    <ActionForm action={saveAddonAction} className="adm-form" resetOnSuccess={!addon}>
      {addon && <input type="hidden" name="id" value={addon.id} />}
      <div className="adm-form-grid" style={{ marginTop: 12 }}>
        <div className="field full">
          <label htmlFor={`an-${key}`}>Name</label>
          <input id={`an-${key}`} name="name" className="input" defaultValue={addon?.name} required />
        </div>
        <div className="field full">
          <label htmlFor={`ad-${key}`}>Beschreibung</label>
          <input id={`ad-${key}`} name="description" className="input" defaultValue={addon?.description} />
        </div>
        <div className="field">
          <label htmlFor={`ap-${key}`}>Preis (€)</label>
          <input id={`ap-${key}`} name="price" className="input" inputMode="decimal" defaultValue={addon ? (addon.priceCents / 100).toFixed(2).replace('.', ',') : ''} required />
        </div>
        <div className="field">
          <label htmlFor={`am-${key}`}>Dauer (Min.)</label>
          <input id={`am-${key}`} name="minutes" type="number" min={0} max={480} step={5} className="input" defaultValue={addon?.durationMinutes ?? 30} />
        </div>
        <div className="field">
          <label htmlFor={`as-${key}`}>Reihenfolge</label>
          <input id={`as-${key}`} name="sort" type="number" className="input" defaultValue={addon?.sort ?? 100} />
        </div>
      </div>
      <label className="adm-check">
        <input type="checkbox" name="priceIsFrom" defaultChecked={addon?.priceIsFrom} /> „ab“-Preis
      </label>
      <label className="adm-check">
        <input type="checkbox" name="bookableAlone" defaultChecked={addon?.bookableAlone ?? true} /> Auch ohne Paket buchbar
      </label>
      <label className="adm-check">
        <input type="checkbox" name="active" defaultChecked={addon?.active ?? true} /> Aktiv
      </label>
      <div className="adm-actions">
        <SubmitButton className="adm-btn">{addon ? 'Speichern' : 'Anlegen'}</SubmitButton>
      </div>
    </ActionForm>
  )
}
