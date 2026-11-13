/**
 * Schutz vor fremden Datenbanken: RM Mobile Autoaufbereitung darf nur in leere oder eigene Datenbanken schreiben.
 * (Ausgangspunkt: eine Neon-Datenbank, die bereits einer anderen Anwendung gehörte.)
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { assertDatabaseIsEmptyOrOurs, databaseUrl, ForeignDatabaseError, splitSql, type Queryable } from '@/lib/db'
import { MIGRATIONS } from '@/lib/db/migrations'

vi.mock('server-only', () => ({}))

function wrap(pg: PGlite): Queryable {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const res = await pg.query<T>(text, params)
      return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length }
    },
  }
}

describe('Datenbank-Schutz', () => {
  it('leere Datenbank: erlaubt', async () => {
    const pg = new PGlite()
    await expect(assertDatabaseIsEmptyOrOurs(wrap(pg))).resolves.toBeUndefined()
  })

  it('Datenbank mit fremden Tabellen (z. B. services mit uuid-Schlüssel): abgelehnt, nichts verändert', async () => {
    const pg = new PGlite()
    await pg.exec(`CREATE TABLE services (id uuid PRIMARY KEY, title text); INSERT INTO services VALUES (gen_random_uuid(), 'fremd');`)
    const q = wrap(pg)
    await expect(assertDatabaseIsEmptyOrOurs(q)).rejects.toBeInstanceOf(ForeignDatabaseError)
    await expect(assertDatabaseIsEmptyOrOurs(q)).rejects.toThrow(/services/)
    const tables = await q.query<{ table_name: string }>(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`)
    expect(tables.rows.map((r) => r.table_name)).toEqual(['services'])
    const rows = await q.query('SELECT count(*)::int AS n FROM services')
    expect(rows.rows[0]).toEqual({ n: 1 })
  })

  it('fremde schema_migrations-Tabelle (anderes Werkzeug) zählt nicht als „unsere“ Datenbank', async () => {
    const pg = new PGlite()
    await pg.exec(`CREATE TABLE schema_migrations (version bigint PRIMARY KEY); CREATE TABLE bookings (id serial PRIMARY KEY);`)
    await expect(assertDatabaseIsEmptyOrOurs(wrap(pg))).rejects.toBeInstanceOf(ForeignDatabaseError)
  })

  it('eigene, bereits migrierte Datenbank: erlaubt', async () => {
    const pg = new PGlite()
    await pg.exec(`
      CREATE TABLE schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
      INSERT INTO schema_migrations (id) VALUES ('001_init');
      CREATE TABLE bookings (id uuid PRIMARY KEY);`)
    await expect(assertDatabaseIsEmptyOrOurs(wrap(pg))).resolves.toBeUndefined()
  })

  it('nach den echten Migrationen (Neustart/Redeploy): die eigene Datenbank wird erkannt', async () => {
    const { btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist')
    const pg = await PGlite.create({ extensions: { btree_gist } })
    const q = wrap(pg)
    await expect(assertDatabaseIsEmptyOrOurs(q)).resolves.toBeUndefined() // leer
    await pg.exec('CREATE TABLE schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
    for (const m of MIGRATIONS) {
      for (const statement of splitSql(m.sql)) await pg.exec(statement)
      await pg.query('INSERT INTO schema_migrations (id) VALUES ($1)', [m.id])
    }
    await expect(assertDatabaseIsEmptyOrOurs(q)).resolves.toBeUndefined() // komplett migriert
  })

  describe('Notschalter GLANZMOBIL_DB=off', () => {
    const saved = { ...process.env }
    afterEach(() => {
      process.env = { ...saved }
    })
    it('ignoriert DATABASE_URL und POSTGRES_URL', () => {
      process.env.DATABASE_URL = 'postgres://x@example.invalid/db'
      process.env.POSTGRES_URL = 'postgres://y@example.invalid/db'
      expect(databaseUrl()).toBe('postgres://x@example.invalid/db')
      process.env.GLANZMOBIL_DB = 'off'
      expect(databaseUrl()).toBeUndefined()
      process.env.GLANZMOBIL_DB = ' OFF '
      expect(databaseUrl()).toBeUndefined()
      process.env.GLANZMOBIL_DB = ''
      expect(databaseUrl()).toBe('postgres://x@example.invalid/db')
    })
  })
})
