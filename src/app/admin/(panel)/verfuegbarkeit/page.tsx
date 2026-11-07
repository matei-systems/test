import { getSettings, getWorkingHours } from '@/lib/catalog'
import { listBlockedPeriods } from '@/lib/admin-data'
import { formatDateTime, WEEKDAYS_LONG } from '@/lib/format'
import { todayInZone } from '@/lib/time'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { Icon } from '@/components/icons'
import { addBlockedPeriodAction, deleteBlockedPeriodAction, saveRulesAction, saveWorkingHoursAction } from '../../actions'

export const metadata = { title: 'Verfügbarkeit' }

export default async function AvailabilityPage() {
  const [hours, blocked, settings] = await Promise.all([getWorkingHours(), listBlockedPeriods(), getSettings()])
  const r = settings.rules
  const today = todayInZone()
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Verfügbarkeit</h1>
          <p>Arbeitszeiten, Urlaub &amp; Sperrzeiten und Buchungsregeln. Die Online-Buchung zeigt ausschließlich freie Termine.</p>
        </div>
      </header>

      <div className="adm-grid adm-grid--halves">
        <div className="adm-stack">
          <section className="adm-card">
            <h2>Arbeitszeiten</h2>
            <p className="adm-card-desc">Termine werden nur so angeboten, dass die Leistung innerhalb dieser Zeiten fertig wird.</p>
            <ActionForm action={saveWorkingHoursAction} className="adm-form">
              <div className="adm-hours">
                {hours.map((h) => (
                  <div key={h.weekday} className="adm-hours-row">
                    <label className="adm-check">
                      <input type="checkbox" name={`open_${h.weekday}`} defaultChecked={h.isOpen} /> {WEEKDAYS_LONG[h.weekday - 1]}
                    </label>
                    <input aria-label={`${WEEKDAYS_LONG[h.weekday - 1]} von`} type="time" name={`from_${h.weekday}`} className="input" defaultValue={h.open} step={900} />
                    <input aria-label={`${WEEKDAYS_LONG[h.weekday - 1]} bis`} type="time" name={`to_${h.weekday}`} className="input" defaultValue={h.close} step={900} />
                  </div>
                ))}
              </div>
              <div className="adm-actions">
                <SubmitButton>Arbeitszeiten speichern</SubmitButton>
              </div>
            </ActionForm>
          </section>

          <section className="adm-card">
            <h2>Buchungsregeln</h2>
            <p className="adm-card-desc">Gilt für alle neuen Online-Buchungen.</p>
            <ActionForm action={saveRulesAction} className="adm-form">
              <div className="adm-form-grid">
                <div className="field">
                  <label htmlFor="bufferMinutes">Pufferzeit nach jedem Termin (Min.)</label>
                  <input id="bufferMinutes" name="bufferMinutes" type="number" min={0} max={240} step={5} className="input" defaultValue={r.bufferMinutes} />
                  <span className="field-hint">Anfahrt, Auf- und Abbau zwischen zwei Terminen.</span>
                </div>
                <div className="field">
                  <label htmlFor="slotIntervalMinutes">Raster der Startzeiten (Min.)</label>
                  <select id="slotIntervalMinutes" name="slotIntervalMinutes" className="select" defaultValue={String(r.slotIntervalMinutes)}>
                    {[15, 20, 30, 45, 60].map((n) => (
                      <option key={n} value={n}>
                        {n} Minuten
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="minLeadHours">Mindestvorlauf (Stunden)</label>
                  <input id="minLeadHours" name="minLeadHours" type="number" min={0} max={336} className="input" defaultValue={r.minLeadHours} />
                </div>
                <div className="field">
                  <label htmlFor="maxAdvanceDays">Buchbar im Voraus (Tage)</label>
                  <input id="maxAdvanceDays" name="maxAdvanceDays" type="number" min={1} max={365} className="input" defaultValue={r.maxAdvanceDays} />
                </div>
              </div>
              <label className="adm-check">
                <input type="checkbox" name="autoConfirm" defaultChecked={r.autoConfirm} /> Neue Buchungen automatisch bestätigen
              </label>
              <span className="field-hint">
                Aus: Neue Buchungen erhalten den Status „Neu“ (Termin reserviert) und werden von dir manuell bestätigt.
              </span>
              <div className="adm-actions">
                <SubmitButton>Regeln speichern</SubmitButton>
              </div>
            </ActionForm>
          </section>
        </div>

        <div className="adm-stack">
          <section className="adm-card">
            <h2>Urlaub &amp; Sperrzeiten eintragen</h2>
            <p className="adm-card-desc">In gesperrten Zeiträumen sind keine Online-Buchungen möglich (z. B. Urlaub, Feiertage, private Termine).</p>
            <ActionForm action={addBlockedPeriodAction} className="adm-form" resetOnSuccess>
              <div className="adm-form-grid">
                <div className="field">
                  <label htmlFor="fromDate">Von (Datum)</label>
                  <input id="fromDate" name="fromDate" type="date" min={today} className="input" required />
                </div>
                <div className="field">
                  <label htmlFor="toDate">Bis (Datum)</label>
                  <input id="toDate" name="toDate" type="date" min={today} className="input" />
                </div>
                <div className="field">
                  <label htmlFor="fromTime">Von (Uhrzeit)</label>
                  <input id="fromTime" name="fromTime" type="time" className="input" />
                </div>
                <div className="field">
                  <label htmlFor="toTime">Bis (Uhrzeit)</label>
                  <input id="toTime" name="toTime" type="time" className="input" />
                </div>
                <div className="field full">
                  <label htmlFor="reason">Grund (intern)</label>
                  <input id="reason" name="reason" className="input" placeholder="z. B. Urlaub, Feiertag" />
                </div>
              </div>
              <label className="adm-check">
                <input type="checkbox" name="allDay" defaultChecked /> Ganztägig (Uhrzeiten werden ignoriert)
              </label>
              <div className="adm-actions">
                <SubmitButton>Sperrzeit hinzufügen</SubmitButton>
              </div>
            </ActionForm>
          </section>

          <section className="adm-card">
            <h2>Aktuelle &amp; geplante Sperrzeiten</h2>
            {blocked.length === 0 ? (
              <p className="adm-empty">Keine Sperrzeiten eingetragen.</p>
            ) : (
              <ul className="adm-stack" style={{ marginTop: 12, gap: 8 }}>
                {blocked.map((p) => (
                  <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '0.9rem' }}>
                      {formatDateTime(p.starts_at)} – {formatDateTime(p.ends_at)}
                      {p.reason && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{p.reason}</span>}
                    </span>
                    <ActionForm action={deleteBlockedPeriodAction} confirm="Sperrzeit entfernen?">
                      <input type="hidden" name="id" value={p.id} />
                      <SubmitButton className="adm-btn adm-btn--danger" pendingText="…">
                        <Icon name="trash" size={15} /> <span className="sr-only">Sperrzeit entfernen</span>
                      </SubmitButton>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
