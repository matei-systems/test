/**
 * Digitale Werbemittel: Instagram, Facebook, Bildschirme, Website, Google-Profil, Display-Ads, WhatsApp, E-Mail.
 * Maße in px. Quellen in 11–14, Exporte in 18_SOCIAL_MEDIA_EXPORTS.
 */
import { ADDONS, COUPONS, FACTS, PACKAGES, PROMO_NOTE, VEHICLES } from './config.mjs'
import { background, brackets, fmtMin, goldRule, hero, k, logo, photo, priceTable, qrSvg, speedLines, tableCss } from './kit.mjs'
import { COPY } from './designs-print.mjs'

const QR = FACTS.qrBooking
const OFFER = { label: 'Einführungspreis Innenraum', price: 'ab 79 €', regular: 'regulär ab 99 € · −20 % in der Startphase' }

function dj({ id, folder, exportDir, file, w, h, concept, copy = COPY[concept], extra = {}, ph, pos = '50% 50%', side = 'right', format = 'jpg', draft = [], content, bg, cls, notes = [] }) {
  const ar = w / h
  return {
    id, folder, exportDir, file, kind: 'digital', w, h, unit: 'px', bleed: 0, format, draft, notes,
    photos: ph ? [{ file: ph, fw: concept === 'C' ? (side === 'top' || side === 'bottom' ? 1 : 0.46) : 1, fh: concept === 'C' && (side === 'top' || side === 'bottom') ? 0.46 : 1 }] : [],
    qrs: extra.qr ? [extra.qr] : [],
    extraCss: concept === 'B' ? `.speed{left:${ar > 1.3 ? '28%' : '0'};width:${ar > 1.3 ? '72%' : '100%'};top:${ar > 1.3 ? '14%' : '50%'};height:${ar > 1.3 ? '72%' : '20%'};opacity:.8}` : '',
    pages: (P) => [
      {
        cls: cls ?? (concept === 'C' ? 'light' : ''),
        bg: bg ? bg(P) : background(concept, P, { photo: ph, photoPos: pos, side }) + (concept === 'B' ? speedLines() : ''),
        content: content ? content(P) : (concept === 'A' || (concept === 'C' && !ph) ? brackets() : '') + hero(P, { id, concept, ar, photoSide: ph && concept !== 'C' && ar >= 1.2 ? side : null, photoTop: concept === 'C' && ph && side === 'top', ...copy, ...extra }),
      },
    ],
  }
}

const IG = (o) => dj({ folder: '11_INSTAGRAM', exportDir: '18_SOCIAL_MEDIA_EXPORTS/Instagram', ...o })
const FB = (o) => dj({ folder: '12_FACEBOOK', exportDir: '18_SOCIAL_MEDIA_EXPORTS/Facebook', ...o })
const SC = (o) => dj({ folder: '13_DIGITAL_SCREENS', exportDir: '18_SOCIAL_MEDIA_EXPORTS/Digital_Screens', ...o })
const WEB = (o, sub = 'Website') => dj({ folder: '14_WEBSITE_ONLINE', exportDir: `18_SOCIAL_MEDIA_EXPORTS/${sub}`, ...o })

// ─── Spezielle Layouts ──────────────────────────────────────────────────────────
const head = (P, eyebrow, title, size = 9, lw = 30) => `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4cqw"><div><p class="eyebrow" style="font-size:${lw < 30 ? 1.2 : 2.4}cqw">${eyebrow}</p><p class="cond" style="font-size:${size}cqw;margin-top:${lw < 30 ? 0.6 : 1.4}cqw">${title}</p></div>${logo(P, 'logo').replace('class="logo"', `class="logo" style="width:${lw}cqw;flex:none"`)}</div>`
const foot = (light = false) => `<div style="display:flex;justify-content:space-between;align-items:baseline;border-top:.2cqw solid ${light ? 'rgba(0,0,0,.15)' : 'rgba(212,168,67,.4)'};padding-top:2.4cqw"><b style="font-family:Barlow,sans-serif;font-size:5cqw">${FACTS.phone}</b><b style="font-family:Barlow,sans-serif;font-size:4.4cqw;color:${light ? 'var(--gold-d)' : 'var(--gold)'}">${FACTS.web}</b></div>`

