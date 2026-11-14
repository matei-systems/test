import { getCoupons } from '@/lib/admin-data'
import { couponTerms, type Coupon } from '@/lib/coupons'
import { formatDateOnly, formatEuro } from '@/lib/format'
import { zonedParts } from '@/lib/time'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { Icon } from '@/components/icons'
import { deleteCouponAction, saveCouponAction } from '../../actions'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Gutscheine' }

function couponState(c: Coupon, redemptions: number, now: number): { label: string; tone: 'on' | 'off' | '' } {
  if (!c.active) return { label: 'inaktiv', tone: 'off' }
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return { label: 'abgelaufen', tone: 'off' }
  if (c.maxRedemptions !== null && redemptions >= c.maxRedemptions) return { label: 'aufgebraucht', tone: 'off' }
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: `gültig ab ${formatDateOnly(c.startsAt)}`, tone: '' }
  return { label: 'einlösbar', tone: 'on' }
}

/** Kalenderdatum (Wien) für <input type="date">; das gespeicherte Ende ist exklusiv (Folgetag 00:00). */
function dateValue(iso: string | null, exclusiveEnd = false): string {
  if (!iso) return ''
  return zonedParts(new Date(new Date(iso).getTime() - (exclusiveEnd ? 1 : 0))).date
}

const euroInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',').replace(/,00$/, '')

export default async function CouponsPage() {
  await requireAdmin()
  const coupons = await getCoupons()
  const now = Date.now()

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Gutscheine</h1>
          <p>
            Gutscheincodes für Flyer, Dankeskarten und Aktionen. Kunden geben den Code im letzten Schritt der Online-Buchung ein; der Betrag
            wird dort sichtbar vom Gesamtpreis abgezogen. Geprüft wird ausschließlich auf dem Server.
          </p>
        </div>
      </header>

      <div className="adm-warn" style={{ marginBottom: 16 }}>
        <Icon name="info" size={18} />
        <span>
          <strong>So ist Missbrauch begrenzt:</strong> Mindestauftragswert, „einmal je Kunde“ bzw. „nur erste Buchung“ (erkannt an E-Mail-Adresse
          oder Telefonnummer), optional eine Höchstzahl an Einlösungen und ein Ablaufdatum. Stornierte Buchungen geben den Gutschein wieder frei.
          Ein allgemein bekannter Code lässt sich mit neuen Kontaktdaten erneut nutzen – das lässt sich technisch nicht vollständig verhindern.
          Gedruckte Bedingungen (Flyer, Dankeskarte) müssen zu den Einstellungen hier passen.
        </span>
      </div>

      <div className="adm-grid adm-grid--halves">
        <section className="adm-card">
          <h2>Gutscheine</h2>
          <p className="adm-card-desc">Gutscheine sind mit laufenden Aktionen (z. B. Einführungspreis) kombinierbar; der Mindestauftragswert bezieht sich auf den zu zahlenden Betrag vor Abzug des Gutscheins.</p>
          {coupons.length === 0 && <p className="adm-empty">Noch keine Gutscheine angelegt.</p>}
          <div className="adm-stack">
            {coupons.map(({ coupon: c, redemptions, discountCents }) => {
              const st = couponState(c, redemptions, now)
              return (
                <details key={c.id} className="adm-card" style={{ padding: 14, background: 'transparent' }}>
                  <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <span>
                      <strong style={{ fontWeight: 500, letterSpacing: '0.06em' }}>{c.code}</strong>
                      {c.label ? ` · ${c.label}` : ''}
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {couponTerms(c)}
                        {c.endsAt ? ` · bis ${formatDateOnly(new Date(new Date(c.endsAt).getTime() - 1))}` : ' · unbefristet'}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {redemptions} Einlösung{redemptions === 1 ? '' : 'en'}
                        {c.maxRedemptions !== null ? ` von ${c.maxRedemptions}` : ''}
                        {discountCents > 0 ? ` · ${formatEuro(discountCents)} Nachlass gewährt` : ''}
                      </span>
                    </span>
                    <span className={`adm-pill ${st.tone === 'on' ? 'adm-pill--on' : st.tone === 'off' ? 'adm-pill--off' : ''}`}>{st.label}</span>
                  </summary>
                  <CouponForm coupon={c} />
                  <ActionForm action={deleteCouponAction} confirm={`Gutschein ${c.code} löschen?`}>
                    <input type="hidden" name="id" value={c.id} />
                    <SubmitButton className="adm-btn adm-btn--danger" pendingText="…">
                      <Icon name="trash" size={15} /> Gutschein löschen
                    </SubmitButton>
                  </ActionForm>
                </details>
              )
            })}
          </div>
        </section>

        <section className="adm-card">
          <h2>Neuen Gutschein anlegen</h2>
          <p className="adm-card-desc">Zum Beispiel „SOMMER15“ mit 15 € ab 149 € Auftragswert, gültig bis 31. August.</p>
          <CouponForm />
        </section>
      </div>
    </>
  )
}

