#!/usr/bin/env node
/**
 * RM6 Autoaufbereitung – Heckscheiben-Werbung (weiß auf transparent)
 *
 *   npm run heckscheibe        (Maße und Texte: RM6_HECKSCHEIBE_DRUCK/masse.json)
 *
 * Erzeugt drei Entwurfsrichtungen, vergleicht sie, und baut die gewählte Variante als
 *   RM6_Heckscheibe_Druck.svg                    – reine Vektorpfade, #FFFFFF, kein Hintergrund, Maße in mm
 *   RM6_Heckscheibe_Transparent.png              – Alphakanal, Auflösung laut masse.json
 *   RM6_Heckscheibe_Druck.pdf                    – Vektor, RGB-Weiß, transparente Seite (für Folienplot)
 *   RM6_Heckscheibe_Weissdruck_Sonderfarbe.pdf   – Vektor, Weiß als Sonderfarbe (für Digitaldruck mit Weiß)
 *   DRUCKANLEITUNG.md, pruefprotokoll.json, vorschau/, entwuerfe/, optional/
 * Alle Texte sind in Pfade umgewandelt (Schrift: Geist, SIL Open Font License – brand/fonts).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'
import opentype from 'opentype.js'
import { PDFDocument, PDFName, PDFNumber, PDFOperator, PDFOperatorNames as Ops } from 'pdf-lib'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'RM6_HECKSCHEIBE_DRUCK')
const cfg = JSON.parse(fs.readFileSync(path.join(OUT, 'masse.json'), 'utf8'))
const T = cfg.texte
const WHITE = '#FFFFFF'
/** sharp/librsvg rechnet mm-SVGs mit Pixel = Zoll × Dichte² / 72 – daraus die Dichte für eine Ziel-Auflösung */
const svgDensity = (dpi) => Math.sqrt(72 * dpi)

// ─── Schriften ───────────────────────────────────────────────────────────────────
const load = (f) => {
  const b = fs.readFileSync(path.join(root, 'brand/fonts', f))
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
}
const F = { xbold: load('Geist-ExtraBold.ttf'), bold: load('Geist-Bold.ttf'), semi: load('Geist-SemiBold.ttf'), medium: load('Geist-Medium.ttf') }
const capRatio = (font) => font.tables.os2.sCapHeight / font.unitsPerEm
/** Strichstärke eines Schnitts ≈ Breite des „I“ (relativ zur Schriftgröße) */
const stemRatio = (font) => {
  const bb = font.charToGlyph('I').getBoundingBox()
  return (bb.x2 - bb.x1) / font.unitsPerEm
}

// ─── Geometrie: Formen als absolute Pfadbefehle (M L Q C Z) ───────────────────────
const fin = (v) => {
  if (!Number.isFinite(v)) throw new Error(`Ungültiger Koordinatenwert: ${v}`)
  return v
}
function bboxOf(cmds) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity
  for (const c of cmds) {
    for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
      if (kx in c) {
        x1 = Math.min(x1, fin(c[kx])); x2 = Math.max(x2, c[kx])
        y1 = Math.min(y1, fin(c[ky])); y2 = Math.max(y2, c[ky])
      }
    }
  }
  return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1 }
}
const mapCmds = (cmds, f) =>
  cmds.map((c) => {
    const o = { type: c.type }
    for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) if (kx in c) [o[kx], o[ky]] = f(c[kx], c[ky])
    return o
  })
const shift = (shape, dx, dy) => ({ ...shape, cmds: mapCmds(shape.cmds, (x, y) => [x + dx, y + dy]) })

/** Text als Pfad, Grundlinie bei y = 0, Start bei x = 0 */
function text(font, str, { cap, ls = 0, spaceExtra = 0, role }) {
  const size = cap / capRatio(font)
  const glyphs = [...str].map((ch) => font.charToGlyph(ch))
  let x = 0
  const cmds = []
  glyphs.forEach((g, i) => {
    cmds.push(...g.getPath(x, 0, size).commands)
    let adv = (g.advanceWidth / font.unitsPerEm) * size
    if (i < glyphs.length - 1) {
      adv += (font.getKerningValue(g, glyphs[i + 1]) / font.unitsPerEm) * size + ls * size
      if (str[i] === ' ') adv += spaceExtra * size
    }
    x += adv
  })
  return { cmds, role, str, cap, size, stem: stemRatio(font) * size, font }
}
/** Größte Versalhöhe, mit der ein Text in eine Breite passt */
function fitCap(font, str, width, opts = {}) {
  const probe = text(font, str, { ...opts, cap: 100 })
  return (100 * width) / bboxOf(probe.cmds).w
}
const rect = (x, y, w, h, role) => ({ role, cmds: [{ type: 'M', x, y }, { type: 'L', x: x + w, y }, { type: 'L', x: x + w, y: y + h }, { type: 'L', x, y: y + h }, { type: 'Z' }] })
function dot(cx, cy, r, role = 'punkt') {
  const k = 0.5522847498 * r
  return {
    role,
    cmds: [
      { type: 'M', x: cx + r, y: cy },
      { type: 'C', x1: cx + r, y1: cy + k, x2: cx + k, y2: cy + r, x: cx, y: cy + r },
      { type: 'C', x1: cx - k, y1: cy + r, x2: cx - r, y2: cy + k, x: cx - r, y: cy },
      { type: 'C', x1: cx - r, y1: cy - k, x2: cx - k, y2: cy - r, x: cx, y: cy - r },
      { type: 'C', x1: cx + k, y1: cy - r, x2: cx + r, y2: cy - k, x: cx + r, y: cy },
      { type: 'Z' },
    ],
  }
}
/** Vierzackiger Glanzpunkt (wie im RM-Markenzeichen) */
function sparkle(cx, cy, r) {
  return {
    role: 'glanzpunkt',
    cmds: [
      { type: 'M', x: cx, y: cy - r },
      { type: 'Q', x1: cx, y1: cy, x: cx + r, y: cy },
      { type: 'Q', x1: cx, y1: cy, x: cx, y: cy + r },
      { type: 'Q', x1: cx, y1: cy, x: cx - r, y: cy },
      { type: 'Q', x1: cx, y1: cy, x: cx, y: cy - r },
      { type: 'Z' },
    ],
  }
}
const place = (shape, x, baseline) => shift(shape, x, baseline)
/** Ink-zentriert platzieren */
function center(shape, cx, baseline) {
  const b = bboxOf(shape.cmds)
  return shift(shape, cx - (b.x1 + b.x2) / 2, baseline)
}
function leftAt(shape, x, baseline) {
  const b = bboxOf(shape.cmds)
  return shift(shape, x - b.x1, baseline)
}
function rightAt(shape, x, baseline) {
  const b = bboxOf(shape.cmds)
  return shift(shape, x - b.x2, baseline)
}

