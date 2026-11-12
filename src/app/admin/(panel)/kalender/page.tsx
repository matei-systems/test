import Link from 'next/link'
import { calendarData, type BookingRow } from '@/lib/admin-data'
import { getSettings, getWorkingHours } from '@/lib/catalog'
import { computeDaySlotCandidates, dayBoundsUtc } from '@/lib/availability'
import { addDays, isoWeekday, isValidDateString, minutesToTime, timeToMinutes, todayInZone, zonedToUtc } from '@/lib/time'
import { formatCalendarDate, formatTime, WEEKDAYS_SHORT } from '@/lib/format'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Icon } from '@/components/icons'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Kalender' }

type View = 'tag' | 'woche' | 'monat'
type Blocked = { id: string; starts_at: Date; ends_at: Date; reason: string }

const VIEWS: Array<{ key: View; label: string }> = [
  { key: 'tag', label: 'Tag' },
  { key: 'woche', label: 'Woche' },
  { key: 'monat', label: 'Monat' },
]

const monthTitle = new Intl.DateTimeFormat('de-AT', { timeZone: 'UTC', month: 'long', year: 'numeric' })
const dayShort = new Intl.DateTimeFormat('de-AT', { timeZone: 'UTC', day: 'numeric', month: 'short' })
const asUtc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12))
}
const mondayOf = (date: string) => addDays(date, 1 - isoWeekday(date))

