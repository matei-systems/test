import 'server-only'
import { createHash, createHmac, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Admin-Authentifizierung
 *  - Zugangsdaten ausschließlich serverseitig über Umgebungsvariablen (ADMIN_USERNAME, ADMIN_PASSWORD_HASH).
 *  - Passwort als scrypt-Hash (erzeugen mit `npm run admin:hash -- "Passwort"`).
 *  - Session als HMAC-signiertes, httpOnly-Cookie (SameSite=Strict, Secure in Produktion, 12 h gültig).
 *  - Ändert sich das Passwort, werden alle bestehenden Sessions automatisch ungültig.
 */

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>

export const SESSION_COOKIE = 'gm_admin'
const SESSION_TTL_SECONDS = 12 * 60 * 60

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && (process.env.SESSION_SECRET ?? '').length >= 32)
}

function adminUsername(): string {
  return process.env.ADMIN_USERNAME || 'admin'
}

export async function hashPassword(password: string, salt: Buffer): Promise<string> {
  const N = 16384
  const r = 8
  const p = 1
  const key = await scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 })
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, saltB64, hashB64] = parts
  const expected = Buffer.from(hashB64, 'base64')
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  })
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/** Prüft Benutzername + Passwort in konstanter Zeit. */
export async function checkCredentials(username: string, password: string): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD_HASH
  if (!stored || !isAdminConfigured()) return false
  const userOk = safeEqual(username.trim().toLowerCase(), adminUsername().toLowerCase())
  const passOk = await verifyPassword(password, stored)
  return userOk && passOk
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

function passwordVersion(): string {
  return createHash('sha256')
    .update(process.env.ADMIN_PASSWORD_HASH ?? '')
    .digest('base64url')
    .slice(0, 16)
}

function sign(payload: string): string {
  return createHmac('sha256', process.env.SESSION_SECRET as string).update(payload).digest('base64url')
}

export function createSessionToken(now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ u: adminUsername(), pv: passwordVersion(), iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS }),
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined, now = Date.now()): { username: string } | null {
  if (!token || !isAdminConfigured()) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u: string; pv: string; exp: number }
    if (data.exp * 1000 < now) return null
    if (data.pv !== passwordVersion()) return null
    if (data.u !== adminUsername()) return null
    return { username: data.u }
  } catch {
    return null
  }
}

export async function setSessionCookie(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getAdminSession(): Promise<{ username: string } | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/** In jeder Admin-Seite UND jeder Admin-Server-Action aufrufen. */
export async function requireAdmin(): Promise<{ username: string }> {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return session
}
