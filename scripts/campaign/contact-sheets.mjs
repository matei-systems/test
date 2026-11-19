#!/usr/bin/env node
/** Übersichtsblätter aller Werbemittel (Vorschauen) – 19_MOCKUPS_VORSCHAUEN/UEBERSICHT_*.jpg */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'RM6_MARKETING')
const m = JSON.parse(fs.readFileSync(path.join(OUT, '20_README_UND_PRODUKTIONSHINWEISE/manifest.json'), 'utf8'))
const groups = [
  ['PRINT_1_BANNER_SCHILDER', (e) => /^0[23]_/.test(e.kategorie)],
  ['PRINT_2_FLYER_POSTER', (e) => /^0[45]_/.test(e.kategorie)],
  ['PRINT_3_KARTEN_PREISLISTEN', (e) => /^0[678]_/.test(e.kategorie)],
  ['PRINT_4_ZEITUNG_FAHRZEUG', (e) => /^(09|10)_/.test(e.kategorie)],
  ['DIGITAL_1_SOCIAL', (e) => /^1[12]_/.test(e.kategorie)],
  ['DIGITAL_2_SCREENS_WEB', (e) => /^1[34]_/.test(e.kategorie)],
]
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
for (const [name, fn] of groups) {
  const items = m.filter(fn).map((e) => ({ e, file: e.dateien.preview ?? e.dateien.exports?.[0] })).filter((x) => x.file)
  const cell = 400, lab = 46, gap = 16, cols = 6
  const rows = Math.ceil(items.length / cols)
  const W = cols * cell + (cols + 1) * gap
  const H = rows * (cell + lab) + (rows + 1) * gap + 60
  const comps = []
  for (const [i, it] of items.entries()) {
    const buf = await sharp(path.join(OUT, it.file)).resize({ width: cell, height: cell, fit: 'contain', background: '#2b2b2f' }).toBuffer()
    const x = gap + (i % cols) * (cell + gap)
    const y = 60 + gap + Math.floor(i / cols) * (cell + lab + gap)
    comps.push({ input: buf, left: x, top: y })
    const st = it.e.status.startsWith('druck') || it.e.status === 'fertig' ? '#9cc5a7' : '#e3bd7a'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${lab}"><text x="0" y="17" font-family="Arial" font-size="13" fill="#ddd">${esc(it.e.datei.replace(/^RM6_/, '').slice(0, 52))}</text><text x="0" y="37" font-family="Arial" font-size="12" fill="${st}">${esc(it.e.status)} · ${esc(it.e.format)}</text></svg>`
    comps.push({ input: Buffer.from(svg), left: x, top: y + cell + 2 })
  }
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="60"><text x="${gap}" y="40" font-family="Arial" font-weight="bold" font-size="26" fill="#D4A843">RM6 Werbemittel – ${esc(name.replace(/_/g, ' '))} (${items.length})</text></svg>`
  comps.push({ input: Buffer.from(head), left: 0, top: 0 })
  const out = path.join(OUT, '19_MOCKUPS_VORSCHAUEN', `UEBERSICHT_${name}.jpg`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp({ create: { width: W, height: H, channels: 3, background: '#1b1b1e' } }).composite(comps).jpeg({ quality: 82, mozjpeg: true }).toFile(out)
  console.log(`✔ ${path.basename(out)} (${items.length})`)
}
