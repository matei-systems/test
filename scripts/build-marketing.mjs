#!/usr/bin/env node
/**
 * Erzeugt alle Drucksachen aus marketing/config.json:
 *   Visitenkarte (2 Varianten), A6-Flyer, Dankeskarte, Heckscheiben-Aufkleber (2 Varianten × 2 Größen)
 *
 *   node scripts/build-marketing.mjs        (bzw. npm run marketing)
 *
 * Je Motiv entstehen:
 *   *.svg  – Vektordatei im Endformat + 3 mm Beschnitt, Maße in mm. Karten/Flyer mit echtem Text (editierbar;
 *            Schriften Geist und Instrument Serif liegen unter brand/fonts bzw. src/app/fonts), Aufkleber als Pfade.
 *   *.pdf  – Vektor-PDF in derselben Größe; TrimBox/BleedBox sind gesetzt. Farbraum RGB (kein CMYK).
 *   previews/*.png – Vorschau (ca. 380 dpi)
 * Alle QR-Codes werden nach dem Rendern mit einem Decoder zurückgelesen und mit der Ziel-Adresse verglichen.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import opentype from 'opentype.js'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { PDFDocument } from 'pdf-lib'

const { chromium } = createRequire(import.meta.url)('playwright')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const M = (...p) => path.join(root, 'marketing', ...p)
const cfg = JSON.parse(fs.readFileSync(M('config.json'), 'utf8'))

// ─── Designsystem (identisch zur Website, siehe src/app/globals.css) ─────────────
const INK = '#0b0b0c'
const WARM = '#f4f1ea'
const MUTED = '#a8a49c'
const DIM = '#8b877f'
const ACCENT = '#c8b48a'
const LINE = '#2a2a2d'
const TODO = '#e58a7e' // Platzhalter: bewusst auffällig, damit nichts versehentlich gedruckt wird
const SANS = "Geist, 'Helvetica Neue', Arial, sans-serif"
const SERIF = "'Instrument Serif', 'Times New Roman', serif"
const BLEED = 3
const MM = 96 / 25.4 // CSS-Pixel je Millimeter

const logoSource = fs.readFileSync(path.join(root, 'src/components/site/Logo.tsx'), 'utf8')
const grab = (name) => logoSource.match(new RegExp(`${name}\\s*=\\s*\\n?\\s*'([^']+)'`))[1]
const RM_PATH = grab('RM_MONOGRAM_PATH')
const GLINT_PATH = grab('GLINT_PATH')

const loadFont = (f) => {
  const b = fs.readFileSync(path.join(root, 'brand/fonts', f))
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
}
const F = { regular: loadFont('Geist-Regular.ttf'), medium: loadFont('Geist-Medium.ttf'), semi: loadFont('Geist-SemiBold.ttf') }

// ─── Platzhalter für fehlende Angaben ────────────────────────────────────────────
const missing = new Set()
function val(key, placeholder) {
  const v = String(cfg[key] ?? '').trim()
  if (v) return { text: v, todo: false }
  missing.add(`${key} → ${placeholder}`)
  return { text: placeholder, todo: true }
}
const OWNER = val('inhaber', '[Vor- und Nachname]')
const PHONE = val('telefon', '[Telefonnummer]')
const EMAIL = val('email', '[E-Mail-Adresse]')
const WEB = val('website', '[www.ihre-domain.at]')
const IMPRINT = val('medieninhaber', '[Name, Ort]')
const BOOK_URL = cfg.buchungsUrl.replace(/\/+$/, '')
const NEU = cfg.gutscheine.neukunden
const DANKE = cfg.gutscheine.danke

// ─── SVG-Bausteine (Einheit: Millimeter) ─────────────────────────────────────────
const n = (v) => String(Number(Number(v).toFixed(3)))
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function text(x, y, str, o = {}) {
  const { size = 3, weight = 400, fill = WARM, anchor = 'start', ls = 0, family = SANS, italic = false, todo = false } = o
  return `<text x="${n(x)}" y="${n(y)}" font-family="${family}" font-size="${n(size)}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''} fill="${todo ? TODO : fill}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${ls ? ` letter-spacing="${n(ls * size)}"` : ''}>${esc(str)}</text>`
}
const field = (x, y, v, o = {}) => text(x, y, v.text, { ...o, todo: v.todo })
const line = (x1, y1, x2, y2, stroke = ACCENT, w = 0.2, opacity = 1) =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(w)}"${opacity < 1 ? ` stroke-opacity="${opacity}"` : ''}/>`
const emblem = (x, y, size, ink = WARM, glint = ACCENT) =>
  `<g transform="translate(${n(x)} ${n(y)}) scale(${n(size / 48)})"><path d="${RM_PATH}" fill="${ink}"/><path d="${GLINT_PATH}" fill="${glint}"/></g>`

/** Logo-Lockup: Monogramm + „MOBILE / AUTO AUFBEREITUNG“ */
function lockup(x, y, size, ink = WARM, accent = ACCENT) {
  const tx = x + size * 1.22
  return `${emblem(x, y, size, ink, accent)}${text(tx, y + size * 0.52, 'MOBILE', { size: size * 0.16, weight: 500, fill: accent, ls: 0.42 })}${text(tx, y + size * 0.83, 'AUTO AUFBEREITUNG', { size: size * 0.26, weight: 600, fill: ink, ls: 0.22 })}`
}

