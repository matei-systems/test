/**
 * Seed-Version 4: genauere Texte für Zusatzleistungen und den Außenwäsche-Hinweis.
 * Nur unveränderte Startwerte werden ersetzt; im Admin geänderte Texte bleiben erhalten.
 */
import { describe, expect, it, vi } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { splitSql } from '@/lib/db'
import { MIGRATIONS } from '@/lib/db/migrations'
import { seedDefaults, upgradeTextsV4 } from '@/lib/db/seed'
import { ADDON_DESCRIPTIONS_V3, DEFAULT_ADDONS, REQ_EXTERIOR, REQ_EXTERIOR_V3 } from '@/config/defaults'
import type { Queryable } from '@/lib/db'

vi.mock('server-only', () => ({}))

async function freshDb() {
  const { btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist')
  const pg = await PGlite.create({ extensions: { btree_gist } })
  for (const m of MIGRATIONS) for (const statement of splitSql(m.sql)) await pg.exec(statement)
  return pg
}

describe('Seed-Version 4', () => {
  it('neue Installationen erhalten direkt die neuen Texte', async () => {
    const pg = await freshDb()
    await seedDefaults(pg as unknown as Queryable)
    const { rows } = await pg.query<{ id: string; description: string }>('SELECT id, description FROM addons')
    for (const a of DEFAULT_ADDONS) expect(rows.find((r) => r.id === a.id)?.description).toBe(a.description)
    const svc = await pg.query<{ requirements: string[] }>("SELECT requirements FROM services WHERE id = 'aussenpflege'")
    expect(svc.rows[0].requirements[0]).toBe(REQ_EXTERIOR)
  })

  it('ersetzt nur unveränderte Startwerte aus Version 3', async () => {
    const pg = await freshDb()
    await seedDefaults(pg as unknown as Queryable)
    // Zustand einer bestehenden Installation mit Version 3 nachstellen
    for (const [id, text] of Object.entries(ADDON_DESCRIPTIONS_V3)) await pg.query('UPDATE addons SET description = $2 WHERE id = $1', [id, text])
    await pg.query("UPDATE addons SET description = 'Eigener Text aus dem Admin' WHERE id = 'detailreinigung'")
    await pg.query(`UPDATE services SET requirements = $1::jsonb WHERE id = 'aussenpflege'`, [JSON.stringify([REQ_EXTERIOR_V3, 'Eigene Voraussetzung'])])
    await pg.query(`UPDATE services SET requirements = $1::jsonb WHERE id = 'komplettpaket'`, [JSON.stringify(['Selbst formulierter Hinweis'])])

    await upgradeTextsV4(pg as unknown as Queryable)
    await upgradeTextsV4(pg as unknown as Queryable) // idempotent

    const addons = await pg.query<{ id: string; description: string }>('SELECT id, description FROM addons')
    const byId = Object.fromEntries(addons.rows.map((r) => [r.id, r.description]))
    expect(byId.tierhaarentfernung).toBe(DEFAULT_ADDONS.find((a) => a.id === 'tierhaarentfernung')!.description)
    expect(byId['starke-verschmutzung']).toContain('erst nach Ihrer Zustimmung')
    expect(byId.detailreinigung).toBe('Eigener Text aus dem Admin')

    const req = await pg.query<{ id: string; requirements: string[] }>("SELECT id, requirements FROM services WHERE id IN ('aussenpflege','komplettpaket')")
    const reqById = Object.fromEntries(req.rows.map((r) => [r.id, r.requirements]))
    expect(reqById.aussenpflege).toEqual([REQ_EXTERIOR, 'Eigene Voraussetzung'])
    expect(reqById.komplettpaket).toEqual(['Selbst formulierter Hinweis'])
  })
})