// ─── Markenzeichen RM6: kräftige Versalien, der „6“ ist der Glanzpunkt zugeordnet ───
function brand(cap) {
  const t = text(F.xbold, T.marke, { cap, ls: -0.012, role: 'marke' })
  // Glyphen-Grenzen der letzten Ziffer bestimmen
  const glyphs = [...T.marke].map((c) => F.xbold.charToGlyph(c))
  const size = t.size
  let x = 0
  for (let i = 0; i < glyphs.length - 1; i++) x += (glyphs[i].advanceWidth / 1000) * size + (F.xbold.getKerningValue(glyphs[i], glyphs[i + 1]) / 1000) * size - 0.012 * size
  const six = bboxOf(glyphs.at(-1).getPath(x, 0, size).commands)
  const r = cap * 0.17
  const sp = sparkle(six.x2 + r * 0.95, -cap - r * 0.05, r)
  const letters = bboxOf(t.cmds)
  return { parts: [t, sp], letters, overhang: bboxOf(sp.cmds).x2 - letters.x2, cap }
}
const placeBrandCentered = (b, cx, baseline) => {
  // optische Mitte: Buchstaben plus halber Überstand des Glanzpunkts
  const mid = (b.letters.x1 + b.letters.x2 + b.overhang) / 2
  return b.parts.map((p) => shift(p, cx - mid, baseline))
}

/** Feine Linie mit Punkt am Ende: von x1 bis x2 (Punkt an x1 bzw. x2 je nach Seite) */
function ruleWithDot(xFrom, xTo, cy, thick, dotR, dotAt) {
  const x1 = Math.min(xFrom, xTo), x2 = Math.max(xFrom, xTo)
  return [rect(x1, cy - thick / 2, x2 - x1, thick, 'linie'), dot(dotAt === 'start' ? xFrom : xTo, cy, dotR)]
}

// ═════════════════════════════════════════════════════════════════════════════════
// Entwurf A – „Zentriert“: klare Hierarchie von oben nach unten, symmetrisch
// ═════════════════════════════════════════════════════════════════════════════════
function designA() {
  const s = []
  const capBrand = 76
  const b = brand(capBrand)
  s.push(...placeBrandCentered(b, 0, capBrand))
  let y = capBrand + 15
  const capLine = 15.5
  const line = text(F.semi, T.zeile, { cap: capLine, ls: 0.28, role: 'zeile' })
  s.push(center(line, 0, y + capLine))
  y += capLine + 18
  const phone = text(F.bold, T.telefon, { cap: 47, ls: 0.005, spaceExtra: 0.08, role: 'telefon' })
  const phoneW = bboxOf(phone.cmds).w
  const capSlogan = 8.6
  const slogan = text(F.medium, T.slogan, { cap: capSlogan, ls: 0.34, role: 'slogan' })
  const sw = bboxOf(slogan.cmds).w
  const cy = y + capSlogan / 2
  s.push(center(slogan, 0, y + capSlogan))
  const thick = 1.7, dotR = 2.6, gap = 11
  s.push(...ruleWithDot(-phoneW / 2 + dotR, -sw / 2 - gap, cy, thick, dotR, 'start'))
  s.push(...ruleWithDot(sw / 2 + gap, phoneW / 2 - dotR, cy, thick, dotR, 'end'))
  y += capSlogan + 19
  s.push(center(phone, 0, y + 47))
  y += 47 + 15
  const web = text(F.semi, T.web, { cap: 27, ls: 0.03, role: 'web' })
  s.push(center(web, 0, y + 27))
  return s
}

// ═════════════════════════════════════════════════════════════════════════════════
// Final – Entwurf A perfektioniert: gleiche Hierarchie, Website neben der Nummer → deutlich flacher
// ═════════════════════════════════════════════════════════════════════════════════
const FINAL_GEOMETRY = { thick: 1.7, dotR: 2.6 }
function designFinal() {
  const s = []
  const capBrand = 76
  const b = brand(capBrand)
  s.push(...placeBrandCentered(b, 0, capBrand))
  let y = capBrand + 17
  const capLine = 15.5
  s.push(center(text(F.semi, T.zeile, { cap: capLine, ls: 0.28, role: 'zeile' }), 0, y + capLine))
  y += capLine + 18
  // Kontaktzeile: Telefonnummer (Hauptelement) · Website, gemeinsame Grundlinie
  const capPhone = 47, capWeb = 31
  const phone = text(F.bold, T.telefon, { cap: capPhone, ls: 0.005, spaceExtra: 0.08, role: 'telefon' })
  const web = text(F.semi, T.web, { cap: capWeb, ls: 0.03, role: 'web' })
  const pw = bboxOf(phone.cmds).w, ww = bboxOf(web.cmds).w
  const sepGap = 24, sepR = 3.4
  const rowW = pw + sepGap * 2 + sepR * 2 + ww
  const capSlogan = 8.6
  const slogan = text(F.medium, T.slogan, { cap: capSlogan, ls: 0.34, role: 'slogan' })
  const sw = bboxOf(slogan.cmds).w
  const { thick, dotR } = FINAL_GEOMETRY
  const cy = y + capSlogan / 2
  s.push(center(slogan, 0, y + capSlogan))
  s.push(...ruleWithDot(-rowW / 2 + dotR, -sw / 2 - 12, cy, thick, dotR, 'start'))
  s.push(...ruleWithDot(sw / 2 + 12, rowW / 2 - dotR, cy, thick, dotR, 'end'))
  y += capSlogan + 19
  const base = y + capPhone
  s.push(leftAt(phone, -rowW / 2, base))
  s.push(dot(-rowW / 2 + pw + sepGap + sepR, base - capPhone / 2, sepR))
  s.push(rightAt(web, rowW / 2, base))
  return s
}

