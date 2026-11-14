#!/usr/bin/env node
/**
 * Erzeugt alle Marken- und Website-Assets aus den Canva-Quellbildern:
 *   - optimierte Website-Bilder        → public/images/*.jpg
 *   - Vorher/Nachher-DEMO-Visualisierungen (deutlich als Demo gekennzeichnet) → public/images/demo/*
 *   - Logo-Dateien (SVG mit Pfaden, PNG) → brand/logo/*
 *   - Favicon / App-Icons / Open-Graph-Bild → src/app/icon.svg, src/app/apple-icon.png, public/*
 *
 * Aufruf: node scripts/build-brand-assets.mjs
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

const INK = '#0b0b0c'
const WARM = '#f4f1ea'
const CHAMPAGNE = '#c8b48a'
const CHAMPAGNE_DARK = '#9a8256'

// ─── Schrift → SVG-Pfade ──────────────────────────────────────────────────────
const loadFont = (f) => { const b = fs.readFileSync(path.join(root, 'brand/fonts', f)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) }
const fontMedium = loadFont('Geist-Medium.ttf')
const fontSemi = loadFont('Geist-SemiBold.ttf')

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

// Emblem: Monogramm „RM“ + Glanzpunkt. Die Pfaddaten stammen direkt aus src/components/site/Logo.tsx
// (eine Quelle für Website und Logo-Dateien).
const logoSource = fs.readFileSync(path.join(root, 'src/components/site/Logo.tsx'), 'utf8')
const grab = (name) => {
  const m = logoSource.match(new RegExp(`${name}\\s*=\\s*\\n?\\s*'([^']+)'`))
  if (!m) throw new Error(`${name} nicht in Logo.tsx gefunden`)
  return m[1]
}
const RM_PATH = grab('RM_MONOGRAM_PATH')
const GLINT_PATH = grab('GLINT_PATH')
const CAP = fontSemi.tables.os2.sCapHeight / fontSemi.unitsPerEm // Versalhöhe relativ zur Schriftgröße
const BRAND = 'RM Mobile Auto Aufbereitung'

function emblem(ink, glint, transform = '') {
  return `<g${transform ? ` transform="${transform}"` : ''}>
    <path d="${RM_PATH}" fill="${ink}"/>
    <path d="${GLINT_PATH}" fill="${glint}"/>
  </g>`
}

/** Zweizeiliger Textblock „MOBILE / AUTO AUFBEREITUNG“, Grundlinie unten = baseline, Oberkante der Versalien oben = capTop. */
function nameBlock({ ink, accent, x, baseline, capTop, big, small, align = 'left', width }) {
  const main = textPath(fontSemi, 'AUTO AUFBEREITUNG', big, 0.22, 0, baseline)
  const eyebrowSize = small
  const eyebrowBaseline = capTop + eyebrowSize * CAP
  const eyebrow = textPath(fontMedium, 'MOBILE', eyebrowSize, 0.42, 0, eyebrowBaseline)
  const w = main.width
  const left = align === 'center' ? x - w / 2 : x
  const m = textPath(fontSemi, 'AUTO AUFBEREITUNG', big, 0.22, left, baseline)
  const e = textPath(fontMedium, 'MOBILE', eyebrowSize, 0.42, align === 'center' ? x - eyebrow.width / 2 : left, eyebrowBaseline)
  return { svg: `<path d="${e.d}" fill="${accent}"/><path d="${m.d}" fill="${ink}"/>`, width: w }
}

/** Waagerechtes Logo: Monogramm + Namensblock. */
function logoSvg({ text, sub, glint, bg }) {
  const scale = 2.4 // Emblem 48 → 115 px
  const markSize = 48 * scale
  const baseline = 40 * scale // Grundlinie von „RM“
  const capTop = 18.7 * scale // Oberkante von „RM“
  const x = markSize + 30
  const block = nameBlock({ ink: text, accent: sub, x, baseline, capTop, big: 35, small: 14 })
  const width = Math.ceil(x + block.width + 8)
  const height = Math.ceil(markSize)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <title>${BRAND}</title>
  ${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}
  ${emblem(text, glint, `scale(${scale})`)}
  ${block.svg}
</svg>`
}

function emblemSvg({ ink, glint, bg, size = 512, radius = 0 }) {
  const s = size / 48
  const pad = bg ? size * 0.14 : 0
  const inner = (size - pad * 2) / 48
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <title>${BRAND} – Monogramm</title>
  ${bg ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>` : ''}
  ${emblem(ink, glint, bg ? `translate(${pad} ${pad}) scale(${inner})` : `scale(${s})`)}