function textWidth(font, str, size, ls = 0) {
  const glyphs = font.stringToGlyphs(str)
  let w = 0
  glyphs.forEach((g, i) => {
    w += (g.advanceWidth / font.unitsPerEm) * size
    if (i < glyphs.length - 1) w += (font.getKerningValue(g, glyphs[i + 1]) / font.unitsPerEm) * size + ls * size
  })
  return w
}
/** Größte Schriftgröße, mit der der Text in maxWidth passt (höchstens maxSize) */
const fitSize = (font, str, maxWidth, maxSize, ls = 0) => Math.min(maxSize, (maxWidth / textWidth(font, str, 100, ls)) * 100)

/** Text als Pfad (für Folienplot – unabhängig von installierten Schriften) */
function outline(font, str, size, ls, x, y, anchor = 'start') {
  const total = textWidth(font, str, size, ls)
  let cursor = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x
  const parts = []
  const glyphs = font.stringToGlyphs(str)
  glyphs.forEach((g, i) => {
    for (const c of g.getPath(cursor, y, size).commands) {
      const v = (k) => {
        if (!Number.isFinite(c[k])) throw new Error('Ungültiger Pfadwert')
        return n(c[k])
      }
      if (c.type === 'M' || c.type === 'L') parts.push(`${c.type}${v('x')} ${v('y')}`)
      else if (c.type === 'Q') parts.push(`Q${v('x1')} ${v('y1')} ${v('x')} ${v('y')}`)
      else if (c.type === 'C') parts.push(`C${v('x1')} ${v('y1')} ${v('x2')} ${v('y2')} ${v('x')} ${v('y')}`)
      else if (c.type === 'Z') parts.push('Z')
    }
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) : 0
    cursor += ((g.advanceWidth + kern) / font.unitsPerEm) * size + ls * size
  })
  return { d: parts.join(''), width: total }
}

// ─── QR-Codes ────────────────────────────────────────────────────────────────────
const qrJobs = [] // { file, expected } – wird nach dem Rendern zurückgelesen
function qrModules(url) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const size = qr.modules.size
  const rects = []
  for (let r = 0; r < size; r++) {
    let c = 0
    while (c < size) {
      if (!qr.modules.data[r * size + c]) { c++; continue }
      let e = c
      while (e < size && qr.modules.data[r * size + e]) e++
      rects.push([c, r, e - c])
      c = e
    }
  }
  return { size, rects }
}
/** QR-Code als helle Fläche mit dunklen Modulen (Standard-Polarität, Ruhezone 4 Module) */
function qr(x, y, box, url, { light = WARM, dark = INK, radius = 1.1 } = {}) {
  const { size, rects } = qrModules(url)
  const m = box / (size + 8)
  const d = rects.map(([c, r, w]) => `M${n(x + (c + 4) * m)} ${n(y + (r + 4) * m)}h${n(w * m)}v${n(m)}h${n(-w * m)}z`).join('')
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(box)}" height="${n(box)}" rx="${radius}" fill="${light}"/><path d="${d}" fill="${dark}"/>`
}
/** Für Folie: eine einzige Fläche mit ausgesparten Modulen – auf dunklem Glas erscheinen die Module dunkel */
function qrCutout(x, y, box, url, fill) {
  const { size, rects } = qrModules(url)
  const m = box / (size + 8)
  const holes = rects.map(([c, r, w]) => `M${n(x + (c + 4) * m)} ${n(y + (r + 4) * m)}h${n(w * m)}v${n(m)}h${n(-w * m)}z`).join('')
  return { svg: `<path fill-rule="evenodd" d="M${n(x)} ${n(y)}h${n(box)}v${n(box)}h${n(-box)}z${holes}" fill="${fill}"/>`, module: m, size }
}

// ─── Dokumentrahmen ──────────────────────────────────────────────────────────────
/** body ist im Koordinatensystem des Endformats (0…w, 0…h) gezeichnet; der Hintergrund reicht in den Beschnitt. */
function doc({ w, h, title, body, bg = INK, bleed = BLEED, defs = '' }) {
  const W = w + bleed * 2
  const H = h + bleed * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(W)}mm" height="${n(H)}mm" viewBox="${n(-bleed)} ${n(-bleed)} ${n(W)} ${n(H)}">