// ═════════════════════════════════════════════════════════════════════════════════
// Entwurf B – „Split“: Marke links, Kontakt rechts, getrennt durch eine feine Senkrechte
// ═════════════════════════════════════════════════════════════════════════════════
function designB() {
  const s = []
  const capBrand = 80
  const b = brand(capBrand)
  const brandParts = b.parts.map((p) => shift(p, -b.letters.x1, capBrand))
  s.push(...brandParts)
  const leftW = b.letters.w + b.overhang
  const capLine = fitCap(F.semi, T.zeile, leftW, { ls: 0.22 })
  s.push(leftAt(text(F.semi, T.zeile, { cap: capLine, ls: 0.22, role: 'zeile' }), 0, capBrand + 15 + capLine))
  const capSlogan = fitCap(F.medium, T.slogan, leftW, { ls: 0.2 })
  const ySlogan = capBrand + 15 + capLine + 14 + capSlogan
  s.push(leftAt(text(F.medium, T.slogan, { cap: capSlogan, ls: 0.2, role: 'slogan' }), 0, ySlogan))
  const leftH = ySlogan
  const xDiv = leftW + 30
  s.push(rect(xDiv - 0.85, 4, 1.7, leftH - 8, 'linie'), dot(xDiv, 0, 2.6), dot(xDiv, leftH, 2.6))
  const capPhone = 46
  const capWeb = 26
  const rightH = capPhone + 22 + capWeb
  const top = (leftH - rightH) / 2
  s.push(leftAt(text(F.bold, T.telefon, { cap: capPhone, ls: 0.005, spaceExtra: 0.08, role: 'telefon' }), xDiv + 30, top + capPhone))
  s.push(leftAt(text(F.semi, T.web, { cap: capWeb, ls: 0.03, role: 'web' }), xDiv + 30, top + rightH))
  return s
}

// ═════════════════════════════════════════════════════════════════════════════════
// Entwurf C – „Band“: Marke und Zusatz in einer Zeile, darunter Linie und Kontaktzeile
// ═════════════════════════════════════════════════════════════════════════════════
function designC() {
  const s = []
  const capBrand = 66
  const b = brand(capBrand)
  s.push(...b.parts.map((p) => shift(p, -b.letters.x1, capBrand)))
  const xs = b.letters.w + b.overhang + 22
  const capLine = 17
  s.push(leftAt(text(F.semi, T.zeile, { cap: capLine, ls: 0.22, role: 'zeile' }), xs, capLine + 6))
  s.push(leftAt(text(F.medium, T.slogan, { cap: 9.2, ls: 0.3, role: 'slogan' }), xs, capBrand))
  const phone = text(F.bold, T.telefon, { cap: 46, ls: 0.005, spaceExtra: 0.08, role: 'telefon' })
  const web = text(F.semi, T.web, { cap: 27, ls: 0.03, role: 'web' })
  const phoneW = bboxOf(phone.cmds).w, webW = bboxOf(web.cmds).w
  const row1W = xs + bboxOf(text(F.semi, T.zeile, { cap: capLine, ls: 0.22 }).cmds).w
  const W = Math.max(row1W, phoneW + 40 + webW)
  const yRule = capBrand + 20
  s.push(...ruleWithDot(2.6, W / 2, yRule, 1.7, 2.6, 'start'), ...ruleWithDot(W / 2, W - 2.6, yRule, 1.7, 2.6, 'end'))
  const yBase = yRule + 20 + 46
  s.push(leftAt(phone, 0, yBase), rightAt(web, W, yBase))
  return s
}

