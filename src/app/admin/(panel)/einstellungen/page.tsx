import { getSettings } from '@/lib/catalog'
import { getDb } from '@/lib/db'
import { isAdminConfigured } from '@/lib/auth'
import { adminRecipient, isEmailConfigured } from '@/lib/email'
import { getSiteUrl } from '@/config/site'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { saveAreaAction, saveBusinessAction, sendTestMailAction } from '../../actions'

export const metadata = { title: 'Einstellungen' }

const BUSINESS_FIELDS: Array<{ name: string; label: string; hint?: string; full?: boolean }> = [
  { name: 'companyName', label: 'Firmenname / Marke', hint: 'z. B. GLANZMOBIL – Max Mustermann' },
  { name: 'ownerName', label: 'Inhaber:in / Vertretungsberechtigte:r' },
  { name: 'legalForm', label: 'Rechtsform', hint: 'z. B. Einzelunternehmen, e.U., GmbH' },
  { name: 'phone', label: 'Telefon (öffentlich)' },
  { name: 'whatsapp', label: 'WhatsApp-Nummer', hint: 'Aktiviert den WhatsApp-Button auf der Website.' },
  { name: 'email', label: 'E-Mail (öffentlich)' },
  { name: 'street', label: 'Straße & Hausnummer (Firmensitz)', full: true },
  { name: 'postalCode', label: 'PLZ' },
  { name: 'city', label: 'Ort' },
  { name: 'country', label: 'Land' },
  { name: 'vatId', label: 'UID-Nummer', hint: 'falls vorhanden' },
  { name: 'companyRegister', label: 'Firmenbuchnummer & -gericht', hint: 'falls eingetragen' },
  { name: 'trade', label: 'Gewerbe / Berufsbezeichnung', full: true },
  { name: 'tradeAuthority', label: 'Gewerbebehörde', hint: 'z. B. Magistrat Graz' },
  { name: 'chamber', label: 'Kammerzugehörigkeit', hint: 'z. B. Wirtschaftskammer Steiermark' },
]

export default async function SettingsPage() {
  const settings = await getSettings()
  const db = await getDb()
  const b = settings.business as unknown as Record<string, string>
  const a = settings.area
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Einstellungen</h1>
          <p>Unternehmensdaten (Impressum, Kontakt, SEO), Einsatzgebiet und Systemstatus.</p>
        </div>
      </header>

      <div className="adm-grid adm-grid--2">
        <section className="adm-card">
          <h2>Unternehmens- &amp; Kontaktdaten</h2>
          <p className="adm-card-desc">
            Werden im Impressum, im Footer, in E-Mails und im Google-Schema (LocalBusiness) verwendet. Leere Felder werden nicht angezeigt
            bzw. im Impressum als fehlend markiert. Bitte nur echte Daten eintragen.
          </p>
          <ActionForm action={saveBusinessAction} className="adm-form">
            <div className="adm-form-grid">
              {BUSINESS_FIELDS.map((f) => (
                <div key={f.name} className={`field ${f.full ? 'full' : ''}`}>
                  <label htmlFor={f.name}>{f.label}</label>
                  <input id={f.name} name={f.name} className="input" defaultValue={b[f.name] ?? ''} type={f.name === 'email' ? 'email' : 'text'} />
                  {f.hint && <span className="field-hint">{f.hint}</span>}
                </div>
              ))}
            </div>
            <div className="adm-actions">
              <SubmitButton>Daten speichern</SubmitButton>
            </div>
          </ActionForm>
        </section>

        <div className="adm-stack">
          <section className="adm-card">
            <h2>Einsatzgebiet</h2>
            <p className="adm-card-desc">Online-Buchungen sind nur für die angegebenen Postleitzahlen möglich (leer = keine Einschränkung).</p>
            <ActionForm action={saveAreaAction} className="adm-form">
              <div className="field">
                <label htmlFor="regions">Regionen (kommagetrennt)</label>
                <input id="regions" name="regions" className="input" defaultValue={a.regions.join(', ')} />
              </div>
              <div className="field">
                <label htmlFor="postalCodes">Erlaubte Postleitzahlen</label>
                <input id="postalCodes" name="postalCodes" className="input" defaultValue={a.postalCodes} />
                <span className="field-hint">Format: 8010-8077, 8101-8160, 8501</span>
              </div>
              <div className="field">
                <label htmlFor="communities">Orte (eine pro Zeile, Anzeige auf der Website)</label>
                <textarea id="communities" name="communities" className="textarea" style={{ minHeight: 180 }} defaultValue={a.communities.join('\n')} />
              </div>
              <div className="adm-actions">
                <SubmitButton>Einsatzgebiet speichern</SubmitButton>
              </div>
            </ActionForm>
          </section>

          <section className="adm-card">
            <h2>Systemstatus</h2>
            <dl className="adm-dl" style={{ marginTop: 12 }}>
              <div>
                <dt>Datenbank</dt>
                <dd>
                  <span className={`adm-pill ${db.kind === 'postgres' ? 'adm-pill--on' : 'adm-pill--off'}`}>
                    {db.kind === 'postgres' ? 'PostgreSQL verbunden' : 'Lokale Entwicklungsdatenbank (PGlite)'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>E-Mail (SMTP)</dt>
                <dd>
                  <span className={`adm-pill ${isEmailConfigured() ? 'adm-pill--on' : 'adm-pill--off'}`}>
                    {isEmailConfigured() ? 'konfiguriert' : 'nicht konfiguriert'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Admin-Benachrichtigung</dt>
                <dd>{adminRecipient() ?? <span className="adm-pill adm-pill--off">ADMIN_NOTIFICATION_EMAIL fehlt</span>}</dd>
              </div>
              <div>
                <dt>Admin-Login</dt>
                <dd>
                  <span className={`adm-pill ${isAdminConfigured() ? 'adm-pill--on' : 'adm-pill--off'}`}>{isAdminConfigured() ? 'eingerichtet' : 'fehlt'}</span>
                </dd>
              </div>
              <div>
                <dt>Website-URL</dt>
                <dd>{getSiteUrl()}</dd>
              </div>
            </dl>
            <ActionForm action={sendTestMailAction} className="adm-form" >
              <div className="adm-filters" style={{ marginTop: 16, marginBottom: 0 }}>
                <label htmlFor="to" className="sr-only">
                  Empfänger
                </label>
                <input id="to" name="to" type="email" className="input" placeholder="Test-E-Mail an …" defaultValue={adminRecipient() ?? ''} />
                <SubmitButton className="adm-btn" pendingText="Sendet …">
                  Test-E-Mail senden
                </SubmitButton>
              </div>
            </ActionForm>
          </section>
        </div>
      </div>
    </>
  )
}
