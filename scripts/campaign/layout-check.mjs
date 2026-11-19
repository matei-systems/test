// Prüft im gerenderten Dokument, ob Texte, QR-Codes und Logos innerhalb des Endformats (Trim) liegen
// und wie nah sie dem Schnittrand kommen. Wird von build.mjs genutzt und kann einzeln laufen:
//   node scripts/campaign/layout-check.mjs            (alle Quellen laut manifest.json)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Läuft im Browser (page.evaluate). Liefert je Seite den kleinsten Randabstand in px und Überläufe. */
export function measureInBrowser() {
  const out = []
  for (const [i, trim] of [...document.querySelectorAll('.trim')].entries()) {
    const t = trim.getBoundingClientRect()
    let minGap = Infinity
    const overflow = []
    const test = (r, what) => {
      if (r.width < 0.5 || r.height < 0.5) return
      const gap = Math.min(r.left - t.left, r.top - t.top, t.right - r.right, t.bottom - r.bottom)
      if (gap < minGap) minGap = gap
      if (gap < -1) overflow.push({ what: what.slice(0, 60), by: Math.round(-gap) })
    }
    const walker = document.createTreeWalker(trim, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const n = walker.currentNode
      if (!n.textContent.trim()) continue
      const el = n.parentElement
      if (el.closest('svg, style, script')) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) test(r, n.textContent.trim())
    }
    for (const el of trim.querySelectorAll('.qrbox, svg.qr, img.logo')) test(el.getBoundingClientRect(), el.matches('img') ? '[Logo]' : '[QR-Code]')
    out.push({ page: i + 1, minGapPx: Number.isFinite(minGap) ? minGap : null, overflow })
  }
  return out
}

/** Bewertet das Messergebnis. pxPerUnit: 96/25.4 für mm, 1 für px. minSafe in Einheiten der Vorlage. */
export function judge(result, { pxPerUnit, minSafe }) {
  const problems = []
  let minGap = Infinity
  for (const p of result) {
    if (p.minGapPx !== null) minGap = Math.min(minGap, p.minGapPx / pxPerUnit)
    for (const o of p.overflow) problems.push(`Seite ${p.page}: „${o.what}“ ragt ${Math.round(o.by / pxPerUnit)} über das Endformat hinaus`)
  }
  if (Number.isFinite(minGap) && minGap < minSafe && !problems.length) problems.push(`Inhalt nur ${minGap.toFixed(1)} vom Schnittrand entfernt (Ziel ≥ ${minSafe})`)
  return { problems, minGap: Number.isFinite(minGap) ? Math.round(minGap * 10) / 10 : null }
}

/** Sicherheitsabstand je nach Format: kleine Drucksachen 3 mm, Plakate 5 mm, Banner/Schilder ≥ 60 cm Breite 30 mm. */
export function safeZoneFor(job) {
  const f = { mm: 1, cm: 10 }[job.unit]
  if (!f) return 0
  const long = Math.max(job.w, job.h) * f
  const mm = long >= 1000 ? 30 : long >= 420 ? 5 : 3
  return mm / f
}

export const pxPerUnit = (unit) => ({ mm: 96 / 25.4, cm: 96 / 2.54 })[unit] ?? 1

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { createRequire } = await import('node:module')
  const { chromium } = createRequire(import.meta.url)('playwright')
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../RM6_MARKETING')
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, '20_README_UND_PRODUKTIONSHINWEISE/manifest.json'), 'utf8'))
  const browser = await chromium.launch()
  const pg = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
  let bad = 0
  for (const e of manifest) {
    await pg.goto('file://' + path.join(ROOT, e.dateien.source))
    await pg.evaluate(() => document.fonts.ready)
    const m = e.format.match(/([\d.,]+)\s*×\s*([\d.,]+)\s*(mm|cm|px)/)
    const job = { unit: m[3], w: Number(m[1].replace(',', '.')), h: Number(m[2].replace(',', '.')) }
    const res = judge(await pg.evaluate(measureInBrowser), { pxPerUnit: pxPerUnit(job.unit), minSafe: safeZoneFor(job) })
    if (res.problems.length) {
      bad++
      console.log(`✗ ${e.datei} [${e.status}] – ${res.problems.slice(0, 3).join(' | ')}`)
    }
  }
  console.log(`${manifest.length} Designs geprüft, ${bad} mit Auffälligkeiten`)
  await browser.close()
  process.exitCode = bad ? 1 : 0
}
