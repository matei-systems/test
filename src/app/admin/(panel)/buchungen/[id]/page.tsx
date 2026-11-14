import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBooking, getBookingEvents } from '@/lib/admin-data'
import { getSettings, getWorkingHours } from '@/lib/catalog'
import { formatDateLong, formatDateTime, formatDuration, formatEuro, formatPrice, formatTime, EMAIL_STATUS_LABELS, KIND_LABELS, STATUS_LABELS, telHref, whatsappHref } from '@/lib/format'
import { zonedParts, timeToMinutes } from '@/lib/time'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Icon } from '@/components/icons'
import {
  anonymizeAction,
  deleteBookingAction,
  rescheduleAction,
  resendMailAction,
  updateDetailsAction,
  updateStatusAction,
} from '../../../actions'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Buchung' }

const TRANSITIONS: Array<{ status: string; label: string; tone?: string }> = [
  { status: 'bestaetigt', label: 'Bestätigen', tone: 'adm-btn--ok' },
  { status: 'in_bearbeitung', label: 'In Bearbeitung' },
  { status: 'abgeschlossen', label: 'Abschließen' },
  { status: 'storniert', label: 'Ablehnen / Stornieren', tone: 'adm-btn--danger' },
  { status: 'neu', label: 'Zurück auf „Neu“' },
]

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [booking, events, hours, settings] = await Promise.all([getBooking(id), getBookingEvents(id), getWorkingHours(), getSettings()])
  if (!booking) notFound()
  const b = booking
  const start = zonedParts(new Date(b.starts_at))
  const end = zonedParts(new Date(b.ends_at))
  const wd = hours.find((h) => h.weekday === start.weekday)
  const outsideHours =
    !wd || !wd.isOpen || timeToMinutes(start.time) < timeToMinutes(wd.open) || (end.date === start.date ? timeToMinutes(end.time) : 24 * 60) > timeToMinutes(wd.close)
  const locked = Boolean(b.anonymized_at)

  return (
    <>
      <Link href="/admin/buchungen" className="adm-crumb">
        <Icon name="arrow-left" size={14} /> Alle Buchungen
      </Link>
      <header className="adm-head">
        <div>
          <h1>
            {b.first_name} {b.last_name}
          </h1>
          <p>
            {b.reference} · {KIND_LABELS[b.kind] ?? 'Buchung'} vom {formatDateTime(b.created_at)}
          </p>
        </div>
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {b.kind === 'anfrage' && <span className="adm-pill">Terminanfrage · Preis auf Anfrage</span>}
          <StatusBadge status={b.status} />
        </span>
      </header>

      {locked && (
        <div className="adm-warn" style={{ marginBottom: 16 }}>
          <Icon name="lock" size={18} /> Diese Buchung wurde anonymisiert ({formatDateTime(b.anonymized_at!)}). Personenbezogene Daten sind
          gelöscht.
        </div>
      )}

      <div className="adm-grid adm-grid--2">
        <div className="adm-stack">
          {/* Überblick */}
          <section className="adm-card">
            <h2>Termin &amp; Leistung</h2>
            <p className="adm-card-desc">Momentaufnahme zum Zeitpunkt der Buchung.</p>
            <dl className="adm-dl">
              <div>
                <dt>Termin</dt>
                <dd>
                  {formatDateLong(b.starts_at)}, {formatTime(b.starts_at)}–{formatTime(b.ends_at)} Uhr
                  {outsideHours && <span className="adm-pill adm-pill--off" style={{ marginLeft: 8 }}>außerhalb der Arbeitszeit</span>}
                </dd>
              </div>
              <div>
                <dt>Dauer</dt>
                <dd>
                  {formatDuration(b.duration_minutes)} (+ Puffer bis {formatTime(b.blocked_until)})
                </dd>
              </div>
              {settings.rules.teams > 1 && (
                <div>
                  <dt>Team</dt>
                  <dd>Team {b.team}</dd>
                </div>
              )}
              <div>
                <dt>Leistung</dt>
                <dd>
                  {b.service_name} ({formatPrice(b.service_price_cents)})
                </dd>
              </div>
              <div>
                <dt>Fahrzeug</dt>
                <dd>
                  {b.vehicle_category_name} – {b.vehicle_model}
                  {b.license_plate ? ` (${b.license_plate})` : ''}
                </dd>
              </div>
              {b.addons?.length > 0 && (
                <div>
                  <dt>Zusatzleistungen</dt>
                  <dd>{b.addons.map((a) => `${a.name} (${formatPrice(a.priceCents, { from: a.priceIsFrom })})`).join(', ')}</dd>
                </div>
              )}
              {Number(b.discount_cents) > 0 && b.regular_price_cents !== null && (
                <div>
                  <dt>Aktion</dt>
                  <dd>
                    {b.promotion_name ?? 'Rabatt'}
                    {b.promotion_percent ? ` (−${b.promotion_percent} %)` : ''}: regulär {formatEuro(Number(b.regular_price_cents))}, Ersparnis{' '}
                    {formatEuro(Number(b.discount_cents))}
                  </dd>
                </div>
              )}
              {b.coupon_code && (
                <div>
                  <dt>Gutschein</dt>
                  <dd>
                    {b.coupon_code}: −{formatEuro(Number(b.coupon_discount_cents ?? 0))}
                  </dd>
                </div>
              )}
              <div>
                <dt>Gesamtpreis</dt>
                <dd>
                  <strong>{formatPrice(b.total_price_cents, { from: b.price_is_from })}</strong>
                </dd>
              </div>
              <div>
                <dt>Standort</dt>
                <dd>
                  {b.street} {b.house_number}, {b.postal_code} {b.city}{' '}
                  {!locked && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.street} ${b.house_number}, ${b.postal_code} ${b.city}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adm-pill"
                    >
                      Karte öffnen
                    </a>
                  )}
                </dd>
              </div>
              {b.location_note && (
                <div>
                  <dt>Hinweis zum Standort</dt>
                  <dd style={{ whiteSpace: 'pre-wrap' }}>{b.location_note}</dd>
                </div>
              )}
              {b.customer_message && (
                <div>
                  <dt>Nachricht</dt>
                  <dd style={{ whiteSpace: 'pre-wrap' }}>{b.customer_message}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Kontakt */}
          <section className="adm-card">
            <h2>Kunde</h2>
            <p className="adm-card-desc">Kontaktdaten – nur für die Abwicklung dieser Buchung verwenden.</p>
            <dl className="adm-dl">
              <div>
                <dt>Telefon</dt>
                <dd>
                  {locked ? (
                    '–'
                  ) : (
                    <>
                      <a href={telHref(b.phone)}>{b.phone}</a>{' '}
                      <a href={whatsappHref(b.phone)} target="_blank" rel="noopener noreferrer" className="adm-pill">
                        WhatsApp
                      </a>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt>E-Mail</dt>
                <dd>{locked ? '–' : <a href={`mailto:${b.email}`}>{b.email}</a>}</dd>
              </div>
              <div>
                <dt>Angebote per E-Mail</dt>
                <dd>{b.marketing_consent_at ? `Einwilligung erteilt am ${formatDateTime(b.marketing_consent_at)}` : 'keine Einwilligung'}</dd>
              </div>
              {b.cancelled_by && (
                <div>
                  <dt>Storniert durch</dt>
                  <dd>{b.cancelled_by === 'kunde' ? 'Kunde (online)' : 'Administrator'}</dd>
                </div>
              )}
              {b.reminder_sent_at && (
                <div>
                  <dt>Erinnerung</dt>
                  <dd>gesendet am {formatDateTime(b.reminder_sent_at)}</dd>
                </div>
              )}
              <div>
                <dt>E-Mail-Status</dt>
                <dd>
                  Kunde: {EMAIL_STATUS_LABELS[b.customer_email_status] ?? b.customer_email_status} · Admin:{' '}
                  {EMAIL_STATUS_LABELS[b.admin_email_status] ?? b.admin_email_status}
                </dd>
              </div>
            </dl>
            {!locked && (
              <ActionForm action={resendMailAction} className="adm-actions" >
                <input type="hidden" name="id" value={b.id} />
                <div className="adm-actions" style={{ marginTop: 16 }}>
                  <SubmitButton className="adm-btn" pendingText="Sendet …">
                    <Icon name="mail" size={16} /> Bestätigung erneut senden
                  </SubmitButton>
                </div>
              </ActionForm>
            )}
          </section>

          {/* Bearbeiten */}
          {!locked && (
            <section className="adm-card">
              <h2>Daten bearbeiten</h2>
              <p className="adm-card-desc">Kundendaten, Preis und interne Notiz anpassen.</p>
              <ActionForm action={updateDetailsAction} className="adm-form">
                <input type="hidden" name="id" value={b.id} />
                <div className="adm-form-grid">
                  <Field name="firstName" label="Vorname" value={b.first_name} />
                  <Field name="lastName" label="Nachname" value={b.last_name} />
                  <Field name="phone" label="Telefon" value={b.phone} />
                  <Field name="email" label="E-Mail" value={b.email} type="email" />
                  <Field name="street" label="Straße" value={b.street} />
                  <Field name="houseNumber" label="Hausnummer" value={b.house_number} />
                  <Field name="postalCode" label="PLZ" value={b.postal_code} />
                  <Field name="city" label="Ort" value={b.city} />
                  <Field name="vehicleModel" label="Fahrzeugmodell" value={b.vehicle_model} />
                  <Field name="licensePlate" label="Kennzeichen" value={b.license_plate ?? ''} />
                  <Field
                    name="totalPrice"
                    label="Gesamtpreis in € (leer = auf Anfrage)"
                    value={b.total_price_cents === null ? '' : (b.total_price_cents / 100).toFixed(2).replace('.', ',')}
                  />
                  <div className="field full">
                    <label htmlFor="locationNote">Hinweis zum Standort</label>
                    <input id="locationNote" name="locationNote" className="input" defaultValue={b.location_note ?? ''} />
                  </div>
                  <div className="field full">
                    <label htmlFor="message">Nachricht des Kunden</label>
                    <textarea id="message" name="message" className="textarea" defaultValue={b.customer_message ?? ''} />
                  </div>
                  <div className="field full">
                    <label htmlFor="adminNote">Interne Notiz (nur für dich sichtbar)</label>
                    <textarea id="adminNote" name="adminNote" className="textarea" defaultValue={b.admin_note ?? ''} />
                  </div>
                </div>
                <div className="adm-actions">
                  <SubmitButton>Änderungen speichern</SubmitButton>
                </div>
              </ActionForm>
            </section>
          )}
        </div>

        <div className="adm-stack">
          {/* Status */}
          {!locked && (
            <section className="adm-card">
              <h2>Status ändern</h2>
              <p className="adm-card-desc">
                Aktuell: <strong>{STATUS_LABELS[b.status]}</strong>. Stornierte Termine geben den Zeitraum sofort wieder frei.
              </p>
              <div className="adm-stack">
                {TRANSITIONS.map((t) => {
                  const current = t.status === b.status
                  return (
                    <ActionForm
                      key={t.status}
                      action={updateStatusAction}
                      confirm={t.status === 'storniert' ? 'Termin wirklich stornieren/ablehnen? Der Zeitraum wird wieder freigegeben.' : undefined}
                    >
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="status" value={t.status} />
                      <div className="adm-actions">
                        {current ? (
                          <button type="button" className="adm-btn adm-btn--active" disabled aria-current="true">
                            {STATUS_LABELS[t.status]} (aktuell)
                          </button>
                        ) : (
                          <SubmitButton className={`adm-btn ${t.tone ?? ''}`} pendingText="…">
                            {t.label}
                          </SubmitButton>
                        )}
                        {!current && ['bestaetigt', 'storniert', 'abgeschlossen'].includes(t.status) && (
                          <label className="adm-check">
                            <input type="checkbox" name="notify" defaultChecked={t.status !== 'abgeschlossen'} /> Kunde per E-Mail informieren
                          </label>
                        )}
                      </div>
                      {!current && t.status === 'storniert' && (
                        <input name="reason" className="input" placeholder="Grund (optional, wird dem Kunden mitgeteilt)" aria-label="Grund der Stornierung" style={{ marginTop: 8, minHeight: 40 }} />
                      )}
                    </ActionForm>
                  )
                })}
              </div>
            </section>
          )}

          {/* Termin verschieben */}
          {!locked && b.status !== 'storniert' && (
            <section className="adm-card">
              <h2>Termin verschieben</h2>
              <p className="adm-card-desc">
                Überschneidungen mit anderen Terminen (inkl. {settings.rules.bufferMinutes} Min. Puffer) werden automatisch verhindert.
              </p>
              <ActionForm action={rescheduleAction} className="adm-form">
                <input type="hidden" name="id" value={b.id} />
                <div className="adm-form-grid adm-form-grid--3">
                  <div className="field">
                    <label htmlFor="date">Datum</label>
                    <input id="date" name="date" type="date" className="input" defaultValue={start.date} required />
                  </div>
                  <div className="field">
                    <label htmlFor="time">Beginn</label>
                    <input id="time" name="time" type="time" step={300} className="input" defaultValue={start.time} required />
                  </div>
                  <div className="field">
                    <label htmlFor="duration">Dauer (Min.)</label>
                    <input id="duration" name="duration" type="number" min={15} max={720} step={5} className="input" defaultValue={b.duration_minutes} required />
                  </div>
                </div>
                <label className="adm-check">
                  <input type="checkbox" name="notify" defaultChecked /> Kunde per E-Mail informieren
                </label>
                <div className="adm-actions">
                  <SubmitButton>Termin speichern</SubmitButton>
                </div>
              </ActionForm>
            </section>
          )}

          {/* Verlauf */}
          <section className="adm-card">
            <h2>Verlauf</h2>
            <ul className="adm-timeline" style={{ marginTop: 12 }}>
              {events.map((e) => (
                <li key={e.id}>
                  <time>{formatDateTime(e.created_at)}</time>
                  <span>{e.message}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Datenschutz */}
          <section className="adm-card">
            <h2>Datenschutz</h2>
            <p className="adm-card-desc">
              Anonymisieren entfernt alle personenbezogenen Daten, behält aber Leistung, Datum und Preis (z. B. für die Buchhaltung). Löschen
              ist nur für stornierte Buchungen möglich.
            </p>
            <div className="adm-actions">
              {!locked && (
                <ActionForm action={anonymizeAction} confirm="Personenbezogene Daten dieser Buchung unwiderruflich anonymisieren?">
                  <input type="hidden" name="id" value={b.id} />
                  <SubmitButton className="adm-btn" pendingText="…">
                    <Icon name="lock" size={16} /> Anonymisieren
                  </SubmitButton>
                </ActionForm>
              )}
              {b.status === 'storniert' && (
                <ActionForm action={deleteBookingAction} confirm="Buchung endgültig löschen? Dies kann nicht rückgängig gemacht werden.">
                  <input type="hidden" name="id" value={b.id} />
                  <SubmitButton className="adm-btn adm-btn--danger" pendingText="…">
                    <Icon name="trash" size={16} /> Endgültig löschen
                  </SubmitButton>
                </ActionForm>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function Field({ name, label, value, type = 'text', full }: { name: string; label: string; value: string; type?: string; full?: boolean }) {
  return (
    <div className={`field ${full ? 'full' : ''}`}>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="input" defaultValue={value} />
    </div>
  )
}