const leistungen = (P) => `${brackets()}<div class="abs" style="inset:6.5cqw;display:flex;flex-direction:column;justify-content:space-between;gap:1.4cqw;color:#0A0A0B">${head(P, 'Unsere Leistungen', 'Vier Pakete. <span class="serif" style="text-transform:none;color:var(--gold-d)">Klar definiert.</span>', 6.4)}${PACKAGES.map((p) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:1.6cqw 2.6cqw;border:.2cqw solid ${p.featured ? 'var(--gold-d)' : 'rgba(0,0,0,.14)'};border-radius:2cqw;background:${p.featured ? 'rgba(212,168,67,.14)' : 'transparent'}"><div><b style="font-size:3.7cqw">${p.name}</b><p style="font-size:2.5cqw;color:#5d594f">ca. ${fmtMin(p.minutes[0])} · ${p.id === 'komplettpaket' ? 'innen + außen' : p.id === 'aussenpflege' ? 'Handwäsche' : p.id === 'innenraum-premium' ? 'bis ins Detail' : 'gründlich'}</p></div><b style="font-family:Barlow,sans-serif;font-size:5.6cqw;white-space:nowrap">ab ${p.promo[0]} €</b></div>`).join('')}<p style="font-size:2.5cqw;color:#5d594f">${PROMO_NOTE}. Endpreise inkl. Anfahrt in Graz & Umgebung.</p>${foot(true)}</div>`

function beforeAfter(P, ar) {
  const pair = [['sitz-vorher', 'Vorher'], ['sitz-nachher', 'Nachher']]
  const horiz = ar > 1.2
  return `<div class="abs" style="inset:0;display:grid;${horiz ? 'grid-template-columns:1fr 1fr' : 'grid-template-rows:1fr 1fr'}">${pair.map(([f, l]) => `<div style="position:relative;overflow:hidden"><img class="ph" src="${P}16_BILDER_ASSETS/fotos/demo/${f}.jpg"><span style="position:absolute;left:4cqmin;top:4cqmin;padding:1cqmin 2.4cqmin;border-radius:99px;background:rgba(10,10,11,.75);border:.2cqmin solid var(--gold);font-size:3cqmin;font-weight:600;letter-spacing:.14em;text-transform:uppercase">${l}</span></div>`).join('')}</div><div class="abs" style="left:0;right:0;bottom:0;padding:5cqmin;background:linear-gradient(0deg,rgba(10,10,11,.95),rgba(10,10,11,.6) 70%,transparent);display:flex;justify-content:space-between;align-items:flex-end;gap:4cqmin"><div><p class="cond" style="font-size:7cqmin">Der Unterschied ist <span class="gold">sichtbar.</span></p><p style="font-size:2.6cqmin;color:#E58A7E;margin-top:1cqmin">Vorlage mit Beispielbild (Demo-Visualisierung, keine Kundenarbeit) – vor dem Posten eigene Fotos einsetzen.</p></div>${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:24cqmin;flex:none"')}</div>`
}

const faq = (P) => `${brackets()}<div class="abs" style="inset:8cqw;display:flex;flex-direction:column;justify-content:space-between">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:34cqw"')}<div><p class="eyebrow" style="font-size:2.6cqw">Häufige Frage</p><p class="cond" style="font-size:8.6cqw;margin:2cqw 0 4cqw">Wann ist mein Termin <span class="gold">verbindlich?</span></p><p style="font-size:3.9cqw;line-height:1.45;color:#D9D5CC">Nach dem Absenden erhalten Sie eine Buchungsnummer. Wir prüfen anschließend Ihre Angaben und bestätigen Ihren Termin persönlich per E-Mail. Erst danach ist Ihr Termin verbindlich bestätigt.</p></div>${foot()}</div>`

