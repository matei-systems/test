/**
 * Zeitzonen-Hilfsfunktionen ohne externe Abhängigkeiten.
 * Alle Termine werden in der Geschäftszeitzone (Europe/Vienna) geplant und in UTC gespeichert.
 * Die Sommer-/Winterzeit-Umstellung wird über Intl korrekt berücksichtigt.
 */

export const BUSINESS_TZ = 'Europe/Vienna'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(:\d{2})?$/

const dtfCache = new Map<string, Intl.DateTimeFormat>()
function getDtf(tz: string): Intl.DateTimeFormat {
  let dtf = dtfCache.get(tz)
  if (!dtf) {
    dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    dtfCache.set(tz, dtf)
  }
  return dtf
}

export interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  /** YYYY-MM-DD in der Zeitzone */
  date: string
  /** HH:MM in der Zeitzone */
  time: string
  /** ISO-Wochentag 1 = Montag … 7 = Sonntag */
  weekday: number
}

export function zonedParts(instant: Date | number, tz = BUSINESS_TZ): ZonedParts {
  const parts = getDtf(tz).formatToParts(typeof instant === 'number' ? new Date(instant) : instant)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hour = get('hour')
  const minute = get('minute')
  const second = get('second')
  const date = `${year}-${pad(month)}-${pad(day)}`
  return { year, month, day, hour, minute, second, date, time: `${pad(hour)}:${pad(minute)}`, weekday: isoWeekday(date) }
}

/** Offset der Zeitzone zu UTC in Minuten zum gegebenen Zeitpunkt (z. B. +60 / +120 für Wien). */
export function tzOffsetMinutes(utcMs: number, tz = BUSINESS_TZ): number {
  const p = zonedParts(utcMs, tz)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000)
}

/** Lokales Datum + Uhrzeit (in tz) → UTC-Zeitpunkt. */
export function zonedToUtc(date: string, time: string, tz = BUSINESS_TZ): Date {
  if (!DATE_RE.test(date)) throw new Error(`Ungültiges Datum: ${date}`)
  const m = TIME_RE.exec(time)
  if (!m) throw new Error(`Ungültige Uhrzeit: ${time}`)
  const [y, mo, d] = date.split('-').map(Number)
  const guess = Date.UTC(y, mo - 1, d, Number(m[1]), Number(m[2]))
  const off1 = tzOffsetMinutes(guess - 0, tz)
  let utc = guess - off1 * 60000
  const off2 = tzOffsetMinutes(utc, tz)
  if (off2 !== off1) utc = guess - off2 * 60000
  return new Date(utc)
}

export function isValidDateString(date: string): boolean {
  if (!DATE_RE.test(date)) return false
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

export function isValidTimeString(time: string): boolean {
  return TIME_RE.test(time)
}

/** ISO-Wochentag (1 = Montag … 7 = Sonntag) eines Kalenderdatums. */
export function isoWeekday(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return wd === 0 ? 7 : wd
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

export function diffDays(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = to.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

export function todayInZone(now: Date | number = Date.now(), tz = BUSINESS_TZ): string {
  return zonedParts(now, tz).date
}

/** "08:00" oder "08:00:00" → Minuten seit Mitternacht */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