function shiftMonth(date: string, delta: number): string {
  const [y, m] = date.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function blockedLabel(p: Blocked, date: string): string {
  const b = dayBoundsUtc(date)
  const start = new Date(p.starts_at).getTime()
  const end = new Date(p.ends_at).getTime()
  const range = start <= b.start && end >= b.end ? 'ganztägig' : `${start <= b.start ? '00:00' : formatTime(p.starts_at)}–${end >= b.end ? '24:00' : formatTime(p.ends_at)}`
  return `${range}${p.reason ? ` · ${p.reason}` : ''}`
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ ansicht?: string; datum?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const view: View = sp.ansicht === 'tag' || sp.ansicht === 'monat' ? sp.ansicht : 'woche'
  const today = todayInZone()
  const date = sp.datum && isValidDateString(sp.datum) ? sp.datum : today

  // Angezeigter Zeitraum [from, to]
  let from: string
  let to: string
  let title: string
  let prev: string
  let next: string
  if (view === 'tag') {
    from = to = date
    title = formatCalendarDate(date)
    prev = addDays(date, -1)
    next = addDays(date, 1)
  } else if (view === 'woche') {
    from = mondayOf(date)
    to = addDays(from, 6)
    title = `${dayShort.format(asUtc(from))} – ${dayShort.format(asUtc(to))} ${to.slice(0, 4)}`
    prev = addDays(from, -7)
    next = addDays(from, 7)
  } else {
    const first = `${date.slice(0, 7)}-01`
    const lastOfMonth = addDays(shiftMonth(first, 1), -1)
    from = mondayOf(first)
    to = addDays(mondayOf(lastOfMonth), 6)
    title = monthTitle.format(asUtc(first))
    prev = shiftMonth(first, -1)
    next = shiftMonth(first, 1)
  }

  const [data, hours, settings] = await Promise.all([
    calendarData(zonedToUtc(from, '00:00'), zonedToUtc(addDays(to, 1), '00:00')),
    getWorkingHours(),
    getSettings(),
  ])
  const teams = settings.rules.teams

  const days: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)

  const info = (d: string) => {
    const b = dayBoundsUtc(d)
    const wd = hours.find((h) => h.weekday === isoWeekday(d))
    return {
      bookings: data.bookings.filter((bk) => {
        const t = new Date(bk.starts_at).getTime()
        return t >= b.start && t < b.end
      }),
      blocked: data.blocked.filter((p) => new Date(p.starts_at).getTime() < b.end && new Date(p.ends_at).getTime() > b.start),
      open: wd?.isOpen ? wd : null,
    }
  }
  const href = (v: View, d: string) => `/admin/kalender?ansicht=${v}&datum=${d}`
  const total = data.bookings.filter((bk) => {
    const t = new Date(bk.starts_at).getTime()
    return t >= zonedToUtc(from, '00:00').getTime()
  }).length

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Kalender</h1>
          <p>
            Alle aktiven Termine, Sperrzeiten und Ruhetage. {total} Termin{total === 1 ? '' : 'e'} im angezeigten Zeitraum
            {teams > 1 ? ` · ${teams} Teams` : ''}.
          </p>
        </div>
        <Link href="/admin/verfuegbarkeit" className="adm-btn">
          <Icon name="lock" size={15} /> Urlaub / Sperrzeit eintragen
        </Link>
      </header>

      <div className="adm-cal-bar">
        <div className="adm-chips" role="group" aria-label="Ansicht" style={{ marginBottom: 0 }}>
          {VIEWS.map((v) => (
            <Link key={v.key} href={href(v.key, date)} className="adm-chip" aria-current={v.key === view ? 'true' : undefined}>
              {v.label}
            </Link>
          ))}
        </div>
        <div className="adm-cal-nav">
          <Link href={href(view, prev)} className="adm-btn" aria-label="Zurück">
            <Icon name="chevron-left" size={16} />
          </Link>
          <h2 aria-live="polite">{title}</h2>
          <Link href={href(view, next)} className="adm-btn" aria-label="Weiter">
            <Icon name="chevron-right" size={16} />
          </Link>
          <Link href={href(view, today)} className="adm-btn">
            Heute
          </Link>
        </div>
      </div>

      {view === 'monat' && (
        <section className="adm-card adm-cal-month" aria-label={`Monatsansicht ${title}`}>
          <div className="adm-cal-weekdays" aria-hidden="true">
            {WEEKDAYS_SHORT.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="adm-cal-grid">
            {days.map((d) => {
              const i = info(d)
              const outside = d.slice(0, 7) !== date.slice(0, 7)
              return (
                <Link
                  key={d}
                  href={href('tag', d)}
                  className={`adm-cal-cell ${outside ? 'is-outside' : ''} ${d === today ? 'is-today' : ''} ${!i.open ? 'is-closed' : ''} ${i.blocked.length ? 'is-blocked' : ''}`}
                >
                  <span className="sr-only">
                    {formatCalendarDate(d)}: {i.bookings.length} Termin{i.bookings.length === 1 ? '' : 'e'}
                    {i.blocked.length ? ', Sperrzeit' : ''}
                    {!i.open ? ', Ruhetag' : ''}.
                  </span>
                  <span className="adm-cal-date" aria-hidden="true">
                    {Number(d.slice(8))}
                  </span>
                  {i.blocked.length > 0 && (
                    <span className="adm-cal-tag adm-cal-tag--blocked">
                      <Icon name="lock" size={11} /> <span>gesperrt</span>
                    </span>
                  )}
                  {i.bookings.slice(0, 3).map((bk) => (
                    <span key={bk.id} className={`adm-cal-tag adm-cal-tag--${bk.status}`}>
                      <b>{formatTime(bk.starts_at)}</b> <span>{bk.last_name || bk.first_name}</span>
                    </span>
                  ))}
                  {i.bookings.length > 3 && <span className="adm-cal-more">+{i.bookings.length - 3} weitere</span>}
                  {i.bookings.length > 0 && (
                    <span className="adm-cal-count" aria-hidden="true">
                      {i.bookings.length}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          <p className="adm-cal-legend">
            <span className="adm-cal-tag adm-cal-tag--neu">neu</span>
            <span className="adm-cal-tag adm-cal-tag--bestaetigt">bestätigt</span>
            <span className="adm-cal-tag adm-cal-tag--in_bearbeitung">in Bearbeitung</span>
            <span className="adm-cal-tag adm-cal-tag--abgeschlossen">abgeschlossen</span>
            <span className="adm-cal-tag adm-cal-tag--blocked">gesperrt</span>
            <span>schraffiert = Ruhetag</span>
          </p>
        </section>
      )}

      {view === 'woche' && (
        <div className="adm-cal-week">
          {days.map((d) => {
            const i = info(d)
            return (
              <section key={d} className={`adm-card adm-cal-day ${d === today ? 'is-today' : ''}`} aria-label={formatCalendarDate(d)}>
                <header>
                  <Link href={href('tag', d)}>
                    <span>{WEEKDAYS_SHORT[isoWeekday(d) - 1]}</span>
                    <strong>{Number(d.slice(8))}</strong>
                  </Link>
                  <small>{i.open ? `${i.open.open}–${i.open.close}` : 'Ruhetag'}</small>
                </header>
                {i.blocked.map((p) => (
                  <p key={p.id} className="adm-cal-tag adm-cal-tag--blocked adm-cal-tag--wide">
                    <Icon name="lock" size={12} /> {blockedLabel(p, d)}
                  </p>
                ))}
                {i.bookings.length === 0 && i.blocked.length === 0 && <p className="adm-cal-empty">{i.open ? 'frei' : '–'}</p>}
                {i.bookings.map((bk) => (
                  <EventCard key={bk.id} booking={bk} teams={teams} compact />
                ))}
              </section>
            )
          })}
        </div>
      )}

      {view === 'tag' && <DayView date={date} today={today} info={info(date)} teams={teams} rules={settings.rules} hours={hours} blockedAll={data.blocked} bookingsAll={data.bookings} />}
    </>
  )
}

function EventCard({ booking: bk, teams, compact = false }: { booking: BookingRow; teams: number; compact?: boolean }) {
  return (
    <Link href={`/admin/buchungen/${bk.id}`} className={`adm-cal-event adm-cal-event--${bk.status}`}>
      <time>
        {formatTime(bk.starts_at)}–{formatTime(bk.ends_at)}
      </time>
      <strong>
        {bk.first_name} {bk.last_name}
      </strong>
      <span>
        {bk.kind === 'anfrage' ? 'Anfrage: ' : ''}
        {bk.service_name} · {bk.vehicle_category_name}
      </span>
      <span>
        {compact ? `${bk.postal_code} ${bk.city}` : `${bk.street} ${bk.house_number}, ${bk.postal_code} ${bk.city}`}
        {teams > 1 ? ` · Team ${bk.team}` : ''}
      </span>
      {!compact && <StatusBadge status={bk.status} />}
    </Link>
  )
}

function DayView({
  date,
  today,
  info,
  teams,
  rules,
  hours,
  blockedAll,
  bookingsAll,
}: {
  date: string
  today: string
  info: { bookings: BookingRow[]; blocked: Blocked[]; open: { open: string; close: string } | null }
  teams: number
  rules: { bufferMinutes: number; slotIntervalMinutes: number; minLeadHours: number; maxAdvanceDays: number; teams: number }
  hours: Array<{ weekday: number; isOpen: boolean; open: string; close: string }>
  blockedAll: Blocked[]
  bookingsAll: BookingRow[]
}) {
  // Freie Zeitfenster: Startzeiten im Raster, zu denen mindestens ein Team frei ist (ohne Mindestvorlauf)
  const step = rules.slotIntervalMinutes
  const candidates =
    date >= today
      ? computeDaySlotCandidates({
          date,
          durationMinutes: step,
          workingHours: hours,
          rules: { ...rules, minLeadHours: 0, maxAdvanceDays: 3650 },
          busy: bookingsAll.map((b) => ({ start: new Date(b.starts_at).getTime(), end: new Date(b.blocked_until).getTime(), team: Number(b.team) })),
          blocked: blockedAll.map((p) => ({ start: new Date(p.starts_at).getTime(), end: new Date(p.ends_at).getTime() })),
          now: Date.now(),
        })
      : []
  const windows: Array<{ from: string; to: string }> = []
  for (const c of candidates) {
    const start = timeToMinutes(c.time)
    const last = windows[windows.length - 1]
    if (last && timeToMinutes(last.to) === start) last.to = minutesToTime(start + step)
    else windows.push({ from: c.time, to: minutesToTime(start + step) })
  }

  return (
    <div className="adm-grid adm-grid--2">
      <section className="adm-card">
        <h2>Termine</h2>
        <p className="adm-card-desc">
          {info.open ? `Arbeitszeit ${info.open.open}–${info.open.close} Uhr` : 'Ruhetag (keine Online-Buchungen)'}
          {info.bookings.length > 0 ? ` · ${info.bookings.length} Termin${info.bookings.length === 1 ? '' : 'e'}` : ''}
        </p>
        {info.bookings.length === 0 ? (
          <p className="adm-empty">Keine Termine an diesem Tag.</p>
        ) : (
          <div className="adm-stack" style={{ gap: 8 }}>
            {info.bookings.map((bk) => (
              <EventCard key={bk.id} booking={bk} teams={teams} />
            ))}
          </div>
        )}
      </section>
      <div className="adm-stack">
        <section className="adm-card">
          <h2>Freie Zeitfenster</h2>
          <p className="adm-card-desc">
            Zeiten, in denen {teams > 1 ? 'mindestens ein Team' : 'noch'} verfügbar ist (inkl. {rules.bufferMinutes} Min. Puffer zwischen Terminen).
          </p>
          {date < today ? (
            <p className="adm-empty">Dieser Tag liegt in der Vergangenheit.</p>
          ) : windows.length === 0 ? (
            <p className="adm-empty">Keine freien Zeiten.</p>
          ) : (
            <ul className="adm-cal-free">
              {windows.map((w) => (
                <li key={w.from}>
                  <Icon name="check" size={14} /> {w.from}–{w.to} Uhr
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="adm-card">
          <h2>Sperrzeiten</h2>
          {info.blocked.length === 0 ? (
            <p className="adm-empty">Keine Sperrzeit an diesem Tag.</p>
          ) : (
            <ul className="adm-cal-free">
              {info.blocked.map((p) => (
                <li key={p.id}>
                  <Icon name="lock" size={14} /> {blockedLabel(p, date)}
                </li>
              ))}
            </ul>
          )}
          <div className="adm-actions" style={{ marginTop: 12 }}>
            <Link href="/admin/verfuegbarkeit" className="adm-btn">
              Sperrzeiten verwalten
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
