/**
 * Bausteine des RM6-Designsystems: Seitengerüst mit Beschnitt, Stylesheet, Logo, QR-Code, Gestaltungselemente
 * und das responsive Haupt-Layout („hero“), das sich an Quer-, Hoch- und Extremformate anpasst.
 * Alle Maße innerhalb eines Motivs sind relativ (cqw/cqh/cqmin) – dadurch skaliert ein Motiv sauber
 * vom Visitenkarten- bis zum Bannerformat, ohne verzerrt zu werden.
 */
import QRCode from 'qrcode'
import { FACTS } from './config.mjs'

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const fmtMin = (m) => {
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r} Min.`
  if (!r) return `${h} Std.`
  if (r === 30) return `${h},5 Std.`
  return `${h} Std. ${r} Min.`
}

/** QR-Code als Vektor (SVG), Standard-Polarität, Ruhezone 4 Module, Fehlerkorrektur M */
export function qrSvg(url, { dark = '#0A0A0B', light = '#FFFFFF', cls = 'qr' } = {}) {
  const q = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const n = q.modules.size
  let d = ''
  for (let r = 0; r < n; r++) {
    let c = 0
    while (c < n) {
      if (!q.modules.data[r * n + c]) { c++; continue }
      let e = c
      while (e < n && q.modules.data[r * n + e]) e++
      d += `M${c + 4} ${r + 4}h${e - c}v1h${c - e}z`
      c = e
    }
  }
  const s = n + 8
  return `<svg class="${cls}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR-Code: ${esc(url)}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`
}

export const logo = (P, cls = 'logo') => `<img class="${cls}" src="${P}16_BILDER_ASSETS/logo/RM6_Autoaufbereitung_Logo_transparent.png" alt="RM6 Autoaufbereitung">`
export const photo = (P, file) => `${P}16_BILDER_ASSETS/fotos/${file}`
export const goldRule = (cls = '') => `<span class="grule ${cls}" aria-hidden="true"><i></i><b></b><i></i></span>`
export const speedLines = (cls = '') =>
  `<svg class="speed ${cls}" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stop-color="#D4A843" stop-opacity="0"/><stop offset=".55" stop-color="#E6C06A"/><stop offset="1" stop-color="#D4A843" stop-opacity="0"/></linearGradient><linearGradient id="ss" x1="0" x2="1"><stop offset="0" stop-color="#C9CCD1" stop-opacity="0"/><stop offset=".6" stop-color="#C9CCD1" stop-opacity=".8"/><stop offset="1" stop-color="#C9CCD1" stop-opacity="0"/></linearGradient></defs><polygon points="0,120 1000,40 1000,52 0,138" fill="url(#sg)"/><polygon points="80,190 1000,110 1000,116 80,200" fill="url(#ss)"/><polygon points="200,250 1000,175 1000,184 200,262" fill="url(#sg)" opacity=".7"/></svg>`
export const brackets = () => `<i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br br2"></i>`

