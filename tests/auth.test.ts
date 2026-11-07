import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { randomBytes } from 'node:crypto'

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }) }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error('REDIRECT ' + url) } }))

describe('Admin-Authentifizierung', () => {
  const env = { ...process.env }
  let auth: typeof import('@/lib/auth')

  beforeAll(async () => {
    auth = await import('@/lib/auth')
    process.env.SESSION_SECRET = 'x'.repeat(40)
    process.env.ADMIN_USERNAME = 'admin'
    process.env.ADMIN_PASSWORD_HASH = await auth.hashPassword('Sehr-Sicher-123', randomBytes(16))
  })
  afterAll(() => {
    process.env = env
  })

  it('Hash-Format enthält keine $-Zeichen (sicher für .env-Dateien)', () => {
    expect(process.env.ADMIN_PASSWORD_HASH).toMatch(/^scrypt:16384:8:1:[^$]+$/)
  })

  it('prüft Benutzername und Passwort', async () => {
    expect(await auth.checkCredentials('admin', 'Sehr-Sicher-123')).toBe(true)
    expect(await auth.checkCredentials('Admin ', 'Sehr-Sicher-123')).toBe(true)
    expect(await auth.checkCredentials('admin', 'falsch')).toBe(false)
    expect(await auth.checkCredentials('root', 'Sehr-Sicher-123')).toBe(false)
  })

  it('akzeptiert gültige und lehnt manipulierte/abgelaufene Sessions ab', () => {
    const token = auth.createSessionToken()
    expect(auth.verifySessionToken(token)?.username).toBe('admin')
    const [payload, sig] = token.split('.')
    const forged = Buffer.from(JSON.stringify({ u: 'admin', pv: 'x', iat: 0, exp: 9999999999 })).toString('base64url')
    expect(auth.verifySessionToken(`${forged}.${sig}`)).toBeNull()
    expect(auth.verifySessionToken(`${payload}.${sig.slice(0, -2)}xx`)).toBeNull()
    expect(auth.verifySessionToken(token, Date.now() + 13 * 3600_000)).toBeNull()
    expect(auth.verifySessionToken(undefined)).toBeNull()
  })

  it('macht Sessions nach Passwortänderung ungültig', async () => {
    const token = auth.createSessionToken()
    process.env.ADMIN_PASSWORD_HASH = await auth.hashPassword('Neues-Passwort-456', randomBytes(16))
    expect(auth.verifySessionToken(token)).toBeNull()
  })
})
