/**
 * Integrationstest gegen eine echte Datenbank:
 *  - PGlite (immer, im Arbeitsspeicher-Verzeichnis)
 *  - PostgreSQL, falls TEST_DATABASE_URL gesetzt ist
 * Prüft Migration, Seed, Buchung, Doppelbuchungsschutz (auch parallel) und Sperrzeiten.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { addDays, isoWeekday, todayInZone } from '@/lib/time'

vi.mock('@/lib/email', async () => {
  const actual = await vi.importActual<typeof import('@/lib/email')>('@/lib/email')
  return { ...actual, sendMail: vi.fn(async () => ({ status: 'nicht_konfiguriert' })) }
})

const targets: Array<{ name: string; env: Record<string, string | undefined> }> = [
  { name: 'PGlite', env: { DATABASE_URL: undefined, PGLITE_DIR: mkdtempSync(path.join(tmpdir(), 'gm-pglite-')) } },
]
if (process.env.TEST_DATABASE_URL) targets.push({ name: 'PostgreSQL', env: { DATABASE_URL: process.env.TEST_DATABASE_URL } })

for (const target of targets) {
  describe(`Datenbank (${target.name})`, () => {
    let mod: {
      bookings: typeof import('@/lib/bookings')
      db: typeof import('@/lib/db')
      catalog: typeof import('@/lib/catalog')
    }

    beforeAll(async () => {
      vi.resetModules()
      ;(globalThis as Record<string, unknown>).__glanzmobilDb = undefined
      ;(globalThis as Record<string, unknown>).__glanzmobilCache = undefined
      for (const [k, v] of Object.entries(target.env)) {
        if (v === undefined) delete process.env[k]
        else process.env[k] = v
      }
      mod = {
        bookings: await import('@/lib/bookings'),
        db: await import('@/lib/db'),
        catalog: await import('@/lib/catalog'),
      }
      const db = await mod.db.getDb()
      if (target.name === 'PostgreSQL') {
        await db.query("DELETE FROM bookings WHERE email LIKE '%@test.glanzmobil.invalid'")
        await db.query("DELETE FROM blocked_periods WHERE reason = 'TEST'")
      }
    })

    afterAll(async () => {
      const db = await mod.db.getDb()
      await db.query("DELETE FROM bookings WHERE email LIKE '%@test.glanzmobil.invalid'")
      await db.query("DELETE FROM blocked_periods WHERE reason = 'TEST'")
      ;(globalThis as Record<string, unknown>).__glanzmobilDb = undefined
    })

    // n-ter Werktag (Mo–Fr) ab heute + 10 Tagen – jeder Test bekommt einen eigenen Tag
    function targetDate(n: number): string {
      let d = addDays(todayInZone(), 10)
      let count = 0
      for (;;) {
        if (isoWeekday(d) <= 5) {
          if (count === n) return d
          count++
        }
        d = addDays(d, 1)
      }
    }

    const request = (date: string, time: string, email = 'kunde@test.glanzmobil.invalid') => ({
      serviceId: 'innenraumreinigung',
      vehicleId: 'kleinwagen',
      addonIds: [] as string[],
      date,
      time,
      customer: {
        firstName: 'Test',
        lastName: 'Kunde',
        phone: '+43 664 0000000',
        email,
        street: 'Teststraße 1',
        postalCode: '8010',
        city: 'Graz',
        vehicleModel: 'VW Polo',
        licensePlate: '',
        message: '',
      },
      privacyAccepted: true as const,
      termsAccepted: true as const,
      website: '',
    })

    it('migriert und spielt Startwerte ein', async () => {
      const catalog = await mod.catalog.getCatalog()
      expect(catalog.services.map((s) => s.id)).toContain('komplettreinigung')
      expect(catalog.vehicles).toHaveLength(6)
      const settings = await mod.catalog.getSettings()
      expect(settings.rules.bufferMinutes).toBe(30)
    })

    it('legt eine Buchung an und blockiert danach den Termin inkl. Puffer', async () => {
      const date = targetDate(0)
      const before = await mod.bookings.getDayAvailability(date, { serviceId: 'innenraumreinigung', vehicleId: 'kleinwagen', addonIds: [] })
      expect(before.ok && before.slots).toContain('10:00')

      const res = await mod.bookings.createBooking(request(date, '10:00'))
      expect(res.ok).toBe(true)
      if (!res.ok) return
      expect(res.reference).toMatch(/^GM-[A-Z2-9]{4}-[A-Z2-9]{4}$/)

      const after = await mod.bookings.getDayAvailability(date, { serviceId: 'innenraumreinigung', vehicleId: 'kleinwagen', addonIds: [] })
      expect(after.ok).toBe(true)
      if (!after.ok) return
      // 10:00–12:30 + 30 min Puffer → blockiert bis 13:00
      expect(after.slots).not.toContain('10:00')
      expect(after.slots).not.toContain('12:30')
      expect(after.slots).toContain('13:00')
      expect(after.slots).not.toContain('07:30')

      const pub = await mod.bookings.getBookingByToken(res.token)
      expect(pub?.reference).toBe(res.reference)
      expect(pub?.totalPriceCents).toBe(11900)
    })

    it('verhindert Doppelbuchungen – auch bei gleichzeitigen Anfragen', async () => {
      const date = targetDate(1)
      const results = await Promise.all([
        mod.bookings.createBooking(request(date, '09:00', 'a@test.glanzmobil.invalid')),
        mod.bookings.createBooking(request(date, '09:00', 'b@test.glanzmobil.invalid')),
        mod.bookings.createBooking(request(date, '09:30', 'c@test.glanzmobil.invalid')),
      ])
      const ok = results.filter((r) => r.ok)
      expect(ok).toHaveLength(1)
      for (const r of results.filter((x) => !x.ok)) expect(!r.ok && r.code).toBe('slot_unavailable')
    })

    it('Datenbank-Constraint greift auch ohne Anwendungslogik', async () => {
      const db = await mod.db.getDb()
      const date = targetDate(2)
      const res = await mod.bookings.createBooking(request(date, '08:00'))
      expect(res.ok).toBe(true)
      const insertOverlap = db.query(
        `INSERT INTO bookings (reference, access_token_hash, service_name, vehicle_category_name, duration_minutes,
           starts_at, ends_at, blocked_until, first_name, last_name, email, phone, street, postal_code, city, vehicle_model,
           privacy_accepted_at, terms_accepted_at)
         SELECT 'GM-TEST-OVER', 'hash-overlap', 'x', 'x', 60, starts_at + interval '30 minutes', starts_at + interval '90 minutes',
           starts_at + interval '120 minutes', 'x', 'x', 'x@test.glanzmobil.invalid', 'x', 'x', '8010', 'x', 'x', now(), now()
         FROM bookings WHERE reference = $1`,
        [res.ok ? res.reference : ''],
      )
      await expect(insertOverlap).rejects.toMatchObject({ code: '23P01' })
    })

    it('stornierte Termine geben den Slot wieder frei', async () => {
      const db = await mod.db.getDb()
      const date = targetDate(3)
      const res = await mod.bookings.createBooking(request(date, '11:00'))
      expect(res.ok).toBe(true)
      if (!res.ok) return
      await db.query("UPDATE bookings SET status = 'storniert' WHERE reference = $1", [res.reference])
      const again = await mod.bookings.createBooking(request(date, '11:00', 'z@test.glanzmobil.invalid'))
      expect(again.ok).toBe(true)
    })

    it('respektiert gesperrte Zeiten (Urlaub)', async () => {
      const db = await mod.db.getDb()
      const date = targetDate(4)
      const { dayBoundsUtc } = await import('@/lib/availability')
      const b = dayBoundsUtc(date)
      await db.query("INSERT INTO blocked_periods (starts_at, ends_at, reason) VALUES ($1, $2, 'TEST')", [new Date(b.start), new Date(b.end)])
      const res = await mod.bookings.createBooking(request(date, '10:00'))
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.code).toBe('slot_unavailable')
    })

    it('lehnt Adressen außerhalb des Einsatzgebiets ab', async () => {
      const r = request(targetDate(5), '10:00')
      r.customer.postalCode = '1010'
      const res = await mod.bookings.createBooking(r)
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.code).toBe('outside_area')
    })
  })
}
