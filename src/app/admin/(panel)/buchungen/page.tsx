import Link from 'next/link'
import { listBookings, type BookingScope } from '@/lib/admin-data'
import { formatDateShort, formatPrice, formatTime, STATUS_LABELS, EMAIL_STATUS_LABELS } from '@/lib/format'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Icon } from '@/components/icons'

export const metadata = { title: 'Buchungen' }

const SCOPES: Array<{ id: BookingScope; label: string }> = [
  { id: 'kommend', label: 'Anstehend' },
  { id: 'heute', label: 'Heute' },
  { id: 'woche', label: '7 Tage' },
  { id: 'vergangen', label: 'Vergangen' },
  { id: 'alle', label: 'Alle' },
]

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const scope = (SCOPES.find((s) => s.id === sp.zeitraum)?.id ?? (sp.status ? 'alle' : 'kommend')) as BookingScope
  const status = sp.status && STATUS_LABELS[sp.status] ? sp.status : undefined
  const q = sp.q?.slice(0, 80)
  const bookings = await listBookings({ scope, status, q })

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const merged = { zeitraum: scope, status, q, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    return `/admin/buchungen?${p}`
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Buchungen</h1>
          <p>{bookings.length} Buchung(en) gefunden.</p>
        </div>
      </header>

      {sp.geloescht && <p className="adm-msg adm-msg--ok" style={{ marginBottom: 16 }}>Buchung wurde gelöscht.</p>}

      <div className="adm-chips" aria-label="Zeitraum">
        {SCOPES.map((s) => (
          <Link key={s.id} href={link({ zeitraum: s.id })} className="adm-chip" aria-current={s.id === scope ? 'true' : undefined}>
            {s.label}
          </Link>
        ))}
      </div>

      <form className="adm-filters" action="/admin/buchungen" method="get">
        <input type="hidden" name="zeitraum" value={scope} />
        <label className="sr-only" htmlFor="q">
          Suche
        </label>
        <input id="q" name="q" className="input" placeholder="Suche: Name, E-Mail, Telefon, Buchungsnr., Kennzeichen …" defaultValue={q} />
        <label className="sr-only" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" className="select" defaultValue={status ?? ''}>
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button type="submit" className="adm-btn">
          <Icon name="list" size={16} /> Filtern
        </button>
        {(q || status) && (
          <Link href={`/admin/buchungen?zeitraum=${scope}`} className="adm-btn">
            Zurücksetzen
          </Link>
        )}
      </form>

      {bookings.length === 0 ? (
        <div className="adm-card adm-empty">Keine Buchungen für diese Auswahl.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--cards">
            <thead>
              <tr>
                <th>Termin</th>
                <th>Kunde</th>
                <th>Leistung</th>
                <th>Ort</th>
                <th>Status</th>
                <th className="num">Preis</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td data-label="Termin">
                    <Link href={`/admin/buchungen/${b.id}`} className="row-link">
                      {formatDateShort(b.starts_at)}
                    </Link>
                    <span className="sub">
                      {formatTime(b.starts_at)}–{formatTime(b.ends_at)} · {b.reference}
                    </span>
                  </td>
                  <td data-label="Kunde">
                    <Link href={`/admin/buchungen/${b.id}`} className="row-link">
                      {b.first_name} {b.last_name}
                    </Link>
                    <span className="sub">{b.phone}</span>
                  </td>
                  <td data-label="Leistung">
                    {b.service_name}
                    <span className="sub">
                      {b.vehicle_category_name}
                      {b.addons?.length ? ` · +${b.addons.length} Extra` : ''}
                    </span>
                  </td>
                  <td data-label="Ort">
                    {b.postal_code} {b.city}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={b.status} />
                    {b.customer_email_status !== 'gesendet' && (
                      <span className="sub">E-Mail: {EMAIL_STATUS_LABELS[b.customer_email_status] ?? b.customer_email_status}</span>
                    )}
                  </td>
                  <td data-label="Preis" className="num">
                    {formatPrice(b.total_price_cents, { from: b.price_is_from })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
