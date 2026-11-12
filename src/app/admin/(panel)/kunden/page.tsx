import Link from 'next/link'
import { listCustomers } from '@/lib/admin-data'
import { formatDateShort, formatPrice, telHref } from '@/lib/format'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Kunden' }

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin()
  const { q } = await searchParams
  const customers = await listCustomers(q?.slice(0, 80))
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Kunden</h1>
          <p>Aus den Buchungen zusammengefasst (nach E-Mail-Adresse). Anonymisierte Buchungen sind ausgeblendet.</p>
        </div>
      </header>
      <form className="adm-filters" method="get" action="/admin/kunden">
        <label htmlFor="q" className="sr-only">
          Suche
        </label>
        <input id="q" name="q" className="input" placeholder="Name, E-Mail oder Telefon …" defaultValue={q} />
        <button type="submit" className="adm-btn">
          Suchen
        </button>
      </form>
      {customers.length === 0 ? (
        <div className="adm-card adm-empty">Noch keine Kunden.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--cards">
            <thead>
              <tr>
                <th>Kunde</th>
                <th>Kontakt</th>
                <th>Ort</th>
                <th className="num">Buchungen</th>
                <th className="num">Umsatz (abgeschl.)</th>
                <th>Letzter Termin</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td data-label="Kunde">
                    <Link href={`/admin/buchungen?zeitraum=alle&q=${encodeURIComponent(c.email)}`} className="row-link">
                      {c.name}
                    </Link>
                    <span className="sub">
                      <Link href={`/admin/buchungen?zeitraum=alle&q=${encodeURIComponent(c.email)}`}>Buchungshistorie ansehen</Link>
                      {c.marketing ? ' · Angebote per E-Mail erlaubt' : ''}
                    </span>
                  </td>
                  <td data-label="Kontakt">
                    <a href={`mailto:${c.email}`}>{c.email}</a>
                    <span className="sub">
                      <a href={telHref(c.phone)}>{c.phone}</a>
                    </span>
                  </td>
                  <td data-label="Ort">{c.city}</td>
                  <td data-label="Buchungen" className="num">
                    {Number(c.active_bookings)} / {Number(c.bookings)}
                  </td>
                  <td data-label="Umsatz" className="num">
                    {formatPrice(c.total_cents === null ? 0 : Number(c.total_cents))}
                  </td>
                  <td data-label="Letzter Termin">
                    <Link href={`/admin/buchungen/${c.last_id}`}>{formatDateShort(c.last_booking)}</Link>
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
