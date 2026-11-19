/**
 * Printwerbemittel der RM6-Kampagne. Jede Funktion liefert Aufträge für den Renderer (build.mjs).
 * Maße in mm (Endformat), bleed = Beschnitt je Seite.
 */
import { ADDONS, COUPONS, EXTERIOR_NOTE, FACTS, PACKAGES, PROMO_NOTE, VEHICLES } from './config.mjs'
import { background, brackets, esc, fmtMin, goldRule, hero, k, logo, photo, priceTable, qrSvg, speedLines, tableCss } from './kit.mjs'

const QR = FACTS.qrBooking
const qrWith = (code) => `${FACTS.qrBooking}?gutschein=${code}`

// ─── Kampagnen-Texte (geprüft: keine Garantien, keine erfundenen Zahlen) ────────────
export const COPY = {
  A: { eyebrow: 'Mobile Fahrzeugaufbereitung · Graz & Umgebung', headline: '<span class="gold">Glanz,</span><br>der zu Ihnen kommt.', sub: 'Premium-Fahrzeugpflege von Hand – direkt bei Ihnen zu Hause oder am Arbeitsplatz.' },
  B: { eyebrow: 'Mobile Fahrzeugpflege · Graz', headline: 'Sauber. Scharf.<br><span class="gold">Startklar.</span>', sub: 'Innenraum, Außenpflege oder Komplettpaket – wir kommen mit unserer Ausrüstung zu Ihnen.' },
  C: { eyebrow: 'Elite Detailing', headline: 'Pflege bis ins <span class="serif gold-solid">Detail.</span>', sub: 'Sorgfältige Handarbeit für Innenraum und Lack – mobil in Graz und Graz-Umgebung.' },
  D: { eyebrow: 'Neu in Graz · Einführungspreise', headline: 'Wir kommen.<br><span class="gold">Sie lehnen sich zurück.</span>', sub: 'Mobile Autoaufbereitung in Graz & Umgebung. Anfahrt inklusive, Termin online buchen.' },
}
const SERVICES = ['Innenraum', 'Außenpflege', 'Komplettpaket', 'Anfahrt inklusive']
const OFFER = { label: 'Einführungspreis Innenraum', price: 'ab 79 €', regular: 'regulär ab 99 € · −20 % in der Startphase' }

/** Logo-Anteil an der Breite im Hero-Layout (für die Auflösungsprüfung) */
export const heroLogoFrac = (ar) => (ar >= 4.5 ? 0.15 : ar >= 2.2 ? (ar > 3.5 ? 0.19 : 0.24) : ar >= 1.2 ? 0.3 : ar >= 0.85 ? 0.5 : ar >= 0.42 ? 0.56 : 0.86)

/** Auftrag mit Hero-Layout */
function heroJob({ id, folder, file, w, h, bleed = 3, concept, copy = COPY[concept], extra = {}, photo: ph, photoPos, photoSide = 'right', cat, draft = [], gray = false, pages }) {
  const ar = w / h
  const job = {
    id,
    folder,
    file,
    kind: 'print',
    w,
    h,
    unit: 'mm',
    bleed,
    cat,
    gray,
    logoFrac: heroLogoFrac(ar),
    photos: ph ? [{ file: ph, fw: concept === 'C' ? (photoSide === 'right' || photoSide === 'left' ? 0.46 : 1) : 1, fh: concept === 'C' && (photoSide === 'top' || photoSide === 'bottom') ? 0.46 : 1, bleed }] : [],
    qrs: extra.qr ? [extra.qr] : [],
    draft,
    pages:
      pages ??
      ((P) => [
        {
          bg: background(concept, P, { photo: ph, photoPos, side: photoSide }) + (concept === 'B' ? `${speedLines()}` : ''),
          content: (concept === 'A' || (concept === 'C' && !ph) ? brackets() : '') + hero(P, { id, concept, ar, photoSide: ph && concept !== 'C' && ar >= 1.2 ? photoSide : null, photoTop: concept === 'C' && ph && photoSide === 'top', ...copy, ...extra }),
          cls: concept === 'C' ? 'light' : '',
        },
      ]),
  }
  return job
}

const speedCss = (ar) => `<style>.speed{left:${ar > 2 ? '30%' : '0'};right:0;top:${ar > 2 ? '10%' : '55%'};height:${ar > 2 ? '80%' : '30%'};width:${ar > 2 ? '70%' : '100%'};opacity:.85}</style>`

