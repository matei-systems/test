/**
 * Migration 003_umbenennung: ersetzt den alten Standard-Firmennamen (Startwert) durch den neuen Markennamen,
 * lässt aber im Admin-Bereich selbst gesetzte Namen unangetastet.
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
  it('Standardwerte tragen den neuen Markennamen', () => {
    expect(DEFAULT_BUSINESS.companyName).toBe('RM Mobile Autoaufbereitung')
    expect(SITE.name).toBe('RM Mobile Autoaufbereitung')
    expect(rename.sql).toContain("'RM Mobile Autoaufbereitung'")
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
