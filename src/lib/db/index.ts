import 'server-only'
import { MIGRATIONS } from './migrations'
import { seedDefaults } from './seed'

/**
 * Datenbankzugriff.
 *  - Produktion: PostgreSQL über DATABASE_URL (z. B. Supabase, Neon, eigener Server).
 *  - Lokale Entwicklung ohne DATABASE_URL: eingebettetes PostgreSQL (PGlite) im Ordner .data/.
 * In Produktion ohne DATABASE_URL wird bewusst ein Fehler geworfen – es dürfen keine
 * Buchungen "scheinbar" angenommen werden, die nicht dauerhaft gespeichert sind.
 */

export interface QueryResult<T> {
  rows: T[]
  rowCount: number
}

export interface Queryable {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<QueryResult<T>>
}

export interface Db extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>
  kind: 'postgres' | 'pglite'
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('DATABASE_URL ist nicht gesetzt. In Produktion ist eine PostgreSQL-Datenbank erforderlich.')
    this.name = 'DatabaseNotConfiguredError'
  }
}

/** Postgres-Fehlercodes, die wir gezielt behandeln */
export const PG_EXCLUSION_VIOLATION = '23P01'
export const PG_UNIQUE_VIOLATION = '23505'

export function pgErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) return String((err as { code: unknown }).code)
  return undefined
}

type GlobalWithDb = typeof globalThis & { __glanzmobilDb?: Promise<Db> }
const g = globalThis as GlobalWithDb

export function getDb(): Promise<Db> {
  if (!g.__glanzmobilDb) {
    g.__glanzmobilDb = createDb().catch((err) => {
      g.__glanzmobilDb = undefined
      throw err
    })
  }
  return g.__glanzmobilDb
}

/** Verbindungs-URL: DATABASE_URL oder (z. B. von der Vercel-Neon-Integration gesetzt) POSTGRES_URL */
export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined
}

export function isDatabaseConfigured(): boolean {
  return Boolean(databaseUrl()) || process.env.NODE_ENV !== 'production' || process.env.ALLOW_PGLITE === 'true'
}

async function createDb(): Promise<Db> {
  const url = databaseUrl()
  let db: Db
  if (url) {
    db = await createPostgres(url)
  } else if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_PGLITE === 'true') {
    db = await createPglite()
  } else {
    throw new DatabaseNotConfiguredError()
  }
  await migrate(db)
  return db
}

async function createPostgres(connectionString: string): Promise<Db> {
  const { Pool, types } = await import('pg')
  // int8 (bigint, count(*)) als Zahl statt String
  types.setTypeParser(20, (v: string) => Number(v))
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  })
  pool.on('error', (err) => console.error('[db] Pool-Fehler', err))

  return {
    kind: 'postgres',
    async query<T>(text: string, params: unknown[] = []) {
      const res = await pool.query(text, params as unknown[])
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 }
    },
    async transaction<T>(fn: (tx: Queryable) => Promise<T>) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        // Eine Verbindung kann nur eine Abfrage gleichzeitig ausführen → Abfragen innerhalb
        // der Transaktion werden in eine Warteschlange gestellt (auch bei Promise.all).
        let queue: Promise<unknown> = Promise.resolve()
        const tx: Queryable = {
          query<R>(text: string, params: unknown[] = []) {
            const run = queue.then(async () => {
              const res = await client.query(text, params as unknown[])
              return { rows: res.rows as R[], rowCount: res.rowCount ?? 0 }
            })
            queue = run.catch(() => undefined)
            return run
          },
        }
        const result = await fn(tx)
        await client.query('COMMIT')
        return result
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined)
        throw err
      } finally {
        client.release()
      }
    },
  }
}

async function createPglite(): Promise<Db> {
  const { PGlite } = await import('@electric-sql/pglite')
  const path = await import('node:path')
  const fs = await import('node:fs')
  const dir = process.env.PGLITE_DIR || path.join(process.cwd(), '.data', 'pglite')
  fs.mkdirSync(dir, { recursive: true })
  const { btree_gist } = await import('@electric-sql/pglite/contrib/btree_gist')
  const pg = await PGlite.create(dir, { extensions: { btree_gist } })
  console.info(`[db] Lokale Entwicklungsdatenbank (PGlite) unter ${dir}`)

  const wrap = (q: { query: typeof pg.query }): Queryable => ({
    async query<T>(text: string, params: unknown[] = []) {
      const res = await q.query<T>(text, params as unknown[])
      return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length }
    },
  })

  // PGlite verarbeitet Abfragen seriell; Transaktionen sind exklusiv.
  return {
    kind: 'pglite',
    ...wrap(pg),
    async transaction<T>(fn: (tx: Queryable) => Promise<T>) {
      return pg.transaction(async (tx) => fn(wrap(tx as unknown as { query: typeof pg.query })))
    },
  }
}

async function migrate(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    // Verhindert parallele Migrationen (z. B. mehrere Serverless-Instanzen gleichzeitig)
    await tx.query('SELECT pg_advisory_xact_lock(72110001)')
    await tx.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`)
    await tx.query('ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY')
    const { rows } = await tx.query<{ id: string }>('SELECT id FROM schema_migrations')
    const applied = new Set(rows.map((r) => r.id))
    for (const m of MIGRATIONS) {
      if (applied.has(m.id)) continue
      await execMulti(db, tx, m.sql)
      await tx.query('INSERT INTO schema_migrations (id) VALUES ($1)', [m.id])
      console.info(`[db] Migration ${m.id} ausgeführt`)
    }
    await seedDefaults(tx)
  })
}

/** Mehrere SQL-Anweisungen ausführen (pg: einfache Query ohne Parameter erlaubt mehrere Statements). */
async function execMulti(db: Db, tx: Queryable, sql: string) {
  if (db.kind === 'pglite') {
    // PGlite: exec() unterstützt mehrere Anweisungen; über query() nur eine
    const statements = splitSql(sql)
    for (const s of statements) await tx.query(s)
  } else {
    await tx.query(sql)
  }
}

/** Einfacher SQL-Splitter für unsere Migrationsdateien (keine Funktionen mit $$-Blöcken). */
export function splitSql(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .map((line) => {
      const i = line.indexOf('--')
      return i === -1 ? line : line.slice(0, i)
    })
    .join('\n')
  return withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}
