#!/usr/bin/env node
/**
 * Erzeugt alle Marken- und Website-Assets aus den Canva-Quellbildern:
 *   - optimierte Website-Bilder        → public/images/*.jpg
 *   - Vorher/Nachher-DEMO-Visualisierungen (deutlich als Demo gekennzeichnet) → public/images/demo/*
 *   - Logo für die Website, Kontrollvorschauen → src/assets/rm6-logo.png, brand/logo/*
 *   - Favicon / App-Icons / Open-Graph-Bild / Profilbild → src/app/icon.png, src/app/apple-icon.png, public/*, brand/social/*
 *
 * Logo-Quelle: brand/logo/RM6_Autoaufbereitung_Logo_Original.png (vom Inhaber geliefert, unverändert).
 *
 * Aufruf: node scripts/build-brand-assets.mjs [logo] [photos] [services] [demos] [og]
 * Quellen: brand/canva/source/*.jpg (exportiert aus dem Canva-Moodboard-Design)
 */
import sharp from 'sharp'
import opentype from 'opentype.js'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const src = (f) => path.join(root, 'brand/canva/source', f)
const out = (...p) => {
  const file = path.join(root, ...p)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  return file
}

const WARM = '#f4f1ea'
const CHAMPAGNE = '#c8b48a'

// ─── Schrift → SVG-Pfade ──────────────────────────────────────────────────────
const loadFont = (f) => { const b = fs.readFileSync(path.join(root, 'brand/fonts', f)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) }
const fontMedium = loadFont('Geist-Medium.ttf')

/**
 * Pfadbefehle → SVG-Pfaddaten. Eigener Formatierer, weil opentype.js (toPathData) je nach Position
 * vereinzelt „NaN“ ausgibt – der SVG-Renderer bricht den Pfad dann mitten im Buchstaben ab.
 */
function commandsToD(commands) {
  const n = (v) => {
    if (!Number.isFinite(v)) throw new Error(`Ungültiger Pfadwert: ${v}`)
    return String(Number(v.toFixed(2)))
  }
  return commands
    .map((c) => {
      switch (c.type) {
        case 'M':
        case 'L':
          return `${c.type}${n(c.x)} ${n(c.y)}`
        case 'Q':
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
        case 'C':
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
        case 'Z':
          return 'Z'
        default:
          throw new Error(`Unbekannter Pfadbefehl: ${c.type}`)
      }
    })
    .join('')
}

/** Text mit Laufweite (em) als Pfad; liefert { d, width } */
function textPath(font, text, size, tracking, x = 0, y = 0) {
  let cursor = x
  const parts = []
  const glyphs = font.stringToGlyphs(text)
  glyphs.forEach((g, i) => {
    parts.push(commandsToD(g.getPath(cursor, y, size).commands))
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) : 0
    cursor += ((g.advanceWidth + kern) / font.unitsPerEm) * size
    if (i < glyphs.length - 1) cursor += tracking * size
  })
  return { d: parts.join(' '), width: cursor - x }
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
// Einzige Logo-Quelle: das vom Inhaber gelieferte Logo (PNG mit transparentem Hintergrund). Es wird inhaltlich
// nicht verändert – nur vollständig transparente Ränder werden entfernt und die Größe für den Einsatzzweck angepasst.
const LOGO_ORIGINAL = path.join(root, 'brand/logo/RM6_Autoaufbereitung_Logo_Original.png')
const BG = '#09090a'

/** Logo ohne die vollständig transparenten Außenränder (Alpha = 0); alle sichtbaren Pixel bleiben unverändert. */
async function trimmedLogo() {
  const { data, info } = await sharp(LOGO_ORIGINAL).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] === 0) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return sharp(LOGO_ORIGINAL).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer()
}

/** Logo auf quadratischer dunkler Fläche (App-Icons, Favicon, Profilbild); Seitenverhältnis bleibt erhalten. */
async function logoTile(logo, size, { radius = 0, widthShare = 0.88, background } = {}) {
  const w = Math.round(size * widthShare)
  const resized = await sharp(logo).resize({ width: w }).png().toBuffer()
  const { height: h } = await sharp(resized).metadata()
  const base = background ?? Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/></svg>`)
  return sharp(base)
    .composite([{ input: resized, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function buildLogos() {
  const logo = await trimmedLogo()
  const meta = await sharp(logo).metadata()
  fs.writeFileSync(out('brand/logo/RM6_Autoaufbereitung_Logo_transparent.png'), logo)
  // Website-Version (Header, Footer, Admin): next/image erzeugt daraus die ausgelieferten Größen
  await sharp(logo).resize({ width: 1400 }).png({ compressionLevel: 9 }).toFile(out('src/assets/rm6-logo.png'))
  // Kontrollvorschau auf dunklem und hellem Grund
  for (const [name, color] of [['vorschau-dunkel', BG], ['vorschau-hell', '#f4f1ea']]) {
    const pad = 80
    const canvas = await sharp({ create: { width: meta.width + pad * 2, height: meta.height + pad * 2, channels: 4, background: color } })
      .composite([{ input: logo, left: pad, top: pad }])
      .png()
      .toBuffer()
    await sharp(canvas)
      .resize({ width: 1200 })
      .png()
      .toFile(out('brand/logo', `${name}.png`))
  }
  // Favicon und App-Icons
  fs.writeFileSync(out('src/app/icon.png'), await logoTile(logo, 96, { radius: 20, widthShare: 0.92 }))
  fs.writeFileSync(out('src/app/apple-icon.png'), await logoTile(logo, 180))
  fs.writeFileSync(out('public/icon-192.png'), await logoTile(logo, 192, { radius: 42 }))
  fs.writeFileSync(out('public/icon-512.png'), await logoTile(logo, 512, { radius: 112 }))
  // Profilbild für Social Media (Logo sicher innerhalb des runden Zuschnitts)
  const size = 1080
  const profileBg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs><radialGradient id="g" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="#1b1b1e"/><stop offset="1" stop-color="#070708"/></radialGradient></defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`)
  fs.writeFileSync(out('brand/social/profilbild-1080.png'), await logoTile(logo, size, { widthShare: 0.8, background: profileBg }))
}

