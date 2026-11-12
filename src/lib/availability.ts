/**
 * Verfügbarkeitslogik (reine Funktionen – ohne Datenbank, vollständig testbar).
 *
 * Ein Startzeitpunkt ist nur dann buchbar, wenn
 *  1. der Wochentag ein Arbeitstag ist und die Leistung vollständig innerhalb der Arbeitszeit liegt,
 *  2. er den Mindestvorlauf einhält und nicht weiter als maxAdvanceDays in der Zukunft liegt,
 *  3. mindestens ein Team frei ist: [Start, Ende + Puffer) überschneidet sich mit keinem aktiven
 *     Termin [Start, Ende + Puffer) dieses Teams,
 *  4. sich [Start, Ende) mit keiner gesperrten Zeit (Urlaub etc.) überschneidet.
 * Regel (3) wird zusätzlich von der Datenbank per EXCLUDE-Constraint je Team erzwungen.
 */
import { addDays, diffDays, isoWeekday, minutesToTime, timeToMinutes, todayInZone, zonedToUtc, BUSINESS_TZ } from './time'

export interface Interval {
  start: number // epoch ms (inklusive)
  end: number // epoch ms (exklusive)
}

export interface BusyInterval extends Interval {
  /** Team, das in diesem Zeitraum belegt ist (Standard: 1) */
  team?: number
}

export interface WorkingDay {
  weekday: number
  isOpen: boolean
  open: string // HH:MM
  close: string // HH:MM
}

export interface SlotRules {
  bufferMinutes: number
  slotIntervalMinutes: number
  minLeadHours: number
  maxAdvanceDays: number
  /** Anzahl parallel arbeitender Teams (Standard: 1) */
  teams?: number
}

export interface DaySlotInput {
  date: string
  durationMinutes: number
  workingHours: WorkingDay[]
  rules: SlotRules
  /** Belegte Zeiten aktiver Buchungen inkl. Puffer: [starts_at, blocked_until) je Team */
  busy: BusyInterval[]
  /** Gesperrte Zeiten (Urlaub, Feiertage …) – gelten für alle Teams */
  blocked: Interval[]
  now: number
  tz?: string
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end
}

/** Erstes freies Team für den Zeitraum (inkl. Puffer) oder null. */
export function firstFreeTeam(occupied: Interval, busy: BusyInterval[], teams: number): number | null {
  for (let team = 1; team <= Math.max(1, teams); team++) {
    if (!busy.some((b) => (b.team ?? 1) === team && overlaps(occupied, b))) return team
  }
  return null
}

export interface SlotCandidate {
  time: string
  start: number
  end: number
  team: number
}

/** Liefert die buchbaren Startzeiten eines Tages inkl. zugewiesenem Team. */
export function computeDaySlotCandidates(input: DaySlotInput): SlotCandidate[] {
  const { date, durationMinutes, workingHours, rules, busy, blocked, now } = input
  const tz = input.tz ?? BUSINESS_TZ
  if (durationMinutes <= 0) return []

  const today = todayInZone(now, tz)
  const dayOffset = diffDays(today, date)
  if (dayOffset < 0 || dayOffset > rules.maxAdvanceDays) return []

  const wd = workingHours.find((w) => w.weekday === isoWeekday(date))
  if (!wd || !wd.isOpen) return []

  const openMin = timeToMinutes(wd.open)
  const closeMin = timeToMinutes(wd.close)
  const interval = Math.max(5, rules.slotIntervalMinutes)
  const earliest = now + rules.minLeadHours * 3600_000
  const bufferMs = rules.bufferMinutes * 60_000
  const durationMs = durationMinutes * 60_000
  const teams = Math.max(1, rules.teams ?? 1)

  const slots: SlotCandidate[] = []
  for (let m = openMin; m + durationMinutes <= closeMin; m += interval) {
    const time = minutesToTime(m)
    const start = zonedToUtc(date, time, tz).getTime()
    if (start < earliest) continue
    const end = start + durationMs
    if (blocked.some((b) => overlaps({ start, end }, b))) continue
    const team = firstFreeTeam({ start, end: end + bufferMs }, busy, teams)
    if (team === null) continue
    slots.push({ time, start, end, team })
  }
  return slots
}

/** Liefert die buchbaren Startzeiten ("HH:MM") für einen Tag. */
export function computeDaySlots(input: DaySlotInput): string[] {
  return computeDaySlotCandidates(input).map((s) => s.time)
}

/** Zeitfenster [Anfang, Ende) eines Kalendertages in UTC (für Datenbankabfragen). */
export function dayBoundsUtc(date: string, tz = BUSINESS_TZ): Interval {
  return {
    start: zonedToUtc(date, '00:00', tz).getTime(),
    end: zonedToUtc(addDays(date, 1), '00:00', tz).getTime(),
  }
}

/** Alle Kalendertage von `from` bis `to` (inklusive). */
export function eachDate(from: string, to: string): string[] {
  const out: string[] = []
  const n = diffDays(from, to)
  for (let i = 0; i <= n; i++) out.push(addDays(from, i))
  return out
}
