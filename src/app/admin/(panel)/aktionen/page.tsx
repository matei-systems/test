import { getDb } from '@/lib/db'
import { loadCatalog } from '@/lib/catalog'
import { isPromotionRunning, promotionPrice, resolvePrice, type Catalog, type Promotion } from '@/lib/pricing'
import { formatDateOnly, formatEuro } from '@/lib/format'
import { zonedParts } from '@/lib/time'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { Icon } from '@/components/icons'
import { deletePromotionAction, savePromotionAction } from '../../actions'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Aktionen & Rabatte' }

const PERCENTS = [10, 20, 30, 40]

function promoState(p: Promotion, now: number): { label: string; tone: 'on' | 'off' | '' } {
  if (!p.active) return { label: 'inaktiv', tone: 'off' }
  if (p.endsAt && new Date(p.endsAt).getTime() <= now) return { label: 'abgelaufen', tone: 'off' }
  if (p.startsAt && new Date(p.startsAt).getTime() > now) return { label: `geplant ab ${formatDateOnly(p.startsAt)}`, tone: '' }
  return { label: 'läuft', tone: 'on' }
}

/** Kalenderdatum (Wien) für <input type="date">; das gespeicherte Ende ist exklusiv (Folgetag 00:00). */
function dateValue(iso: string | null, exclusiveEnd = false): string {
  if (!iso) return ''
  return zonedParts(new Date(new Date(iso).getTime() - (exclusiveEnd ? 1 : 0))).date
}

function scopeLabel(p: Promotion, catalog: Catalog): string {
  const service = p.serviceId ? (catalog.services.find((s) => s.id === p.serviceId)?.name ?? p.serviceId) : 'Alle Pakete'
  const vehicle = p.vehicleId ? (catalog.vehicles.find((v) => v.id === p.vehicleId)?.name ?? p.vehicleId) : 'alle Fahrzeugkategorien'
  return `${service} · ${vehicle}`
}

/** Beispielrechnung für die erste passende Kombination (zur Kontrolle). */
function example(p: Promotion, catalog: Catalog): string | null {
  for (const s of catalog.services) {
    if (s.requiresAddon || (p.serviceId && p.serviceId !== s.id)) continue
    for (const v of catalog.vehicles) {
      if (p.vehicleId && p.vehicleId !== v.id) continue
      const regular = s.prices[v.id]?.priceCents
      if (regular === null || regular === undefined) continue
      const r = promotionPrice(p, regular)
      if (!r) return `${s.name} (${v.name}): kein Preisvorteil – Aktionspreis liegt nicht unter ${formatEuro(regular)}`
      return `${s.name} (${v.name}): regulär ${formatEuro(regular)} → ${formatEuro(r.priceCents)} (−${r.percent} %)`
    }
  }
  return null
}