// ─── Website-Bilder ───────────────────────────────────────────────────────────
async function buildPhotos() {
  const jobs = [
    ['hero.jpg', 'hero.jpg', 2000],
    ['interior.jpg', 'interior.jpg', 1600],
    ['wash.jpg', 'wash.jpg', 1600],
    ['graz-night.jpg', 'graz-night.jpg', 2000],
  ]
  for (const [from, to, width] of jobs) {
    await sharp(src(from))
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 86, mozjpeg: true, progressive: true })
      .toFile(out('public/images', to))
  }
  // Hochformat-Ausschnitt für den Hero auf Smartphones (Fahrzeug im Fokus)
  const meta = await sharp(src('hero.jpg')).metadata()
  const cropW = Math.round(meta.height * 0.75)
  await sharp(src('hero.jpg'))
    .extract({ left: meta.width - cropW - 40, top: 0, width: cropW, height: meta.height })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out('public/images/hero-portrait.jpg'))
}

// ─── Vorher/Nachher-Demos ─────────────────────────────────────────────────────
/** Eigenes Motiv für „Innenraum Basic“: Cockpit-Ausschnitt aus dem Innenraum-Foto. */
async function buildServiceImages() {
  await sharp(src('interior.jpg'))
    .extract({ left: 520, top: 60, width: 936, height: 702 })
    .resize({ width: 1600 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out('public/images/leistung-innenraum-basic.jpg'))
}

function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Weiche, kontrollierte Staub-/Schmutzschicht als RGBA-Bild (deterministisch über seed). */
async function noiseLayer(w, h, { seed, scale, maxAlpha, tint, bias = 0.45, gain = 2.2 }) {
  const sw = Math.max(2, Math.ceil(w / scale))
  const sh = Math.max(2, Math.ceil(h / scale))
  const r = rng(seed)
  const small = Buffer.alloc(sw * sh)
  for (let i = 0; i < small.length; i++) small[i] = Math.floor(r() * 256)
  const smooth = await sharp(small, { raw: { width: sw, height: sh, channels: 1 } })
    .resize(w, h, { kernel: 'cubic', fit: 'fill' })
    .blur(Math.max(0.5, scale / 3))
    .raw()
    .toBuffer()
  const [tr, tg, tb] = tint.split(',').map(Number)
  const rgba = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const v = smooth[i] / 255
    const a = Math.min(1, Math.max(0, (v - bias) * gain)) * maxAlpha
    rgba[i * 4] = tr
    rgba[i * 4 + 1] = tg
    rgba[i * 4 + 2] = tb
    rgba[i * 4 + 3] = Math.round(a * 255)
  }
  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
}