<title>${esc(title)}</title>
<desc>Endformat ${w} × ${h} mm, Beschnitt ${bleed} mm umlaufend. Maße in Millimetern. Schriften: Geist, Instrument Serif.</desc>
<defs>${defs}</defs>
${bg ? `<rect x="${n(-bleed)}" y="${n(-bleed)}" width="${n(W)}" height="${n(H)}" fill="${bg}"/>` : ''}
${body}
</svg>`
}
const glow = (id, cx, cy, r, opacity = 0.12) =>
  `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${ACCENT}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>`

const outputs = [] // { dir, name, svg, w, h, bleed, label, previewBg }
const add = (dir, name, label, spec) => outputs.push({ dir, name, label, bleed: BLEED, ...spec })

// ═════════════════════════════════════════════════════════════════════════════════
// VISITENKARTE 85 × 55 mm
// ═════════════════════════════════════════════════════════════════════════════════
{
  const w = 85, h = 55
  const contactRows = (x, y, gap) =>
    [['TELEFON', PHONE], ['E-MAIL', EMAIL], ['WEB', WEB]]
      .map(([label, v], i) => text(x, y + i * gap, label, { size: 2.1, weight: 500, fill: ACCENT, ls: 0.2 }) + field(x + 15, y + i * gap, v, { size: 3 }))
      .join('') + text(x, y + 3 * gap, 'GEBIET', { size: 2.1, weight: 500, fill: ACCENT, ls: 0.2 }) + text(x + 15, y + 3 * gap, cfg.gebiet, { size: 3 })
  const qrUrl = BOOK_URL

  // Variante A – „Monogramm“ (Empfehlung): zentriert, ruhig, maximale Wiedererkennung
  add('visitenkarte', 'visitenkarte-a-vorderseite', 'Visitenkarte A · Vorderseite', {
    w, h,
    svg: doc({
      w, h, title: `${cfg.firma} – Visitenkarte Variante A, Vorderseite`,
      defs: glow('g', 70, -6, 60, 0.16),
      body: `<rect x="-3" y="-3" width="91" height="61" fill="url(#g)"/>
${emblem(w / 2 - 10.5, 6.5, 21)}
${text(w / 2, 33.6, 'MOBILE', { size: 2.2, weight: 500, fill: ACCENT, anchor: 'middle', ls: 0.42 })}
${text(w / 2, 39.2, 'AUTO AUFBEREITUNG', { size: 3.6, weight: 600, anchor: 'middle', ls: 0.22 })}
${line(w / 2 - 6, 43, w / 2 + 6, 43)}
${text(w / 2, 48.6, cfg.slogan, { size: 3.3, family: SERIF, italic: true, fill: ACCENT, anchor: 'middle' })}`,
    }),
  })
  add('visitenkarte', 'visitenkarte-a-rueckseite', 'Visitenkarte A · Rückseite', {
    w, h, qr: qrUrl,
    svg: doc({
      w, h, title: `${cfg.firma} – Visitenkarte Variante A, Rückseite`,
      body: `${field(7, 13.2, OWNER, { size: 4.4, weight: 500 })}
${text(7, 18.4, cfg.firma.toUpperCase(), { size: 2.1, weight: 500, fill: ACCENT, ls: 0.2 })}
${line(7, 22.6, 21, 22.6)}
${contactRows(7, 29.6, 5.6)}
${qr(55, 10, 23, qrUrl)}
${text(66.5, 37.4, 'TERMIN ONLINE', { size: 2.1, weight: 500, fill: ACCENT, anchor: 'middle', ls: 0.2 })}
${text(66.5, 40.8, 'BUCHEN', { size: 2.1, weight: 500, fill: ACCENT, anchor: 'middle', ls: 0.2 })}
${emblem(71, 43.4, 7.5, DIM, ACCENT)}`,
    }),
  })

  // Variante B – „Zeile“: linksbündig, der Slogan trägt die Karte
  add('visitenkarte', 'visitenkarte-b-vorderseite', 'Visitenkarte B · Vorderseite', {
    w, h,
    svg: doc({
      w, h, title: `${cfg.firma} – Visitenkarte Variante B, Vorderseite`,
      defs: glow('g', 6, 60, 55, 0.14),
      body: `<rect x="-3" y="-3" width="91" height="61" fill="url(#g)"/>
${emblem(7, 5.5, 12)}
${text(78, 12.6, cfg.gebiet.toUpperCase(), { size: 2.1, weight: 500, fill: ACCENT, anchor: 'end', ls: 0.2 })}
${text(7, 29, 'Premium Fahrzeugaufbereitung.', { size: 4.5, weight: 500 })}
${text(7, 37.6, 'Direkt bei Ihnen.', { size: 7.6, family: SERIF, italic: true, fill: ACCENT })}
${line(7, 43.4, 78, 43.4, LINE, 0.2)}
${text(7, 48.8, cfg.firma.toUpperCase(), { size: 2.3, weight: 600, ls: 0.24 })}`,
    }),
  })
  add('visitenkarte', 'visitenkarte-b-rueckseite', 'Visitenkarte B · Rückseite', {
    w, h, qr: qrUrl,
    svg: doc({
      w, h, title: `${cfg.firma} – Visitenkarte Variante B, Rückseite`,
      body: `${qr(7, 10, 22, qrUrl)}
