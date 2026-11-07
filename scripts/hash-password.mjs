#!/usr/bin/env node
// Erzeugt einen scrypt-Passwort-Hash für ADMIN_PASSWORD_HASH.
// Verwendung:  npm run admin:hash -- "DeinSicheresPasswort"
import { randomBytes, scrypt } from 'node:crypto'

const password = process.argv[2]
if (!password || password.length < 10) {
  console.error('Bitte ein Passwort mit mindestens 10 Zeichen angeben:  npm run admin:hash -- "DeinSicheresPasswort"')
  process.exit(1)
}
const N = 16384
const r = 8
const p = 1
const salt = randomBytes(16)
scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) => {
  if (err) throw err
  const hash = ['scrypt', N, r, p, salt.toString('base64'), key.toString('base64')].join('$')
  console.log('\nTrage folgende Zeile in .env.local bzw. in die Umgebungsvariablen deines Hostings ein:\n')
  // Einfache Anführungszeichen, damit $-Zeichen nicht als Variablen interpretiert werden
  console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`)
})