function CouponForm({ coupon }: { coupon?: Coupon }) {
  const c = coupon
  const key = c?.id ?? 'neu'
  return (
    <ActionForm action={saveCouponAction} className="adm-form" resetOnSuccess={!c}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="adm-form-grid" style={{ marginTop: 12 }}>
        <div className="field">
          <label htmlFor={`cc-${key}`}>Code (Großbuchstaben und Ziffern)</label>
          <input id={`cc-${key}`} name="code" className="input" defaultValue={c?.code ?? ''} placeholder="z. B. DANKE20" maxLength={24} required autoCapitalize="characters" spellCheck={false} />
        </div>
        <div className="field">
          <label htmlFor={`cl-${key}`}>Bezeichnung (für Kunden sichtbar)</label>
          <input id={`cl-${key}`} name="label" className="input" defaultValue={c?.label ?? ''} placeholder="z. B. Dankeschön-Vorteil" maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor={`ca-${key}`}>Gutscheinbetrag in €</label>
          <input id={`ca-${key}`} name="amount" className="input" inputMode="decimal" defaultValue={c ? euroInput(c.amountCents) : ''} placeholder="20" required />
        </div>
        <div className="field">
          <label htmlFor={`cm-${key}`}>Mindestauftragswert in €</label>
          <input id={`cm-${key}`} name="minOrder" className="input" inputMode="decimal" defaultValue={c ? euroInput(c.minOrderCents) : ''} placeholder="119" required />
        </div>
        <div className="field">
          <label htmlFor={`cs-${key}`}>Gültig ab (optional)</label>
          <input id={`cs-${key}`} name="startDate" type="date" className="input" defaultValue={dateValue(c?.startsAt ?? null)} />
        </div>
        <div className="field">
          <label htmlFor={`ce-${key}`}>Gültig bis einschließlich (optional)</label>
          <input id={`ce-${key}`} name="endDate" type="date" className="input" defaultValue={dateValue(c?.endsAt ?? null, true)} />
        </div>
        <div className="field full">
          <label htmlFor={`cx-${key}`}>Höchstzahl an Einlösungen insgesamt (leer = unbegrenzt)</label>
          <input id={`cx-${key}`} name="maxRedemptions" className="input" inputMode="numeric" defaultValue={c?.maxRedemptions ?? ''} placeholder="z. B. 200" />
        </div>
        <label className="checkbox full">
          <input type="checkbox" name="oncePerCustomer" defaultChecked={c ? c.oncePerCustomer : true} />
          <span>Je Kunde nur einmal einlösbar (E-Mail-Adresse oder Telefonnummer)</span>
        </label>
        <label className="checkbox full">
          <input type="checkbox" name="firstBookingOnly" defaultChecked={c ? c.firstBookingOnly : false} />
          <span>Nur für die erste Buchung (Neukunden-Gutschein)</span>
        </label>
        <label className="checkbox full">
          <input type="checkbox" name="active" defaultChecked={c ? c.active : true} />
          <span>Aktiv (einlösbar)</span>
        </label>
      </div>
      <SubmitButton className="adm-btn adm-btn--primary" pendingText="Speichern …">
        {c ? 'Gutschein speichern' : 'Gutschein anlegen'}
      </SubmitButton>
    </ActionForm>
  )
}