${text(18, 36.6, 'TERMIN ONLINE', { size: 2.1, weight: 500, fill: ACCENT, anchor: 'middle', ls: 0.16 })}
${text(18, 40, 'BUCHEN', { size: 2.1, weight: 500, fill: ACCENT, anchor: 'middle', ls: 0.16 })}
${line(33.5, 10, 33.5, 45, ACCENT, 0.2, 0.6)}
${field(38, 14.4, OWNER, { size: 4, weight: 500 })}
${text(38, 19.2, cfg.firma.toUpperCase(), { size: 2.1, weight: 500, fill: ACCENT, ls: 0.1 })}
${[['T', PHONE], ['E', EMAIL], ['W', WEB]].map(([l, v], i) => text(38, 27.6 + i * 5.4, l, { size: 2.3, weight: 600, fill: ACCENT }) + field(42.5, 27.6 + i * 5.4, v, { size: 2.9 })).join('')}
${text(38, 45, cfg.gebiet, { size: 2.6, fill: MUTED })}`,
    }),
  })
}

// ═════════════════════════════════════════════════════════════════════════════════
// FLYER DIN A6 105 × 148 mm
// ═════════════════════════════════════════════════════════════════════════════════
{
  const w = 105, h = 148
  // Fotoausschnitt mit dem Fahrzeug (rechte Bildhälfte): 1100 × 944 px auf 111 mm Breite ≈ 252 dpi
  const photo = await sharp(path.join(root, 'brand/canva/source/hero.jpg')).extract({ left: 560, top: 0, width: 1100, height: 944 }).jpeg({ quality: 90 }).toBuffer()
  const photoH = (111 * 944) / 1100
  const img = `<image x="-3" y="-3" width="111" height="${n(photoH)}" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${photo.toString('base64')}"/>`
  const neuUrl = `${BOOK_URL}?gutschein=${NEU.code}`
  const headSize = fitSize(F.medium, 'Fahrzeugaufbereitung', 89, 9.4, -0.03)

  add('flyer-a6', 'flyer-a6-vorderseite', 'Flyer A6 · Vorderseite', {
    w, h,
    svg: doc({
      w, h, title: `${cfg.firma} – Flyer DIN A6, Vorderseite`,
      defs: `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity="0.72"/><stop offset="0.22" stop-color="${INK}" stop-opacity="0"/><stop offset="0.6" stop-color="${INK}" stop-opacity="0.1"/><stop offset="1" stop-color="${INK}" stop-opacity="1"/></linearGradient>`,
      body: `${img}
<rect x="-3" y="-3" width="111" height="${n(photoH + 0.5)}" fill="url(#fade)"/>
${lockup(8, 8, 11)}
${text(8, 92.5, 'MOBIL IN ' + cfg.gebiet.toUpperCase(), { size: 2.4, weight: 500, fill: ACCENT, ls: 0.26 })}
${text(8, 103.5, 'Premium', { size: headSize, weight: 500, ls: -0.03 })}
${text(8, 103.5 + headSize * 1.04, 'Fahrzeugaufbereitung', { size: headSize, weight: 500, ls: -0.03 })}
${text(8, 103.5 + headSize * 1.04 + 11.4, 'direkt bei Ihnen.', { size: 11.6, family: SERIF, italic: true, fill: ACCENT })}
${text(8, 131.2, 'Mobile Fahrzeugpflege in Graz und Umgebung', { size: 3.5, fill: MUTED })}
<rect x="8" y="135.4" width="52" height="8" rx="4" fill="${ACCENT}"/>
${text(34, 140.5, 'JETZT TERMIN ONLINE BUCHEN', { size: 2.25, weight: 600, fill: '#15120c', anchor: 'middle', ls: 0.12 })}
<rect x="62.5" y="135.4" width="34.5" height="8" rx="4" fill="none" stroke="${ACCENT}" stroke-width="0.25"/>
${text(79.75, 140.5, `${NEU.betrag} NEUKUNDEN-VORTEIL`, { size: 2.1, weight: 600, fill: ACCENT, anchor: 'middle', ls: 0.03 })}`,
    }),
  })

  const services = [
    ['Innenraumreinigung', 'Basic und Premium – vom gründlichen Aussaugen bis zur Detailpflege'],
    ['Intensive Polsterreinigung', 'Tiefenreinigung der Sitzpolster bei Flecken und Verschmutzungen'],
    ['Außenpflege', 'Schonende Handwäsche für Lack, Felgen und Scheiben*'],
    ['Komplettpaket', 'Innenraum Premium und Außenpflege in einem Termin'],
  ]
  add('flyer-a6', 'flyer-a6-rueckseite', 'Flyer A6 · Rückseite', {
    w, h, qr: neuUrl,
    svg: doc({
      w, h, title: `${cfg.firma} – Flyer DIN A6, Rückseite`,
      defs: glow('g', 100, 0, 80, 0.12),
      body: `<rect x="-3" y="-3" width="111" height="154" fill="url(#g)"/>
${text(8, 12.5, 'UNSERE LEISTUNGEN', { size: 2.3, weight: 500, fill: ACCENT, ls: 0.26 })}
${text(8, 22, 'Pflege, die man', { size: 6.8, weight: 500, ls: -0.03 })}${text(8 + textWidth(F.medium, 'Pflege, die man ', 6.8, -0.03) + 0.4, 22, 'sieht.', { size: 7.6, family: SERIF, italic: true, fill: ACCENT })}
${services.map(([name, sub], i) => `${line(8, 27.5 + i * 11.2, 97, 27.5 + i * 11.2, LINE, 0.2)}${text(8, 33 + i * 11.2, name, { size: 3.7, weight: 500 })}${text(8, 36.9 + i * 11.2, sub, { size: 2.45, fill: MUTED })}`).join('')}
${line(8, 72.3, 97, 72.3, LINE, 0.2)}
<rect x="8" y="76.5" width="89" height="33" rx="3" fill="#141417" stroke="${ACCENT}" stroke-width="0.25"/>
${text(13, 84.2, 'FÜR NEUKUNDINNEN UND NEUKUNDEN', { size: 2.1, weight: 500, fill: ACCENT, ls: 0.2 })}
<rect x="72" y="79.6" width="20.5" height="8.6" rx="1.4" fill="none" stroke="${ACCENT}" stroke-width="0.25" stroke-dasharray="1 0.7"/>
${text(82.25, 83, 'CODE', { size: 2.1, weight: 500, fill: ACCENT, anchor: 'middle', ls: 0.22 })}
${text(82.25, 86.9, NEU.code, { size: 3.2, weight: 600, anchor: 'middle', ls: 0.1 })}
${text(13, 97.4, NEU.betrag, { size: 10, weight: 500, ls: -0.03 })}
${text(13 + textWidth(F.medium, NEU.betrag, 10, -0.03) + 3.5, 93.2, 'Neukunden-Vorteil', { size: 4.5, weight: 500 })}
${text(13 + textWidth(F.medium, NEU.betrag, 10, -0.03) + 3.5, 97.6, 'auf Ihre erste Buchung', { size: 3, fill: MUTED })}
${text(13, 102.8, `Gültig für die erste Buchung ab ${NEU.mindestwert} Auftragswert, einmal je Kunde.`, { size: 2.1, fill: MUTED })}
${text(13, 106, 'Online einlösbar: Code im Schritt „Übersicht“ eingeben. Keine Barablöse.', { size: 2.1, fill: MUTED })}
${text(8, 117.4, 'TERMIN & KONTAKT', { size: 2.3, weight: 500, fill: ACCENT, ls: 0.26 })}
${[['Telefon', PHONE], ['E-Mail', EMAIL], ['Web', WEB]].map(([l, v], i) => text(8, 124 + i * 5.4, l, { size: 2.6, fill: MUTED }) + field(22, 124 + i * 5.4, v, { size: 3.1 })).join('')}
${qr(73, 113, 24, neuUrl)}
${text(85, 140.2, 'Scannen & buchen', { size: 2.1, fill: MUTED, anchor: 'middle' })}
${text(8, 140.2, '* Außenwäsche nur an geeigneten, zulässigen Standorten.', { size: 2.1, fill: DIM })}
${text(8, 144.2, `${cfg.firma} · ${cfg.gebiet} · Medieninhaber: `, { size: 2.1, fill: DIM })}${field(8 + textWidth(F.regular, `${cfg.firma} · ${cfg.gebiet} · Medieninhaber: `, 2.1), 144.2, IMPRINT, { size: 2.1, fill: DIM })}`,
    }),
  })
}

