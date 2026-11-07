import { describe, expect, it } from 'vitest'
import { computeDaySlots, type WorkingDay } from '@/lib/availability'
import { zonedToUtc, zonedParts, addDays, isoWeekday, todayInZone } from '@/lib/time'

const HOURS: WorkingDay[] = [
  { weekday: 1, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 2, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 3, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 4, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 5, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 6, isOpen: true, open: '09:00', close: '15:00' },
  { weekday: 7, isOpen: false, open: '09:00', close: '15:00' },
]
const RULES = { bufferMinutes: 30, slotIntervalMinutes: 30, minLeadHours: 24, maxAdvanceDays: 60 }

// "Jetzt" = Montag, 9. November 2026, 10:00 Wiener Zeit
const NOW = zonedToUtc('2026-11-09', '10:00').getTime()
const at = (date: string, time: string) => zonedToUtc(date, time).getTime()

describe('Zeitzonen', () => {
  it('rechnet Wiener Winterzeit korrekt (UTC+1)', () => {
    expect(zonedToUtc('2026-11-09', '10:00').toISOString()).toBe('2026-11-09T09:00:00.000Z')
  })
  it('rechnet Wiener Sommerzeit korrekt (UTC+2)', () => {
    expect(zonedToUtc('2026-07-01', '10:00').toISOString()).toBe('2026-07-01T08:00:00.000Z')
  })
  it('liefert lokale Bestandteile zurück', () => {
    const p = zonedParts(new Date('2026-03-29T08:30:00Z'))
    expect(p.date).toBe('2026-03-29')
    expect(p.time).toBe('10:30') // Tag der Zeitumstellung
    expect(p.weekday).toBe(7)
  })
  it('Kalenderhilfen', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(isoWeekday('2026-11-09')).toBe(1)
    expect(todayInZone(new Date('2026-11-08T23:30:00Z'))).toBe('2026-11-09')
  })
})

describe('computeDaySlots', () => {
  const base = { workingHours: HOURS, rules: RULES, busy: [], blocked: [], now: NOW }

  it('bietet Startzeiten im Raster an, sodass die Leistung vor Feierabend endet', () => {
    const slots = computeDaySlots({ ...base, date: '2026-11-11', durationMinutes: 150 })
    expect(slots[0]).toBe('08:00')
    expect(slots.at(-1)).toBe('15:30') // 15:30 + 2,5 h = 18:00
    expect(slots).not.toContain('16:00')
  })

  it('zeigt an Ruhetagen keine Termine', () => {
    expect(computeDaySlots({ ...base, date: '2026-11-15', durationMinutes: 90 })).toEqual([]) // Sonntag
  })

  it('beachtet kürzere Samstags-Öffnungszeiten', () => {
    const slots = computeDaySlots({ ...base, date: '2026-11-14', durationMinutes: 240 })
    expect(slots[0]).toBe('09:00')
    expect(slots.at(-1)).toBe('11:00')
  })

  it('beachtet den Mindestvorlauf (24 h)', () => {
    const slots = computeDaySlots({ ...base, date: '2026-11-10', durationMinutes: 90 })
    expect(slots[0]).toBe('10:00')
    expect(computeDaySlots({ ...base, date: '2026-11-09', durationMinutes: 90 })).toEqual([])
  })

  it('beachtet den maximalen Buchungshorizont', () => {
    expect(computeDaySlots({ ...base, date: addDays('2026-11-09', 61), durationMinutes: 90 })).toEqual([])
    expect(computeDaySlots({ ...base, date: addDays('2026-11-09', 59), durationMinutes: 90 }).length).toBeGreaterThan(0)
  })

  it('blockiert bestehende Termine inklusive Pufferzeit – in beide Richtungen', () => {
    // Bestehender Termin 10:00–12:00, Puffer bis 12:30
    const busy = [{ start: at('2026-11-11', '10:00'), end: at('2026-11-11', '12:30') }]
    const slots = computeDaySlots({ ...base, busy, date: '2026-11-11', durationMinutes: 90 })
    // Neuer Termin (1,5 h + 30 min Puffer) muss vor 10:00 inkl. Puffer enden → spätestens 08:00
    expect(slots).toContain('08:00')
    expect(slots).not.toContain('08:30')
    expect(slots).not.toContain('11:00')
    expect(slots).not.toContain('12:00')
    // frühestens nach Ende inkl. Puffer
    expect(slots).toContain('12:30')
  })

  it('blockiert Urlaub / gesperrte Zeiten', () => {
    const blocked = [{ start: at('2026-11-12', '00:00'), end: at('2026-11-13', '00:00') }]
    expect(computeDaySlots({ ...base, blocked, date: '2026-11-12', durationMinutes: 90 })).toEqual([])
    expect(computeDaySlots({ ...base, blocked, date: '2026-11-13', durationMinutes: 90 }).length).toBeGreaterThan(0)
  })

  it('blockiert teilweise gesperrte Zeiten', () => {
    const blocked = [{ start: at('2026-11-11', '13:00'), end: at('2026-11-11', '14:00') }]
    const slots = computeDaySlots({ ...base, blocked, date: '2026-11-11', durationMinutes: 60 })
    expect(slots).toContain('12:00')
    expect(slots).not.toContain('12:30')
    expect(slots).not.toContain('13:30')
    expect(slots).toContain('14:00')
  })

  it('liefert keine Termine, wenn die Leistung länger als der Arbeitstag ist', () => {
    expect(computeDaySlots({ ...base, date: '2026-11-11', durationMinutes: 11 * 60 })).toEqual([])
  })
})