</svg>`
}

/** Reine Wortmarke ohne Emblem (für schmale Flächen, Fußzeilen, Stempel): „RM“ | MOBILE / AUTO AUFBEREITUNG. */
function wordmarkSvg({ text, sub, bg }) {
  const pad = bg ? 40 : 4
  const rmSize = 84
  const rmCap = rmSize * CAP
  const baseline = pad + rmCap + 6
  const rm = textPath(fontSemi, 'RM', rmSize, 0.02, pad, baseline)
  const dividerX = pad + rm.width + 26
  const x = dividerX + 26
  const capTop = baseline - rmCap
  const block = nameBlock({ ink: text, accent: sub, x, baseline, capTop, big: 31, small: 14.5 })
  const width = Math.ceil(x + block.width + pad)
  const height = Math.ceil(baseline + pad + 6)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <title>${BRAND} – Wortmarke</title>
  ${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}
  <path d="${rm.d}" fill="${text}"/>
  <rect x="${dividerX}" y="${capTop}" width="2" height="${rmCap}" fill="${sub}"/>
  ${block.svg}
</svg>`
}

/** Gestapeltes Logo: Emblem über dem Namensblock (für quadratische Flächen, Social Media, Aufkleber). */
function stackedSvg({ text, sub, glint, bg, size = 800 }) {
  const scale = 4.6
  const mark = 48 * scale
  const cx = size / 2
  const top = size * 0.2
  const big = 44
  const small = 19
  const eyebrowCapTop = top + mark + 54
  const baseline = eyebrowCapTop + small * CAP + 26 + big * CAP
  const block = nameBlock({ ink: text, accent: sub, x: cx, baseline, capTop: eyebrowCapTop, big, small, align: 'center' })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <title>${BRAND} – Logo gestapelt</title>
  ${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}
  ${emblem(text, glint, `translate(${cx - mark / 2} ${top}) scale(${scale})`)}
  ${block.svg}
</svg>`
}

/** Profilbild für Social Media (Emblem zentriert, sicher innerhalb des Kreis-Zuschnitts). */
function profileSvg(size = 1080) {
  const scale = (size * 0.4) / 48
  const mark = 48 * scale
  const o = (size - mark) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs><radialGradient id="g" cx="0.5" cy="0.38" r="0.75"><stop offset="0" stop-color="#1b1b1e"/><stop offset="1" stop-color="#070708"/></radialGradient></defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.36}" fill="none" stroke="${CHAMPAGNE}" stroke-opacity="0.22" stroke-width="2"/>
  ${emblem(WARM, CHAMPAGNE, `translate(${o} ${o}) scale(${scale})`)}
</svg>`
}

async function buildLogoVariants() {
  const write = async (name, svg, density = 300) => {
    fs.writeFileSync(out('brand/logo', `${name}.svg`), svg)
    await sharp(Buffer.from(svg), { density }).png().toFile(out('brand/logo', `${name}.png`))
  }
  await write('rm-wortmarke-fuer-dunklen-hintergrund', wordmarkSvg({ text: WARM, sub: CHAMPAGNE }))
  await write('rm-wortmarke-fuer-hellen-hintergrund', wordmarkSvg({ text: INK, sub: CHAMPAGNE_DARK }))
  await write('rm-logo-gestapelt-dunkel', stackedSvg({ text: WARM, sub: CHAMPAGNE, glint: CHAMPAGNE, bg: INK }), 144)
  await write('rm-logo-gestapelt-hell', stackedSvg({ text: INK, sub: CHAMPAGNE_DARK, glint: CHAMPAGNE_DARK, bg: WARM }), 144)
  await sharp(Buffer.from(profileSvg(1080))).png().toFile(out('brand/social', 'profilbild-1080.png'))
  await sharp(Buffer.from(wordmarkSvg({ text: WARM, sub: CHAMPAGNE, bg: INK })), { density: 200 }).png().toFile(out('brand/logo/vorschau-wortmarke-dunkel.png'))
  await sharp(Buffer.from(wordmarkSvg({ text: INK, sub: CHAMPAGNE_DARK, bg: WARM })), { density: 200 }).png().toFile(out('brand/logo/vorschau-wortmarke-hell.png'))
}