const carousel = (P, i) => {
  const steps = [
    ['01', 'Online buchen', 'Leistung und Fahrzeugkategorie wählen, freien Termin aussuchen. Den Gesamtpreis sehen Sie vor dem Absenden.'],
    ['02', 'Persönlich bestätigt', 'Sie erhalten sofort eine Buchungsnummer. Wir prüfen Ihre Angaben und bestätigen den Termin persönlich per E-Mail.'],
    ['03', 'Wir kommen zu Ihnen', 'Zur vereinbarten Zeit mit unserer Ausrüstung – zu Hause, am Arbeitsplatz oder am vereinbarten Standort.'],
  ]
  const [n, t, d] = steps[i]
  return `${brackets()}<div class="abs" style="inset:8cqw;display:flex;flex-direction:column;justify-content:space-between"><div style="display:flex;justify-content:space-between;align-items:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:32cqw"')}<span style="font-size:3cqw;letter-spacing:.2em;color:var(--silver)">${i + 1} / 3</span></div><div><p class="cond gold" style="font-size:34cqw;line-height:.8">${n}</p><p class="cond" style="font-size:10cqw;margin:3cqw 0">${t}</p><p style="font-size:4.2cqw;line-height:1.45;color:#D9D5CC">${d}</p></div><div style="display:flex;justify-content:space-between;align-items:center"><p class="eyebrow" style="font-size:2.6cqw">So läuft’s bei RM6</p><span style="font-size:3.4cqw;color:var(--gold)">${i < 2 ? 'weiter →' : FACTS.web}</span></div></div>`
}

const review = (P) => `${brackets()}<div class="abs" style="inset:8cqw;display:flex;flex-direction:column;justify-content:space-between;color:#0A0A0B">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:34cqw"')}<div><p style="font-size:9cqw;color:var(--gold-d)">★★★★★</p><p class="serif" style="font-size:7.4cqw;line-height:1.15;margin:3cqw 0"><span class="todo">„Hier eine echte, freigegebene Kundenbewertung einsetzen.“</span></p><p style="font-size:3.4cqw;color:#5d594f">— <span class="todo">Vorname, Ort (mit Einverständnis)</span></p></div><p style="font-size:2.6cqw;color:#E58A7E">Vorlage – nur mit echten, freigegebenen Bewertungen verwenden.</p></div>`

const priceDigital = (P, ar) => `<style>${tableCss}</style><div class="abs" style="inset:${ar > 1.2 ? '5cqh 4cqw' : '6cqw'};display:flex;flex-direction:column;gap:${ar > 1.2 ? '1.6cqh' : '2.6cqw'};font-size:${k(ar > 1.2 ? '1.3cqw' : '2.6cqw')}">${head(P, `Preise · ${FACTS.region}`, 'Klare <span class="gold">Endpreise.</span>', ar > 1.2 ? 3.6 : 8, ar > 1.2 ? 15 : 30)}${priceTable(PACKAGES, VEHICLES, { minutes: false })}<p style="font-size:.8em;color:#B9B4AA">${PROMO_NOTE}. Inkl. Anfahrt. Zusatzleistungen: ${ADDONS.map((a) => `${a.name} ${a.price}`).join(' · ')}.</p>${ar > 1.2 ? `<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><p><b style="font-family:Barlow,sans-serif;font-size:3em">${FACTS.phone}</b>&nbsp;&nbsp;<b class="gold-solid" style="font-family:Barlow,sans-serif;font-size:2.4em">${FACTS.web}</b></p><div style="display:flex;align-items:center;gap:1.4cqw"><span style="font-size:1.1em;letter-spacing:.14em;text-transform:uppercase;color:var(--silver)">Termin online buchen</span><div class="qrbox" style="width:12cqh">${qrSvg(QR)}</div></div></div>` : foot()}</div>`

const serviceBanner = (P, pk, ph, pos) => `<div class="abs" style="inset:9cqh 5cqw;display:flex;flex-direction:column;justify-content:space-between;max-width:56%">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:24cqw"')}<div><p class="eyebrow" style="font-size:2.6cqh">${pk.short}</p><p class="cond" style="font-size:11cqh;margin:1.4cqh 0">${pk.name}</p><p style="font-size:4.4cqh;color:#D9D5CC">ab <b class="gold" style="font-family:Barlow,sans-serif;font-size:2.2em">${pk.promo[0]} €</b> · ca. ${fmtMin(pk.minutes[0])}</p></div><span class="btn" style="font-size:3.4cqh;align-self:flex-start">Jetzt Termin buchen</span></div>`

