/**
 * Umbenennungs-Migrationen (003, 004, 005): ersetzen frühere Standard-Firmennamen (Startwerte) durch den jeweils
 * neuen Markennamen, lassen aber im Admin-Bereich selbst gesetzte Namen unangetastet.
 * Die alten Namen in diesem Test sind absichtlich enthalten – sie sind die Werte, die die Migrationen erkennen müssen.
 */
import { describe, expect, it, vi } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { splitSql } from '@/lib/db'
import { MIGRATIONS } from '@/lib/db/migrations'
import { DEFAULT_BUSINESS } from '@/config/defaults'
import { SITE } from '@/config/site'

vi.mock('server-only', () => ({}))

const rename = MIGRATIONS.find((m) => m.id === '003_umbenennung')!

async function migratedUntilRename() {
  const { btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist')
  const pg = await PGlite.create({ extensions: { btree_gist } })
  for (const m of MIGRATIONS.filter((x) => x.id < '003')) {
    for (const statement of splitSql(m.sql)) await pg.exec(statement)
  }
  return pg
}

async function runRename(pg: PGlite) {
  for (const statement of splitSql(rename.sql)) await pg.exec(statement)
}

async function companyName(pg: PGlite): Promise<string | undefined> {
  const res = await pg.query<{ name: string }>(`SELECT value->>'companyName' AS name FROM settings WHERE key = 'business'`)
  return res.rows[0]?.name
}

describe('Migration 003_umbenennung', () => {
  it('Standardwerte tragen den aktuellen Firmennamen', () => {
    expect(DEFAULT_BUSINESS.companyName).toBe('RM6 Autoaufbereitung')
    expect(SITE.name).toBe('RM6 Autoaufbereitung')
  })

  it('Migration 005 stellt alle früheren Startwerte auf „RM6 Autoaufbereitung“ um, eigene Namen und übrige Felder bleiben', async () => {
    const m004 = MIGRATIONS.find((m) => m.id === '004_gutscheine_leistungsumfang')!
    const m005 = MIGRATIONS.find((m) => m.id === '005_marke_rm6')!
    for (const [before, after] of [
      ['RM Mobile Auto Aufbereitung', 'RM6 Autoaufbereitung'],
      ['RM Mobile Autoaufbereitung', 'RM6 Autoaufbereitung'],
      ['GLANZMOBIL', 'RM6 Autoaufbereitung'],
      ['Mein eigener Firmenname e.U.', 'Mein eigener Firmenname e.U.'],
    ]) {
      const pg = await migratedUntilRename()
      await pg.query(`INSERT INTO settings (key, value) VALUES ('business', $1::jsonb)`, [JSON.stringify({ ...DEFAULT_BUSINESS, companyName: before, phone: '+43 000' })])
      for (const m of [rename, m004, m005, m005]) for (const statement of splitSql(m.sql)) await pg.exec(statement)
      expect(await companyName(pg)).toBe(after)
      const res = await pg.query<{ value: Record<string, string> }>(`SELECT value FROM settings WHERE key = 'business'`)
      expect(res.rows[0].value.phone).toBe('+43 000')
    }
  })

  it('Migration 004 stellt frühere Startwerte auf die Schreibweise „RM Mobile Auto Aufbereitung“ um, eigene Namen bleiben', async () => {
    const m004 = MIGRATIONS.find((m) => m.id === '004_gutscheine_leistungsumfang')!
    for (const [before, after] of [
      ['RM Mobile Autoaufbereitung', 'RM Mobile Auto Aufbereitung'],
      ['GLANZMOBIL', 'RM Mobile Auto Aufbereitung'],
      ['Mein eigener Firmenname e.U.', 'Mein eigener Firmenname e.U.'],
    ]) {
      const pg = await migratedUntilRename()
      await pg.query(`INSERT INTO settings (key, value) VALUES ('business', $1::jsonb)`, [JSON.stringify({ ...DEFAULT_BUSINESS, companyName: before, phone: '+43 000' })])
      for (const statement of splitSql(m004.sql)) await pg.exec(statement)
      expect(await companyName(pg)).toBe(after)
      const res = await pg.query<{ value: Record<string, string> }>(`SELECT value FROM settings WHERE key = 'business'`)
      expect(res.rows[0].value.phone).toBe('+43 000')
    }
  })

  it('ersetzt den alten Startwert und lässt alle anderen Felder unverändert', async () => {
    const pg = await migratedUntilRename()
    const old = { ...DEFAULT_BUSINESS, companyName: 'GLANZMOBIL', phone: '+43 000 000', email: 'info@example.invalid' }
    await pg.query(`INSERT INTO settings (key, value) VALUES ('business', $1::jsonb)`, [JSON.stringify(old)])

    await runRename(pg)

    expect(await companyName(pg)).toBe('RM Mobile Autoaufbereitung')
    const res = await pg.query<{ value: Record<string, string> }>(`SELECT value FROM settings WHERE key = 'business'`)
    expect(res.rows[0].value).toMatchObject({ phone: '+43 000 000', email: 'info@example.invalid', country: 'Österreich' })
  })

  it('überschreibt keinen im Admin-Bereich selbst gesetzten Namen', async () => {
    const pg = await migratedUntilRename()
    const own = { ...DEFAULT_BUSINESS, companyName: 'Mein eigener Firmenname e.U.' }
    await pg.query(`INSERT INTO settings (key, value) VALUES ('business', $1::jsonb)`, [JSON.stringify(own)])

    await runRename(pg)

    expect(await companyName(pg)).toBe('Mein eigener Firmenname e.U.')
  })

  it('ist idempotent und stört frische Datenbanken ohne Einstellungen nicht', async () => {
    const pg = await migratedUntilRename()
    await runRename(pg) // keine Zeile vorhanden → nichts passiert
    expect(await companyName(pg)).toBeUndefined()

    await pg.query(`INSERT INTO settings (key, value) VALUES ('business', $1::jsonb)`, [JSON.stringify({ ...DEFAULT_BUSINESS, companyName: 'GLANZMOBIL' })])
    await runRename(pg)
    await runRename(pg)
    expect(await companyName(pg)).toBe('RM Mobile Autoaufbereitung')
  })
})