/** Stylesheet. P = relativer Pfad zum Ordner RM6_MARKETING/ */
export function css(P) {
  const f = `${P}01_BRAND_GUIDELINES/fonts/`
  return `
@font-face{font-family:Geist;src:url('${f}Geist-Variable.woff2') format('woff2');font-weight:100 900}
@font-face{font-family:Barlow;src:url('${f}BarlowCondensed-600-normal.woff2') format('woff2');font-weight:600}
@font-face{font-family:Barlow;src:url('${f}BarlowCondensed-700-normal.woff2') format('woff2');font-weight:700}
@font-face{font-family:Barlow;src:url('${f}BarlowCondensed-800-normal.woff2') format('woff2');font-weight:800}
@font-face{font-family:Barlow;src:url('${f}BarlowCondensed-700-italic.woff2') format('woff2');font-weight:700;font-style:italic}
@font-face{font-family:Barlow;src:url('${f}BarlowCondensed-800-italic.woff2') format('woff2');font-weight:800;font-style:italic}
@font-face{font-family:Serif;src:url('${f}instrument-serif-latin-400-italic.woff2') format('woff2');font-style:italic}
@font-face{font-family:Serif;src:url('${f}instrument-serif-latin-400-normal.woff2') format('woff2');font-style:normal}
:root{--black:#0A0A0B;--carbon:#17171A;--gold:#D4A843;--gold-l:#E6C06A;--gold-d:#9A7420;--silver:#C9CCD1;--ivory:#F4F1EA;--red:#C8372D;
--goldgrad:linear-gradient(100deg,#9A7420 0%,#D4A843 22%,#F3D88E 46%,#D4A843 62%,#B58A2C 82%,#E6C06A 100%)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#555}
body{font-family:Geist,Arial,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.sheet{position:relative;overflow:hidden;break-after:page;page-break-after:always;background:var(--black)}
.sheet:last-child{break-after:auto;page-break-after:auto}
.bg{position:absolute;inset:0;overflow:hidden}
.trim{position:absolute;container-type:size;overflow:visible}
.abs{position:absolute}
.logo{display:block;height:auto}
.qr{display:block;width:100%;height:auto}
.gold{background:var(--goldgrad);-webkit-background-clip:text;background-clip:text;color:transparent}
.gold-solid{color:var(--gold)}
.silver{color:var(--silver)}
.serif{font-family:Serif,serif;font-style:italic;font-weight:400;letter-spacing:0}
.cond{font-family:Barlow,Geist,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.01em;line-height:.92}
.cond-i{font-family:Barlow,Geist,sans-serif;font-weight:800;font-style:italic;text-transform:uppercase;letter-spacing:.005em;line-height:.9}
.eyebrow{font-weight:600;text-transform:uppercase;letter-spacing:.32em;color:var(--gold)}
.grule{display:flex;align-items:center;gap:.6em;width:100%}
.grule i{flex:1;height:.09em;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
.grule b{width:.42em;height:.42em;border-radius:50%;background:var(--gold);flex:none}
.speed{position:absolute;pointer-events:none}
.br{position:absolute;width:6cqmin;height:6cqmin;border-color:var(--gold);border-style:solid;border-width:0}
.br.tl{top:4cqmin;left:4cqmin;border-top-width:.35cqmin;border-left-width:.35cqmin}
.br.tr{top:4cqmin;right:4cqmin;border-top-width:.35cqmin;border-right-width:.35cqmin}
.br.bl{bottom:4cqmin;left:4cqmin;border-bottom-width:.35cqmin;border-left-width:.35cqmin}
.br.br2{bottom:4cqmin;right:4cqmin;border-bottom-width:.35cqmin;border-right-width:.35cqmin}
.chip{display:inline-flex;align-items:center;gap:.5em;padding:.45em 1em;border:1px solid rgba(212,168,67,.55);border-radius:999px;color:#fff;font-weight:500;white-space:nowrap}
.chip::before{content:'';width:.42em;height:.42em;border-radius:50%;background:var(--gold)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.6em;padding:.75em 1.6em;border-radius:999px;background:var(--goldgrad);color:#15120C;font-weight:700;text-transform:uppercase;letter-spacing:.14em;white-space:nowrap}
.badge-sale{display:inline-block;padding:.18em .5em;border-radius:.3em;background:var(--red);color:#fff;font-weight:700;letter-spacing:.02em}
.qrbox{background:#fff;border-radius:.25em;padding:0;overflow:hidden}
.ph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.todo{color:#E58A7E}
.muted{color:#B9B4AA}
.light .muted{color:#5d594f}
/* Konzept C – heller Grund */
.light{color:#0A0A0B}
.light .eyebrow{color:var(--gold-d)}
.light .gold-solid{color:var(--gold-d)}
.light .chip{color:#0A0A0B;border-color:rgba(154,116,32,.5)}
.light .grule i{background:linear-gradient(90deg,transparent,var(--gold-d),transparent)}
.light .grule b{background:var(--gold-d)}
`
}

/** Skalierbare Größe: build.mjs verkleinert --k automatisch, falls Inhalte nicht in den Sicherheitsabstand passen. */
export const k = (v) => `calc(var(--k, 1) * ${v})`