function specksSvg(w, h, { seed, tint, specks = 0, crumbs = 0, streaks = 0, spots = 0 }) {
  const r = rng(seed + 101)
  let body = ''
  for (let i = 0; i < specks; i++) {
    body += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(0.5 + r() * 1.6).toFixed(1)}" fill="rgba(${tint},${(0.25 + r() * 0.35).toFixed(2)})"/>`
  }
  for (let i = 0; i < crumbs; i++) {
    const rad = 0.8 + r() * 2.2
    body += `<ellipse cx="${(r() * w).toFixed(1)}" cy="${(h * 0.4 + r() * h * 0.6).toFixed(1)}" rx="${rad.toFixed(1)}" ry="${(rad * (0.5 + r() * 0.5)).toFixed(1)}" fill="rgba(206,190,160,${(0.35 + r() * 0.35).toFixed(2)})"/>`
  }
  for (let i = 0; i < spots; i++) {
    const rad = 4 + r() * 10
    body += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${rad.toFixed(1)}" fill="none" stroke="rgba(200,190,170,${(0.08 + r() * 0.12).toFixed(2)})" stroke-width="${(0.8 + r() * 1.2).toFixed(1)}"/>`
  }
  for (let i = 0; i < streaks; i++) {
    const x = r() * w
    const len = h * (0.1 + r() * 0.25)
    const y = r() * (h - len)
    body += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q ${(r() * 10 - 5).toFixed(1)} ${(len / 2).toFixed(1)} ${(r() * 8 - 4).toFixed(1)} ${len.toFixed(1)}" stroke="rgba(${tint},${(0.06 + r() * 0.1).toFixed(2)})" stroke-width="${(3 + r() * 6).toFixed(1)}" fill="none" stroke-linecap="round"/>`
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g opacity="0.95">${body}</g></svg>`)
}

async function buildDemoPair(name, file, crop, opts, outW = 1400) {
  const afterBuf = await sharp(src(file)).extract(crop).resize({ width: outW }).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
  const { width, height } = await sharp(afterBuf).metadata()
  const tint = opts.tint ?? '128,112,88'
  const coarse = await noiseLayer(width, height, { seed: opts.seed, scale: 60, maxAlpha: opts.coarse ?? 0.22, tint })
  const fine = await noiseLayer(width, height, { seed: opts.seed + 7, scale: 5, maxAlpha: opts.fine ?? 0.12, tint, bias: 0.5, gain: 3 })
  const before = await sharp(afterBuf)
    .modulate({ brightness: opts.brightness ?? 0.94, saturation: opts.saturation ?? 0.55 })
    .linear(opts.contrast ?? 0.86, opts.lift ?? 9)
    .blur(0.45)
    .composite([
      { input: coarse, blend: 'over' },
      { input: fine, blend: 'over' },
      { input: specksSvg(width, height, { seed: opts.seed, tint, ...opts }), blend: 'over' },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer()
  fs.writeFileSync(out('public/images/demo', `${name}-nachher.jpg`), afterBuf)
  fs.writeFileSync(out('public/images/demo', `${name}-vorher.jpg`), before)
}

async function buildDemos() {
  // Lack/Front aus dem Hero-Foto: Staubfilm, Wasserflecken, Laufspuren
  await buildDemoPair('lack', 'hero.jpg', { left: 760, top: 210, width: 920, height: 690 }, { seed: 11, specks: 420, spots: 90, streaks: 18 })
  // Innenraum: Staub, Krümel
  await buildDemoPair('innenraum', 'interior.jpg', { left: 0, top: 60, width: 1456, height: 1028 }, { seed: 23, specks: 260, crumbs: 420, coarse: 0.16, fine: 0.1 })
  // Sitz: Krümel, Staub, Flecken auf Sitzfläche und Lehne
  await buildDemoPair('sitz', 'interior.jpg', { left: 100, top: 420, width: 880, height: 660 }, { seed: 41, specks: 220, crumbs: 520, spots: 26, coarse: 0.2, fine: 0.12 })
  // Mittelkonsole: Staub in Fugen und auf Hochglanzflächen
  await buildDemoPair('mittelkonsole', 'interior.jpg', { left: 640, top: 330, width: 780, height: 585 }, { seed: 57, specks: 520, crumbs: 160, coarse: 0.24, fine: 0.16 })
  // Felge/Seitenpartie: Bremsstaub (dunkler, bräunlicher Ton)
  await buildDemoPair('felge', 'graz-night.jpg', { left: 860, top: 300, width: 812, height: 609 }, { seed: 5, tint: '104,84,60', specks: 600, spots: 40, streaks: 8, coarse: 0.28, fine: 0.16 })
}

// ─── Open-Graph-Bild ──────────────────────────────────────────────────────────
async function buildOg() {
  const W = 1200
  const H = 630
  const bg = await sharp(src('hero.jpg')).resize({ width: W, height: H, fit: 'cover', position: 'right' }).toBuffer()
  const head1 = textPath(fontMedium, 'Ihr Fahrzeug. Unser Anspruch.', 54, -0.02, 72, 360)
  const head2 = textPath(fontMedium, 'Perfekter Glanz.', 54, -0.02, 72, 426)
  const sub = textPath(fontMedium, 'PREMIUM FAHRZEUGPFLEGE · GRAZ & UMGEBUNG', 15, 0.22, 72, 490)
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#09090a" stop-opacity="0.96"/><stop offset="0.55" stop-color="#09090a" stop-opacity="0.55"/><stop offset="1" stop-color="#09090a" stop-opacity="0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <path d="${head1.d}" fill="${WARM}"/>
    <path d="${head2.d}" fill="${CHAMPAGNE}"/>
    <path d="${sub.d}" fill="#a8a49c"/>
  </svg>`
  const logo = await sharp(await trimmedLogo()).resize({ width: 440 }).png().toBuffer()
  await sharp(bg)
    .composite([{ input: Buffer.from(overlay) }, { input: logo, left: 60, top: 70 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out('public/og-image.jpg'))
}

// Aufruf ohne Argumente erzeugt alles; mit Argumenten nur die genannten Teile, z. B. „node scripts/build-brand-assets.mjs logo og“
const steps = process.argv.slice(2)
const run = (name) => steps.length === 0 || steps.includes(name)
if (run('logo')) await buildLogos()
if (run('photos')) await buildPhotos()
if (run('services')) await buildServiceImages()
if (run('demos')) await buildDemos()
if (run('og')) await buildOg()
console.log('✔ Marken- und Website-Assets erzeugt.')
