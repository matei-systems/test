import Link from 'next/link'
import { statistics, type MonthStat } from '@/lib/admin-data'
import { formatEuro } from '@/lib/format'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Statistiken' }

const PERIODS = [6, 12, 24]
const monthShort = new Intl.DateTimeFormat('de-AT', { timeZone: 'UTC', month: 'short' })
const monthLong = new Intl.DateTimeFormat('de-AT', { timeZone: 'UTC', month: 'long', year: 'numeric' })
const monthDate = (key: string) => new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1))

/** Runde Achsen-Obergrenze (1 / 2 / 2,5 / 5 × 10ⁿ) und vier gleichmäßige Schritte. */
function niceScale(max: number, minTop: number): { top: number; ticks: number[] } {
  const target = Math.max(max, minTop)
  const pow = 10 ** Math.floor(Math.log10(target))
  const top = [1, 2, 2.5, 4, 5, 10].map((m) => m * pow).find((v) => v >= target) ?? 10 * pow
  return { top, ticks: [0, 1, 2, 3, 4].map((i) => (top / 4) * i) }
}

interface Column {
  key: string
  label: string
  title: string
  /** Segmente von unten nach oben */
  segments: Array<{ value: number; className: string; label: string; text: string }>
  total: number
  totalText: string
}

/** Säulendiagramm (eine Achse, dünne Säulen, Werte per Hover/Fokus und in der Tabelle). */
function ColumnChart({ columns, top, ticks, formatTick, label }: { columns: Column[]; top: number; ticks: number[]; formatTick: (v: number) => string; label: string }) {
  const peak = Math.max(...columns.map((c) => c.total))
  const peakIndex = peak > 0 ? columns.findIndex((c) => c.total === peak) : -1
  const lastIndex = columns.length - 1
  return (
    <div className="adm-chart" role="group" aria-label={label}>
      <div className="adm-chart-axis" aria-hidden="true">
        {[...ticks].reverse().map((t) => (
          <span key={t}>{formatTick(t)}</span>
        ))}
      </div>
      <div className="adm-chart-plot">
        <div className="adm-chart-grid" aria-hidden="true">
          {ticks.map((t) => (
            <i key={t} />
          ))}
        </div>
        <ol className="adm-cols">
          {columns.map((c, i) => (
            <li key={c.key} className={i < 2 ? 'is-start' : i > columns.length - 3 ? 'is-end' : ''}>
              <div className="adm-col" role="img" tabIndex={0} aria-label={`${c.title}: ${c.segments.map((s) => `${s.label} ${s.text}`).join(', ')}`}>
                {/* Wert nur an der Spitze und am aktuellen Monat – nicht auf jeder Säule */}
                {c.total > 0 && (i === peakIndex || i === lastIndex) && <span className="adm-col-value">{c.totalText}</span>}
                <span className="adm-col-stack" style={{ height: `${(c.total / top) * 100}%` }}>
                  {[...c.segments]
                    .reverse()
                    .filter((s) => s.value > 0)
                    .map((s) => (
                      <i key={s.label} className={s.className} style={{ flexGrow: s.value }} />
                    ))}
                </span>
                <span className="adm-tip" aria-hidden="true">
                  <strong>{c.title}</strong>
                  {c.segments.map((s) => (
                    <span key={s.label}>
                      <i className={s.className} /> {s.label} <b>{s.text}</b>
                    </span>
                  ))}
                </span>
              </div>
              <span className="adm-col-label" aria-hidden="true">
                {c.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/** Rangliste mit Balken (ein Farbton, Wert am Ende jeder Zeile). */
function Ranking({ items, unit, empty }: { items: Array<{ name: string; count: number; sub?: string }>; unit: string; empty: string }) {
  if (items.length === 0) return <p className="adm-empty">{empty}</p>
  const max = Math.max(...items.map((i) => i.count))
  return (
    <ol className="adm-rank">
      {items.map((i) => (
        <li key={i.name}>
          <span className="adm-rank-name">{i.name}</span>
          <span className="adm-rank-figure">
            {i.count}
            <small> {unit}</small>
            {i.sub && <small> · {i.sub}</small>}
          </span>
          <span className="adm-rank-track" aria-hidden="true">
            <i style={{ width: `${Math.max(2, (i.count / max) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ol>
  )
}

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ monate?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const months = PERIODS.includes(Number(sp.monate)) ? Number(sp.monate) : 12
  const stats = await statistics(months)
  const { totals, series } = stats

  const label = (s: MonthStat, i: number) => {
    const d = monthDate(s.month)
    const short = monthShort.format(d).replace('.', '')
    return d.getUTCMonth() === 0 || i === 0 ? `${short} ${String(d.getUTCFullYear()).slice(2)}` : short
  }

  const bookingScale = niceScale(Math.max(...series.map((s) => s.bookings)), 4)
  const bookingColumns: Column[] = series.map((s, i) => ({
    key: s.month,
    label: label(s, i),
    title: monthLong.format(monthDate(s.month)),
    segments: [{ value: s.bookings, className: 'adm-seg-1', label: 'Buchungen', text: String(s.bookings) }],
    total: s.bookings,
    totalText: String(s.bookings),
  }))

  const revenueScale = niceScale(Math.max(...series.map((s) => s.revenueCents + s.plannedCents)) / 100, 400)
  const revenueColumns: Column[] = series.map((s, i) => ({
    key: s.month,
    label: label(s, i),
    title: monthLong.format(monthDate(s.month)),
    segments: [
      { value: s.revenueCents, className: 'adm-seg-1', label: 'Abgeschlossen', text: formatEuro(s.revenueCents) },
      { value: s.plannedCents, className: 'adm-seg-2', label: 'Offen/geplant', text: formatEuro(s.plannedCents) },
    ],
    total: (s.revenueCents + s.plannedCents) / 100,
    totalText: formatEuro(s.revenueCents + s.plannedCents),
  }))

  const addonShare = totals.bookings > 0 ? Math.round((totals.withAddons / totals.bookings) * 100) : null

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Statistiken</h1>
          <p>Buchungen, Umsatz und beliebteste Leistungen. Grundlage sind die Termine im gewählten Zeitraum (nach Termindatum, ohne Stornos).</p>
        </div>
      </header>

      <div className="adm-chips" role="group" aria-label="Zeitraum" style={{ marginBottom: 16 }}>
        {PERIODS.map((p) => (
          <Link key={p} href={`/admin/statistiken?monate=${p}`} className="adm-chip" aria-current={p === months ? 'true' : undefined}>
            {p} Monate
          </Link>
        ))}
      </div>

      <div className="adm-kpis">
        <div className="adm-kpi adm-kpi--accent">
          <span>Buchungen</span>
          <strong>{totals.bookings}</strong>
        </div>
        <div className="adm-kpi">
          <span>Umsatz (abgeschlossene Aufträge)</span>
          <strong>{formatEuro(totals.revenueCents)}</strong>
        </div>
        <div className="adm-kpi">
          <span>Ø Auftragswert</span>
          <strong>{totals.avgOrderCents === null ? '–' : formatEuro(totals.avgOrderCents)}</strong>
        </div>
        <div className="adm-kpi">
          <span>Buchungen mit Zusatzleistung</span>
          <strong>{addonShare === null ? '–' : `${addonShare} %`}</strong>
        </div>
      </div>

      <div className="adm-grid adm-grid--halves">
        <section className="adm-card">
          <h2>Buchungen pro Monat</h2>
          <p className="adm-card-desc">Anzahl der Termine je Monat (ohne stornierte).</p>
          <ColumnChart columns={bookingColumns} {...bookingScale} formatTick={(v) => String(v)} label={`Buchungen pro Monat, letzte ${months} Monate. Details in der Tabelle darunter.`} />
        </section>

        <section className="adm-card">
          <h2>Umsatz pro Monat</h2>
          <p className="adm-card-desc">Abgeschlossene Aufträge und noch offene Termine (Auftragswert laut Buchung).</p>
          <ul className="adm-legend">
            <li>
              <i className="adm-seg-1" /> Abgeschlossen
            </li>
            <li>
              <i className="adm-seg-2" /> Offen / geplant
            </li>
          </ul>
          <ColumnChart
            columns={revenueColumns}
            {...revenueScale}
            formatTick={(v) => `${v.toLocaleString('de-AT')} €`}
            label={`Umsatz pro Monat, letzte ${months} Monate: abgeschlossen und offen. Details in der Tabelle darunter.`}
          />
        </section>
      </div>

      <section className="adm-card" style={{ marginTop: 16 }}>
        <details>
          <summary style={{ cursor: 'pointer' }}>Monatswerte als Tabelle anzeigen</summary>
          <div className="adm-table-wrap" style={{ marginTop: 12 }} tabIndex={0} role="region" aria-label="Monatswerte">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Monat</th>
                  <th className="num">Buchungen</th>
                  <th className="num">davon abgeschlossen</th>
                  <th className="num">Storniert</th>
                  <th className="num">Umsatz abgeschlossen</th>
                  <th className="num">Offen / geplant</th>
                </tr>
              </thead>
              <tbody>
                {[...series].reverse().map((s) => (
                  <tr key={s.month}>
                    <td>{monthLong.format(monthDate(s.month))}</td>
                    <td className="num">{s.bookings}</td>
                    <td className="num">{s.completed}</td>
                    <td className="num">{s.cancelled}</td>
                    <td className="num">{formatEuro(s.revenueCents)}</td>
                    <td className="num">{formatEuro(s.plannedCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div className="adm-grid adm-grid--halves" style={{ marginTop: 16 }}>
        <section className="adm-card">
          <h2>Beliebteste Leistungen</h2>
          <p className="adm-card-desc">Nach Anzahl der Buchungen, mit Auftragswert.</p>
          <Ranking items={stats.services.map((s) => ({ name: s.name, count: s.count, sub: formatEuro(s.revenueCents) }))} unit="×" empty="Noch keine Buchungen im Zeitraum." />
        </section>
        <section className="adm-card">
          <h2>Häufig gebuchte Zusatzleistungen</h2>
          <p className="adm-card-desc">Wie oft eine Zusatzleistung mitgebucht wurde.</p>
          <Ranking items={stats.addons} unit="×" empty="Noch keine Zusatzleistungen gebucht." />
        </section>
        <section className="adm-card">
          <h2>Fahrzeugkategorien</h2>
          <p className="adm-card-desc">Welche Fahrzeuggrößen gebucht werden.</p>
          <Ranking items={stats.vehicles} unit="×" empty="Noch keine Buchungen im Zeitraum." />
        </section>
        <section className="adm-card">
          <h2>Aktionen</h2>
          <p className="adm-card-desc">Gewährter Preisvorteil durch Einführungspreise und Rabatte im Zeitraum.</p>
          <div className="adm-kpi" style={{ marginTop: 12 }}>
            <span>Rabatte gesamt</span>
            <strong>{formatEuro(totals.discountCents)}</strong>
          </div>
          <div className="adm-actions" style={{ marginTop: 12 }}>
            <Link href="/admin/aktionen" className="adm-btn">
              Aktionen verwalten
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