/** Seite mit Beschnitt. w/h = Endformat, bleed = Beschnitt je Seite (gleiche Einheit) */
export function page({ w, h, unit, bleed = 0, bg = '', content = '', cls = '', sheetBg }) {
  const W = w + 2 * bleed
  const H = h + 2 * bleed
  return `<section class="sheet" style="width:${W}${unit};height:${H}${unit}${sheetBg ? `;background:${sheetBg}` : ''}"><div class="bg">${bg}</div><div class="trim ${cls}" style="left:${bleed}${unit};top:${bleed}${unit};width:${w}${unit};height:${h}${unit}">${content}</div></section>`
}

export function doc({ title, pages, w, h, unit, bleed = 0, P, extraCss = '' }) {
  const W = w + 2 * bleed
  const H = h + 2 * bleed
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="generator" content="RM6 Kampagnen-Generator (scripts/campaign)">
<style>${css(P)}@page{size:${W}${unit} ${H}${unit};margin:0}${extraCss}</style></head><body>${pages.join('\n')}</body></html>`
}

/** Hintergründe je Konzept */
export function background(concept, P, { photo: ph, photoPos = '50% 50%', side = 'right', strength = 1 } = {}) {
  if (concept === 'C') {
    return `<div class="abs" style="inset:0;background:var(--ivory)"></div>${
      ph ? `<img class="ph" src="${photo(P, ph)}" style="object-position:${photoPos};${side === 'right' ? 'left:54%;width:46%' : side === 'left' ? 'width:46%' : side === 'top' ? 'height:46%' : 'top:54%;height:46%'}">${side === 'top' ? '<div class="abs" style="left:0;right:0;top:0;height:46%;background:linear-gradient(180deg,rgba(10,10,11,.7),rgba(10,10,11,0) 35%)"></div>' : ''}` : ''
    }`
  }
  const glow = `<div class="abs" style="inset:0;background:radial-gradient(60% 70% at 78% 18%,rgba(212,168,67,.22),transparent 70%),radial-gradient(50% 60% at 10% 100%,rgba(212,168,67,.10),transparent 70%),linear-gradient(180deg,#0A0A0B,#111114)"></div>`
  const tex = `<div class="abs" style="inset:0;opacity:.18;background:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 2px,transparent 2px 9px)"></div>`
  if (!ph) return glow + tex
  const shade =
    side === 'right'
      ? 'linear-gradient(90deg,#0A0A0B 0%,rgba(10,10,11,.96) 38%,rgba(10,10,11,.55) 62%,rgba(10,10,11,.15) 100%)'
      : side === 'bottom'
        ? 'linear-gradient(0deg,#0A0A0B 0%,rgba(10,10,11,.92) 40%,rgba(10,10,11,.25) 75%,rgba(10,10,11,.4) 100%)'
        : 'linear-gradient(180deg,rgba(10,10,11,.55),rgba(10,10,11,.88))'
  return `${glow}<img class="ph" src="${photo(P, ph)}" style="object-position:${photoPos};opacity:${strength}"><div class="abs" style="inset:0;background:${shade}"></div>${tex}`
}

/**
 * Haupt-Layout für Banner, Schilder, Poster, Bildschirme, Social Media und Anzeigen.
 * o: { concept, eyebrow, headline, sub, services:[], offer:{label,price,regular}, cta, qr, phone, web, note, ar }
 */
export function hero(P, o) {
  const ar = o.ar
  const shape = ar >= 4.5 ? 'strip' : ar >= 2.2 ? 'wide' : ar >= 1.2 ? 'land' : ar >= 0.85 ? 'square' : ar >= 0.42 ? 'port' : 'tower'
  const light = o.concept === 'C'
  const hcls = o.concept === 'B' || o.concept === 'D' ? 'cond-i' : 'cond'
  const head = o.headline ? `<h1 class="${hcls} hl">${o.headline}</h1>` : ''
  const sub = o.sub ? `<p class="sub">${o.sub}</p>` : ''
  const eb = o.eyebrow ? `<p class="eyebrow eb">${o.eyebrow}</p>` : ''
  const services = o.services?.length ? `<div class="svc">${o.services.map((s) => `<span class="chip">${s}</span>`).join('')}</div>` : ''
  const offer = o.offer
    ? `<div class="offer"><span class="ol">${o.offer.label}</span><span class="op ${light ? '' : 'gold'}">${o.offer.price}</span>${o.offer.regular ? `<span class="or">${o.offer.regular}</span>` : ''}</div>`
    : ''
  const contact = `<div class="ct">${o.phone !== false ? `<span class="tel">${FACTS.phone}</span>` : ''}${o.web !== false ? `<span class="web">${FACTS.web}</span>` : ''}</div>`
  const qr = o.qr ? `<div class="qrw"><div class="qrbox">${qrSvg(o.qr)}</div><span class="ql">${o.qrLabel ?? 'Termin online buchen'}</span></div>` : ''
  const cta = o.cta ? `<span class="btn cta">${o.cta}</span>` : ''
  const note = o.note ? `<p class="note">${o.note}</p>` : ''
  const L = logo(P, 'logo lg')

  // Größenregeln je Format (in cq-Einheiten der Endformat-Fläche)
  const S = {
    strip: { pad: '6cqh 2.2cqw', lg: '15cqw', hl: '30cqh', sub: '13cqh', eb: '10cqh', chip: '11cqh', tel: '22cqh', web: '18cqh', qr: '78cqh', btn: '13cqh' },
    wide: { pad: '8cqh 4cqw', lg: ar > 3.5 ? '19cqw' : '24cqw', hl: '15cqh', sub: '5.4cqh', eb: '3.8cqh', chip: '4.6cqh', tel: '9cqh', web: '7.4cqh', qr: '44cqh', btn: '3.4cqh' },
    land: { pad: '8cqh 6cqw', lg: '30cqw', hl: '9.6cqh', sub: '3.5cqh', eb: '2.5cqh', chip: '3cqh', tel: '5.8cqh', web: '4.6cqh', qr: '23cqh', btn: '3.2cqh' },
    square: { pad: '7cqw', lg: '50cqw', hl: '10cqw', sub: '3.6cqw', eb: '2.6cqw', chip: '2.8cqw', tel: '5.2cqw', web: '4cqw', qr: '22cqw', btn: '3.2cqw' },
    port: { pad: '7cqw', lg: '56cqw', hl: '11.2cqw', sub: '3.9cqw', eb: '2.7cqw', chip: '3.3cqw', tel: '6.6cqw', web: '5.2cqw', qr: '24cqw', btn: '3.6cqw' },
    tower: { pad: '7cqw', lg: '86cqw', hl: '15cqw', sub: '6.6cqw', eb: '5cqw', chip: '5.2cqw', tel: '8cqw', web: '7cqw', qr: '62cqw', btn: '6cqw' },
  }[shape]
  for (const key of Object.keys(S)) if (key !== 'pad') S[key] = k(S[key])
  const textCol = light ? '#0A0A0B' : '#fff'
  const style = `<style>
.h-${o.id} {position:absolute;inset:0;padding:${S.pad};display:flex;color:${textCol}}
.h-${o.id} .lg{width:${S.lg}}
.h-${o.id} .hl{font-size:${S.hl}}
.h-${o.id} .sub{font-size:${S.sub};line-height:1.32;color:${light ? '#3c3a35' : '#D9D5CC'};max-width:44em}
.h-${o.id} .eb{font-size:${S.eb}}
.h-${o.id} .svc{display:flex;flex-wrap:wrap;gap:.6em;font-size:${S.chip}}
.h-${o.id} .tel{font-family:Barlow,sans-serif;font-weight:800;font-size:${S.tel};letter-spacing:.02em;line-height:1}
.h-${o.id} .web{font-family:Barlow,sans-serif;font-weight:700;font-size:${S.web};letter-spacing:.06em;color:${light ? 'var(--gold-d)' : 'var(--gold)'};line-height:1}
.h-${o.id} .ct{display:flex;flex-wrap:wrap;align-items:baseline;gap:.15em .7em;font-size:${S.web}}
.h-${o.id} .ct .tel{margin-right:.2em}
.h-${o.id} .ct-s .tel{font-size:calc(${S.tel} * .68)}.h-${o.id} .ct-s .web{font-size:calc(${S.web} * .68)}
.h-${o.id} .qrw{display:flex;flex-direction:column;align-items:center;gap:.4em;width:${S.qr};flex:none;container-type:inline-size}
.h-${o.id} .qrw .qrbox{width:100%;padding:0}
.h-${o.id} .ql{font-size:6.4cqi;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:${light ? '#3c3a35' : 'var(--silver)'};text-align:center;white-space:nowrap}
.h-${o.id} .btn{font-size:${S.btn}}
.h-${o.id} .offer{display:flex;flex-direction:column;gap:.15em}
.h-${o.id} .ol{font-size:calc(${S.eb} * 1.1);font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:${light ? 'var(--gold-d)' : 'var(--gold)'}}
.h-${o.id} .op{font-family:Barlow,sans-serif;font-weight:800;font-size:calc(${S.hl} * 1.15);line-height:.95}
.h-${o.id} .or{font-size:calc(${S.sub} * .85);color:${light ? '#5d594f' : 'var(--silver)'}}
.h-${o.id} .note{font-size:calc(${S.sub} * .62);color:${light ? '#5d594f' : '#A8A39A'};line-height:1.35}
.h-${o.id} .stack{display:flex;flex-direction:column;gap:${k(shape === 'wide' ? '3.2cqh' : shape === 'strip' ? '0px' : '2.4cqmin')}}
</style>`
  let body
  if (o.concept === 'C' && o.photoTop && ar < 1.2) {
    body = `<style>.h-${o.id} .hl{font-size:${k(shape === 'port' ? '9.4cqw' : '8cqw')}}.h-${o.id} .sub{font-size:${k(shape === 'port' ? '3.4cqw' : '3cqw')}}.h-${o.id} .svc{font-size:${k('2.9cqw')}}.h-${o.id} .qrw{width:${k(shape === 'port' ? '21cqw' : '18cqw')}}.h-${o.id} .stack{gap:${k('1.8cqw')}}</style><div class="h-${o.id}" style="flex-direction:column;justify-content:space-between;padding:${S.pad}"><div>${logo(P, 'logo lg').replace('class="logo lg"', 'class="logo lg" style="width:' + k(shape === 'port' ? '44cqw' : '36cqw') + '"')}</div><div style="display:grid;grid-template-columns:1fr auto;gap:5cqw;align-items:end;height:46%"><div class="stack">${eb}${head}${sub}${services}${offer}${contact}${note}</div>${qr}</div></div>`
    return style + body
  }
  if (shape === 'strip') {
    body = `<div class="h-${o.id}" style="align-items:center;gap:3cqw">${L}<div class="stack" style="flex:1">${head}</div>${o.cta ? cta : contact}${qr}</div>`
  } else if (shape === 'wide') {
    body = `<div class="h-${o.id}" style="align-items:center;gap:4cqw"><div style="display:flex;flex-direction:column;align-items:flex-start;gap:3cqh;flex:none">${L}${o.services?.length && o.qr ? '' : o.qr ? contact : contact.replace('class="ct"', 'class="ct ct-s"')}</div><div class="stack" style="flex:1;align-self:center">${eb}${head}${o.services?.length || o.offer ? '' : sub}${services}${offer}${note}</div>${o.qr || o.cta ? `<div class="stack" style="align-items:center;flex:none">${qr}${o.services?.length && o.qr ? contact : ''}${cta}</div>` : ''}</div>`
  } else if (shape === 'land') {
    body = `<div class="h-${o.id}" style="flex-direction:column;justify-content:space-between"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4cqw">${L}${o.offer ? offer : ''}</div><div class="stack" style="max-width:${o.photoSide ? '52%' : '74%'}">${eb}${head}${o.services?.length || o.offer ? '' : sub}${services}</div><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:4cqw"><div class="stack">${contact}${cta}${note}</div>${qr}</div></div>`
  } else if (shape === 'square') {
    body = `<div class="h-${o.id}" style="flex-direction:column;justify-content:space-between"><div style="display:flex;justify-content:space-between;align-items:flex-start">${logo(P, 'logo lg')}</div><div class="stack">${eb}${head}${sub}${services}${offer}</div><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:4cqw"><div class="stack">${cta}${contact}${note}</div>${qr}</div></div>`
  } else if (shape === 'port') {
    const bottom = o.qr
      ? `<div style="display:flex;align-items:center;justify-content:center;gap:5cqw;text-align:left">${qr}<div class="stack" style="align-items:flex-start">${cta}<span class="tel">${o.phone === false ? '' : FACTS.phone}</span><span class="web">${FACTS.web}</span></div></div>`
      : `<div class="stack" style="align-items:center">${cta}${contact.replace('class="ct"', 'class="ct" style="justify-content:center"')}</div>`
    body = `<div class="h-${o.id}" style="flex-direction:column;justify-content:space-between;align-items:center;text-align:center"><div class="stack" style="align-items:center">${L}</div><div class="stack" style="align-items:center">${eb}${head}${o.offer ? '' : sub}${services ? services.replace('class="svc"', 'class="svc" style="justify-content:center"') : ''}${offer ? offer.replace('class="offer"', 'class="offer" style="align-items:center"') : ''}</div><div class="stack" style="align-items:center">${bottom}${note}</div></div>`
  } else {
    body = `<div class="h-${o.id}" style="flex-direction:column;justify-content:space-between;align-items:center;text-align:center">${L}<div class="stack" style="align-items:center">${eb}${head}${sub}</div><div class="stack" style="align-items:center">${cta}${o.qr && ar > 0.3 ? qr : ''}${o.phone === false ? '' : `<span class="tel">${FACTS.phone}</span>`}<span class="web">${FACTS.web}</span></div></div>`
  }
  return style + body
}