const signature = (P) => `<div class="abs" style="inset:0;display:flex;align-items:center;gap:4cqw;padding:0 5cqw;background:#0A0A0B">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:36cqw"')}<span style="width:.3cqw;align-self:stretch;margin:18cqh 0;background:var(--gold)"></span><div style="display:flex;flex-direction:column;gap:3cqh"><b style="font-size:13cqh;letter-spacing:.04em">${FACTS.brand}</b><span style="font-size:10cqh;color:var(--silver)">Mobile Fahrzeugpflege · ${FACTS.region}</span><span style="font-size:11cqh"><b>${FACTS.phone}</b> · <b class="gold-solid">${FACTS.web}</b></span></div></div>`

const voucher = (P) => `${brackets()}<div class="abs" style="inset:8cqh 6cqw;display:grid;grid-template-columns:1.1fr 1fr;gap:5cqw;align-items:center"><div style="display:flex;flex-direction:column;gap:3cqh">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:30cqw"')}<p class="cond gold" style="font-size:13cqh">Gutschein</p><p style="font-size:3.6cqh;color:#D9D5CC">Premium-Fahrzeugpflege · mobil in Graz & Umgebung</p></div><div style="display:grid;gap:4cqh;font-size:3.6cqh">${['Für', 'Wert in €', 'Gutscheincode', 'Gültig bis'].map((l) => `<div style="display:flex;gap:1.4cqw;align-items:flex-end"><span style="color:var(--silver);white-space:nowrap">${l}</span><i style="flex:1;border-bottom:.3cqh solid rgba(255,255,255,.45);height:1em"></i></div>`).join('')}<p style="font-size:.78em;color:#A8A39A">Einlösen bei der Online-Buchung auf ${FACTS.web}. Keine Barablöse.</p></div></div>`