async function buildLogos() {
  const dark = logoSvg({ text: WARM, sub: CHAMPAGNE, glint: CHAMPAGNE })
  const light = logoSvg({ text: INK, sub: CHAMPAGNE_DARK, glint: CHAMPAGNE_DARK })
  fs.writeFileSync(out('brand/logo/rm-logo-fuer-dunklen-hintergrund.svg'), dark)
  fs.writeFileSync(out('brand/logo/rm-logo-fuer-hellen-hintergrund.svg'), light)
  fs.writeFileSync(out('brand/logo/rm-emblem-hell.svg'), emblemSvg({ ink: WARM, glint: CHAMPAGNE }))
  fs.writeFileSync(out('brand/logo/rm-emblem-dunkel.svg'), emblemSvg({ ink: INK, glint: CHAMPAGNE_DARK }))
  await sharp(Buffer.from(dark), { density: 300 }).png().toFile(out('brand/logo/rm-logo-fuer-dunklen-hintergrund.png'))
  await sharp(Buffer.from(light), { density: 300 }).png().toFile(out('brand/logo/rm-logo-fuer-hellen-hintergrund.png'))
  // Vorschau auf Hintergrund (zur Kontrolle)
  await sharp(Buffer.from(logoSvg({ text: WARM, sub: CHAMPAGNE, glint: CHAMPAGNE, bg: INK })), { density: 200 })
    .png()
    .toFile(out('brand/logo/vorschau-dunkel.png'))
  await sharp(Buffer.from(logoSvg({ text: INK, sub: CHAMPAGNE_DARK, glint: CHAMPAGNE_DARK, bg: WARM })), { density: 200 })
    .png()
    .toFile(out('brand/logo/vorschau-hell.png'))

  // App-Icons / Favicon
  const appIcon = emblemSvg({ ink: WARM, glint: CHAMPAGNE, bg: INK, size: 512, radius: 112 })
  fs.writeFileSync(out('src/app/icon.svg'), emblemSvg({ ink: WARM, glint: CHAMPAGNE, bg: INK, size: 64, radius: 14 }))
  await sharp(Buffer.from(emblemSvg({ ink: WARM, glint: CHAMPAGNE, bg: INK, size: 180, radius: 0 }))).png().toFile(out('src/app/apple-icon.png'))
  await sharp(Buffer.from(appIcon)).png().toFile(out('public/icon-512.png'))
  await sharp(Buffer.from(emblemSvg({ ink: WARM, glint: CHAMPAGNE, bg: INK, size: 192, radius: 42 }))).png().toFile(out('public/icon-192.png'))
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
  const head1 = textPath(fontMedium, 'Dein Fahrzeug. Unser Anspruch.', 54, -0.02, 72, 330)
  const head2 = textPath(fontMedium, 'Perfekter Glanz.', 54, -0.02, 72, 396)
  const sub = textPath(fontMedium, 'PREMIUM FAHRZEUGPFLEGE · GRAZ & UMGEBUNG', 15, 0.22, 72, 460)
  const scale = 1.6
  const markTop = 80
  const block = nameBlock({
    ink: WARM,
    accent: CHAMPAGNE,
    x: 72 + 48 * scale + 18,
    baseline: markTop + 40 * scale,
    capTop: markTop + 18.7 * scale,
    big: 20,
    small: 10,
  })
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#09090a" stop-opacity="0.96"/><stop offset="0.55" stop-color="#09090a" stop-opacity="0.55"/><stop offset="1" stop-color="#09090a" stop-opacity="0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${emblem(WARM, CHAMPAGNE, `translate(72 ${markTop}) scale(${scale})`)}
    ${block.svg}
    <path d="${head1.d}" fill="${WARM}"/>
    <path d="${head2.d}" fill="${CHAMPAGNE}"/>
    <path d="${sub.d}" fill="#a8a49c"/>
  </svg>`
  await sharp(bg)
    .composite([{ input: Buffer.from(overlay) }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out('public/og-image.jpg'))
}

await buildLogos()
await buildLogoVariants()
await buildPhotos()
await buildServiceImages()
await buildDemos()
await buildOg()
console.log('✔ Marken- und Website-Assets erzeugt.')
