import 'server-only'
import { createHash } from 'node:crypto'
import { getDb } from './db'

/**
 * Datenbankbasiertes Fixed-Window-Rate-Limiting (funktioniert auch über mehrere Serverless-Instanzen).
 * IP-Adressen werden nur gehasht gespeichert (Datenminimierung).
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const key = `${bucket}:${createHash('sha256').update(identifier).digest('hex').slice(0, 32)}`
  const db = await getDb()
  const { rows } = await db.query<{ count: number; window_start: Date }>(
    `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN now() ELSE rate_limits.window_start END
     RETURNING count, window_start`,
    [key, windowSeconds],
  )
  const row = rows[0]
  const count = Number(row.count)
  const elapsed = (Date.now() - new Date(row.window_start).getTime()) / 1000
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil(windowSeconds - elapsed)),
  }
}

export async function resetRateLimit(bucket: string, identifier: string): Promise<void> {
  const key = `${bucket}:${createHash('sha256').update(identifier).digest('hex').slice(0, 32)}`
  const db = await getDb()
  await db.query('DELETE FROM rate_limits WHERE key = $1', [key])
}

/** Client-IP aus den Proxy-Headern (Vercel/Reverse-Proxy) ermitteln. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') || 'unknown'
}