export default function digital() {
  const L = []
  // Instagram
  L.push(IG({ id: 'IG_FEED_BRAND', file: 'RM6_INSTAGRAM_FEED_1080x1080_A_BRAND', w: 1080, h: 1080, concept: 'A', extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], phone: false } }))
  L.push(IG({ id: 'IG_FEED_LEIST', file: 'RM6_INSTAGRAM_FEED_1080x1080_C_LEISTUNGEN', w: 1080, h: 1080, concept: 'C', content: leistungen, cls: 'light' }))
  L.push(IG({ id: 'IG_POST_ANGEBOT', file: 'RM6_INSTAGRAM_POST_1080x1350_D_ANGEBOT', w: 1080, h: 1350, concept: 'D', extra: { offer: OFFER, services: ['Anfahrt inklusive'], note: PROMO_NOTE, phone: false } }))
  L.push(IG({ id: 'IG_POST_KOMPLETT', file: 'RM6_INSTAGRAM_POST_1080x1350_B_KOMPLETTPAKET', w: 1080, h: 1350, concept: 'B', ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '66% 50%', side: 'bottom', copy: { eyebrow: 'Komplettpaket', headline: 'Innen und außen.<br><span class="gold">Ein Termin.</span>', sub: 'Innenraum Premium + Außenpflege – mit Preisvorteil. Ab 199 € (Einführungspreis).' }, extra: { phone: false } }))
  L.push(IG({ id: 'IG_STORY_NEU20', file: 'RM6_INSTAGRAM_STORY_1080x1920_D_NEU20', w: 1080, h: 1920, concept: 'D', copy: { eyebrow: 'Neukunden-Vorteil', headline: '20 € auf Ihre<br><span class="gold">erste Buchung.</span>', sub: `Code NEU20 · ${COUPONS.neu.terms}` }, extra: { cta: 'Jetzt Termin buchen', phone: false } }))
  L.push(IG({ id: 'IG_STORY_BUCHEN', file: 'RM6_INSTAGRAM_STORY_1080x1920_A_TERMIN', w: 1080, h: 1920, concept: 'A', extra: { cta: 'Link in Bio · Termin buchen', services: ['Innenraum', 'Außenpflege', 'Komplettpaket'] } }))
  L.push(IG({ id: 'IG_REEL_COVER', file: 'RM6_INSTAGRAM_REEL_COVER_1080x1920_B', w: 1080, h: 1920, concept: 'B', ph: 'RM6_FOTO_HANDWAESCHE.jpg', pos: '50% 50%', side: 'bottom', copy: { eyebrow: 'Behind the Shine', headline: 'Handwäsche<br><span class="gold">im Detail.</span>', sub: '' }, extra: { phone: false } }))
  L.push(IG({ id: 'IG_VN', file: 'RM6_INSTAGRAM_VORHER_NACHHER_1080x1350_VORLAGE', w: 1080, h: 1350, concept: 'A', content: (P) => beforeAfter(P, 1080 / 1350), bg: () => '', draft: ['Vorlage mit Demo-Bildern – vor dem Posten durch echte Vorher-Nachher-Fotos ersetzen'] }))
  L.push(IG({ id: 'IG_FAQ', file: 'RM6_INSTAGRAM_FAQ_1080x1080_A', w: 1080, h: 1080, concept: 'A', content: faq }))
  for (let i = 0; i < 3; i++) L.push(IG({ id: `IG_KAR_${i + 1}`, file: `RM6_INSTAGRAM_KARUSSELL_1080x1350_A_${String(i + 1).padStart(2, '0')}`, w: 1080, h: 1350, concept: 'A', content: (P) => carousel(P, i) }))
  L.push(IG({ id: 'IG_NEUKUNDEN', file: 'RM6_INSTAGRAM_FEED_1080x1080_D_NEUKUNDEN', w: 1080, h: 1080, concept: 'D', copy: { eyebrow: 'Neu in Graz', headline: 'Ihr erstes Mal<br><span class="gold">mit RM6?</span>', sub: '20 € Vorteil mit Code NEU20 – ab 119 € Auftragswert, einmal je Kunde.' }, extra: { phone: false } }))
  L.push(IG({ id: 'IG_BEWERTUNG', file: 'RM6_INSTAGRAM_BEWERTUNG_1080x1080_C_VORLAGE', w: 1080, h: 1080, concept: 'C', content: review, cls: 'light', draft: ['Nur mit echten, freigegebenen Bewertungen verwenden'] }))
  L.push(IG({ id: 'IG_PREMIUM', file: 'RM6_INSTAGRAM_POST_1080x1350_A_PREMIUM_MOTIV', w: 1080, h: 1350, concept: 'A', ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '68% 50%', side: 'bottom', copy: { eyebrow: 'Premium Fahrzeugpflege', headline: 'Ihr Auto.<br><span class="gold">Unser Anspruch.</span>', sub: '' }, extra: { phone: false } }))
  L.push(IG({ id: 'IG_PREISE', file: 'RM6_INSTAGRAM_POST_1080x1350_A_PREISLISTE', w: 1080, h: 1350, concept: 'A', content: (P) => priceDigital(P, 1080 / 1350) }))
  // Facebook
  L.push(FB({ id: 'FB_TITEL', file: 'RM6_FACEBOOK_TITELBILD_1640x624_A', w: 1640, h: 624, concept: 'A', copy: { ...COPY.A, sub: null }, extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket', 'Anfahrt inklusive'] }, notes: ['Profilbild überdeckt links unten einen Bereich – Inhalte dort freigehalten'] }))
  L.push(FB({ id: 'FB_AD_LAND', file: 'RM6_FACEBOOK_AD_1200x628_B', w: 1200, h: 628, concept: 'B', ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '70% 50%', extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], cta: 'Jetzt Termin buchen' } }))
  L.push(FB({ id: 'FB_AD_SQ', file: 'RM6_FACEBOOK_AD_1080x1080_D', w: 1080, h: 1080, concept: 'D', extra: { offer: OFFER, phone: false, note: PROMO_NOTE } }))
  L.push(FB({ id: 'FB_AD_HOCH', file: 'RM6_FACEBOOK_AD_1080x1350_C', w: 1080, h: 1350, concept: 'C', ph: 'RM6_FOTO_INNENRAUM.jpg', pos: '50% 55%', side: 'top', extra: { services: ['Basic ab 79 €', 'Premium ab 119 €'], phone: false } }))
  L.push(FB({ id: 'FB_SAISON', file: 'RM6_FACEBOOK_SAISON_1200x628_B_HERBST_WINTER', w: 1200, h: 628, concept: 'B', ph: 'RM6_FOTO_GRAZ_NACHT.jpg', pos: '60% 50%', copy: { eyebrow: 'Saison-Pflege · Herbst & Winter', headline: 'Streusplitt raus.<br><span class="gold">Frische rein.</span>', sub: '' }, extra: { services: ['Innenraum ab 79 €', 'Komplettpaket ab 199 €'], cta: 'Jetzt Termin buchen' } }))
  L.push(FB({ id: 'FB_VN', file: 'RM6_FACEBOOK_VORHER_NACHHER_1200x628_VORLAGE', w: 1200, h: 628, concept: 'A', content: (P) => beforeAfter(P, 1200 / 628), bg: () => '', draft: ['Vorlage mit Demo-Bildern – vor dem Posten durch echte Vorher-Nachher-Fotos ersetzen'] }))
  // Bildschirme
  L.push(SC({ id: 'SCR_1080P_A', file: 'RM6_DIGITAL_SCREEN_1920x1080_A_BRAND', w: 1920, h: 1080, concept: 'A', extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket', 'Anfahrt inklusive'], qr: QR } }))
  L.push(SC({ id: 'SCR_1080P_D', file: 'RM6_DIGITAL_SCREEN_1920x1080_D_ANGEBOT', w: 1920, h: 1080, concept: 'D', extra: { offer: OFFER, qr: QR, note: PROMO_NOTE } }))
  L.push(SC({ id: 'SCR_1080P_B', file: 'RM6_DIGITAL_SCREEN_1920x1080_B_PERFORMANCE', w: 1920, h: 1080, concept: 'B', ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '70% 50%', extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], qr: QR } }))
  L.push(SC({ id: 'SCR_PORT_A', file: 'RM6_DIGITAL_SCREEN_1080x1920_A_BRAND', w: 1080, h: 1920, concept: 'A', extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], qr: QR, cta: 'Termin online buchen' } }))
  L.push(SC({ id: 'SCR_PORT_D', file: 'RM6_DIGITAL_SCREEN_1080x1920_D_ANGEBOT', w: 1080, h: 1920, concept: 'D', extra: { offer: OFFER, qr: QR, services: ['Anfahrt inklusive'], note: PROMO_NOTE } }))
  L.push(SC({ id: 'SCR_4K_A', file: 'RM6_DIGITAL_SCREEN_3840x2160_A_BRAND', w: 3840, h: 2160, concept: 'A', extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket', 'Anfahrt inklusive'], qr: QR } }))
  L.push(SC({ id: 'SCR_PREISE', file: 'RM6_DIGITAL_SCREEN_1920x1080_PREISLISTE', w: 1920, h: 1080, concept: 'A', content: (P) => priceDigital(P, 1920 / 1080), extra: { qr: QR } }))
  // Website & Online
  L.push(WEB({ id: 'WEB_HEADER', file: 'RM6_WEBSITE_HEADER_1920x600_A', w: 1920, h: 600, concept: 'A', copy: { ...COPY.A, sub: null }, extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket', 'Anfahrt inklusive'] } }))
  L.push(WEB({ id: 'WEB_HERO', file: 'RM6_WEBSITE_HERO_2400x1000_B', w: 2400, h: 1000, concept: 'B', ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '72% 50%', extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], cta: 'Jetzt Termin buchen' } }))
  const svcPh = [['RM6_DETAIL_COCKPIT.jpg', '50% 50%'], ['RM6_FOTO_INNENRAUM.jpg', '50% 55%'], ['RM6_FOTO_HANDWAESCHE.jpg', '50% 50%'], ['RM6_FOTO_LIMOUSINE_STUDIO.jpg', '70% 50%']]
  PACKAGES.forEach((pk, i) => L.push(WEB({ id: `WEB_SVC_${i}`, file: `RM6_WEBSITE_LEISTUNG_1200x600_${pk.id.toUpperCase()}`, w: 1200, h: 600, concept: 'A', ph: svcPh[i][0], pos: svcPh[i][1], content: (P) => serviceBanner(P, pk) })))
  L.push(WEB({ id: 'WEB_AKTION', file: 'RM6_WEBSITE_AKTIONSBANNER_1200x300_D', w: 1200, h: 300, concept: 'D', copy: { eyebrow: 'Einführungspreise', headline: 'Innenraum <span class="gold">ab 79 €</span>', sub: '' }, extra: { services: ['regulär ab 99 €', 'Anfahrt inklusive'], cta: 'Termin buchen' } }))
  L.push(WEB({ id: 'WEB_MOBIL', file: 'RM6_WEBSITE_MOBIL_BANNER_750x1000_D', w: 750, h: 1000, concept: 'D', extra: { offer: OFFER, cta: 'Jetzt Termin buchen', phone: false } }))
  L.push(WEB({ id: 'NEWSLETTER', file: 'RM6_NEWSLETTER_HEADER_1200x300_A', w: 1200, h: 300, concept: 'A', copy: { eyebrow: 'Neuigkeiten', headline: 'Glanz, <span class="gold">der zu Ihnen kommt.</span>', sub: '' }, extra: { phone: false } }))
  L.push(WEB({ id: 'MAIL_SIG', file: 'RM6_EMAIL_SIGNATUR_600x150', w: 600, h: 150, concept: 'A', content: signature, bg: () => '', format: 'png' }))
  L.push(WEB({ id: 'GUTSCHEIN_DIGITAL', file: 'RM6_DIGITALER_GUTSCHEIN_1600x800_A', w: 1600, h: 800, concept: 'A', content: voucher, draft: ['Ablauf für Wertgutscheine festlegen (Code im Admin, Bedingungen in AGB)'] }))
  // Google-Unternehmensprofil
  L.push(WEB({ id: 'GBP_LOGO', file: 'RM6_GOOGLE_PROFIL_LOGO_720x720', w: 720, h: 720, concept: 'A', content: (P) => `<div class="abs" style="inset:0;display:grid;place-items:center">${logo(P, 'logo').replace('class="logo"', 'class="logo" style="width:84cqw"')}</div>`, format: 'png' }, 'Google_Profil'))
  L.push(WEB({ id: 'GBP_TITEL', file: 'RM6_GOOGLE_PROFIL_TITELBILD_1080x608_A', w: 1080, h: 608, concept: 'A', ph: 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', pos: '70% 50%', copy: { ...COPY.A, sub: null }, extra: { phone: false } }, 'Google_Profil'))
  L.push(WEB({ id: 'GBP_POST', file: 'RM6_GOOGLE_PROFIL_BEITRAG_1200x900_D', w: 1200, h: 900, concept: 'D', extra: { offer: OFFER, note: PROMO_NOTE } }, 'Google_Profil'))
  // Display-Ads (Standardgrößen) – ohne QR, klickbar
  for (const [w, h, c] of [[300, 250, 'D'], [336, 280, 'A'], [728, 90, 'A'], [300, 600, 'D'], [320, 50, 'A'], [160, 600, 'A'], [970, 250, 'B']]) {
    const tiny = w * h < 50000
    L.push(WEB({ id: `AD_${w}x${h}`, file: `RM6_DISPLAY_AD_${w}x${h}_${c}`, w, h, concept: c, ph: c === 'B' ? 'RM6_FOTO_LIMOUSINE_STUDIO.jpg' : undefined, pos: '70% 50%', format: 'png', copy: { eyebrow: tiny ? '' : 'Mobile Autoaufbereitung Graz', headline: c === 'D' ? 'Innenraum<br><span class="gold">ab 79 €</span>' : 'Glanz, der <span class="gold">zu Ihnen kommt.</span>', sub: '' }, extra: { cta: 'Jetzt buchen', phone: false, services: w >= 970 ? ['Innenraum', 'Außenpflege', 'Komplettpaket'] : [] } }, 'Display_Ads'))
  }
  // WhatsApp
  L.push(WEB({ id: 'WA_STATUS_D', file: 'RM6_WHATSAPP_STATUS_1080x1920_D', w: 1080, h: 1920, concept: 'D', extra: { offer: OFFER, cta: 'Jetzt Termin buchen', note: PROMO_NOTE } }, 'WhatsApp'))
  L.push(WEB({ id: 'WA_STATUS_A', file: 'RM6_WHATSAPP_STATUS_1080x1920_A', w: 1080, h: 1920, concept: 'A', extra: { services: ['Innenraum', 'Außenpflege', 'Komplettpaket'], cta: 'Termin online buchen' } }, 'WhatsApp'))
  L.push(WEB({ id: 'WA_ANGEBOT', file: 'RM6_WHATSAPP_ANGEBOT_1080x1080_D', w: 1080, h: 1080, concept: 'D', copy: { eyebrow: 'Neukunden-Vorteil', headline: '20 € mit Code<br><span class="gold">NEU20</span>', sub: COUPONS.neu.terms } }, 'WhatsApp'))
  return L
}