// ═════════════════════════════════════════════════════════════════════════════════
// DANKESKARTE 85,6 × 54 mm (Bankkartenformat)
// ═════════════════════════════════════════════════════════════════════════════════
{
  const w = 85.6, h = 54
  const url = `${BOOK_URL}?gutschein=${DANKE.code}`
  add('dankeskarte', 'dankeskarte-vorderseite', 'Dankeskarte · Vorderseite', {
    w, h,
    svg: doc({
      w, h, title: `${cfg.firma} – Dankeskarte, Vorderseite`,
      defs: glow('g', 80, 0, 62, 0.16),
      body: `<rect x="-3" y="-3" width="91.6" height="60" fill="url(#g)"/>
${emblem(7, 5.5, 10)}
${text(7, 26.6, 'Vielen Dank', { size: 7.4, weight: 500, ls: -0.03 })}
${text(7, 35.4, 'für Ihr Vertrauen!', { size: 8.4, family: SERIF, italic: true, fill: ACCENT })}
${text(7, 42.2, 'Wir hoffen, Sie sind mit dem Ergebnis zufrieden.', { size: 2.75, fill: MUTED })}
${line(7, 45.3, 19, 45.3)}
${text(7, 49.6, 'Ihr Team von ', { size: 2.5, fill: MUTED })}${text(7 + textWidth(F.regular, 'Ihr Team von ', 2.5), 49.6, cfg.firma, { size: 2.5, weight: 500 })}`,
    }),
  })
  add('dankeskarte', 'dankeskarte-rueckseite', 'Dankeskarte · Rückseite', {
    w, h, qr: url,
    svg: doc({
      w, h, title: `${cfg.firma} – Dankeskarte, Rückseite`,
      body: `${text(7, 9.8, 'IHR DANKESCHÖN', { size: 2.1, weight: 500, fill: ACCENT, ls: 0.26 })}
${text(7, 21, DANKE.betrag, { size: 10, weight: 500, ls: -0.03 })}
${text(7 + textWidth(F.medium, DANKE.betrag, 10, -0.03) + 3.2, 16.4, 'Dankeschön-Vorteil', { size: 4.2, weight: 500 })}
${text(7 + textWidth(F.medium, DANKE.betrag, 10, -0.03) + 3.2, 21, 'auf Ihren nächsten Auftrag', { size: 2.7, fill: MUTED })}
<rect x="7" y="25.2" width="44" height="8" rx="1.4" fill="none" stroke="${ACCENT}" stroke-width="0.25" stroke-dasharray="1 0.7"/>
${text(10, 30.2, 'CODE', { size: 2.1, weight: 500, fill: ACCENT, ls: 0.26 })}
${text(22, 30.6, DANKE.code, { size: 4.4, weight: 600, ls: 0.16 })}
${text(7, 38.2, 'Vielen Dank, dass Sie sich für uns', { size: 2.3, fill: MUTED })}
${text(7, 41.4, 'entschieden haben. Wir freuen uns', { size: 2.3, fill: MUTED })}
${text(7, 44.6, 'auf Ihren nächsten Termin.', { size: 2.3, fill: MUTED })}
${text(7, 49.8, `Ab ${DANKE.mindestwert} Auftragswert · einmal je Kunde · keine Barablöse`, { size: 2.1, fill: DIM })}
${qr(58.6, 23.4, 20, url)}
${text(68.6, 46.4, 'ONLINE EINLÖSEN', { size: 2.1, weight: 500, fill: ACCENT, anchor: 'middle', ls: 0.14 })}`,
    }),
  })
}