// ─── Ausgabe: auf Endmaß skalieren ─────────────────────────────────────────────────
function toFinal(shapes, { width, maxHeight, margin }) {
  const all = bboxOf(shapes.flatMap((s) => s.cmds))
  let scale = (width - 2 * margin) / all.w
  if (maxHeight && all.h * scale > maxHeight - 2 * margin) scale = (maxHeight - 2 * margin) / all.h
  const W = all.w * scale + 2 * margin
  const H = all.h * scale + 2 * margin
  const out = shapes.map((s) => ({ ...s, cmds: mapCmds(s.cmds, (x, y) => [(x - all.x1) * scale + margin, (y - all.y1) * scale + margin]), cap: s.cap ? s.cap * scale : undefined, stem: s.stem ? s.stem * scale : undefined }))
  return { shapes: out, W, H, scale }
}
const num = (v) => String(Number(fin(v).toFixed(3)))
function dOf(cmds) {
  return cmds
    .map((c) => (c.type === 'Z' ? 'Z' : c.type === 'Q' ? `Q${num(c.x1)} ${num(c.y1)} ${num(c.x)} ${num(c.y)}` : c.type === 'C' ? `C${num(c.x1)} ${num(c.y1)} ${num(c.x2)} ${num(c.y2)} ${num(c.x)} ${num(c.y)}` : `${c.type}${num(c.x)} ${num(c.y)}`))
    .join('')
}
function svgOf({ shapes, W, H }, fill = WHITE, title = 'RM6 Autoaufbereitung – Heckscheiben-Werbung') {
  const groups = {}
  for (const s of shapes) (groups[s.role] ??= []).push(dOf(s.cmds))
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${num(W)}mm" height="${num(H)}mm" viewBox="0 0 ${num(W)} ${num(H)}">
<title>${title}</title>
<desc>Endmaß ${num(W)} × ${num(H)} mm (Einheit der Koordinaten: mm). Einfarbig ${fill}, transparenter Hintergrund, alle Texte in Pfade umgewandelt.</desc>
${Object.entries(groups).map(([role, ds]) => `<path id="${role}" fill="${fill}" d="${ds.join('')}"/>`).join('\n')}
</svg>
`
}

// ─── PDF (eigene Pfade → PDF-Operatoren) ───────────────────────────────────────────
async function pdfOf({ shapes, W, H }, mode) {
  const k = 72 / 25.4
  const pdf = await PDFDocument.create()
  pdf.setTitle(`RM6 Autoaufbereitung – Heckscheibe ${num(W)} × ${num(H)} mm${mode === 'spot' ? ' – Weiß als Sonderfarbe' : ''}`)
  pdf.setAuthor('RM6 Autoaufbereitung')
  pdf.setProducer('scripts/build-rm6-heckscheibe.mjs')
  const page = pdf.addPage([W * k, H * k])
  for (const box of ['setTrimBox', 'setBleedBox', 'setArtBox', 'setCropBox']) page[box](0, 0, W * k, H * k)
  const N = (v) => PDFNumber.of(Number(fin(v).toFixed(4)))
  const P = (x, y) => [N(x * k), N((H - y) * k)]
  const ops = [PDFOperator.of(Ops.PushGraphicsState)]
  if (mode === 'spot') {
    const ctx = pdf.context
    const fn = ctx.obj({ FunctionType: 2, Domain: [0, 1], C0: [0, 0, 0, 0], C1: [0, 0, 0, 0], N: 1 })
    const cs = ctx.obj([PDFName.of('Separation'), PDFName.of(cfg.weiss_sonderfarbe_name), PDFName.of('DeviceCMYK'), fn])
    page.node.Resources().set(PDFName.of('ColorSpace'), ctx.obj({ CS0: cs }))
    ops.push(PDFOperator.of(Ops.NonStrokingColorspace, [PDFName.of('CS0')]), PDFOperator.of(Ops.NonStrokingColorN, [N(1)]))
  } else {
    ops.push(PDFOperator.of(Ops.NonStrokingColorRgb, [N(1), N(1), N(1)]))
  }
  for (const s of shapes) {
    let cx = 0, cy = 0
    for (const c of s.cmds) {
      if (c.type === 'M') { ops.push(PDFOperator.of(Ops.MoveTo, P(c.x, c.y))); cx = c.x; cy = c.y }
      else if (c.type === 'L') { ops.push(PDFOperator.of(Ops.LineTo, P(c.x, c.y))); cx = c.x; cy = c.y }
      else if (c.type === 'C') { ops.push(PDFOperator.of(Ops.AppendBezierCurve, [...P(c.x1, c.y1), ...P(c.x2, c.y2), ...P(c.x, c.y)])); cx = c.x; cy = c.y }
      else if (c.type === 'Q') {
        // quadratisch → kubisch (exakt)
        const c1x = cx + (2 / 3) * (c.x1 - cx), c1y = cy + (2 / 3) * (c.y1 - cy)
        const c2x = c.x + (2 / 3) * (c.x1 - c.x), c2y = c.y + (2 / 3) * (c.y1 - c.y)
        ops.push(PDFOperator.of(Ops.AppendBezierCurve, [...P(c1x, c1y), ...P(c2x, c2y), ...P(c.x, c.y)]))
        cx = c.x; cy = c.y
      } else if (c.type === 'Z') ops.push(PDFOperator.of(Ops.ClosePath))
    }
    ops.push(PDFOperator.of(Ops.FillNonZero))
  }
  ops.push(PDFOperator.of(Ops.PopGraphicsState))
  page.pushOperators(...ops)
  return pdf.save({ useObjectStreams: false })
}

// ─── Kennzahlen für den Vergleich ──────────────────────────────────────────────────
function metrics(final) {
  const by = (role) => final.shapes.find((s) => s.role === role)
  const caps = final.shapes.filter((s) => s.cap).map((s) => s.cap)
  const stems = final.shapes.filter((s) => s.stem).map((s) => s.stem)
  return {
    breite: final.W, hoehe: final.H,
    marke: by('marke').cap, zeile: by('zeile').cap, slogan: by('slogan').cap, telefon: by('telefon').cap, web: by('web').cap,
    kleinsteVersalhoehe: Math.min(...caps), duennsterStrich: Math.min(...stems),
  }
}

// ═════════════════════════════════════════════════════════════════════════════════
const tmpDir = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'rm6-'))
for (const d of ['vorschau', 'entwuerfe', 'optional']) fs.mkdirSync(path.join(OUT, d), { recursive: true })

const DESIGNS = { A: ['Zentriert', designA], B: ['Split', designB], C: ['Band', designC], F: ['Final (A perfektioniert)', designFinal] }
const HIERARCHIE = { A: 'ja', B: 'nein – Kontakt rechts neben der Marke', C: 'teilweise – AUTOAUFBEREITUNG neben RM6', F: 'ja' }
// Vergleich in einem typischen Rahmen auf der Heckscheibe: max. 800 × 300 mm
const BOX = { width: 800, maxHeight: 300, margin: 10 }
const compare = {}
for (const [key, [name, fn]] of Object.entries(DESIGNS)) {
  const f = toFinal(fn(), BOX)
  compare[key] = { name, ...metrics(f) }
  if (key !== 'F') fs.writeFileSync(path.join(OUT, 'entwuerfe', `RM6_Entwurf_${key}_${name}.svg`), svgOf(f, WHITE, `RM6 – Entwurf ${key} (${name})`))
}
for (const [k, c] of Object.entries(compare)) c.hierarchie = HIERARCHIE[k]
const CHOSEN = 'A' // Begründung siehe DRUCKANLEITUNG.md – die finale Datei ist Entwurf A, perfektioniert (F)

// ─── Finale Datei ──────────────────────────────────────────────────────────────────
const final = toFinal(designFinal(), { width: cfg.breite_mm, maxHeight: cfg.max_hoehe_mm, margin: cfg.sicherheitsabstand_mm })
const m = metrics(final)
const svg = svgOf(final)
const files = {
  svg: path.join(OUT, 'RM6_Heckscheibe_Druck.svg'),
  png: path.join(OUT, 'RM6_Heckscheibe_Transparent.png'),
  pdf: path.join(OUT, 'RM6_Heckscheibe_Druck.pdf'),
  spot: path.join(OUT, 'RM6_Heckscheibe_Weissdruck_Sonderfarbe.pdf'),
}
fs.writeFileSync(files.svg, svg)
fs.writeFileSync(path.join(OUT, 'optional', 'RM6_Heckscheibe_Variante_Schwarz_fuer_helle_Scheiben.svg'), svgOf(final, '#000000', 'RM6 Autoaufbereitung – optionale Variante Schwarz für helle Scheiben'))
await sharp(Buffer.from(svg), { density: svgDensity(cfg.png_dpi), limitInputPixels: false }).png({ compressionLevel: 9 }).toFile(files.png)
fs.writeFileSync(files.pdf, await pdfOf(final, 'rgb'))
fs.writeFileSync(files.spot, await pdfOf(final, 'spot'))

// ─── Vorschauen (nur zur Ansicht – nicht drucken) ──────────────────────────────────
async function onGlass(svgText, light, outFile, widthPx = 1800) {
  const svgW = Number(svgText.match(/width="([\d.]+)mm"/)[1])
  const decal = await sharp(Buffer.from(svgText), { density: svgDensity((widthPx / svgW) * 25.4) }).png().toBuffer()
  const meta = await sharp(decal).metadata()
  const pad = Math.round(widthPx * 0.08)
  const W = meta.width + pad * 2, H = meta.height + pad * 2
  const bg = light
    ? `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf0"/><stop offset="0.5" stop-color="#c3ccd3"/><stop offset="1" stop-color="#a7b2bb"/></linearGradient>`
    : `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20262c"/><stop offset="0.55" stop-color="#11151a"/><stop offset="1" stop-color="#0a0c0f"/></linearGradient>`
  const glass = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${bg}<linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0.25" stop-color="#fff" stop-opacity="0"/><stop offset="0.42" stop-color="#fff" stop-opacity="${light ? 0.28 : 0.05}"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" rx="${pad * 0.6}" fill="url(#g)"/><rect width="${W}" height="${H}" rx="${pad * 0.6}" fill="url(#r)"/></svg>`
  await sharp(Buffer.from(glass)).composite([{ input: decal, left: pad, top: pad }]).png().toFile(outFile)
}
const finalWhite = svg
await onGlass(finalWhite, false, path.join(OUT, 'vorschau', 'RM6_Vorschau_dunkle_Scheibe.png'))
await onGlass(finalWhite, true, path.join(OUT, 'vorschau', 'RM6_Vorschau_helle_Scheibe.png'))
await onGlass(svgOf(final, '#000000'), true, path.join(OUT, 'vorschau', 'RM6_Vorschau_optional_schwarz_helle_Scheibe.png'))