// ═════════════════════════════════════════════════════════════════════════════════
// 02 BANNER
// ═════════════════════════════════════════════════════════════════════════════════
export function banners() {
  const base = { bleed: 10, cat: 'large' }
  const list = []
  const mk = (w, h, concept, sub, extra, more = {}) => {
    const tag = { A: 'A_BLACKGOLD', B: 'B_PERFORMANCE', C: 'C_ELITE', D: 'D_AKTION' }[concept]
    const kind = w >= 300 && h <= 100 ? 'ZAUNBANNER' : h >= 150 ? 'GROSSBANNER' : 'BANNER'
    list.push(
      heroJob({
        id: `BAN_${w}x${h}_${concept}`,
        folder: `02_BANNER/${sub}`,
        file: `RM6_${kind}_${w}x${h}_${tag}`,
        w: w * 10,
        h: h * 10,
        concept,
        ...base,
        extra: { qr: QR, ...extra },
        ...more,
      }),
    )
  }
  mk(300, 100, 'A', 'Zaunbanner', { services: SERVICES })
  mk(300, 100, 'B', 'Zaunbanner', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'] }, { photo: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', photoPos: '70% 55%', draft: [] })
  mk(300, 100, 'C', 'Zaunbanner', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'] })
  mk(300, 100, 'D', 'Zaunbanner', { services: ['Anfahrt inklusive', 'Termin online buchen'], offer: OFFER, note: PROMO_NOTE })
  mk(400, 100, 'A', 'Zaunbanner', { services: SERVICES })
  mk(400, 100, 'D', 'Zaunbanner', { services: ['Anfahrt inklusive', 'Termin online buchen'], offer: OFFER, note: PROMO_NOTE })
  mk(300, 150, 'A', 'Grossbanner', { services: SERVICES, cta: 'Termin online buchen' })
  mk(300, 150, 'B', 'Grossbanner', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], cta: 'Termin online buchen' }, { photo: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', photoPos: '70% 50%' })
  mk(200, 100, 'A', 'Grundstuecksbanner', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'] })
  mk(200, 100, 'C', 'Grundstuecksbanner', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'] })
  mk(150, 100, 'D', 'Grundstuecksbanner', { offer: OFFER, note: PROMO_NOTE })
  mk(150, 100, 'A', 'Grundstuecksbanner', {})
  // Speed-Lines in Performance-Bannern positionieren
  for (const j of list) if (j.id.endsWith('_B')) j.extraCss = '.speed{left:28%;width:72%;top:12%;height:76%;opacity:.8}'
  return list
}

// ═════════════════════════════════════════════════════════════════════════════════
// 03 SCHILDER & AUFSTELLER
// ═════════════════════════════════════════════════════════════════════════════════
const A = { A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420], A4: [210, 297] }

export function signs() {
  const L = []
  const S = (id, sub, file, w, h, concept, extra, more = {}) =>
    L.push(heroJob({ id, folder: `03_SCHILDER_AUFSTELLER/${sub}`, file, w, h, bleed: w >= 594 || h >= 594 ? 5 : 3, concept, cat: Math.max(w, h) >= 594 ? 'poster' : 'close', extra: { qr: QR, ...extra }, ...more }))
  S('SIGN_A0_A', 'A0', 'RM6_AUFSTELLER_A0_HOCH_A_BLACKGOLD', ...A.A0, 'A', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], cta: 'Termin online buchen' })
  S('SIGN_A0_D', 'A0', 'RM6_AUFSTELLER_A0_HOCH_D_ANGEBOT', ...A.A0, 'D', { offer: OFFER, services: ['Anfahrt inklusive'], note: PROMO_NOTE })
  S('SIGN_A1_A', 'A1', 'RM6_AUFSTELLER_A1_HOCH_A_BLACKGOLD', ...A.A1, 'A', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], cta: 'Termin online buchen' })
  S('SIGN_A1_B', 'A1', 'RM6_AUFSTELLER_A1_HOCH_B_PERFORMANCE', ...A.A1, 'B', { cta: 'Termin online buchen' }, { photo: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', photoPos: '62% 50%', photoSide: 'bottom' })
  S('SIGN_A2_C', 'A2', 'RM6_AUFSTELLER_A2_HOCH_C_ELITE', ...A.A2, 'C', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'] }, { photo: 'RM6_FOTO_INNENRAUM.jpg', photoPos: '50% 60%', photoSide: 'top' })
  S('SIGN_A2_D', 'A2', 'RM6_AUFSTELLER_A2_HOCH_D_ANGEBOT', ...A.A2, 'D', { offer: OFFER, note: PROMO_NOTE })
  S('SIGN_A3_A', 'A3', 'RM6_WERBESCHILD_A3_HOCH_A_BLACKGOLD', ...A.A3, 'A', {})
  S('SIGN_A3Q_D', 'A3', 'RM6_WERBESCHILD_A3_QUER_D_ANGEBOT', 420, 297, 'D', { offer: OFFER, note: PROMO_NOTE })
  S('SIGN_60x40_A', 'Kleine_Schilder', 'RM6_SCHILD_60x40_QUER_A_BLACKGOLD', 600, 400, 'A', {})
  S('SIGN_80x60_D', 'Kleine_Schilder', 'RM6_SCHILD_80x60_QUER_D_ANGEBOT', 800, 600, 'D', { offer: OFFER, note: PROMO_NOTE })
  S('SIGN_100x70_A', 'Kleine_Schilder', 'RM6_WERBETAFEL_100x70_QUER_A_BLACKGOLD', 1000, 700, 'A', { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'] })
  S('SIGN_100x70_B', 'Kleine_Schilder', 'RM6_WERBETAFEL_100x70_QUER_B_PERFORMANCE', 1000, 700, 'B', { services: ['Innenraum', 'Außenpflege'] }, { photo: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', photoPos: '70% 50%' })
  S('SIGN_MOBIL_A3_B', 'Kleine_Schilder', 'RM6_MOBILE_TAFEL_A3_HOCH_B_PERFORMANCE', ...A.A3, 'B', { cta: 'Termin online buchen' }, { photo: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', photoPos: '62% 50%', photoSide: 'bottom' })
  for (const j of L) if (j.id.includes('_B')) j.extraCss = '.speed{left:0;width:100%;top:48%;height:22%;opacity:.75}'

  // Klappaufsteller A1: Vorderseite Angebot, Rückseite Image (2 Seiten)
  const kf = heroJob({ id: 'KLAPP_A1', folder: '03_SCHILDER_AUFSTELLER/Klappaufsteller', file: 'RM6_KLAPPAUFSTELLER_A1_VORDER_RUECK', w: 594, h: 841, bleed: 5, concept: 'D', cat: 'poster', extra: { qr: QR } })
  kf.pages = (P) => [
    { bg: background('D', P), content: hero(P, { id: 'KLAPP_A1f', concept: 'D', ar: 594 / 841, ...COPY.D, offer: OFFER, services: ['Anfahrt inklusive'], note: PROMO_NOTE, qr: QR }) },
    { bg: background('A', P), content: brackets() + hero(P, { id: 'KLAPP_A1b', concept: 'A', ar: 594 / 841, ...COPY.A, services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], cta: 'Termin online buchen', qr: QR }) },
  ]
  L.push(kf)

  // Eingangsschild (Elite, hell) und Parkplatz-/Einfahrtsschild
  L.push({
    id: 'SIGN_EINGANG',
    folder: '03_SCHILDER_AUFSTELLER/Kleine_Schilder',
    file: 'RM6_EINGANGSSCHILD_60x40_C_ELITE',
    kind: 'print', w: 600, h: 400, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 0.56, photos: [], qrs: [QR], draft: [],
    pages: (P) => [{
      bg: background('C', P), cls: 'light',
      content: `${brackets()}<div class="abs" style="inset:9cqh 8cqw;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:56cqw"')}${goldRule().replace('class="grule ', 'class="grule " style="width:40cqw;font-size:3cqh" data-x="')}<div><p class="eyebrow" style="font-size:3.4cqh">Mobile Fahrzeugpflege · Graz & Umgebung</p><p style="margin-top:2cqh;font-size:5cqh">Termine nach Vereinbarung · <b style="color:var(--gold-d)">${FACTS.web}</b></p></div><div style="display:flex;align-items:center;gap:3cqw"><div class="qrbox" style="width:17cqh">${qrSvg(QR)}</div><p style="text-align:left;font-size:3.6cqh;line-height:1.3">Termin online buchen<br><b style="font-size:5.4cqh">${FACTS.phone}</b></p></div></div>`,
    }],
  })
  L.push({
    id: 'SIGN_PARK',
    folder: '03_SCHILDER_AUFSTELLER/Kleine_Schilder',
    file: 'RM6_PARKPLATZSCHILD_40x60_HOCH_A',
    kind: 'print', w: 400, h: 600, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 0.8, photos: [], qrs: [], draft: [],
    pages: (P) => [{
      bg: background('A', P),
      content: `${brackets()}<div class="abs" style="inset:8cqw;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center"><div style="width:44cqw;height:44cqw;border-radius:50%;border:2.4cqw solid var(--gold);display:grid;place-items:center"><span class="cond gold" style="font-size:36cqw;line-height:1">P</span></div><div><p class="cond" style="font-size:12cqw">Parkplatz</p><p class="cond gold" style="font-size:9.5cqw;margin-top:1cqw">Fahrzeugpflege</p><p style="margin-top:3cqw;font-size:4.4cqw;color:var(--silver)">Bitte während des Termins freihalten</p></div>${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:80cqw"')}</div>`,
    }],
  })
  // Öffnungs- bzw. Einsatzzeiten (laut Website: buchbare Zeiten)
  L.push({
    id: 'SIGN_ZEITEN',
    folder: '03_SCHILDER_AUFSTELLER/Kleine_Schilder',
    file: 'RM6_EINSATZZEITEN_A4_HOCH_A',
    kind: 'print', w: 210, h: 297, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 0.7, photos: [], qrs: [QR], draft: [],
    pages: (P) => [{
      bg: background('A', P),
      content: `${brackets()}<div class="abs" style="inset:12cqw 11cqw;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:70cqw"')}<div style="width:100%"><p class="eyebrow" style="font-size:3.2cqw">Unsere Einsatzzeiten</p><p class="cond" style="font-size:10cqw;margin:2cqw 0 6cqw">Termine nach <span class="gold">Vereinbarung</span></p>${FACTS.hours.map(([d, t]) => `<div style="display:flex;justify-content:space-between;padding:3cqw 0;border-bottom:.3cqw solid rgba(212,168,67,.35);font-size:4.6cqw"><span>${d}</span><b>${t}</b></div>`).join('')}<p class="muted" style="font-size:3.2cqw;margin-top:4cqw">Mobile Fahrzeugpflege – wir kommen zu Ihrem Standort in Graz & Graz-Umgebung.</p></div><div style="display:flex;align-items:center;gap:5cqw"><div class="qrbox" style="width:24cqw">${qrSvg(QR)}</div><p style="text-align:left;font-size:4cqw;line-height:1.35">Termin online buchen<br><b class="gold-solid">${FACTS.web}</b><br><b>${FACTS.phone}</b></p></div></div>`,
    }],
  })
  return L
}

// ═════════════════════════════════════════════════════════════════════════════════
// 04 FLYER
// ═════════════════════════════════════════════════════════════════════════════════
const IMPRESSUM = `Medieninhaber: <span class="todo">[Name, Anschrift]</span> · Hersteller: <span class="todo">[Druckerei, Ort]</span>`
const IMPRESSUM_DRAFT = 'Impressum nach § 24 MedienG fehlt (Medieninhaber, Hersteller, Herstellungsort)'

function flyerFront(P, { concept, ph, pos = '50% 50%', eyebrow, headline, sub, chips = [], badge, ar }) {
  const light = concept === 'C'
  const portrait = ar < 1
  const hcls = concept === 'B' || concept === 'D' ? 'cond-i' : 'cond'
  const imgH = portrait ? 58 : 100
  return {
    cls: light ? 'light' : '',
    sheetBg: light ? 'var(--ivory)' : undefined,
    bg: `${light ? '<div class="abs" style="inset:0;background:var(--ivory)"></div>' : background('A', P)}${
      ph
        ? `<img class="ph" src="${photo(P, ph)}" style="object-position:${pos};${portrait ? `height:${imgH}%` : 'left:42%;width:58%'}"><div class="abs" style="${portrait ? `left:0;right:0;top:0;height:${imgH}%;background:linear-gradient(180deg,rgba(10,10,11,.65),rgba(10,10,11,0) 30%,rgba(10,10,11,0) 55%,${light ? 'rgba(244,241,234,1)' : 'rgba(10,10,11,1)'} 100%)` : `inset:0;background:linear-gradient(90deg,${light ? '#F4F1EA 38%,rgba(244,241,234,.0) 62%' : '#0A0A0B 40%,rgba(10,10,11,0) 70%'})`}"></div>`
        : ''
    }${concept === 'B' ? speedLines() : ''}`,
    content: `<style>.speed{left:0;width:100%;top:${portrait ? '50%' : '60%'};height:16%;opacity:.8}</style>
<div class="abs" style="inset:${portrait ? '6cqw' : '7cqh 6cqw'};display:flex;flex-direction:column;justify-content:space-between">
 <div style="display:flex;justify-content:space-between;align-items:flex-start">${logo(P, 'logo').replace('class="logo"', `class="logo" style="width:${portrait ? 46 : 26}cqw"`)}${badge ? `<span class="badge-sale" style="font-size:${portrait ? 4 : 3.4}cqmin">${badge}</span>` : ''}</div>
 <div style="display:flex;flex-direction:column;gap:${portrait ? 2.4 : 2.4}cqmin;max-width:${portrait ? '100%' : '48%'}">
  ${eyebrow ? `<p class="eyebrow" style="font-size:${portrait ? 2.6 : 2.4}cqmin">${eyebrow}</p>` : ''}
  <h1 class="${hcls}" style="font-size:${portrait ? 11.5 : 10}cqmin;${light ? 'color:#0A0A0B' : ''}">${headline}</h1>
  ${sub ? `<p style="font-size:${portrait ? 3.6 : 3.3}cqmin;line-height:1.38;color:${light ? '#3c3a35' : '#D9D5CC'}">${sub}</p>` : ''}
  ${chips.length ? `<div style="display:flex;flex-wrap:wrap;gap:1.4cqmin;font-size:${portrait ? 2.8 : 2.6}cqmin">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>` : ''}
 </div>
</div>`,
  }
}

function flyerBack(P, { concept, title, intro, packages = PACKAGES, addons = true, coupon, qr = QR, steps = true, exterior = true, ar }) {
  const light = concept === 'C'
  const portrait = ar < 1
  const tall = ar < 0.6
  const fs = tall ? 'cqw' : 'cqmin'
  const k = tall ? 1.35 : 1
  const pk = packages
    .map((p) => `<div class="pk${p.featured ? ' f' : ''}"><div><b>${p.name}</b><small>${p.short} · ca. ${fmtMin(p.minutes[0])}</small></div><div class="pp"><b>ab ${p.promo[0]} €</b><small>regulär ab ${p.regular[0]} €</small></div></div>`)
    .join('')
  const ad = addons ? `<p class="h4">Zusatzleistungen</p><div class="ads">${ADDONS.map((a) => `<span>${a.name} <b>${a.price}</b></span>`).join('')}</div>` : ''
  const st = steps
    ? `<div class="steps">${[['1', 'Online buchen', 'Leistung, Fahrzeug, Termin'], ['2', 'Wir kommen', 'zu Ihrem Standort'], ['3', 'Bestätigung', 'persönlich per E-Mail']].map(([n, t, s]) => `<div><i>${n}</i><b>${t}</b><small>${s}</small></div>`).join('')}</div>`
    : ''
  const cp = coupon
    ? `<div class="cp"><div><p class="h4" style="margin:0">Neukunden-Vorteil</p><p class="cpv"><b>${coupon.amount}</b> mit Code <b class="code">${coupon.code}</b></p><small>${coupon.terms}</small></div></div>`
    : ''
  return {
    cls: light ? 'light' : '',
    sheetBg: light ? 'var(--ivory)' : undefined,
    bg: light ? '<div class="abs" style="inset:0;background:var(--ivory)"></div>' : background('A', P),
    content: `<style>
.fb{position:absolute;inset:${portrait ? '6cqw' : '6cqh 5cqw'};display:flex;flex-direction:column;gap:${2.2 * k}${fs};font-size:${2.6 * k}${fs};color:${light ? '#0A0A0B' : '#fff'}}
.fb .h2{font-family:Barlow,sans-serif;font-weight:800;text-transform:uppercase;font-size:${6.4 * k}${fs};line-height:.95}
.fb .h4{font-size:${2.2 * k}${fs};font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${light ? 'var(--gold-d)' : 'var(--gold)'};margin-top:${1 * k}${fs}}
.fb .pk{display:flex;justify-content:space-between;gap:2cqmin;padding:${1.5 * k}${fs} ${1.8 * k}${fs};border:1px solid ${light ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.14)'};border-radius:${1.4 * k}${fs}}
.fb .pk.f{border-color:${light ? 'var(--gold-d)' : 'var(--gold)'};background:${light ? 'rgba(212,168,67,.12)' : 'rgba(212,168,67,.1)'}}
.fb .pk b{font-size:1.15em;font-weight:600}.fb .pk small{display:block;font-size:.8em;color:${light ? '#5d594f' : '#B9B4AA'};margin-top:.15em}
.fb .pp{text-align:right;white-space:nowrap}.fb .pp b{font-family:Barlow,sans-serif;font-size:1.55em;font-weight:800}
.fb .ads{display:flex;flex-wrap:wrap;gap:.5em 1.4em;font-size:.92em}.fb .ads b{color:${light ? 'var(--gold-d)' : 'var(--gold)'};font-weight:600}
.fb .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:${1.4 * k}${fs}}
.fb .steps div{display:flex;flex-direction:column;gap:.2em}.fb .steps i{font-style:normal;width:1.9em;height:1.9em;border-radius:50%;display:grid;place-items:center;background:var(--goldgrad);color:#15120C;font-weight:700;margin-bottom:.3em}
.fb .steps small{color:${light ? '#5d594f' : '#B9B4AA'};font-size:.85em}
.fb .cp{padding:${1.6 * k}${fs} ${2 * k}${fs};border:1px dashed ${light ? 'var(--gold-d)' : 'var(--gold)'};border-radius:${1.4 * k}${fs}}
.fb .cpv{font-size:1.25em;margin:.2em 0}.fb .cpv b{font-family:Barlow,sans-serif;font-size:1.3em}.fb .code{letter-spacing:.12em;color:${light ? 'var(--gold-d)' : 'var(--gold)'}}
.fb .cp small{font-size:.78em;color:${light ? '#5d594f' : '#B9B4AA'}}
.fb .foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:3cqmin}
.fb .foot .qrbox{width:${tall ? 26 : 19}${fs}}
.fb .tiny{font-size:.68em;color:${light ? '#5d594f' : '#A8A39A'};line-height:1.35}
</style>
<div class="fb">
 <div style="display:flex;justify-content:space-between;align-items:center;gap:3cqmin"><p class="h2">${title}</p>${logo(P, 'logo').replace('class="logo"', `class="logo" style="width:${tall ? 34 : 26}${fs}"`)}</div>
 ${intro ? `<p style="color:${light ? '#3c3a35' : '#D9D5CC'};line-height:1.4">${intro}</p>` : ''}
 <div style="display:grid;gap:${1.1 * k}${fs}">${pk}</div>
 <p class="tiny">${PROMO_NOTE}. Preise für Kleinwagen/Kompaktklasse; größere Fahrzeuge siehe ${FACTS.web}. Endpreise inkl. Anfahrt im Einsatzgebiet.</p>
 ${ad}${cp}${st}
 <div class="foot"><div><p class="h4" style="margin:0 0 .3em">Termin & Kontakt</p><p style="font-family:Barlow,sans-serif;font-weight:800;font-size:2em;line-height:1">${FACTS.phone}</p><p style="font-family:Barlow,sans-serif;font-weight:700;font-size:1.5em;color:${light ? 'var(--gold-d)' : 'var(--gold)'}">${FACTS.web}</p><p class="tiny" style="margin-top:.6em">${exterior ? `* ${EXTERIOR_NOTE}<br>` : ''}${IMPRESSUM}</p></div><div style="display:flex;flex-direction:column;align-items:center;gap:.3em"><div class="qrbox">${qrSvg(qr)}</div><span class="tiny" style="letter-spacing:.12em;text-transform:uppercase">Scannen & buchen</span></div></div>
</div>`,
  }
}

function flyerJob({ id, sub, file, w, h, front, back, photos = [], qrs = [QR], draft = [IMPRESSUM_DRAFT] }) {
  const ar = w / h
  return {
    id, folder: `04_FLYER/${sub}`, file, kind: 'print', w, h, unit: 'mm', bleed: 3, cat: 'close', logoFrac: ar < 1 ? 0.46 : 0.26, photos, qrs, draft,
    pages: (P) => [front(P, ar), back ? back(P, ar) : null].filter(Boolean),
  }
}

export function flyers() {
  const L = []
  L.push(flyerJob({
    id: 'FLY_A5_IMAGE', sub: 'A5', file: 'RM6_FLYER_A5_IMAGE_A_FRONT_BACK', w: 148, h: 210,
    photos: [{ file: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', fw: 1, fh: 0.58, bleed: 3 }],
    front: (P, ar) => flyerFront(P, { concept: 'A', ar, ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '68% 50%', eyebrow: 'Mobile Fahrzeugaufbereitung', headline: '<span class="gold">Glanz,</span><br>der zu Ihnen kommt.', sub: 'Premium-Fahrzeugpflege von Hand – direkt bei Ihnen in Graz & Graz-Umgebung.', chips: ['Innenraum', 'Außenpflege', 'Komplettpaket'] }),
    back: (P, ar) => flyerBack(P, { concept: 'A', ar, title: 'Leistungen<br>& Preise' }),
  }))
  L.push(flyerJob({
    id: 'FLY_A5_INNEN', sub: 'A5', file: 'RM6_FLYER_A5_INNENRAUM_C_FRONT_BACK', w: 148, h: 210,
    photos: [{ file: 'RM6_FOTO_INNENRAUM.jpg', fw: 1, fh: 0.58, bleed: 3 }],
    front: (P, ar) => flyerFront(P, { concept: 'C', ar, ph: 'RM6_FOTO_INNENRAUM.jpg', pos: '50% 55%', eyebrow: 'Innenraumreinigung', headline: 'Frische für Ihren <span class="serif gold-solid">Innenraum.</span>', sub: 'Gründlich gesaugt, Oberflächen gereinigt, Scheiben streifenfrei – Basic oder Premium bis ins Detail.', chips: ['Basic ab 79 €', 'Premium ab 119 €'] }),
    back: (P, ar) => flyerBack(P, { concept: 'C', ar, title: 'Innenraum<br>Basic & Premium', intro: 'Premium enthält alles aus Basic und zusätzlich Türverkleidungen, Fugen, Lüftungsdüsen, Schalter und Kunststoffpflege.', packages: PACKAGES.slice(0, 2), exterior: false }),
  }))
  L.push(flyerJob({
    id: 'FLY_A5Q_AUSSEN', sub: 'A5', file: 'RM6_FLYER_A5_QUER_AUSSENPFLEGE_B_FRONT_BACK', w: 210, h: 148,
    photos: [{ file: 'RM6_FOTO_HANDWAESCHE.jpg', fw: 0.58, fh: 1, bleed: 3 }],
    front: (P, ar) => flyerFront(P, { concept: 'B', ar, ph: 'RM6_FOTO_HANDWAESCHE.jpg', pos: '50% 50%', eyebrow: 'Außenpflege', headline: 'Sauber. Scharf.<br><span class="gold">Startklar.</span>', sub: 'Schonende Handwäsche für Lack, Felgen und Scheiben – an einem geeigneten Standort bei Ihnen.*', chips: ['ab 99 €', 'Anfahrt inklusive'] }),
    back: (P, ar) => flyerBack(P, { concept: 'A', ar, title: 'Außenpflege<br>& Komplettpaket', packages: PACKAGES.slice(2), addons: false, steps: false }),
  }))
  L.push(flyerJob({
    id: 'FLY_A6_NEU', sub: 'A6', file: 'RM6_FLYER_A6_NEUKUNDEN_D_FRONT_BACK', w: 105, h: 148, qrs: [qrWith('NEU20')],
    photos: [{ file: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', fw: 1, fh: 0.58, bleed: 3 }],
    front: (P, ar) => flyerFront(P, { concept: 'D', ar, ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '70% 50%', eyebrow: 'Neukunden-Vorteil', headline: '20 € auf Ihre<br><span class="gold">erste Buchung.</span>', sub: 'Mit Code NEU20 – ab 119 € Auftragswert, online einlösbar.', chips: ['Mobil in Graz', 'Anfahrt inklusive'] }),
    back: (P, ar) => flyerBack(P, { concept: 'A', ar, title: 'So einfach<br>geht’s', packages: PACKAGES.slice(1), addons: false, coupon: COUPONS.neu, qr: qrWith('NEU20'), steps: false }),
  }))
  L.push(flyerJob({
    id: 'FLY_DL_KOMPLETT', sub: 'DIN_LANG', file: 'RM6_FLYER_DINLANG_KOMPLETTPAKET_A_FRONT_BACK', w: 99, h: 210,
    photos: [{ file: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', fw: 1, fh: 0.58, bleed: 3 }],
    front: (P, ar) => flyerFront(P, { concept: 'A', ar, ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '72% 50%', eyebrow: 'Komplettpaket', headline: 'Innen und außen.<br><span class="gold">Ein Termin.</span>', sub: 'Innenraum Premium und Außenpflege – mit Preisvorteil gegenüber der Einzelbuchung.', chips: ['ab 199 €', 'ca. 4 Std.'] }),
    back: (P, ar) => flyerBack(P, { concept: 'A', ar, title: 'Alle<br>Pakete', addons: true, steps: false }),
  }))
  // A4 einseitig – saisonal (Herbst/Winter)
  L.push({
    id: 'FLY_A4_SAISON', folder: '04_FLYER/A4', file: 'RM6_FLYER_A4_SAISON_HERBST_WINTER_B', kind: 'print', w: 210, h: 297, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 0.6,
    photos: [{ file: 'RM6_FOTO_GRAZ_NACHT.jpg', fw: 1, fh: 1, bleed: 3 }], qrs: [QR], draft: [IMPRESSUM_DRAFT],
    pages: (P) => [{ bg: background('B', P, { photo: 'RM6_FOTO_GRAZ_NACHT.jpg', photoPos: '55% 50%', side: 'bottom' }) + speedLines(), extraCss: '', content: `<style>.speed{left:0;width:100%;top:36%;height:14%;opacity:.7}</style>` + hero(P, { id: 'FLY_A4_SAISON', concept: 'B', ar: 210 / 297, eyebrow: 'Saison-Pflege · Herbst & Winter', headline: 'Streusplitt raus.<br><span class="gold">Frische rein.</span>', sub: 'Salz, Nässe und Schmutz setzen dem Innenraum zu. Wir reinigen Fußräume, Matten und Oberflächen gründlich – direkt bei Ihnen.', services: ['Innenraum ab 79 €', 'Komplettpaket ab 199 €'], note: `${PROMO_NOTE}. ${IMPRESSUM}`, qr: QR, cta: 'Jetzt Termin buchen' }) }],
  })
  // Premium-Fahrzeugpflege A5 (Konzept A, ohne Foto – Typografie & Gold)
  L.push(flyerJob({
    id: 'FLY_A5_PREMIUM', sub: 'A5', file: 'RM6_FLYER_A5_PREMIUM_A_FRONT_BACK', w: 148, h: 210, photos: [],
    front: (P, ar) => ({ bg: background('A', P), content: brackets() + hero(P, { id: 'FLY_A5_PREMIUMf', concept: 'A', ar, eyebrow: 'Premium Fahrzeugpflege', headline: 'Ihr Auto.<br><span class="gold">Unser Anspruch.</span>', sub: 'Sorgfältige Handarbeit, klare Endpreise und ein Termin, den wir persönlich bestätigen.', services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], web: true, phone: true }) }),
    back: (P, ar) => flyerBack(P, { concept: 'A', ar, title: 'Leistungen<br>& Preise' }),
  }))
  // Gutschein & Geschenkidee (DIN lang, Elite)
  L.push(flyerJob({
    id: 'FLY_DL_GESCHENK', sub: 'DIN_LANG', file: 'RM6_FLYER_DINLANG_GESCHENKIDEE_C_FRONT_BACK', w: 99, h: 210, photos: [{ file: 'RM6_DETAIL_SITZ.jpg', fw: 1, fh: 0.58, bleed: 3 }],
    draft: [IMPRESSUM_DRAFT, 'Ablauf für Wertgutscheine festlegen (Codes im Admin, Bedingungen in AGB Punkt 6)'],
    front: (P, ar) => flyerFront(P, { concept: 'C', ar, ph: 'RM6_DETAIL_SITZ.jpg', pos: '50% 50%', eyebrow: 'Geschenkidee', headline: 'Schenken Sie <span class="serif gold-solid">Glanz.</span>', sub: 'Ein RM6-Gutschein für Innenraum, Außenpflege oder das Komplettpaket – für alle, die ihr Auto lieben.' }),
    back: (P, ar) => flyerBack(P, { concept: 'C', ar, title: 'So funktioniert’s', intro: 'Gutschein persönlich bei uns anfragen – wir stellen ihn mit Wert und Code aus. Eingelöst wird er bei der Online-Buchung.', addons: false, steps: false }),
  }))
  // Empfehlungsflyer A6 (nutzt den bestehenden Neukunden-Code – kein erfundenes Bonusprogramm)
  L.push(flyerJob({
    id: 'FLY_A6_EMPF', sub: 'A6', file: 'RM6_FLYER_A6_EMPFEHLUNG_D_FRONT_BACK', w: 105, h: 148, qrs: [qrWith('NEU20')], photos: [],
    front: (P, ar) => ({ bg: background('A', P), content: brackets() + hero(P, { id: 'FLY_A6_EMPFf', concept: 'D', ar, eyebrow: 'Weitersagen lohnt sich', headline: 'Zufrieden?<br><span class="gold">Erzählen Sie es weiter.</span>', sub: 'Geben Sie diesen Flyer weiter: Neukunden erhalten 20 € auf die erste Buchung mit Code NEU20.', phone: false }) }),
    back: (P, ar) => flyerBack(P, { concept: 'A', ar, title: '20 € für<br>Neukunden', packages: PACKAGES.slice(1), addons: false, coupon: COUPONS.neu, qr: qrWith('NEU20'), steps: false }),
  }))
  return L
}

// ═════════════════════════════════════════════════════════════════════════════════
// 05 POSTER (drei Kampagnen × A4–A0)
// ═════════════════════════════════════════════════════════════════════════════════
export function posters() {
  const L = []
  const camps = [
    ['IMAGE', 'A', { ...COPY.A, services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], cta: 'Termin online buchen' }, null],
    ['ANGEBOT', 'D', { ...COPY.D, offer: OFFER, services: ['Anfahrt inklusive'], note: PROMO_NOTE }, null],
    ['QUALITAET', 'C', { eyebrow: 'Sorgfalt, die man sieht', headline: 'Jede Fuge.<br>Jede <span class="serif gold-solid">Oberfläche.</span>', sub: 'Innenraum Premium: Türverkleidungen, Lüftungsdüsen, Schalter und Ablagen – im Detail gereinigt und gepflegt.', services: ['Premium ab 119 €', 'mobil in Graz'] }, 'RM6_FOTO_INNENRAUM.jpg'],
  ]
  for (const [name, concept, copy, ph] of camps) {
    for (const [size, [w, h]] of Object.entries(A)) {
      L.push(heroJob({ id: `POS_${name}_${size}`, folder: '05_POSTER', file: `RM6_POSTER_${size}_${name}_${concept}`, w, h, bleed: w >= 594 ? 5 : 3, concept, copy, cat: w >= 420 ? 'poster' : 'close', extra: { qr: QR }, photo: ph, photoPos: '50% 60%', photoSide: 'top' }))
    }
  }
  return L
}

// ═════════════════════════════════════════════════════════════════════════════════
// 06 VISITENKARTEN · 07 GUTSCHEINE & KUNDENKARTEN
// ═════════════════════════════════════════════════════════════════════════════════
function cardJob({ id, folder, file, w = 85, h = 55, front, back, qrs = [QR], draft = [], logoFrac = 0.62 }) {
  return { id, folder, file, kind: 'print', w, h, unit: 'mm', bleed: 3, cat: 'close', logoFrac, photos: [], qrs, draft, pages: (P) => [front(P), back(P)].filter(Boolean) }
}
const contactBlock = (light, scale = 1) =>
  `<div style="display:grid;gap:${1.6 * scale}cqh;font-size:${6.6 * scale}cqh"><div><small style="display:block;font-size:.62em;letter-spacing:.22em;text-transform:uppercase;color:${light ? 'var(--gold-d)' : 'var(--gold)'}">Telefon</small><b style="font-family:Barlow,sans-serif;font-size:1.35em;font-weight:800">${FACTS.phone}</b></div><div><small style="display:block;font-size:.62em;letter-spacing:.22em;text-transform:uppercase;color:${light ? 'var(--gold-d)' : 'var(--gold)'}">Web</small><b style="font-family:Barlow,sans-serif;font-size:1.35em;font-weight:700">${FACTS.web}</b></div><div style="font-size:.8em;color:${light ? '#5d594f' : '#B9B4AA'}">${FACTS.region}</div></div>`

export function cards() {
  const L = []
  const back = (P, light, extraBg = '') => ({
    cls: light ? 'light' : '',
    sheetBg: light ? 'var(--ivory)' : undefined,
    bg: (light ? '<div class="abs" style="inset:0;background:var(--ivory)"></div>' : background('A', P)) + extraBg,
    content: `<div class="abs" style="inset:9cqh 7cqw;display:flex;justify-content:space-between;align-items:center;gap:5cqw"><div style="display:flex;flex-direction:column;gap:4cqh"><p style="font-weight:600;font-size:6cqh;letter-spacing:.06em">${FACTS.brand}</p><p style="font-size:4.6cqh;color:${light ? '#5d594f' : '#B9B4AA'};margin-top:-2.6cqh">Mobile Fahrzeugpflege</p>${contactBlock(light)}</div><div style="display:flex;flex-direction:column;align-items:center;gap:2cqh"><div class="qrbox" style="width:30cqw">${qrSvg(QR)}</div><span style="font-size:4cqh;letter-spacing:.16em;text-transform:uppercase;color:${light ? '#5d594f' : 'var(--silver)'}">Termin buchen</span></div></div>`,
  })
  L.push(cardJob({
    id: 'VK_A', folder: '06_VISITENKARTEN', file: 'RM6_VISITENKARTE_85x55_A_SCHWARZ_GOLD',
    front: (P) => ({ bg: background('A', P), content: `${brackets()}<div class="abs" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5cqh">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:62cqw"')}<span style="width:36cqw;font-size:4cqh">${goldRule()}</span><p class="eyebrow" style="font-size:4.4cqh">Premium Fahrzeugpflege</p></div>` }),
    back: (P) => back(P, false),
  }))
  L.push(cardJob({
    id: 'VK_C', folder: '06_VISITENKARTEN', file: 'RM6_VISITENKARTE_85x55_C_KLASSISCH_PREMIUM',
    front: (P) => ({ cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>', content: `<div class="abs" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5cqh">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:60cqw"')}<p class="serif" style="font-size:8cqh;color:var(--gold-d)">Pflege bis ins Detail.</p></div>` }),
    back: (P) => back(P, true),
  }))
  L.push(cardJob({
    id: 'VK_B', folder: '06_VISITENKARTEN', file: 'RM6_VISITENKARTE_85x55_B_SPORTLICH',
    front: (P) => ({ bg: background('A', P) + speedLines(), content: `<style>.speed{left:20%;width:80%;top:52%;height:42%;opacity:.9}</style><div class="abs" style="inset:10cqh 7cqw;display:flex;flex-direction:column;justify-content:space-between">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:58cqw"')}<p class="cond-i" style="font-size:12cqh">Sauber. Scharf. <span class="gold">Startklar.</span></p></div>` }),
    back: (P) => back(P, false, '<div class="abs" style="left:-10%;top:0;bottom:0;width:6%;background:var(--goldgrad);transform:skewX(-14deg);left:62%;opacity:.0"></div>'),
  }))

  // 07 Gutscheine & Kundenkarten
  const F = '07_GUTSCHEINE_KUNDENKARTEN'
  const field = (label, light) => `<div style="display:flex;align-items:flex-end;gap:2cqw;font-size:5cqh"><span style="white-space:nowrap;color:${light ? '#5d594f' : 'var(--silver)'}">${label}</span><i style="flex:1;border-bottom:.35cqh solid ${light ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.45)'};height:1em"></i></div>`
  L.push(cardJob({
    id: 'GS_DL', folder: F, file: 'RM6_GESCHENKGUTSCHEIN_210x99_A_FRONT_BACK', w: 210, h: 99, logoFrac: 0.34,
    draft: ['Ablauf für Wertgutscheine festlegen (Code im Admin anlegen, Bedingungen in AGB Punkt 6)'],
    front: (P) => ({ bg: background('A', P), content: `${brackets()}<div class="abs" style="inset:10cqh 6cqw;display:flex;justify-content:space-between;align-items:center"><div style="display:flex;flex-direction:column;gap:3cqh"><p class="eyebrow" style="font-size:3.6cqh">RM6 Autoaufbereitung</p><p class="cond gold" style="font-size:22cqh">Geschenk&shy;gutschein</p><p style="font-size:5cqh;color:#D9D5CC">Premium-Fahrzeugpflege – mobil in Graz & Umgebung</p></div>${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:34cqw"')}</div>` }),
    back: (P) => ({ bg: background('A', P), content: `<div class="abs" style="inset:10cqh 6cqw;display:grid;grid-template-columns:1.3fr 1fr;gap:5cqw;align-items:center"><div style="display:grid;gap:5cqh">${field('Für', false)}${field('Von', false)}${field('Wert in €', false)}${field('Gutscheincode', false)}${field('Gültig bis', false)}</div><div style="display:flex;flex-direction:column;gap:3cqh;font-size:4.2cqh;color:#D9D5CC"><p><b style="color:var(--gold)">So lösen Sie ein:</b> Termin online buchen und den Gutscheincode in der Buchungsübersicht eingeben.</p><div style="display:flex;gap:3cqw;align-items:center"><div class="qrbox" style="width:20cqh">${qrSvg(QR)}</div><p><b style="font-size:1.4em">${FACTS.phone}</b><br><b class="gold-solid">${FACTS.web}</b></p></div><p style="font-size:.78em;color:#A8A39A">Keine Barablöse. Es gelten die AGB von ${FACTS.brand}.</p></div></div>` }),
  }))
  L.push(cardJob({
    id: 'GS_A6', folder: F, file: 'RM6_WERTGUTSCHEIN_148x105_C_FRONT_BACK', w: 148, h: 105, logoFrac: 0.42,
    draft: ['Ablauf für Wertgutscheine festlegen (Code im Admin anlegen, Bedingungen in AGB Punkt 6)'],
    front: (P) => ({ cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>', content: `${brackets()}<div class="abs" style="inset:12cqh 9cqw;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:42cqw"')}<p class="serif" style="font-size:16cqh;color:var(--gold-d)">Wertgutschein</p><div style="display:flex;align-items:flex-end;gap:2cqw;font-size:8cqh"><span>über</span><i style="width:30cqw;border-bottom:.4cqh solid rgba(0,0,0,.4);height:1em"></i><span>€</span></div></div>` }),
    back: (P) => ({ cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>', content: `<div class="abs" style="inset:12cqh 9cqw;display:grid;gap:5cqh">${field('Gutscheincode', true)}${field('Ausgestellt am', true)}${field('Gültig bis', true)}<div style="display:flex;gap:4cqw;align-items:center;font-size:4.6cqh"><div class="qrbox" style="width:24cqh">${qrSvg(QR)}</div><p>Einlösen bei der Online-Buchung: Code in der Übersicht eingeben.<br><b>${FACTS.phone}</b> · <b style="color:var(--gold-d)">${FACTS.web}</b><br><small style="color:#5d594f">Keine Barablöse. Es gelten die AGB.</small></p></div></div>` }),
  }))
  const small = (id, file, front, back, more = {}) => L.push(cardJob({ id, folder: F, file, front, back, ...more }))
  small('KK_KUNDE', 'RM6_KUNDENKARTE_85x55_A_FRONT_BACK',
    (P) => ({ bg: background('A', P), content: `${brackets()}<div class="abs" style="inset:10cqh 7cqw;display:flex;flex-direction:column;justify-content:space-between">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:52cqw"')}<div><p class="eyebrow" style="font-size:4.4cqh">Kundenkarte</p>${field('Name', false)}</div></div>` }),
    (P) => back(P, false))
  small('KK_TREUE', 'RM6_TREUEKARTE_85x55_A_FRONT_BACK',
    (P) => ({ bg: background('A', P), content: `${brackets()}<div class="abs" style="inset:10cqh 7cqw;display:flex;flex-direction:column;justify-content:space-between">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:52cqw"')}<p class="cond" style="font-size:13cqh">Treue<span class="gold">karte</span></p></div>` }),
    (P) => ({ bg: background('A', P), content: `<div class="abs" style="inset:9cqh 7cqw;display:flex;flex-direction:column;justify-content:space-between"><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:2.4cqw">${Array.from({ length: 6 }, (_, i) => `<div style="aspect-ratio:1;border-radius:50%;border:.5cqh solid ${i === 5 ? 'var(--gold)' : 'rgba(255,255,255,.4)'};display:grid;place-items:center;font-size:4.6cqh;color:${i === 5 ? 'var(--gold)' : '#999'}">${i + 1}</div>`).join('')}</div><p style="font-size:4.8cqh">Prämie: <span class="todo">[nach Ihrer Festlegung]</span></p><p style="font-size:4cqh;color:#B9B4AA">${FACTS.phone} · ${FACTS.web}</p></div>` }),
    { qrs: [], draft: ['Treueprogramm nicht festgelegt: Prämie und Bedingungen definieren'] })
  small('KK_TERMIN', 'RM6_TERMINKARTE_85x55_C_FRONT_BACK',
    (P) => ({ cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>', content: `<div class="abs" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4cqh">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:56cqw"')}<p class="serif" style="font-size:9cqh;color:var(--gold-d)">Ihr nächster Termin</p></div>` }),
    (P) => ({ cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>', content: `<div class="abs" style="inset:10cqh 7cqw;display:grid;gap:4.4cqh">${field('Datum', true)}${field('Uhrzeit', true)}${field('Leistung', true)}${field('Standort', true)}<p style="font-size:4cqh;color:#5d594f">Änderungen bitte rechtzeitig: <b style="color:#0A0A0B">${FACTS.phone}</b></p></div>` }),
    { qrs: [] })
  small('KK_DANKE', 'RM6_DANKESKARTE_85x55_A_FRONT_BACK',
    (P) => ({ bg: background('A', P), content: `${brackets()}<div class="abs" style="inset:10cqh 7cqw;display:flex;flex-direction:column;justify-content:space-between">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:44cqw"')}<div><p class="cond" style="font-size:15cqh">Vielen <span class="gold">Dank!</span></p><p style="font-size:4.6cqh;color:#D9D5CC;margin-top:1.4cqh">Schön, dass wir Ihr Fahrzeug pflegen durften.</p></div></div>` }),
    (P) => ({ bg: background('A', P), content: `<div class="abs" style="inset:9cqh 7cqw;display:flex;justify-content:space-between;align-items:center;gap:4cqw"><div style="display:flex;flex-direction:column;gap:2.6cqh"><p class="eyebrow" style="font-size:4cqh">Ihr Dankeschön</p><p style="font-size:6.4cqh"><b class="cond gold" style="font-size:2.2em">20 €</b> mit Code</p><p class="cond" style="font-size:11cqh;letter-spacing:.12em">DANKE20</p><p style="font-size:3.4cqh;color:#A8A39A;line-height:1.35">${COUPONS.danke.terms}</p></div><div style="display:flex;flex-direction:column;align-items:center;gap:1.6cqh"><div class="qrbox" style="width:28cqw">${qrSvg(qrWith('DANKE20'))}</div><span style="font-size:3.6cqh;letter-spacing:.14em;text-transform:uppercase;color:var(--silver)">Online einlösen</span></div></div>` }),
    { qrs: [qrWith('DANKE20')] })
  small('KK_EMPF', 'RM6_EMPFEHLUNGSKARTE_85x55_D_FRONT_BACK',
    (P) => ({ bg: background('A', P), content: `<div class="abs" style="inset:10cqh 7cqw;display:flex;flex-direction:column;justify-content:space-between">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:44cqw"')}<p class="cond-i" style="font-size:12.5cqh">Für Ihre Freunde:<br><span class="gold">20 € Startvorteil.</span></p></div>` }),
    (P) => ({ bg: background('A', P), content: `<div class="abs" style="inset:9cqh 7cqw;display:flex;justify-content:space-between;align-items:center;gap:4cqw"><div style="display:flex;flex-direction:column;gap:2.4cqh"><p class="eyebrow" style="font-size:4cqh">Code für Neukunden</p><p class="cond" style="font-size:12cqh;letter-spacing:.12em">NEU20</p><p style="font-size:3.4cqh;color:#A8A39A;line-height:1.35">${COUPONS.neu.terms}</p></div><div class="qrbox" style="width:28cqw">${qrSvg(qrWith('NEU20'))}</div></div>` }),
    { qrs: [qrWith('NEU20')] })
  small('KK_BEWERTUNG', 'RM6_BEWERTUNGSKARTE_85x55_C_FRONT_BACK',
    (P) => ({ cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>', content: `<div class="abs" style="inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4cqh;text-align:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:48cqw"')}<p class="serif" style="font-size:10cqh;color:var(--gold-d)">Wie zufrieden waren Sie?</p><p style="font-size:4.6cqh;color:#3c3a35">Ihre ehrliche Bewertung hilft uns – und anderen Autofahrern in Graz.</p></div>` }),
    (P) => ({ cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>', content: `<div class="abs" style="inset:10cqh 7cqw;display:flex;justify-content:space-between;align-items:center;gap:4cqw"><div style="display:flex;flex-direction:column;gap:2.6cqh;font-size:5cqh"><p class="eyebrow" style="font-size:4cqh">Bewertung abgeben</p><p>QR-Code scannen und in einer Minute bewerten.</p><p style="font-size:.8em;color:#5d594f">Danke für Ihr Vertrauen!</p></div><div style="width:30cqw;aspect-ratio:1;border:.5cqh dashed #E58A7E;display:grid;place-items:center;text-align:center;font-size:3.6cqh;color:#E58A7E;padding:2cqw">QR zum Google-Bewertungs&shy;link folgt</div></div>` }),
    { qrs: [], draft: ['Kein Google-Bewertungslink hinterlegt (Admin → Einstellungen); danach QR-Code einsetzen'] })
  return L
}

// ═════════════════════════════════════════════════════════════════════════════════
// 08 PREISLISTEN & ANGEBOTE
// ═════════════════════════════════════════════════════════════════════════════════
export function priceLists() {
  const L = []
  const F = '08_PREISLISTEN_ANGEBOTE'
  const docJob = (id, file, w, h, page, more = {}) => L.push({ id, folder: F, file, kind: 'print', w, h, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 0.3, photos: [], qrs: [QR], draft: [], ...more, pages: (P) => [page(P)] })
  docJob('PL_A4', 'RM6_PREISLISTE_A4_A', 210, 297, (P) => ({
    bg: background('A', P),
    content: `<style>${tableCss}.pl{position:absolute;inset:7cqw 7cqw;display:flex;flex-direction:column;gap:${k('2.1cqw')};font-size:${k('2.15cqw')}}</style><div class="pl"><div style="display:flex;justify-content:space-between;align-items:flex-end"><div><p class="eyebrow" style="font-size:1.7cqw">Mobile Fahrzeugpflege · ${FACTS.region}</p><p class="cond" style="font-size:${k('7cqw')};margin-top:1cqw">Preise <span class="gold">& Leistungen</span></p></div>${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:30cqw"')}</div>${priceTable(PACKAGES, VEHICLES)}<p style="font-size:.78em;color:#B9B4AA">${PROMO_NOTE}. Alle Preise sind Endpreise inklusive Anfahrt im Einsatzgebiet. Dauer: Richtwerte für normale Verschmutzung.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:1.4cqw 3cqw">${ADDONS.map((a) => `<div style="display:flex;justify-content:space-between;gap:1em;padding:1.2cqw 1.6cqw;border:1px solid rgba(255,255,255,.14);border-radius:1.2cqw"><span><b>${a.name}</b><small style="display:block;color:#B9B4AA;font-size:.78em">${a.note}</small></span><b class="gold-solid" style="white-space:nowrap">${a.price}</b></div>`).join('')}</div><div style="display:grid;gap:.7cqw;font-size:.86em;color:#D9D5CC"><p>• Zusatzkosten entstehen nur, wenn Sie sie wählen oder vorab zustimmen.</p><p>• ${EXTERIOR_NOTE}</p><p>• Nach dem Absenden erhalten Sie eine Buchungsnummer; verbindlich wird der Termin mit unserer persönlichen Bestätigung.</p></div><div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div><p class="eyebrow" style="font-size:1.6cqw">Termin & Kontakt</p><p style="font-family:Barlow,sans-serif;font-weight:800;font-size:${k('5cqw')};line-height:1">${FACTS.phone}</p><p style="font-family:Barlow,sans-serif;font-weight:700;font-size:${k('3.6cqw')};color:var(--gold)">${FACTS.web}</p></div><div class="qrbox" style="width:${k('17cqw')}">${qrSvg(QR)}</div></div></div>`,
  }))
  docJob('PL_A5', 'RM6_PREISLISTE_A5_C', 148, 210, (P) => ({
    cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>',
    content: `<div class="abs" style="inset:8cqw;display:flex;flex-direction:column;gap:${k('3cqw')};font-size:${k('3cqw')};color:#0A0A0B"><div style="display:flex;justify-content:space-between;align-items:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:40cqw"')}<p class="serif" style="font-size:${k('8cqw')};color:var(--gold-d)">Preise</p></div>${PACKAGES.map((p) => `<div style="display:flex;justify-content:space-between;gap:3cqw;padding-bottom:2.4cqw;border-bottom:1px solid rgba(0,0,0,.14)"><div><b style="font-size:1.15em">${p.name}</b><small style="display:block;color:#5d594f">${p.short}<br>ca. ${fmtMin(p.minutes[0])} – ${fmtMin(p.minutes[5])}</small></div><div style="text-align:right;white-space:nowrap"><b style="font-family:Barlow,sans-serif;font-size:1.7em">ab ${p.promo[0]} €</b><small style="display:block;color:#5d594f">bis ${p.promo[5]} € je nach Fahrzeug<br>regulär ab ${p.regular[0]} €</small></div></div>`).join('')}<p class="eyebrow" style="font-size:2.4cqw">Zusatzleistungen</p><div style="display:grid;gap:1.4cqw">${ADDONS.map((a) => `<div style="display:flex;justify-content:space-between"><span>${a.name}</span><b style="color:var(--gold-d)">${a.price}</b></div>`).join('')}</div><p style="font-size:.78em;color:#5d594f">${PROMO_NOTE}. Endpreise inkl. Anfahrt. Fahrzeugkategorien: ${VEHICLES.join(', ')}.</p><div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><p><b style="font-size:1.6em;font-family:Barlow,sans-serif">${FACTS.phone}</b><br><b style="color:var(--gold-d);font-size:1.3em">${FACTS.web}</b></p><div class="qrbox" style="width:${k('22cqw')}">${qrSvg(QR)}</div></div></div>`,
  }))
  docJob('PL_DL', 'RM6_PREISUEBERSICHT_DINLANG_B', 99, 210, (P) => ({
    bg: background('A', P) + speedLines(),
    content: `<style>.speed{left:0;width:100%;top:2%;height:10%;opacity:.7}</style><div class="abs" style="inset:8cqw;display:flex;flex-direction:column;gap:4cqw;font-size:4.4cqw"><div>${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:62cqw"')}</div><p class="cond-i" style="font-size:12cqw">Preise <span class="gold">auf einen Blick</span></p>${PACKAGES.map((p) => `<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(255,255,255,.14);padding-bottom:2.6cqw"><b>${p.name}</b><span style="white-space:nowrap"><b class="gold" style="font-family:Barlow,sans-serif;font-size:1.5em">ab ${p.promo[0]} €</b></span></div>`).join('')}<p style="font-size:.74em;color:#B9B4AA">${PROMO_NOTE}. Kleinwagen/Kompaktklasse; größere Fahrzeuge bis ${PACKAGES[3].promo[5]} €. Endpreise inkl. Anfahrt.</p><p class="eyebrow" style="font-size:3cqw">Extras</p>${ADDONS.map((a) => `<div style="display:flex;justify-content:space-between;font-size:.9em"><span>${a.name}</span><b class="gold-solid">${a.price}</b></div>`).join('')}<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><p><b style="font-family:Barlow,sans-serif;font-size:1.5em">${FACTS.phone}</b><br><b class="gold-solid">${FACTS.web}</b></p><div class="qrbox" style="width:30cqw">${qrSvg(QR)}</div></div></div>`,
  }))
  docJob('PL_LEIST', 'RM6_LEISTUNGSUEBERSICHT_A4_A', 210, 297, (P) => ({
    bg: background('A', P),
    content: `<div class="abs" style="inset:7cqw;display:flex;flex-direction:column;gap:${k('3cqw')};font-size:${k('2.15cqw')}"><div style="display:flex;justify-content:space-between;align-items:flex-end"><p class="cond" style="font-size:${k('7cqw')}">Was ist <span class="gold">enthalten?</span></p>${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:30cqw"')}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:${k('2.4cqw')}">${PACKAGES.map((p) => `<div style="padding:${k('2.4cqw')};border:1px solid ${p.featured ? 'var(--gold)' : 'rgba(255,255,255,.14)'};border-radius:1.6cqw;background:${p.featured ? 'rgba(212,168,67,.08)' : 'transparent'}"><p style="font-weight:700;font-size:1.25em">${p.name}</p><p class="gold-solid" style="font-family:Barlow,sans-serif;font-weight:800;font-size:1.7em">ab ${p.promo[0]} €</p><ul style="list-style:none;display:grid;gap:.8cqw;margin-top:1.4cqw">${p.includes.map((i) => `<li style="display:flex;gap:.6em"><span class="gold-solid">✓</span><span>${i}</span></li>`).join('')}</ul></div>`).join('')}</div><p class="eyebrow" style="font-size:1.7cqw">Fahrzeugkategorien</p><div style="display:flex;flex-wrap:wrap;gap:1.2cqw">${VEHICLES.map((v) => `<span class="chip" style="font-size:.95em">${v}</span>`).join('')}</div><p style="color:#B9B4AA;font-size:.86em">Nicht enthalten u. a.: Politur, Lackkorrektur, Versiegelung, Motorraumwäsche, Reparaturen. Polster-Tiefenreinigung und Tierhaarentfernung als Zusatzleistung. ${PROMO_NOTE}.</p><div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><p><b style="font-family:Barlow,sans-serif;font-size:2.2em">${FACTS.phone}</b><br><b class="gold-solid" style="font-size:1.6em">${FACTS.web}</b></p><div class="qrbox" style="width:${k('17cqw')}">${qrSvg(QR)}</div></div></div>`,
  }))
  docJob('PL_ANGEBOT', 'RM6_ANGEBOTSBLATT_A4_C_VORLAGE', 210, 297, (P) => ({
    cls: 'light', sheetBg: '#fff', bg: '<div class="abs" style="inset:0;background:#fff"></div><div class="abs" style="left:0;right:0;top:0;height:1.4%;background:var(--goldgrad)"></div>',
    content: `<div class="abs" style="inset:8cqw;display:flex;flex-direction:column;gap:3cqw;font-size:2.2cqw;color:#0A0A0B"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><p class="serif" style="font-size:7cqw;color:var(--gold-d)">Ihr Angebot</p><p style="color:#5d594f">Angebotsnummer ________ · Datum ________</p></div>${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:30cqw"')}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:3cqw"><div><b>Kunde</b><p style="border-bottom:1px solid #ccc;height:2.4em"></p><p style="border-bottom:1px solid #ccc;height:2.4em"></p></div><div><b>Fahrzeug</b><p style="border-bottom:1px solid #ccc;height:2.4em"></p><p style="color:#5d594f">Kategorie: ${VEHICLES.join(' · ')}</p></div></div><table style="width:100%;border-collapse:collapse"><thead><tr style="text-align:left;border-bottom:2px solid var(--gold-d)"><th style="padding:1cqw 0">Pos.</th><th>Leistung</th><th style="text-align:right">Preis</th></tr></thead><tbody>${Array.from({ length: 6 }, (_, i) => `<tr style="border-bottom:1px solid #ddd"><td style="padding:2.2cqw 0;width:8%">${i + 1}</td><td></td><td></td></tr>`).join('')}</tbody><tfoot><tr><td></td><td style="text-align:right;padding-top:2cqw"><b>Gesamt (Endpreis)</b></td><td style="width:22%;border-bottom:2px solid #0A0A0B"></td></tr></tfoot></table><p style="font-size:.86em;color:#5d594f">Preise laut aktueller Preisliste (${FACTS.web}). Zusatzleistungen nur nach Absprache. Gültig bis ________.</p><div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #ddd;padding-top:2cqw;font-size:.86em;color:#5d594f"><p>${FACTS.brand} · ${FACTS.phone} · ${FACTS.web}<br><span class="todo">[Inhaber · Anschrift · UID bzw. Kleinunternehmer-Hinweis]</span></p><div class="qrbox" style="width:13cqw">${qrSvg(QR)}</div></div></div>`,
  }), { draft: ['Unternehmensangaben (Inhaber, Anschrift, UID/Kleinunternehmer) fehlen'] })
  return L
}

// ═════════════════════════════════════════════════════════════════════════════════
// 09 ZEITUNGSWERBUNG (neutrale Ausgangsformate – vor Buchung an Mediadaten anpassen)
// ═════════════════════════════════════════════════════════════════════════════════
export function newspaper() {
  const L = []
  const formats = [
    ['1-1', 'GANZSEITIG', 230, 310, 'A'],
    ['1-2', 'HALBSEITIG_QUER', 230, 150, 'D'],
    ['1-4', 'VIERTELSEITE_HOCH', 112, 150, 'A'],
    ['1-4Q', 'VIERTELSEITE_QUER', 230, 73, 'D'],
    ['1-8', 'ACHTELSEITE', 112, 73, 'D'],
    ['KOMPAKT', 'KOMPAKT_1SPALTIG', 54, 90, 'A'],
  ]
  for (const [key, label, w, h, concept] of formats) {
    for (const gray of [false, true]) {
      const copy = concept === 'D' ? { ...COPY.D, offer: w * h > 9000 ? OFFER : null, note: w * h > 9000 ? PROMO_NOTE : null } : { ...COPY.A, sub: w > 100 ? COPY.A.sub : null, eyebrow: w > 100 ? COPY.A.eyebrow : null }
      L.push(heroJob({ id: `NP_${key}_${gray ? 'SW' : '4C'}`, folder: '09_ZEITUNGSWERBUNG', file: `RM6_ZEITUNG_${label}_${w}x${h}_${gray ? 'SW' : '4C'}`, w, h, bleed: 0, concept, copy, cat: 'close', gray, extra: { qr: w >= 90 ? QR : null }, draft: ['Anzeigenmaße und Druckvorgaben beim Medium erfragen (Mediadaten) und Datei anpassen'] }))
    }
  }
  return L
}

// ═════════════════════════════════════════════════════════════════════════════════
// I. GESCHÄFTSPAPIERE & WEITERE DRUCKSACHEN
// ═════════════════════════════════════════════════════════════════════════════════
export function stationery() {
  const L = []
  const F = '08_PREISLISTEN_ANGEBOTE/Geschaeftspapiere'
  const footer = `<div style="position:absolute;left:20mm;right:20mm;bottom:10mm;display:flex;justify-content:space-between;align-items:flex-end;font-size:2.6mm;color:#5d594f;border-top:.3mm solid #D4A843;padding-top:2.6mm"><span>${FACTS.brand} · ${FACTS.phone} · ${FACTS.web}</span><span class="todo">[Inhaber · Anschrift · UID bzw. Kleinunternehmer · Firmenbuch]</span></div>`
  const letter = (title, body) => (P) => ({
    cls: 'light', sheetBg: '#fff', bg: '<div class="abs" style="inset:0;background:#fff"></div>',
    content: `<div style="position:absolute;left:20mm;top:12mm;right:20mm;display:flex;justify-content:space-between;align-items:center;color:#0A0A0B">${title ? `<p class="serif" style="font-size:9mm;color:var(--gold-d)">${title}</p>` : '<span></span>'}${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:55mm"')}</div><div style="position:absolute;left:20mm;top:45mm;width:85mm;font-size:2.2mm;color:#8a857b;border-bottom:.2mm solid #ccc;padding-bottom:1mm">${FACTS.brand} · <span class="todo">[Anschrift]</span></div><div style="position:absolute;left:20mm;right:20mm;top:95mm;bottom:28mm;font-size:3.6mm;line-height:1.5;color:#0A0A0B">${body}</div>${footer}`,
  })
  const job = (id, file, title, body, draft) => L.push({ id, folder: F, file, kind: 'print', w: 210, h: 297, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 55 / 210, photos: [], qrs: [], draft, pages: (P) => [letter(title, body)(P)] })
  const dataDraft = 'Unternehmensangaben (Inhaber, Anschrift, UID/Kleinunternehmer, ggf. Firmenbuch) fehlen'
  job('BR_PAPIER', 'RM6_BRIEFPAPIER_A4', '', '<p style="color:#bbb">[Brieftext – Anschriftfeld nach DIN 5008 Form B, Fensterkuvert DL]</p>', [dataDraft])
  job('BR_ANGEBOT', 'RM6_ANGEBOTSVORLAGE_A4', 'Angebot', `<p>Sehr geehrte Damen und Herren,</p><p style="margin-top:4mm">vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen an:</p><table style="width:100%;margin-top:6mm;border-collapse:collapse;font-size:3.3mm"><tr style="border-bottom:.4mm solid #9A7420;text-align:left"><th style="padding:2mm 0">Pos.</th><th>Leistung</th><th>Fahrzeugkategorie</th><th style="text-align:right">Preis</th></tr>${'<tr style="border-bottom:.2mm solid #ddd"><td style="padding:4mm 0"></td><td></td><td></td><td></td></tr>'.repeat(4)}</table><p style="margin-top:6mm">Alle Preise sind Endpreise inklusive Anfahrt im Einsatzgebiet. Angebot gültig bis ________.</p>`, [dataDraft])
  job('BR_RECHNUNG', 'RM6_RECHNUNGSVORLAGE_A4_DESIGN', 'Rechnung', `<p>Rechnungsnummer: ________ · Rechnungsdatum: ________ · Leistungsdatum: ________</p><table style="width:100%;margin-top:6mm;border-collapse:collapse;font-size:3.3mm"><tr style="border-bottom:.4mm solid #9A7420;text-align:left"><th style="padding:2mm 0">Pos.</th><th>Leistung</th><th style="text-align:right">Betrag</th></tr>${'<tr style="border-bottom:.2mm solid #ddd"><td style="padding:4mm 0"></td><td></td><td></td></tr>'.repeat(4)}<tr><td></td><td style="text-align:right;padding-top:3mm"><b>Gesamtbetrag</b></td><td style="border-bottom:.5mm solid #0A0A0B"></td></tr></table><p style="margin-top:6mm" class="todo">[Umsatzsteuer bzw. Hinweis „Umsatzsteuerbefreit – Kleinunternehmer“ · Zahlungsbedingungen · Bankverbindung]</p>`, [dataDraft, 'Designvorlage – Rechnungspflichtangaben mit Steuerberater prüfen'])
  job('BR_AUFTRAG', 'RM6_AUFTRAGSBESTAETIGUNG_A4', 'Terminbestätigung', `<p>Guten Tag,</p><p style="margin-top:4mm">hiermit bestätigen wir Ihren Termin verbindlich:</p><div style="margin-top:6mm;display:grid;grid-template-columns:45mm 1fr;gap:3mm">${['Buchungsnummer', 'Termin', 'Standort', 'Leistung', 'Fahrzeug', 'Gesamtpreis (Endpreis)'].map((l) => `<b>${l}</b><span style="border-bottom:.2mm solid #ccc"></span>`).join('')}</div><p style="margin-top:8mm">Bitte räumen Sie persönliche Gegenstände vorab aus dem Fahrzeug. ${EXTERIOR_NOTE}</p>`, [dataDraft])
  // Pflege-Hinweisblatt A5 (allgemeine Tipps, keine Produktversprechen)
  L.push({
    id: 'PFLEGE_A5', folder: F, file: 'RM6_PFLEGEHINWEISE_A5_C', kind: 'print', w: 148, h: 210, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 0.4, photos: [], qrs: [QR], draft: [],
    pages: (P) => [{
      cls: 'light', sheetBg: 'var(--ivory)', bg: '<div class="abs" style="inset:0;background:var(--ivory)"></div>',
      content: `<div class="abs" style="inset:8cqw;display:flex;flex-direction:column;gap:3cqw;font-size:3.1cqw;color:#0A0A0B"><div style="display:flex;justify-content:space-between;align-items:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:40cqw"')}<p class="serif" style="font-size:7cqw;color:var(--gold-d)">Pflegetipps</p></div><p style="color:#3c3a35">So bleibt Ihr Fahrzeug länger gepflegt:</p>${[['Nach der Polsterreinigung', 'Polster brauchen einige Zeit zum Trocknen. Wenn möglich, das Fahrzeug anfangs lüften.'], ['Verschmutzungen frisch entfernen', 'Verschüttete Getränke und Flecken lassen sich frisch am leichtesten lösen.'], ['Vogelkot und Insekten', 'Möglichst bald und schonend entfernen – sie können den Lack angreifen.'], ['Fußmatten', 'Regelmäßig ausschütteln oder aussaugen, besonders im Winter bei Streusplitt und Salz.'], ['Scheiben innen', 'Mit einem sauberen Mikrofasertuch abwischen – für bessere Sicht bei tiefer Sonne.']].map(([t, d]) => `<div style="display:flex;gap:2.4cqw"><span style="color:var(--gold-d);font-weight:700">✓</span><div><b>${t}</b><p style="color:#3c3a35">${d}</p></div></div>`).join('')}<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><p>Nächster Termin?<br><b style="font-family:Barlow,sans-serif;font-size:1.6em">${FACTS.phone}</b><br><b style="color:var(--gold-d)">${FACTS.web}</b></p><div class="qrbox" style="width:22cqw">${qrSvg(QR)}</div></div></div>`,
    }],
  })
  // Übergabekarte A6
  L.push({
    id: 'UEBERGABE_A6', folder: '07_GUTSCHEINE_KUNDENKARTEN', file: 'RM6_UEBERGABEKARTE_A6_A', kind: 'print', w: 105, h: 148, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 0.56, photos: [], qrs: [qrWith('DANKE20')], draft: [],
    pages: (P) => [{
      bg: background('A', P),
      content: `${brackets()}<div class="abs" style="inset:9cqw;display:flex;flex-direction:column;gap:3.4cqw;font-size:3.6cqw">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:56cqw"')}<p class="cond" style="font-size:10cqw">Gepflegt <span class="gold">für Sie.</span></p>${['Datum', 'Leistung', 'Hinweise'].map((l) => `<div style="display:flex;align-items:flex-end;gap:2cqw"><span style="color:var(--silver)">${l}</span><i style="flex:1;border-bottom:.3cqw solid rgba(255,255,255,.45);height:1em"></i></div>`).join('')}<p style="color:#D9D5CC">Danke für Ihr Vertrauen! Für Ihren nächsten Termin: <b class="gold-solid">20 € mit DANKE20</b> (ab 119 €, einmal je Kunde).</p><div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><p><b style="font-family:Barlow,sans-serif;font-size:1.5em">${FACTS.phone}</b><br><b class="gold-solid">${FACTS.web}</b></p><div class="qrbox" style="width:26cqw">${qrSvg(qrWith('DANKE20'))}</div></div></div>`,
    }],
  })
  // Kleine Beileger 99×70 (Neukunden-Code zum Weitergeben)
  L.push({
    id: 'BEILEGER', folder: '07_GUTSCHEINE_KUNDENKARTEN', file: 'RM6_BEILEGER_99x70_D', kind: 'print', w: 99, h: 70, unit: 'mm', bleed: 3, cat: 'close', logoFrac: 0.42, photos: [], qrs: [qrWith('NEU20')], draft: [],
    pages: (P) => [{ bg: background('A', P), content: `<div class="abs" style="inset:8cqh 6cqw;display:flex;justify-content:space-between;align-items:center;gap:4cqw"><div style="display:flex;flex-direction:column;gap:3cqh">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:42cqw"')}<p class="cond-i" style="font-size:10cqh">Zum Weitergeben:<br><span class="gold">20 € mit NEU20</span></p><p style="font-size:3.6cqh;color:#A8A39A;line-height:1.3">${COUPONS.neu.terms}</p></div><div class="qrbox" style="width:30cqw">${qrSvg(qrWith('NEU20'))}</div></div>` }],
  })
  // Tür-/Fensteraufkleber und QR-Aufkleber
  L.push({
    id: 'AUFKL_TUER', folder: '08_PREISLISTEN_ANGEBOTE/Aufkleber', file: 'RM6_TUER_FENSTERAUFKLEBER_200x100', kind: 'print', w: 200, h: 100, unit: 'mm', bleed: 2, cat: 'close', logoFrac: 0.42, photos: [], qrs: [QR], draft: [],
    pages: (P) => [{ bg: background('A', P), content: `<div class="abs" style="inset:9cqh 6cqw;display:flex;justify-content:space-between;align-items:center;gap:4cqw"><div style="display:flex;flex-direction:column;gap:4cqh">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:42cqw"')}<p style="font-size:6cqh;color:#D9D5CC">Mobile Fahrzeugpflege · ${FACTS.region}</p><p><b style="font-family:Barlow,sans-serif;font-size:11cqh">${FACTS.phone}</b> <b class="gold-solid" style="font-family:Barlow,sans-serif;font-size:9cqh;margin-left:2cqw">${FACTS.web}</b></p></div><div style="display:flex;flex-direction:column;align-items:center;gap:2cqh"><div class="qrbox" style="width:24cqw">${qrSvg(QR)}</div><span style="font-size:4.4cqh;letter-spacing:.14em;text-transform:uppercase;color:var(--silver)">Termin buchen</span></div></div>` }],
  })
  L.push({
    id: 'AUFKL_QR', folder: '08_PREISLISTEN_ANGEBOTE/Aufkleber', file: 'RM6_QR_AUFKLEBER_60x60', kind: 'print', w: 60, h: 60, unit: 'mm', bleed: 2, cat: 'close', logoFrac: 0.7, photos: [], qrs: [QR], draft: [],
    pages: (P) => [{ bg: background('A', P), content: `<div class="abs" style="inset:6cqw;display:flex;flex-direction:column;align-items:center;justify-content:space-between">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:70cqw"')}<div class="qrbox" style="width:52cqw">${qrSvg(QR)}</div><p style="font-size:4.4cqw;letter-spacing:.12em;text-transform:uppercase;font-weight:600;white-space:nowrap">Termin online buchen</p></div>` }],
  })
  return L
}

// ═════════════════════════════════════════════════════════════════════════════════
// 10 FAHRZEUGWERBUNG (skalierbare Layouts – Maße am Fahrzeug aufnehmen)
// ═════════════════════════════════════════════════════════════════════════════════
export function vehicle() {
  const L = []
  const F = '10_FAHRZEUGWERBUNG'
  const MEASURE = 'Skalierbares Layout: tatsächliche Flächenmaße am Fahrzeug aufnehmen und von Folierer/Werbetechnik freigeben lassen'
  const v = (id, file, w, h, content, more = {}) => L.push({ id, folder: F, file, kind: 'print', w, h, unit: 'mm', bleed: 0, cat: 'large', logoFrac: 0.4, photos: [], qrs: [], draft: [MEASURE], pages: (P) => [{ bg: more.bg ? more.bg(P) : background('A', P), content: content(P), cls: more.cls ?? '' }], ...more.job })
  v('FZ_MAGNET_60x40', 'RM6_FAHRZEUGMAGNET_600x400_A', 600, 400, (P) => `<div class="abs" style="inset:8cqh 6cqw;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:70cqw"')}<p style="font-size:6cqh;color:#D9D5CC;letter-spacing:.06em">Mobile Fahrzeugpflege · ${FACTS.region}</p><div style="display:flex;align-items:center;gap:4cqw"><div class="qrbox" style="width:24cqh">${qrSvg(QR)}</div><div style="text-align:left"><b style="font-family:Barlow,sans-serif;font-size:12cqh;line-height:1">${FACTS.phone}</b><br><b class="gold-solid" style="font-family:Barlow,sans-serif;font-size:9cqh">${FACTS.web}</b></div></div></div>`, { job: { logoFrac: 0.7, qrs: [QR], draft: ['Magnetfolie nur auf ebenen Stahlflächen; Größe an Tür anpassen'] } })
  v('FZ_TUER', 'RM6_TUERBESCHRIFTUNG_900x450_A_DEZENT', 900, 450, (P) => `<div class="abs" style="inset:10cqh 6cqw;display:flex;flex-direction:column;justify-content:center;gap:5cqh">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:58cqw"')}<span style="width:58cqw;font-size:4cqh">${goldRule()}</span><p style="font-size:7cqh;letter-spacing:.06em">${FACTS.phone} · <span class="gold-solid">${FACTS.web}</span></p></div>`, { job: { logoFrac: 0.58 } })
  v('FZ_HECKKLAPPE', 'RM6_HECKKLAPPE_1100x450_B', 1100, 450, (P) => `<div class="abs" style="inset:9cqh 5cqw;display:flex;justify-content:space-between;align-items:center;gap:4cqw">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:40cqw"')}<div style="text-align:right"><p class="cond-i" style="font-size:16cqh">Wir kommen <span class="gold">zu Ihnen.</span></p><p style="margin-top:3cqh"><b style="font-family:Barlow,sans-serif;font-size:13cqh">${FACTS.phone}</b></p><p class="gold-solid" style="font-family:Barlow,sans-serif;font-weight:700;font-size:10cqh">${FACTS.web}</p></div></div>`, { job: { logoFrac: 0.4 } })
  v('FZ_SEITE_GROSS', 'RM6_SEITENBESCHRIFTUNG_GROSS_4200x1100_B', 4200, 1100, (P) => `${speedLines()}<style>.speed{left:0;width:100%;top:8%;height:84%;opacity:.9}</style><div class="abs" style="inset:10cqh 4cqw;display:flex;justify-content:space-between;align-items:center;gap:4cqw">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:21cqw"')}<div style="text-align:right"><p class="cond-i" style="font-size:15cqh">Mobile <span class="gold">Fahrzeugpflege</span></p><p style="font-size:9cqh;font-family:Barlow,sans-serif;font-weight:800;margin-top:2cqh">${FACTS.phone} · <span class="gold-solid">${FACTS.web}</span></p></div></div>`, { job: { logoFrac: 0.21, draft: [MEASURE, 'Großflächige Beschriftung: Fahrzeugkonturen (Türen, Griffe, Sicken) im Layout berücksichtigen'] } })
  v('FZ_DEZENT', 'RM6_PREMIUM_DEZENT_700x180_C', 700, 180, (P) => `<div class="abs" style="inset:12cqh 4cqw;display:flex;justify-content:space-between;align-items:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:46cqw"')}<p style="font-family:Barlow,sans-serif;font-weight:700;font-size:22cqh;color:var(--gold)">${FACTS.web}</p></div>`, { job: { logoFrac: 0.46 } })
  v('FZ_LOGO_KLEIN', 'RM6_LOGO_KLEIN_300x92', 300, 92, (P) => `<div class="abs" style="inset:0;display:grid;place-items:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:90cqw"')}</div>`, { job: { logoFrac: 0.9, draft: ['Kleines Logo für Fahrzeugflächen; für Plott/Folie Vektorfassung des Logos nötig'] } })
  return L
}

export function allPrint() {
  return [...banners(), ...signs(), ...flyers(), ...posters(), ...cards(), ...priceLists(), ...newspaper(), ...stationery(), ...vehicle()]
}