// ═════════════════════════════════════════════════════════════════════════════════
// HECKSCHEIBEN-AUFKLEBER (einfarbig, als Pfade – Vorschau weiß auf dunklem Glas)
// ═════════════════════════════════════════════════════════════════════════════════
function sticker({ w, h, premium, color }) {
  const s = h / 70 // Maßstab relativ zur kompakten Größe
  const qrBox = 58 * s
  const pad = 2 * s
  const textW = w - qrBox - pad * 2 - 8 * s
  const x = pad
  const parts = []
  let y
  if (premium) {
    const mark = 17 * s
    parts.push(`<g transform="translate(${n(x)} ${n(pad - 0.6 * s)}) scale(${n(mark / 48)})"><path d="${RM_PATH}"/><path d="${GLINT_PATH}"/></g>`)
    const lx = x + mark * 1.3
    parts.push(`<path d="${outline(F.medium, 'MOBILE', 3 * s, 0.42, lx, pad + 5.2 * s).d}"/>`)
    const nameSize = fitSize(F.semi, 'AUTO AUFBEREITUNG', textW - mark * 1.3, 7.6 * s, 0.2)
    parts.push(`<path d="${outline(F.semi, 'AUTO AUFBEREITUNG', nameSize, 0.2, lx, pad + 13.57 * s).d}"/>`)
    y = pad + 20.5 * s
    parts.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(textW)}" height="${n(0.5 * s)}"/>`)
    const l1 = fitSize(F.semi, 'MOBILE AUTOAUFBEREITUNG', textW, 12 * s, 0.05)
    parts.push(`<path d="${outline(F.semi, 'MOBILE AUTOAUFBEREITUNG', l1, 0.05, x, y + 13.4 * s).d}"/>`)
    const l2 = fitSize(F.medium, 'INNENRAUM • POLSTER • AUSSENPFLEGE', textW, 6 * s, 0.1)
    parts.push(`<path d="${outline(F.medium, 'INNENRAUM • POLSTER • AUSSENPFLEGE', l2, 0.1, x, y + 22.6 * s).d}"/>`)
    const l3 = fitSize(F.semi, 'GRAZ & UMGEBUNG  ·  JETZT TERMIN BUCHEN', textW, 6.4 * s, 0.1)
    parts.push(`<path d="${outline(F.semi, 'GRAZ & UMGEBUNG  ·  JETZT TERMIN BUCHEN', l3, 0.1, x, y + 33 * s).d}"/>`)
  } else {
    const l1 = fitSize(F.semi, 'MOBILE AUTOAUFBEREITUNG', textW, 15 * s, 0.05)
    parts.push(`<path d="${outline(F.semi, 'MOBILE AUTOAUFBEREITUNG', l1, 0.05, x, pad + 13.5 * s).d}"/>`)
    const l2 = fitSize(F.medium, 'INNENRAUM • POLSTER • AUSSENPFLEGE', textW, 8 * s, 0.1)
    parts.push(`<path d="${outline(F.medium, 'INNENRAUM • POLSTER • AUSSENPFLEGE', l2, 0.1, x, pad + 25.5 * s).d}"/>`)
    parts.push(`<rect x="${n(x)}" y="${n(pad + 31 * s)}" width="${n(textW)}" height="${n(0.5 * s)}"/>`)
    const l3 = fitSize(F.medium, 'GRAZ & UMGEBUNG', textW, 8.4 * s, 0.16)
    parts.push(`<path d="${outline(F.medium, 'GRAZ & UMGEBUNG', l3, 0.16, x, pad + 42.5 * s).d}"/>`)
    const l4 = fitSize(F.semi, 'JETZT TERMIN BUCHEN', textW, 11.4 * s, 0.08)
    parts.push(`<path d="${outline(F.semi, 'JETZT TERMIN BUCHEN', l4, 0.08, x, pad + 57 * s).d}"/>`)
  }
  const q = qrCutout(w - pad - qrBox, (h - qrBox) / 2 - 2.6 * s, qrBox, BOOK_URL, color)
  const cap = outline(F.medium, 'QR-CODE SCANNEN', 3.3 * s, 0.14, w - pad - qrBox / 2, (h - qrBox) / 2 - 2.6 * s + qrBox + 5.2 * s, 'middle')
  return { art: `<g fill="${color}">${parts.join('')}<path d="${cap.d}"/></g>${q.svg}`, module: q.module, modules: q.size }
}
const stickerInfo = []
for (const [key, premium] of [['minimal', false], ['premium', true]]) {
  for (const [sizeKey, w, h] of [['kompakt', 250, 70], ['gross', 400, 112]]) {
    const name = `aufkleber-${key}-${sizeKey}-${w}x${h}mm`
    const plot = sticker({ w, h, premium, color: '#000000' })
    const preview = sticker({ w, h, premium, color: '#ffffff' })
    stickerInfo.push({ name, w, h, module: plot.module, modules: plot.modules })
    add('heckscheiben-aufkleber', name, `Aufkleber ${premium ? 'Premium' : 'Minimal'} · ${w} × ${h} mm`, {
      w, h, bleed: 0, qr: BOOK_URL,
      // Produktionsdatei: Konturen in Schwarz, ohne Hintergrund (die Folienfarbe Weiß wählt die Werkstatt)
      svg: doc({ w, h, bleed: 0, bg: null, title: `${cfg.firma} – Heckscheiben-Aufkleber ${premium ? 'Premium' : 'Minimal'} ${w} × ${h} mm (Konturen)`, body: plot.art }),
      // Vorschau: weiße Folie auf dunkler Scheibe
      previewSvg: doc({
        w: w + 30, h: h + 30, bleed: 0, bg: '#0d0e10', title: 'Vorschau',
        defs: `<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c1f24"/><stop offset="1" stop-color="#090a0b"/></linearGradient>`,
        body: `<rect width="${w + 30}" height="${h + 30}" fill="url(#glass)"/><g transform="translate(15 15)">${preview.art}</g>`,
      }),
    })
  }
}