export default async function PromotionsPage() {
  await requireAdmin()
  const catalog = await loadCatalog(await getDb(), true)
  const now = Date.now()
  const packages = catalog.services.filter((s) => !s.requiresAddon)
  const vehicles = catalog.vehicles.filter((v) => v.active)
  const running = catalog.promotions.filter((p) => isPromotionRunning(p, now))

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Aktionen &amp; Rabatte</h1>
          <p>
            Einführungspreise und Rabattaktionen planen. Der Aktionspreis wird automatisch vom regulären Preis berechnet und gilt sofort auf
            der Website und in der Buchung. Zusatzleistungen sind von Aktionen ausgenommen.
          </p>
        </div>
      </header>

      <div className="adm-warn" style={{ marginBottom: 16 }}>
        <Icon name="info" size={18} />
        <span>
          <strong>Ehrliche Preisangaben:</strong> Der Kunde sieht immer den tatsächlich zu zahlenden Preis, den Namen der Aktion, das
          Rabatt-Kennzeichen (z. B. −20 %) und den regulären Preis („Regulär 149 €“). Den regulären Preis nur dann{' '}
          <em>durchgestrichen</em> darstellen, wenn er tatsächlich verlangt wurde bzw. nach der Aktion verlangt wird – Preisgegenüberstellungen
          dürfen nicht irreführend sein. Im Zweifel bitte rechtlich prüfen lassen.
        </span>
      </div>

      <div className="adm-grid adm-grid--halves">
          <section className="adm-card">
            <h2>Aktionen</h2>
            <p className="adm-card-desc">
              Treffen mehrere Aktionen auf dieselbe Leistung zu, gilt die speziellere (Leistung + Fahrzeug vor „alle“), bei Gleichstand die
              günstigere. Prozent-Rabatte werden zugunsten des Kunden auf volle Euro abgerundet.
            </p>
            {catalog.promotions.length === 0 && <p className="adm-empty">Keine Aktionen angelegt – es gelten die regulären Preise.</p>}
            <div className="adm-stack">
              {catalog.promotions.map((p) => {
                const st = promoState(p, now)
                const ex = example(p, catalog)
                return (
                  <details key={p.id} className="adm-card" style={{ padding: 14, background: 'transparent' }}>
                    <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <span>
                        <strong style={{ fontWeight: 500 }}>{p.name}</strong>{' '}
                        <span className="adm-sale">{p.discountPercent !== null ? `−${p.discountPercent} %` : `Aktionspreis ${formatEuro(p.promoPriceCents ?? 0)}`}</span>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          {scopeLabel(p, catalog)}
                          {p.endsAt ? ` · bis ${formatDateOnly(new Date(new Date(p.endsAt).getTime() - 1))}` : ' · unbefristet'}
                        </span>
                      </span>
                      <span className={`adm-pill ${st.tone === 'on' ? 'adm-pill--on' : st.tone === 'off' ? 'adm-pill--off' : ''}`}>{st.label}</span>
                    </summary>
                    {ex && (
                      <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Icon name="tag" size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                        {ex}
                      </p>
                    )}
                    <PromotionForm promotion={p} catalog={catalog} />
                    <ActionForm action={deletePromotionAction} confirm={`Aktion „${p.name}“ löschen? Es gelten dann wieder die regulären Preise.`}>
                      <input type="hidden" name="id" value={p.id} />
                      <SubmitButton className="adm-btn adm-btn--danger" pendingText="…">
                        <Icon name="trash" size={15} /> Aktion löschen
                      </SubmitButton>
                    </ActionForm>
                  </details>
                )
              })}
            </div>
          </section>

          <section className="adm-card">
            <h2>Neue Aktion anlegen</h2>
            <p className="adm-card-desc">Zum Beispiel „Frühlingsaktion“ mit −10 % auf die Außenpflege vom 1. bis 31. März.</p>
            <PromotionForm catalog={catalog} />
          </section>
      </div>

      <section className="adm-card" style={{ marginTop: 16 }}>
          <h2>Aktuelle Preise auf der Website</h2>
          <p className="adm-card-desc">
            So werden die Pakete jetzt verkauft ({running.length === 0 ? 'keine Aktion aktiv' : `${running.length} Aktion${running.length === 1 ? '' : 'en'} aktiv`}). Darunter
            steht jeweils der reguläre Preis.
          </p>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Fahrzeug</th>
                  {packages.map((s) => (
                    <th key={s.id} className="num">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.name}</td>
                    {packages.map((s) => {
                      const info = resolvePrice(catalog, s, v.id, now)
                      return (
                        <td key={s.id} className="num">
                          {info.priceCents === null ? (
                            'auf Anfrage'
                          ) : (
                            <>
                              <strong style={{ fontWeight: 500 }}>{formatEuro(info.priceCents)}</strong>
                              {info.promotion && info.regularCents !== null && (
                                <span className="sub">regulär {formatEuro(info.regularCents)}</span>
                              )}
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
        </section>
    </>
  )
}

function PromotionForm({ promotion, catalog }: { promotion?: Promotion; catalog: Catalog }) {
  const key = promotion?.id ?? 'neu'
  const p = promotion
  const percentOptions = p?.discountPercent && !PERCENTS.includes(p.discountPercent) ? [...PERCENTS, p.discountPercent].sort((a, b) => a - b) : PERCENTS
  const fixed = p ? p.promoPriceCents !== null : false
  return (
    <ActionForm action={savePromotionAction} className="adm-form" resetOnSuccess={!p}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="adm-form-grid" style={{ marginTop: 12 }}>
        <div className="field full">
          <label htmlFor={`pn-${key}`}>Bezeichnung (für Kunden sichtbar)</label>
          <input id={`pn-${key}`} name="name" className="input" defaultValue={p?.name ?? ''} placeholder="z. B. Einführungspreis, Startangebot, Frühlingsaktion" required />
        </div>
        <div className="field">
          <label htmlFor={`ps-${key}`}>Leistung</label>
          <select id={`ps-${key}`} name="serviceId" className="select" defaultValue={p?.serviceId ?? ''}>
            <option value="">Alle Pakete</option>
            {catalog.services
              .filter((s) => !s.requiresAddon)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`pv-${key}`}>Fahrzeugkategorie</label>
          <select id={`pv-${key}`} name="vehicleId" className="select" defaultValue={p?.vehicleId ?? ''}>
            <option value="">Alle Fahrzeugkategorien</option>
            {catalog.vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="field full adm-fieldset">
          <legend>Preisvorteil</legend>
          <div className="adm-form-grid">
            <div className="field">
              <label className="adm-check">
                <input type="radio" name="mode" value="prozent" defaultChecked={!fixed} /> Rabatt in Prozent
              </label>
              <select name="percent" className="select" defaultValue={String(p?.discountPercent ?? 20)} aria-label="Rabatt in Prozent">
                {percentOptions.map((n) => (
                  <option key={n} value={n}>
                    −{n} %
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="adm-check">
                <input type="radio" name="mode" value="preis" defaultChecked={fixed} /> Fester Aktionspreis (€)
              </label>
              <input
                name="promoPrice"
                className="input"
                inputMode="decimal"
                placeholder="z. B. 119"
                aria-label="Fester Aktionspreis in Euro"
                defaultValue={p?.promoPriceCents != null ? (p.promoPriceCents / 100).toFixed(2).replace('.', ',') : ''}
              />
              <span className="field-hint">Nur für genau eine Leistung und eine Fahrzeugkategorie.</span>
            </div>
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor={`pa-${key}`}>Startdatum</label>
          <input id={`pa-${key}`} name="startDate" type="date" className="input" defaultValue={dateValue(p?.startsAt ?? null)} />
          <span className="field-hint">Leer = gilt ab sofort.</span>
        </div>
        <div className="field">
          <label htmlFor={`pe-${key}`}>Enddatum (einschließlich)</label>
          <input id={`pe-${key}`} name="endDate" type="date" className="input" defaultValue={dateValue(p?.endsAt ?? null, true)} />
          <span className="field-hint">Leer = unbefristet. Wird Kunden als „gültig bis“ angezeigt.</span>
        </div>
      </div>
      <label className="adm-check">
        <input type="checkbox" name="active" defaultChecked={p?.active ?? true} /> Aktion aktiv
      </label>
      <label className="adm-check">
        <input type="checkbox" name="showStrikethrough" defaultChecked={p?.showStrikethrough ?? false} /> Regulären Preis durchgestrichen anzeigen
      </label>
      <span className="field-hint">
        Standard: „Regulär 149 €“ ohne Durchstreichung – die sichere Variante für Einführungspreise. Durchstreichen nur, wenn der reguläre
        Preis tatsächlich gilt bzw. gegolten hat.
      </span>
      <div className="adm-actions">
        <SubmitButton className="adm-btn">{p ? 'Aktion speichern' : 'Aktion anlegen'}</SubmitButton>
      </div>
    </ActionForm>
  )
}