// Entwürfe nebeneinander
{
  const tiles = []
  for (const key of Object.keys(DESIGNS)) {
    const f = path.join(tmpDir, `${key}.png`)
    const s = key === 'F' ? svgOf(toFinal(designFinal(), BOX)) : fs.readFileSync(path.join(OUT, 'entwuerfe', `RM6_Entwurf_${key}_${DESIGNS[key][0]}.svg`), 'utf8')
    await onGlass(s, false, f, 1000)
    const img = await sharp(f).resize({ width: 1100, height: 520, fit: 'contain', background: '#2a2d31' }).png().toBuffer()
    const c = compare[key]
    const label = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="70"><rect width="1100" height="70" fill="#2a2d31"/><text x="20" y="44" font-family="DejaVu Sans" font-size="26" fill="#f4f1ea">${key === 'F' ? 'Final – A perfektioniert' : `Entwurf ${key} – ${c.name}`}   ·   Telefon ${c.telefon.toFixed(0)} mm · RM6 ${c.marke.toFixed(0)} mm · Format ${c.breite.toFixed(0)}×${c.hoehe.toFixed(0)} mm</text></svg>`
    tiles.push(await sharp({ create: { width: 1100, height: 590, channels: 3, background: '#2a2d31' } }).composite([{ input: Buffer.from(label), top: 0, left: 0 }, { input: img, top: 70, left: 0 }]).png().toBuffer())
  }
  await sharp({ create: { width: 1100, height: 590 * tiles.length + 20 * (tiles.length - 1), channels: 3, background: '#1b1d20' } })
    .composite(tiles.map((input, i) => ({ input, left: 0, top: i * 610 })))
    .png()
    .toFile(path.join(OUT, 'vorschau', 'RM6_Entwuerfe_Vergleich.png'))
}

// ═════════════════════════════════════════════════════════════════════════════════
// Qualitätskontrolle
// ═════════════════════════════════════════════════════════════════════════════════
const qa = []
const check = (name, ok, detail = '') => {
  qa.push({ pruefung: name, ok, detail })
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` – ${detail}` : ''}`)
}
// SVG
check('SVG enthält nur Pfade (keine Texte, Bilder, Verknüpfungen, Konturen, Verläufe, Filter)', !/<text|<image|href=|stroke|Gradient|filter|<rect|<use|font-family/i.test(svg))
const fills = [...svg.matchAll(/fill="([^"]+)"/g)].map((x) => x[1])
check('Alle Elemente exakt #FFFFFF', fills.length > 0 && fills.every((f) => f === WHITE), `${fills.length} Pfadgruppen`)
check('Kein Hintergrundobjekt', !/<rect|<image/.test(svg))
const inner = bboxOf(final.shapes.flatMap((s) => s.cmds))
const minMargin = Math.min(inner.x1, inner.y1, final.W - inner.x2, final.H - inner.y2)
check('Sicherheitsabstand zum Rand eingehalten', minMargin >= cfg.sicherheitsabstand_mm - 0.01, `${minMargin.toFixed(1)} mm`)
// PNG
{
  const { data, info } = await sharp(files.png).raw().toBuffer({ resolveWithObject: true })
  let transparent = 0, visible = 0, nonWhite = 0, minRGB = 255
  for (let i = 0; i < data.length; i += info.channels) {
    const a = data[i + 3]
    if (a === 0) transparent++
    else {
      visible++
      const mn = Math.min(data[i], data[i + 1], data[i + 2])
      if (mn < minRGB) minRGB = mn
      if (mn < 255) nonWhite++
    }
  }
  const corners = [0, (info.width - 1) * 4, (info.height - 1) * info.width * 4, (info.height * info.width - 1) * 4].map((o) => data[o + 3])
  check('PNG mit Alphakanal, Hintergrund transparent', info.channels === 4 && corners.every((a) => a === 0) && transparent > visible, `${info.width}×${info.height} px (${cfg.png_dpi} dpi), ${((transparent / (transparent + visible)) * 100).toFixed(1)} % transparent`)
  check('PNG: alle sichtbaren Pixel reines Weiß', nonWhite === 0, `kleinster Farbwert ${minRGB}`)
}
// PDF
for (const [label, file] of [['PDF (RGB-Weiß)', files.pdf], ['PDF (Sonderfarbe)', files.spot]]) {
  const info = execFileSync('pdfinfo', ['-box', file]).toString()
  const media = info.match(/MediaBox:\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  const wmm = (Number(media[3]) / 72) * 25.4, hmm = (Number(media[4]) / 72) * 25.4
  const out = path.join(tmpDir, 'pdf')
  execFileSync('pdftocairo', ['-png', '-transp', '-r', '25', '-singlefile', file, out])
  const st = await sharp(`${out}.png`).raw().toBuffer({ resolveWithObject: true })
  let vis = 0, bad = 0
  for (let i = 0; i < st.data.length; i += 4) if (st.data[i + 3] > 200) { vis++; if (Math.min(st.data[i], st.data[i + 1], st.data[i + 2]) < 250) bad++ }
  check(`${label}: Endmaß, transparente Seite, Inhalt weiß`, Math.abs(wmm - final.W) < 0.2 && Math.abs(hmm - final.H) < 0.2 && vis > 0 && bad === 0, `${wmm.toFixed(1)} × ${hmm.toFixed(1)} mm`)
}
check('Sonderfarben-PDF: Flächen in Separation „' + cfg.weiss_sonderfarbe_name + '“', new RegExp(`/Separation\\s*/${cfg.weiss_sonderfarbe_name}\\s*/DeviceCMYK`).test(fs.readFileSync(files.spot, 'latin1')))
// Texterkennung je Textelement (jede Zeile einzeln gerendert) und für das Gesamtmotiv
async function ocr(shapes, psm) {
  const f = toFinal(shapes, { width: 2000, margin: 60 })
  const img = path.join(tmpDir, `ocr-${Math.random().toString(36).slice(2)}.png`)
  await sharp(Buffer.from(svgOf(f)), { density: svgDensity(25.4) }).flatten({ background: '#000000' }).negate({ alpha: false }).grayscale().png().toFile(img)
  return execFileSync('tesseract', [img, 'stdout', '--psm', String(psm), '--dpi', '300', '-l', 'eng'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().replace(/\s+/g, ' ').trim()
}
for (const [role, expected] of [['marke', T.marke], ['zeile', T.zeile], ['slogan', T.slogan], ['telefon', T.telefon], ['web', T.web]]) {
  const got = await ocr(final.shapes.filter((x) => x.role === role), 7)
  const ok = role === 'telefon' ? got.replace(/\D/g, '') === expected.replace(/\D/g, '') && got.includes(expected) : got === expected
  check(`Texterkennung „${expected}“`, ok, `erkannt: ${JSON.stringify(got)}`)
}
check('Texterkennung Gesamtmotiv (Information)', true, `erkannt: ${JSON.stringify(await ocr(final.shapes, 6))}`)
check('Telefonnummer gehört zu den größten Elementen', m.telefon >= 0.55 * m.marke && m.telefon > m.zeile * 2.5 && m.telefon > m.web, `Telefon ${m.telefon.toFixed(1)} mm · RM6 ${m.marke.toFixed(1)} mm · Website ${m.web.toFixed(1)} mm Versalhöhe`)
check('Kleinste Details plotbar (Strich ≥ 1 mm, Punkte ≥ 3 mm)', m.duennsterStrich >= 1 && FINAL_GEOMETRY.dotR * 2 * final.scale >= 3 && FINAL_GEOMETRY.thick * final.scale >= 1, `dünnster Schriftstrich ${m.duennsterStrich.toFixed(1)} mm, Linie ${(FINAL_GEOMETRY.thick * final.scale).toFixed(1)} mm, Punkt Ø ${(FINAL_GEOMETRY.dotR * 2 * final.scale).toFixed(1)} mm`)

const failed = qa.filter((q) => !q.ok)
fs.writeFileSync(path.join(OUT, 'pruefprotokoll.json'), JSON.stringify({ erzeugt: new Date().toISOString(), masse: { breite_mm: Number(final.W.toFixed(1)), hoehe_mm: Number(final.H.toFixed(1)) }, versalhoehen_mm: Object.fromEntries(['marke', 'zeile', 'slogan', 'telefon', 'web'].map((k) => [k, Number(m[k].toFixed(1))])), entwuerfe: compare, gewaehlt: CHOSEN, pruefungen: qa }, null, 2) + '\n')

// ─── Druckanleitung (aus den aktuellen Maßen erzeugt) ──────────────────────────────
const cm = (mm) => (mm / 10).toFixed(1).replace('.', ',')
const dist = (mm) => `${Math.round((mm / 10) * 3)}–${Math.round((mm / 10) * 5)} m`
const fmt = (v) => v.toFixed(0)
const table = Object.entries(compare).map(([k, c]) => `| ${k === 'F' ? '**Final – A perfektioniert**' : `${k} – ${c.name}`} | ${c.hierarchie} | ${fmt(c.breite)} × ${fmt(c.hoehe)} mm | ${fmt(c.marke)} mm | ${fmt(c.telefon)} mm | ${fmt(c.web)} mm | ${c.kleinsteVersalhoehe.toFixed(1)} mm |`).join('\n')
fs.writeFileSync(path.join(OUT, 'DRUCKANLEITUNG.md'), `# RM6 Autoaufbereitung – Heckscheiben-Werbung: Druckanleitung

Motiv: **RM6 · AUTOAUFBEREITUNG · PREMIUM FAHRZEUGPFLEGE · ${T.telefon} · ${T.web}**
Ausführung: einfarbig **Weiß (#FFFFFF)** auf transparentem Untergrund, ohne Hintergrund, alle Texte in Pfade umgewandelt.

## Dateien

| Datei | Wofür |
| --- | --- |
| \`RM6_Heckscheibe_Druck.svg\` | Hauptdatei: reine Vektorpfade, Maße in mm, verlustfrei skalierbar |
| \`RM6_Heckscheibe_Druck.pdf\` | Dieselbe Grafik als Vektor-PDF (Weiß als RGB #FFFFFF), z. B. für den **Folienplot** |
| \`RM6_Heckscheibe_Weissdruck_Sonderfarbe.pdf\` | Dieselbe Grafik, Weiß als **Sonderfarbe „${cfg.weiss_sonderfarbe_name}“** – für Digitaldruck mit Weiß auf transparenter Folie |
| \`RM6_Heckscheibe_Transparent.png\` | Pixelbild mit echtem Alphakanal, ${cfg.png_dpi} dpi im Endmaß (Ansicht, Angebot, Social Media) |
| \`masse.json\` | Maße, Sicherheitsabstand, Sonderfarbname und Texte – hier ändern, dann \`npm run heckscheibe\` |
| \`vorschau/\` | Ansichten auf dunkler und heller Scheibe, Vergleich der Entwürfe – **nicht drucken** |
| \`entwuerfe/\` | Die drei Entwurfsrichtungen A, B, C als SVG (zum Vergleich) |
| \`optional/\` | Variante in Schwarz für sehr helle Scheiben (siehe „Kontrast“) |
| \`pruefprotokoll.json\` | Ergebnis der automatischen Prüfung |

**Hinweis zur Ansicht:** Weiß auf transparentem Hintergrund ist in vielen Programmen und Browsern auf weißem Grund unsichtbar. Das ist kein Fehler – zum Ansehen die Vorschaubilder verwenden.

## Maße (aktuell)

**${cm(final.W)} × ${cm(final.H)} cm** (inkl. ${cfg.sicherheitsabstand_mm} mm Sicherheitsabstand rundum).

| Element | Versalhöhe | grobe Lesedistanz* |
| --- | --- | --- |
| RM6 | ${cm(m.marke)} cm | ${dist(m.marke)} |
| Telefonnummer | ${cm(m.telefon)} cm | ${dist(m.telefon)} |
| Website | ${cm(m.web)} cm | ${dist(m.web)} |
| AUTOAUFBEREITUNG | ${cm(m.zeile)} cm | ${dist(m.zeile)} |
| PREMIUM FAHRZEUGPFLEGE | ${cm(m.slogan)} cm | ${dist(m.slogan)} |

\\* Gängige Faustregel der Schilderbranche: etwa 3–5 m Lesedistanz je Zentimeter Buchstabenhöhe – bei gutem Kontrast und Licht, ohne Bewegung. Im fließenden Verkehr und bei hellem Glas deutlich weniger.

**Andere Größe:** In \`masse.json\` \`breite_mm\` (und bei Bedarf \`max_hoehe_mm\`) eintragen und \`npm run heckscheibe\` ausführen – alle Dateien, Maße und diese Anleitung werden neu erzeugt und erneut geprüft. Alternativ die SVG/PDF in jedem Grafikprogramm **proportional** skalieren. Empfehlung: nicht schmaler als etwa 50 cm, damit die Telefonnummer mindestens rund 3 cm hoch bleibt.

## Entwürfe und Auswahl

Alle Varianten im selben Rahmen verglichen (höchstens 80 × 30 cm, Werte = Versalhöhe):

| Variante | Hierarchie wie gewünscht | Format | RM6 | Telefon | Website | kleinste Zeile |
| --- | --- | --- | --- | --- | --- | --- |
${table}

- **A – Zentriert** folgt exakt der gewünschten Hierarchie und ist symmetrisch, wird mit der Website unter der Nummer aber sehr hoch (bei 70 cm Breite rund 35 cm).
- **B – Split** ist flach, hat aber die kleinste Telefonnummer, und die Kontaktdaten stehen neben statt unter der Marke.
- **C – Band** bringt die größte Telefonnummer, setzt AUTOAUFBEREITUNG jedoch neben RM6 – weicht also von der Hierarchie ab.

**Gewählt: A, perfektioniert (Final).** Die Website steht rechts neben der Telefonnummer, getrennt durch einen Punkt, auf derselben Grundlinie. Dadurch wird der Aufkleber deutlich flacher als A, ohne die Hierarchie aufzugeben: oben RM6 mit dem Glanzpunkt an der „6“, darunter AUTOAUFBEREITUNG, in der Mitte PREMIUM FAHRZEUGPFLEGE zwischen feinen Linien mit Punkten, unten die Telefonnummer als breiteste Zeile. Die Linien nehmen exakt die Breite der Kontaktzeile auf; alles ist auf eine Mittelachse ausgerichtet.
Ist die Scheibe besonders niedrig, ist C die Alternative (\`entwuerfe/RM6_Entwurf_C_Band.svg\`).

## Herstellung – zwei Wege

### 1. Empfohlen: Folienplot (Schneideplot) aus weißer Folie
Die Buchstaben werden aus weißer Klebefolie geschnitten, entgittert und mit Übertragungsfolie geliefert. Es gibt **keinen Hintergrund und keinen Weißdruck** – genau das gewünschte Ergebnis „nur Weiß auf der Scheibe“, sehr haltbar.
- Datei: \`RM6_Heckscheibe_Druck.svg\` oder \`RM6_Heckscheibe_Druck.pdf\` (die Pfade sind die Schneidkonturen).
- Folie: weiße **gegossene (Cast-)Folie** für Außenanwendung; für gewölbte Heckscheiben besonders geeignet.
- Kleinste Details: dünnster Schriftstrich ca. ${m.duennsterStrich.toFixed(1)} mm, Linien ${(FINAL_GEOMETRY.thick * final.scale).toFixed(1)} mm, Punkte Ø ${(FINAL_GEOMETRY.dotR * 2 * final.scale).toFixed(1)} mm – nach üblicher Erfahrung plot- und entgitterbar; **von der Werbetechnik bestätigen lassen**.

### 2. Digitaldruck auf transparenter Folie (nur mit Weißdruck)
Normale Drucker drucken kein Weiß: Eine PNG- oder CMYK-Datei ergibt auf transparenter Folie **keine weiße Schrift**. Nötig ist ein Drucker mit weißer Tinte (Weiß als Sonderfarbe), meist mit Konturschnitt.
- Datei: \`RM6_Heckscheibe_Weissdruck_Sonderfarbe.pdf\` – alle Flächen in der Sonderfarbe **„${cfg.weiss_sonderfarbe_name}“** (100 %).
- Den genauen **Namen der Weiß-Sonderfarbe gibt die Druckerei vor** (z. B. White, Weiss, Spot_White, RDG_WHITE). In \`masse.json\` → \`weiss_sonderfarbe_name\` anpassen und neu erzeugen.
- Ob ein- oder mehrfach Weiß gedruckt wird (Deckkraft), entscheidet die Druckerei.

## Was die Druckerei noch bestätigen muss

Diese Punkte sind **nicht** freigegeben, nur vorbereitet:
1. Herstellungsweg (Folienplot oder Weißdruck) und das gewünschte Dateiformat.
2. Bei Weißdruck: Name und Anlage der Weiß-Sonderfarbe.
3. Folientyp, Außenhaltbarkeit und Eignung für die gewölbte Heckscheibe (und Heckscheibenheizung).
4. Mindestdetailgrößen fürs Schneiden und Entgittern.
5. Endmaß – vorher an der Scheibe nachmessen (sichtbarer Glasbereich ohne Siebdruckrand, Wischerbereich aussparen).

## Kontrast: dunkle und helle Scheiben

Weiß wirkt am stärksten auf **getönten oder dunklen** Scheiben (\`vorschau/RM6_Vorschau_dunkle_Scheibe.png\`). Auf **hellem, ungetöntem** Glas mit hellem Innenraum oder Himmelsspiegelung sinkt der Kontrast deutlich (\`vorschau/RM6_Vorschau_helle_Scheibe.png\`). Das Motiv nutzt deshalb nur kräftige Schnitte und keine Haarlinien. Ist die Scheibe sehr hell, ist eine Ausführung in Schwarz oder Anthrazit lesbarer – vorbereitet in \`optional/\`.

## Montage

Außen auf die saubere, fettfreie Scheibe kleben (Verarbeitungstemperatur laut Folienhersteller, meist ab ca. 10 °C). Nicht in den Wischerbereich – der Wischer hebt mit der Zeit die Kanten an. Auf ausreichende Sicht nach hinten achten.

## Rechtliches (Österreich) – bitte vor dem Kleben prüfen

Die Sicht nach hinten darf nicht unzulässig eingeschränkt werden. Für Folien auf der Heckscheibe (Tönungs- und Lochfolien) verlangen die Landesbehörden u. a. **zwei Außenrückspiegel**, außerdem gelten Regeln zu typengenehmigten Scheibenfolien. Ob und wie diese Regeln für geplottete Beschriftungen gelten, ist hier **nicht rechtlich geprüft** – bitte bei der Landesprüfstelle, dem ÖAMTC oder der Werbetechnik nachfragen.
`)
console.log(failed.length ? `\n✘ ${failed.length} Prüfung(en) fehlgeschlagen` : `\n✔ Alle Prüfungen bestanden – ${cm(final.W)} × ${cm(final.H)} cm`)
console.table(Object.fromEntries(Object.entries(compare).map(([k, c]) => [k, { Format: `${fmt(c.breite)}×${fmt(c.hoehe)}`, RM6: fmt(c.marke), Telefon: fmt(c.telefon), Web: fmt(c.web), kleinste: c.kleinsteVersalhoehe.toFixed(1), Hierarchie: c.hierarchie.split(' ')[0] }])))
process.exit(failed.length ? 1 : 0)