/** Kompakte Preistabelle (alle Fahrzeugkategorien × Pakete) */
export function priceTable(PACKAGES, VEHICLES, { light = false, regular = true, minutes = true } = {}) {
  const head = `<tr><th>Fahrzeug</th>${PACKAGES.map((p) => `<th class="${p.featured ? 'ft' : ''}">${esc(p.name)}</th>`).join('')}</tr>`
  const rows = VEHICLES.map(
    (v, i) =>
      `<tr><th>${v}</th>${PACKAGES.map((p) => `<td class="${p.featured ? 'ft' : ''}"><b>${p.promo[i]} €</b>${regular ? `<small>regulär ${p.regular[i]} €</small>` : ''}${minutes ? `<small>ca. ${fmtMin(p.minutes[i])}</small>` : ''}</td>`).join('')}</tr>`,
  ).join('')
  return `<table class="pt ${light ? 'pt-l' : ''}"><thead>${head}</thead><tbody>${rows}</tbody></table>`
}

export const tableCss = `
.pt{width:100%;border-collapse:collapse}
.pt th,.pt td{padding:.55em .6em;text-align:right;border-bottom:1px solid rgba(255,255,255,.12);vertical-align:top}
.pt thead th{font-size:.72em;letter-spacing:.14em;text-transform:uppercase;color:#C9CCD1;font-weight:600}
.pt th:first-child{text-align:left}
.pt tbody th{font-weight:600}
.pt td b{display:block;font-size:1.15em}
.pt td small{display:block;font-size:.72em;color:#A8A39A;white-space:nowrap}
.pt .ft{background:rgba(212,168,67,.12)}
.pt thead .ft{color:#D4A843}
.pt-l th,.pt-l td{border-bottom-color:rgba(0,0,0,.12)}
.pt-l thead th{color:#5d594f}
.pt-l td small{color:#5d594f}
.pt-l .ft{background:rgba(212,168,67,.16)}
.pt-l thead .ft{color:#9A7420}
`
