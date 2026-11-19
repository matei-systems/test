#!/usr/bin/env node
/**
 * RM6 Kampagnen-Generator – rendert alle Werbemittel aus scripts/campaign/designs-*.mjs.
 *
 *   node scripts/campaign/build.mjs                 alles
 *   node scripts/campaign/build.mjs BAN_ POS_       nur Aufträge, deren ID einen der Begriffe enthält
 *   node scripts/campaign/build.mjs --no-cmyk       ohne CMYK-Konvertierung (schneller)
 *
 * Je Auftrag: editierbare HTML-Quelle (im Kategorieordner), Vorschau-JPG, Druck-PDF (RGB + CMYK bzw. Graustufen)
 * oder Digital-Export (PNG/JPG). QR-Codes werden decodiert und mit dem Ziel verglichen, Bildauflösungen geprüft.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import jsQR from 'jsqr'
import { PDFDocument } from 'pdf-lib'
import { fixBlendSpace } from './pdf-fix.mjs'
import { judge, measureInBrowser, pxPerUnit, safeZoneFor } from './layout-check.mjs'
import { doc, page } from './kit.mjs'
import { allPrint } from './designs-print.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'RM6_MARKETING')
const args = process.argv.slice(2)
const filters = args.filter((a) => !a.startsWith('--'))
const NO_CMYK = args.includes('--no-cmyk')

let jobs = [...allPrint()]
for (const mod of ['./designs-digital.mjs', './guidelines.mjs']) {
  if (fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), mod))) {
    const m = await import(mod)
    jobs.push(...m.default())
  }
}
if (filters.length) jobs = jobs.filter((j) => filters.some((f) => j.id.includes(f)))
const ids = new Set()
for (const j of jobs) {
  if (ids.has(j.id)) throw new Error(`Doppelte ID ${j.id}`)
  ids.add(j.id)
}

const LOGO_PX = 2116
const MIN_DPI = { close: 150, poster: 100, large: 60 }
const imgSize = {}
async function dims(file) {
  if (!imgSize[file]) {
    const m = await sharp(path.join(OUT, '16_BILDER_ASSETS/fotos', file)).metadata()
    imgSize[file] = [m.width, m.height]
  }
  return imgSize[file]
}
const mkdir = (p) => fs.mkdirSync(p, { recursive: true })
const mmToPx = (mm) => (mm * 96) / 25.4

async function checkQrs(pg, expected) {
  const found = await pg.evaluate(() =>
    [...document.querySelectorAll('svg.qr')].map((s) => {
      const r = s.getBoundingClientRect()
      return { svg: s.outerHTML, w: r.width, x: r.x, y: r.y }
    }),
  )
  const res = []
  for (const f of found) {
    const png = await sharp(Buffer.from(f.svg.replace('<svg ', '<svg width="600" height="600" '))).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const code = jsQR(new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length), png.info.width, png.info.height)
    res.push({ url: code?.data ?? null, cssW: f.w })
  }
  const missing = expected.filter((u) => !res.some((r) => r.url === u))
  const wrong = res.filter((r) => !expected.includes(r.url))
  return { res, ok: missing.length === 0 && wrong.length === 0, missing, wrong }
}

async function setBoxes(file, bleedMm, mode) {
  const pdf = await PDFDocument.load(fs.readFileSync(file))
  if (mode) fixBlendSpace(pdf, mode)
  const pt = 72 / 25.4
  for (const p of pdf.getPages()) {
    const { width, height } = p.getSize()
    p.setMediaBox(0, 0, width, height)
    p.setBleedBox(0, 0, width, height)
    p.setTrimBox(bleedMm * pt, bleedMm * pt, width - 2 * bleedMm * pt, height - 2 * bleedMm * pt)
    p.setArtBox(bleedMm * pt, bleedMm * pt, width - 2 * bleedMm * pt, height - 2 * bleedMm * pt)
  }
  pdf.setTitle(path.basename(file, '.pdf'))
  pdf.setAuthor('RM6 Autoaufbereitung')
  pdf.setCreator('RM6 Kampagnen-Generator')
  fs.writeFileSync(file, await pdf.save({ useObjectStreams: false }))
}

function gs(input, output, mode) {
  const strat = mode === 'gray' ? ['-sColorConversionStrategy=Gray', '-sProcessColorModel=DeviceGray'] : ['-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK']
  execFileSync('gs', ['-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.6', '-dPDFSETTINGS=/prepress', '-dAutoRotatePages=/None', ...strat, `-sOutputFile=${output}`, input], { stdio: 'pipe' })
}

const browser = await chromium.launch()
const manifest = []
const t0 = Date.now()
for (const [n, job] of jobs.entries()) {
  const depth = job.folder.split('/').length
  const P = '../'.repeat(depth)
  const srcDir = path.join(OUT, job.folder)
  mkdir(srcDir)
  const pages = job.pages(P).map((p) => page({ w: job.w, h: job.h, unit: job.unit, bleed: job.bleed ?? 0, ...p }))
  const html = doc({ title: job.file, pages, w: job.w, h: job.h, unit: job.unit, bleed: job.bleed ?? 0, P, extraCss: job.extraCss ?? '' })
  const htmlFile = path.join(srcDir, `${job.file}.html`)
  fs.writeFileSync(htmlFile, html)

  // Ergebnisse früherer Läufe entfernen (Status kann wechseln: druckfertig ↔ Entwurf)
  for (const d of [srcDir, path.join(OUT, '17_PRINT_READY_EXPORTS', job.folder.split('/')[0])]) {
    for (const suf of ['_PRINT.pdf', '_PRINT_CMYK.pdf', '_ENTWURF.pdf', '_ENTWURF_GRAU.pdf', '_PRINT_GRAU.pdf']) fs.rmSync(path.join(d, job.file + suf), { force: true })
  }

  const W = job.w + 2 * (job.bleed ?? 0)
  const H = job.h + 2 * (job.bleed ?? 0)
  const cssW = job.unit === 'mm' ? mmToPx(W) : W
  const cssH = job.unit === 'mm' ? mmToPx(H) : H
  const dsf = job.kind === 'digital' ? 1 : Math.min(2, 1800 / cssW)
  const ctx = await browser.newContext({ viewport: { width: Math.ceil(cssW), height: Math.ceil(cssH) }, deviceScaleFactor: dsf })
  const pg = await ctx.newPage()
  await pg.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' })
  await pg.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r }))))
  })
  const broken = await pg.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')))

  const reasons = [...(job.draft ?? [])]
  const notes = []
  if (broken.length) reasons.push(`Bild fehlt: ${broken.join(', ')}`)

  // Layout: Texte, QR-Codes und Logo innerhalb des Endformats und mit Sicherheitsabstand.
  // Reicht der Platz nicht, werden die skalierbaren Größen (--k) schrittweise verkleinert.
  const layoutOpts = { pxPerUnit: pxPerUnit(job.unit), minSafe: job.kind === 'print' ? safeZoneFor(job) : 0 }
  let fit = judge(await pg.evaluate(measureInBrowser), layoutOpts)
  let kVal = 1
  while (fit.problems.length && kVal > 0.64) {
    kVal = Math.round((kVal - 0.04) * 100) / 100
    await pg.evaluate((v) => document.querySelectorAll('.trim').forEach((t) => t.style.setProperty('--k', v)), kVal)
    fit = judge(await pg.evaluate(measureInBrowser), layoutOpts)
  }
  if (fit.problems.length) {
    if (kVal < 1) await pg.evaluate(() => document.querySelectorAll('.trim').forEach((t) => t.style.removeProperty('--k')))
    fit = judge(await pg.evaluate(measureInBrowser), layoutOpts)
    reasons.push(`Layout: ${fit.problems[0]}`)
  } else if (kVal < 1) {
    fs.writeFileSync(htmlFile, html.replace('</style></head>', `.trim{--k:${kVal}}</style></head>`))
    notes.push(`Schriftgrößen automatisch auf ${Math.round(kVal * 100)} % angepasst, damit alles im Sicherheitsabstand liegt`)
  }

  // QR
  const qr = await checkQrs(pg, job.qrs ?? [])
  if (!qr.ok) reasons.push(`QR-Prüfung fehlgeschlagen (fehlend: ${qr.missing.join(', ') || '–'}; falsch: ${qr.wrong.map((w) => w.url).join(', ') || '–'})`)
  const qrSizes = qr.res.map((r) => (job.unit === 'mm' ? `${Math.round((r.cssW * 25.4) / 96)} mm` : `${Math.round(r.cssW)} px`))

  // Auflösung
  let minDpi = null
  if (job.kind === 'print') {
    const limit = MIN_DPI[job.cat] ?? 150
    if (job.logoFrac) {
      const d = Math.round(LOGO_PX / ((job.logoFrac * job.w) / 25.4))
      minDpi = d
      if (d < limit) reasons.push(`Logo nur ca. ${d} dpi im Endformat (Ziel ≥ ${limit}) – Vektorfassung des Logos nötig`)
    }
    for (const ph of job.photos ?? []) {
      const [pw, phh] = await dims(ph.file)
      const bw = ph.fw * (job.w + 2 * (ph.bleed ?? 0))
      const bh = ph.fh * (job.h + 2 * (ph.bleed ?? 0))
      const d = Math.round(25.4 / Math.max(bw / pw, bh / phh))
      minDpi = minDpi === null ? d : Math.min(minDpi, d)
      if (d < limit) reasons.push(`Foto ${ph.file} nur ca. ${d} dpi (Ziel ≥ ${limit}) – höher aufgelöstes Foto nötig`)
    }
  } else {
    for (const ph of job.photos ?? []) {
      const [pw, phh] = await dims(ph.file)
      const s = Math.max((ph.fw * job.w) / pw, (ph.fh * job.h) / phh)
      if (s > 1.25) notes.push(`Foto ${ph.file} um Faktor ${s.toFixed(1)} vergrößert (leicht weich)`)
    }
  }
  const ready = reasons.length === 0

  // Vorschau
  const sheets = pg.locator('.sheet')
  const count = await sheets.count()
  const shots = []
  for (let i = 0; i < count; i++) shots.push(await sheets.nth(i).screenshot({ type: 'png' }))
  const files = { source: path.relative(OUT, htmlFile) }
  if (job.kind === 'print') {
    const metas = await Promise.all(shots.map((s) => sharp(s).metadata()))
    const gap = 30
    const pw = metas.reduce((a, m) => a + m.width, 0) + gap * (count - 1)
    const ph = Math.max(...metas.map((m) => m.height))
    let x = 0
    const comps = shots.map((s, i) => { const c = { input: s, left: x, top: 0 }; x += metas[i].width + gap; return c })
    const prev = path.join(srcDir, `${job.file}_VORSCHAU.jpg`)
    const sheet = await sharp({ create: { width: pw, height: ph, channels: 3, background: '#3a3a3e' } }).composite(comps).png().toBuffer()
    await (job.gray ? sharp(sheet).grayscale() : sharp(sheet)).jpeg({ quality: 84, mozjpeg: true }).toFile(prev)
    files.preview = path.relative(OUT, prev)

    // PDF
    const pdfTmp = path.join(srcDir, `${job.file}.tmp.pdf`)
    await pg.pdf({ path: pdfTmp, width: `${W}${job.unit}`, height: `${H}${job.unit}`, printBackground: true, preferCSSPageSize: true })
    const top = job.folder.split('/')[0]
    const destDir = ready ? path.join(OUT, '17_PRINT_READY_EXPORTS', top) : srcDir
    mkdir(destDir)
    const base = path.join(destDir, `${job.file}_${ready ? 'PRINT' : 'ENTWURF'}`)
    fs.renameSync(pdfTmp, `${base}.pdf`)
    await setBoxes(`${base}.pdf`, job.bleed ?? 0)
    files.pdf = path.relative(OUT, `${base}.pdf`)
    if (job.gray) {
      gs(`${base}.pdf`, `${base}_GRAU.pdf`, 'gray')
      await setBoxes(`${base}_GRAU.pdf`, job.bleed ?? 0, 'gray')
      fs.rmSync(`${base}.pdf`)
      files.pdf = path.relative(OUT, `${base}_GRAU.pdf`)
    } else if (ready && !NO_CMYK) {
      gs(`${base}.pdf`, `${base}_CMYK.pdf`, 'cmyk')
      await setBoxes(`${base}_CMYK.pdf`, job.bleed ?? 0, 'cmyk')
      files.pdfCmyk = path.relative(OUT, `${base}_CMYK.pdf`)
    }
  } else {
    const dir = path.join(OUT, job.exportDir)
    mkdir(dir)
    const ext = job.format ?? 'jpg'
    for (let i = 0; i < count; i++) {
      const name = count > 1 ? `${job.file}_${String(i + 1).padStart(2, '0')}.${ext}` : `${job.file}.${ext}`
      const out = path.join(dir, name)
      if (ext === 'png') await sharp(shots[i]).png({ compressionLevel: 9 }).toFile(out)
      else await sharp(shots[i]).flatten({ background: '#0A0A0B' }).jpeg({ quality: 90, mozjpeg: true }).toFile(out)
      ;(files.exports ??= []).push(path.relative(OUT, out))
    }
  }
  await ctx.close()

  manifest.push({
    id: job.id,
    kategorie: job.folder,
    datei: job.file,
    art: job.kind,
    format: job.unit === 'mm' ? `${job.w / (job.w >= 1000 ? 10 : 1)} × ${job.h / (job.w >= 1000 ? 10 : 1)} ${job.w >= 1000 ? 'cm' : 'mm'}` : `${job.w} × ${job.h} px`,
    beschnitt: job.unit === 'mm' ? `${job.bleed ?? 0} mm` : '–',
    seiten: count,
    status: job.kind === 'digital' ? (reasons.length ? 'Entwurf' : 'fertig') : ready ? 'druckfertig (technisch geprüft)' : 'Entwurf',
    gruende: reasons,
    hinweise: [...notes, ...(job.notes ?? [])],
    qr: qr.res.map((r, i) => ({ ziel: r.url, groesse: qrSizes[i] })),
    minDpi,
    randabstand: fit.minGap === null ? null : `${fit.minGap} ${job.unit === 'mm' ? 'mm' : 'px'}`,
    dateien: files,
  })
  console.log(`${String(n + 1).padStart(3)} / ${jobs.length}  ${ready || job.kind === 'digital' ? '✔' : '◌'} ${job.file}${reasons.length ? `  → ${reasons[0]}` : ''}`)
}
await browser.close()

// Manifest zusammenführen (bei Teil-Läufen bestehende Einträge behalten)
const mfFile = path.join(OUT, '20_README_UND_PRODUKTIONSHINWEISE', 'manifest.json')
mkdir(path.dirname(mfFile))
const old = fs.existsSync(mfFile) ? JSON.parse(fs.readFileSync(mfFile, 'utf8')) : []
const byId = new Map(old.map((e) => [e.id, e]))
for (const e of manifest) byId.set(e.id, e)
const all = [...byId.values()].sort((a, b) => a.kategorie.localeCompare(b.kategorie) || a.datei.localeCompare(b.datei))
fs.writeFileSync(mfFile, JSON.stringify(all, null, 2) + '\n')
console.log(`\n✔ ${manifest.length} Aufträge in ${Math.round((Date.now() - t0) / 1000)} s – Manifest: ${all.length} Einträge`)