// ═════════════════════════════════════════════════════════════════════════════════
// Rendern: SVG → PDF + PNG, QR-Codes zurücklesen
// ═════════════════════════════════════════════════════════════════════════════════
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'rm-marketing-'))
const fontUrl = (f) => pathToFileURL(path.join(root, 'src/app/fonts', f)).href
const html = (svg, W, H) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Geist'; src: url('${fontUrl('Geist-Variable.woff2')}') format('woff2'); font-weight: 100 900; }
@font-face { font-family: 'Instrument Serif'; src: url('${fontUrl('instrument-serif-latin-400-italic.woff2')}') format('woff2'); font-style: italic; }
@font-face { font-family: 'Instrument Serif'; src: url('${fontUrl('instrument-serif-latin-400-normal.woff2')}') format('woff2'); font-style: normal; }
@page { size: ${W}mm ${H}mm; margin: 0; }
html, body { margin: 0; padding: 0; background: transparent; }
svg { display: block; width: ${W}mm; height: ${H}mm; }
</style></head><body>${svg}</body></html>`

fs.mkdirSync(M('previews'), { recursive: true })
const browser = await chromium.launch()
const results = []
for (const o of outputs) {
  const W = o.w + o.bleed * 2
  const H = o.h + o.bleed * 2
  fs.mkdirSync(M(o.dir), { recursive: true })
  fs.writeFileSync(M(o.dir, `${o.name}.svg`), o.svg)

  // PDF (Vektor, eingebettete Schriften)
  const page = await browser.newPage()
  const file = path.join(tmp, `${o.name}.html`)
  fs.writeFileSync(file, html(o.svg, W, H))
  await page.goto(pathToFileURL(file).href)
  await page.evaluate(() => document.fonts.ready)
  const pdfBytes = await page.pdf({ width: `${W}mm`, height: `${H}mm`, printBackground: true, pageRanges: '1' })
  const pdf = await PDFDocument.load(pdfBytes)
  const p = pdf.getPage(0)
  const pt = 72 / 25.4
  const { width: pw, height: ph } = p.getSize()
  p.setBleedBox(0, 0, pw, ph)
  p.setTrimBox(o.bleed * pt, o.bleed * pt, pw - o.bleed * 2 * pt, ph - o.bleed * 2 * pt)
  pdf.setTitle(`${cfg.firma} – ${o.label}`)
  pdf.setAuthor(cfg.firma)
  fs.writeFileSync(M(o.dir, `${o.name}.pdf`), await pdf.save())
  await page.close()

  // PNG-Vorschau
  const pv = o.previewSvg ?? o.svg
  const pw2 = o.previewSvg ? o.w + 30 : W
  const ph2 = o.previewSvg ? o.h + 30 : H
  const scale = o.previewSvg ? 2 : 4
  const ctx = await browser.newContext({ viewport: { width: Math.ceil(pw2 * MM), height: Math.ceil(ph2 * MM) }, deviceScaleFactor: scale })
  const pp = await ctx.newPage()
  const pfile = path.join(tmp, `${o.name}-preview.html`)
  fs.writeFileSync(pfile, html(pv, pw2, ph2))
  await pp.goto(pathToFileURL(pfile).href)
  await pp.evaluate(() => document.fonts.ready)
  const png = M('previews', `${o.name}.png`)
  await pp.locator('svg').screenshot({ path: png, type: 'png' })
  await ctx.close()

  // QR-Code zurücklesen
  let qrState = '–'
  if (o.qr) {
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const found = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height)
    if (!found || found.data !== o.qr) throw new Error(`QR-Code in ${o.name} nicht lesbar oder falsch: ${found?.data ?? 'kein Code erkannt'} (erwartet ${o.qr})`)
    qrState = `lesbar → ${found.data}`
  }
  const pages = pdf.getPageCount()
  results.push({ ...o, W, H, pages, qrState, pdfSize: `${n((pw / 72) * 25.4)} × ${n((ph / 72) * 25.4)} mm` })
  console.log(`✔ ${o.dir}/${o.name}  PDF ${n((pw / 72) * 25.4)}×${n((ph / 72) * 25.4)} mm, ${pages} Seite  QR: ${qrState}`)
}
await browser.close()

// Brand-Assets für Druckereien und Grafiker bündeln
fs.mkdirSync(M('brand-assets'), { recursive: true })
for (const f of fs.readdirSync(path.join(root, 'brand/logo'))) {
  if (/^rm-.*\.(svg|png)$/.test(f)) fs.copyFileSync(path.join(root, 'brand/logo', f), M('brand-assets', f))
}
fs.copyFileSync(path.join(root, 'brand/designsystem.png'), M('brand-assets', 'designsystem.png'))
fs.writeFileSync(
  M('brand-assets', 'farben-und-schriften.json'),
  JSON.stringify(
    {
      farben: { Tiefschwarz: '#09090A', Druckschwarz: INK, Anthrazit: '#141417', Warmweiss: WARM, Champagner: ACCENT, 'Champagner dunkel': '#9A8256', Steingrau: DIM, Signalrot: '#C8372D' },
      schriften: { Text: 'Geist (SIL OFL) – 400, 500, 600', Akzent: 'Instrument Serif Italic (SIL OFL)', Dateien: ['brand/fonts/*.ttf', 'src/app/fonts/*.woff2'] },
      regeln: { Rundungen: 'Buttons als Pille, Karten 16–24 px', Akzent: 'Champagner sparsam; Rot nur im Rabatt-Kennzeichen', Logo: 'Schutzzone = Höhe des Zeichens, nicht verzerren oder einfärben' },
    },
    null,
    2,
  ) + '\n',
)

// Übersicht aller Motive als ein Bild
{
  const cell = 560
  const gap = 20
  const tiles = []
  for (const r of results) {
    const b = await sharp(M('previews', `${r.name}.png`)).resize({ width: cell, height: 380, fit: 'contain', background: '#2b2b2f' }).png().toBuffer()
    tiles.push(b)
  }
  const cols = 4
  const rows = Math.ceil(tiles.length / cols)
  await sharp({ create: { width: cols * cell + (cols + 1) * gap, height: rows * 380 + (rows + 1) * gap, channels: 3, background: '#2b2b2f' } })
    .composite(tiles.map((input, i) => ({ input, left: gap + (i % cols) * (cell + gap), top: gap + Math.floor(i / cols) * (380 + gap) })))
    .jpeg({ quality: 88 })
    .toFile(M('previews', 'uebersicht.jpg'))
}

fs.writeFileSync(M('previews', 'build.json'), JSON.stringify({ erzeugt: new Date().toISOString().slice(0, 10), fehlend: [...missing], aufkleber: stickerInfo.map((s) => ({ ...s, module: Number(s.module.toFixed(2)) })), dateien: results.map((r) => ({ ordner: r.dir, name: r.name, bezeichnung: r.label, endformat: `${r.w} × ${r.h} mm`, beschnitt: `${r.bleed} mm`, pdf: r.pdfSize, qr: r.qrState })) }, null, 2) + '\n')
if (missing.size) console.log(`\n⚠ Platzhalter (in marketing/config.json ergänzen):\n  - ${[...missing].join('\n  - ')}`)
console.log('✔ Drucksachen erzeugt.')
