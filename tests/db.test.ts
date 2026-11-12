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

    const SERVICE = { serviceId: 'innenraum-premium', vehicleId: 'kleinwagen', addonIds: [] as string[] }

    const request = (date: string, time: string, email = 'kunde@test.glanzmobil.invalid') => ({
      ...SERVICE,
      date,
      time,
      customer: {
        firstName: 'Test',
        lastName: 'Kunde',
        phone: '+43 664 0000000',
        email,
        street: 'Teststraße',
        houseNumber: '1a',
        postalCode: '8010',
        city: 'Graz',
        locationNote: '',
        vehicleModel: 'VW Polo',
        licensePlate: '',
        message: '',
      },
      // Innenraum Premium Kleinwagen: regulär 149 €, Einführungspreis −20 % = 119 €
      expectedTotalCents: 11900 as number | null,
      privacyAccepted: true as const,
      termsAccepted: true as const,
      marketingConsent: false,
      website: '',
    })

    async function setRules(patch: Record<string, unknown>) {
      const db = await mod.db.getDb()
      const current = await mod.catalog.loadSettings(db)
      await db.query(
        `INSERT INTO settings (key, value, updated_at) VALUES ('booking_rules', $1::jsonb, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [JSON.stringify({ ...current.rules, ...patch })],
      )
      mod.catalog.invalidateCatalogCache()
    }

    it('migriert und spielt Startwerte ein', async () => {
      const catalog = await mod.catalog.getCatalog()
      expect(catalog.services.map((s) => s.id)).toEqual(['innenraum-basic', 'innenraum-premium', 'aussenpflege', 'komplettpaket', 'zusatzleistungen'])
      expect(catalog.vehicles.map((v) => v.id)).toEqual(['kleinwagen', 'kompaktklasse', 'limousine', 'kombi', 'suv', 'van'])
      expect(catalog.promotions).toHaveLength(1)
      expect(catalog.promotions[0].discountPercent).toBe(20)
      const settings = await mod.catalog.getSettings()
      expect(settings.rules.bufferMinutes).toBe(30)
      expect(settings.rules.teams).toBe(1)
      const gallery = await mod.catalog.getGallery()
      expect(gallery.filter((g) => g.kind === 'vergleich').length).toBeGreaterThanOrEqual(3)
      expect(gallery.every((g) => g.isDemo)).toBe(true)
    })

    it('legt eine Buchung an, speichert den Rabatt und blockiert den Termin inkl. Puffer', async () => {
      const date = targetDate(0)
      const before = await mod.bookings.getDayAvailability(date, SERVICE)
      expect(before.ok && before.slots).toContain('10:00')
      expect(before.ok && before.quote.totalPriceCents).toBe(11900)

      const res = await mod.bookings.createBooking(request(date, '10:00'))
      expect(res.ok).toBe(true)
      if (!res.ok) return
      expect(res.reference).toMatch(/^GM-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
      expect(res.kind).toBe('buchung')

      const after = await mod.bookings.getDayAvailability(date, SERVICE)
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
      expect(pub?.regularPriceCents).toBe(14900)
      expect(pub?.discountCents).toBe(3000)
      expect(pub?.promotionName).toBe('Einführungspreis')
      expect(pub?.promotionPercent).toBe(20)
      expect(pub?.houseNumber).toBe('1a')
      expect(pub?.cancellableUntil).toBeInstanceOf(Date)
    })

    it('lehnt ab, wenn der bestätigte Preis nicht dem Server-Preis entspricht', async () => {
      const r = request(targetDate(6), '10:00')
      r.expectedTotalCents = 14900
      const res = await mod.bookings.createBooking(r)
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.code).toBe('price_changed')
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

    it('Datenbank-Constraint greift auch ohne Anwendungslogik (je Team)', async () => {
      const db = await mod.db.getDb()
      const date = targetDate(2)
      const res = await mod.bookings.createBooking(request(date, '08:00'))
      expect(res.ok).toBe(true)
      const insertOverlap = (ref: string, team: number) =>
        db.query(
          `INSERT INTO bookings (reference, access_token_hash, team, service_name, vehicle_category_name, duration_minutes,
             starts_at, ends_at, blocked_until, first_name, last_name, email, phone, street, postal_code, city, vehicle_model,
             privacy_accepted_at, terms_accepted_at)
           SELECT $2, 'hash-' || $2, $3, 'x', 'x', 60, starts_at + interval '30 minutes', starts_at + interval '90 minutes',
             starts_at + interval '120 minutes', 'x', 'x', 'x@test.glanzmobil.invalid', 'x', 'x', '8010', 'x', 'x', now(), now()
           FROM bookings WHERE reference = $1`,
          [res.ok ? res.reference : '', ref, team],
        )
      await expect(insertOverlap('GM-TEST-OVR1', 1)).rejects.toMatchObject({ code: '23P01' })
      // Ein anderes Team darf denselben Zeitraum belegen
      await expect(insertOverlap('GM-TEST-OVR2', 2)).resolves.toBeTruthy()
    })

    it('mehrere Teams: gleicher Termin ist so oft buchbar, wie Teams vorhanden sind', async () => {
      const db = await mod.db.getDb()
      const date = targetDate(7)
      await setRules({ teams: 2 })
      try {
        const a = await mod.bookings.createBooking(request(date, '09:00', 't1@test.glanzmobil.invalid'))
        const b = await mod.bookings.createBooking(request(date, '09:00', 't2@test.glanzmobil.invalid'))
        const c = await mod.bookings.createBooking(request(date, '09:00', 't3@test.glanzmobil.invalid'))
        expect(a.ok).toBe(true)
        expect(b.ok).toBe(true)
        expect(c.ok).toBe(false)
        const { rows } = await db.query<{ team: number }>(
          "SELECT team FROM bookings WHERE email IN ('t1@test.glanzmobil.invalid','t2@test.glanzmobil.invalid') ORDER BY team",
        )
        expect(rows.map((r) => Number(r.team))).toEqual([1, 2])
      } finally {
        await setRules({ teams: 1 })
      }
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

    it('Kunde kann online stornieren – aber nur innerhalb der Frist', async () => {
      const db = await mod.db.getDb()
      const date = targetDate(8)
      const res = await mod.bookings.createBooking(request(date, '10:00', 'storno@test.glanzmobil.invalid'))
      expect(res.ok).toBe(true)
      if (!res.ok) return

      // 2 Stunden vor dem Termin: Frist (24 h) abgelaufen
      const late = await mod.bookings.cancelBookingByToken(res.token, res.startsAt.getTime() - 2 * 3600_000)
      expect(late.ok).toBe(false)
      if (!late.ok) expect(late.code).toBe('too_late')

      expect((await mod.bookings.cancelBookingByToken('x'.repeat(43))).ok).toBe(false)

      const ok = await mod.bookings.cancelBookingByToken(res.token)
      expect(ok.ok).toBe(true)
      const { rows } = await db.query<{ status: string; cancelled_by: string }>('SELECT status, cancelled_by FROM bookings WHERE reference = $1', [res.reference])
      expect(rows[0].status).toBe('storniert')
      expect(rows[0].cancelled_by).toBe('kunde')
      const pub = await mod.bookings.getBookingByToken(res.token)
      expect(pub?.cancellableUntil).toBeNull()

      // Slot ist wieder frei
      const slots = await mod.bookings.getDayAvailability(date, SERVICE)
      expect(slots.ok && slots.slots).toContain('10:00')
    })

    it('Terminerinnerungen: nur bestätigte Termine im Zeitfenster, ohne SMTP wird nichts als gesendet markiert', async () => {
      const db = await mod.db.getDb()
      const date = targetDate(9)
      const res = await mod.bookings.createBooking(request(date, '10:00', 'erinnerung@test.glanzmobil.invalid'))
      expect(res.ok).toBe(true)
      if (!res.ok) return
      const now = res.startsAt.getTime() - 20 * 3600_000
      const none = await mod.bookings.sendDueReminders(now)
      expect(none.due).toBe(0) // Status "neu" → keine Erinnerung
      await db.query("UPDATE bookings SET status = 'bestaetigt' WHERE reference = $1", [res.reference])
      const due = await mod.bookings.sendDueReminders(now)
      expect(due.due).toBe(1)
      expect(due.sent).toBe(0)
      expect(due.skipped).toBe(1) // E-Mail-Versand im Test nicht konfiguriert
      const { rows } = await db.query<{ reminder_sent_at: Date | null }>('SELECT reminder_sent_at FROM bookings WHERE reference = $1', [res.reference])
      expect(rows[0].reminder_sent_at).toBeNull()
    })

    it('Preis auf Anfrage → unverbindliche Terminanfrage statt Buchung', async () => {
      const db = await mod.db.getDb()
      const date = targetDate(10)
      await db.query("UPDATE service_prices SET price_cents = NULL WHERE service_id = 'innenraum-basic' AND vehicle_category_id = 'van'")
      mod.catalog.invalidateCatalogCache()
      try {
        const r = { ...request(date, '09:00', 'anfrage@test.glanzmobil.invalid'), serviceId: 'innenraum-basic', vehicleId: 'van', expectedTotalCents: null }
        const res = await mod.bookings.createBooking(r)
        expect(res.ok).toBe(true)
        if (!res.ok) return
        expect(res.kind).toBe('anfrage')
        expect(res.status).toBe('neu')
        const pub = await mod.bookings.getBookingByToken(res.token)
        expect(pub?.totalPriceCents).toBeNull()
        expect(pub?.kind).toBe('anfrage')
      } finally {
        await db.query("UPDATE service_prices SET price_cents = 13900 WHERE service_id = 'innenraum-basic' AND vehicle_category_id = 'van'")
        mod.catalog.invalidateCatalogCache()
      }
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
