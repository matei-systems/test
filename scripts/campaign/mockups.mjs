#!/usr/bin/env node
/**
 * Stilisierte Mockups (Visualisierungen) der RM6-Werbemittel – CSS-Szenen mit den tatsächlich erzeugten Dateien.
 * Keine realen Werbeflächen; jedes Bild trägt den Hinweis „Visualisierung“.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { css } from './kit.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = path.join(root, 'RM6_MARKETING/19_MOCKUPS_VORSCHAUEN')
const P = '../'
const W = 1920
const H = 1080

const img = (rel) => `${P}${rel}`
const label = `<div style="position:absolute;right:24px;bottom:20px;padding:8px 14px;border-radius:999px;background:rgba(10,10,11,.7);border:1px solid rgba(212,168,67,.5);color:#C9CCD1;font:500 15px Geist;letter-spacing:.12em;text-transform:uppercase">Visualisierung · keine reale Werbefläche</div>`
const title = (t) => `<div style="position:absolute;left:28px;top:24px;font:600 16px Geist;letter-spacing:.22em;text-transform:uppercase;color:#D4A843">RM6 Mockup · ${t}</div>`
const sky = 'linear-gradient(180deg,#1b2333 0%,#3a3f4f 45%,#8a7a66 78%,#c7a676 100%)'

const SUV = `<svg viewBox="0 0 1000 400" style="position:absolute;inset:0;width:100%;height:100%"><defs><linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f46"/><stop offset=".45" stop-color="#1c1e22"/><stop offset="1" stop-color="#0b0c0e"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5d6776"/><stop offset="1" stop-color="#151a22"/></linearGradient><radialGradient id="rim"><stop offset="0" stop-color="#d9dde2"/><stop offset=".6" stop-color="#7d838b"/><stop offset="1" stop-color="#2a2d31"/></radialGradient></defs>
<ellipse cx="500" cy="378" rx="470" ry="16" fill="rgba(0,0,0,.55)"/>
<path id="car" d="M60,300 L60,232 Q64,206 96,200 L250,188 L332,120 Q347,104 372,102 L700,99 Q737,99 758,121 L832,188 L906,199 Q938,205 942,236 L942,300 Q942,313 928,313 L872,313 A72,72 0 0 0 728,313 L332,313 A72,72 0 0 0 188,313 L72,313 Q60,313 60,300 Z" fill="url(#body)"/>
<path d="M347,190 L388,126 Q395,116 409,116 L521,114 L521,190 Z" fill="url(#glass)"/><path d="M536,114 L692,113 Q714,114 724,129 L776,190 L536,190 Z" fill="url(#glass)"/>
<path d="M62,250 L940,250" stroke="rgba(255,255,255,.08)" stroke-width="2"/><path d="M528,195 L528,300 M342,196 L342,296 M782,196 L790,300" stroke="rgba(0,0,0,.6)" stroke-width="2"/>
<rect x="470" y="212" width="34" height="6" rx="3" fill="#9aa0a8"/><rect x="720" y="212" width="34" height="6" rx="3" fill="#9aa0a8"/>
<path d="M890,206 L938,214 L936,232 L896,226 Z" fill="#e8edf2" opacity=".9"/><path d="M62,212 L92,208 L94,228 L62,232 Z" fill="#a3201a"/>
${[260, 800].map((x) => `<circle cx="${x}" cy="313" r="62" fill="#0c0d0f"/><circle cx="${x}" cy="313" r="40" fill="url(#rim)"/>${Array.from({ length: 5 }, (_, i) => `<line x1="${x}" y1="313" x2="${x + 36 * Math.cos((i * 2 * Math.PI) / 5)}" y2="${313 + 36 * Math.sin((i * 2 * Math.PI) / 5)}" stroke="#3a3d42" stroke-width="7"/>`).join('')}<circle cx="${x}" cy="313" r="9" fill="#1a1b1e"/>`).join('')}</svg>`

const SCENES = [
  {
    file: 'RM6_MOCKUP_ZAUNBANNER', t: 'Zaunbanner 300 × 100 cm',
    body: `<div style="position:absolute;inset:0;background:${sky}"></div><div style="position:absolute;left:0;right:0;bottom:0;height:30%;background:linear-gradient(180deg,#2b2a27,#121211)"></div>
<div style="position:absolute;left:0;right:0;top:350px;height:520px;background:repeating-linear-gradient(90deg,transparent 0 118px,#6f747b 118px 124px),repeating-linear-gradient(180deg,transparent 0 98px,rgba(111,116,123,.8) 98px 102px);opacity:.75"></div>
<div style="position:absolute;left:210px;top:430px;width:1500px;height:500px;transform:perspective(1800px) rotateY(-6deg);box-shadow:0 30px 60px rgba(0,0,0,.6);background:url('${img('02_BANNER/Zaunbanner/RM6_ZAUNBANNER_300x100_A_BLACKGOLD_VORSCHAU.jpg')}') center/cover"></div>
${[0, 1, 2, 3, 4, 5].map((i) => `<i style="position:absolute;top:${440 + (i % 2) * 470}px;left:${230 + Math.floor(i / 2) * 720}px;width:16px;height:16px;border-radius:50%;background:#d8d8d8;box-shadow:0 0 0 3px #555"></i>`).join('')}`,
  },
  {
    file: 'RM6_MOCKUP_KLAPPAUFSTELLER_VOR_GEBAEUDE', t: 'Klappaufsteller A1',
    body: `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#3a3633,#2a2725)"></div>${[0, 1, 2].map((i) => `<div style="position:absolute;top:120px;left:${180 + i * 560}px;width:420px;height:520px;background:linear-gradient(180deg,#141821,#2b3240);border:14px solid #1a1a1a;box-shadow:inset 0 0 80px rgba(0,0,0,.6)"></div>`).join('')}<div style="position:absolute;left:0;right:0;bottom:0;height:300px;background:repeating-linear-gradient(90deg,#4c4a47 0 238px,#3e3c3a 238px 242px),#4c4a47"></div>
<div style="position:absolute;left:760px;top:250px;width:420px;height:600px;transform:perspective(1400px) rotateX(8deg);transform-origin:bottom;box-shadow:0 40px 60px rgba(0,0,0,.55);border:10px solid #111;background:url('${img('03_SCHILDER_AUFSTELLER/Klappaufsteller/RM6_KLAPPAUFSTELLER_A1_VORDER_RUECK_VORSCHAU.jpg')}') left center/auto 100% no-repeat"></div><div style="position:absolute;left:770px;top:848px;width:400px;height:30px;background:rgba(0,0,0,.45);filter:blur(10px)"></div>`,
  },
  {
    file: 'RM6_MOCKUP_GRUNDSTUECKSSCHILD', t: 'Schild 60 × 40 cm auf Privatgrund',
    body: `<div style="position:absolute;inset:0;background:${sky}"></div><div style="position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(180deg,#2f4a2a,#16220f)"></div><div style="position:absolute;left:0;right:0;top:470px;height:160px;background:linear-gradient(180deg,#1f3519,#2a4523);border-radius:80px 80px 0 0"></div>
<div style="position:absolute;left:770px;top:520px;width:18px;height:470px;background:#555"></div><div style="position:absolute;left:1132px;top:520px;width:18px;height:470px;background:#555"></div>
<div style="position:absolute;left:700px;top:330px;width:520px;height:347px;box-shadow:0 30px 50px rgba(0,0,0,.6);background:url('${img('03_SCHILDER_AUFSTELLER/Kleine_Schilder/RM6_SCHILD_60x40_QUER_A_BLACKGOLD_VORSCHAU.jpg')}') center/cover"></div>`,
  },
  {
    file: 'RM6_MOCKUP_FLYER_TISCH', t: 'Flyer A5 (Vorder- und Rückseite)',
    body: `<div style="position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 40%,#3a3530,#151311)"></div><div style="position:absolute;inset:0;opacity:.2;background:repeating-linear-gradient(100deg,rgba(255,255,255,.06) 0 3px,transparent 3px 14px)"></div>
<div style="position:absolute;left:470px;top:150px;width:520px;height:740px;transform:rotate(-8deg);box-shadow:0 40px 70px rgba(0,0,0,.7);background:url('${img('04_FLYER/A5/RM6_FLYER_A5_IMAGE_A_FRONT_BACK_VORSCHAU.jpg')}') left center/auto 100% no-repeat"></div>
<div style="position:absolute;left:960px;top:190px;width:520px;height:740px;transform:rotate(6deg);box-shadow:0 40px 70px rgba(0,0,0,.7);background:url('${img('04_FLYER/A5/RM6_FLYER_A5_IMAGE_A_FRONT_BACK_VORSCHAU.jpg')}') right center/auto 100% no-repeat"></div>`,
  },
  {
    file: 'RM6_MOCKUP_POSTER_SCHAUFENSTER', t: 'Poster A1 im Schaufenster',
    body: `<div style="position:absolute;inset:0;background:#1d1b19"></div><div style="position:absolute;left:330px;top:90px;width:1260px;height:860px;background:#0d0f13;border:26px solid #2b2925;box-shadow:inset 0 0 120px rgba(0,0,0,.8)"></div>
<div style="position:absolute;left:740px;top:170px;width:480px;height:680px;box-shadow:0 20px 40px rgba(0,0,0,.6);background:url('${img('05_POSTER/RM6_POSTER_A1_IMAGE_A_VORSCHAU.jpg')}') center/cover"></div>
<div style="position:absolute;left:356px;top:116px;width:1208px;height:808px;background:url('${img('16_BILDER_ASSETS/fotos/RM6_FOTO_GRAZ_NACHT.jpg')}') center/cover;opacity:.12;filter:blur(3px);mix-blend-mode:screen"></div><div style="position:absolute;left:356px;top:116px;width:1208px;height:808px;background:linear-gradient(115deg,rgba(255,255,255,.12) 0%,transparent 30%,transparent 60%,rgba(255,255,255,.06) 75%,transparent 85%)"></div>`,
  },
  {
    file: 'RM6_MOCKUP_ZEITUNG', t: 'Zeitungsanzeige ¼ Seite',
    body: `<div style="position:absolute;inset:0;background:#3b3632"></div><div style="position:absolute;left:460px;top:60px;width:1000px;height:1000px;background:#efeae0;transform:rotate(-2deg);box-shadow:0 30px 60px rgba(0,0,0,.6);padding:40px;font-family:Georgia,serif;color:#333">
<div style="border-bottom:3px double #555;padding-bottom:10px;font-size:46px;font-weight:700;letter-spacing:.04em">Regionalzeitung <span style="font-size:18px;font-weight:400">(Platzhalter)</span></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:24px">${[0, 1].map(() => `<div>${Array.from({ length: 18 }, (_, i) => `<i style="display:block;height:10px;margin:9px 0;background:#c9c3b8;width:${i % 6 === 5 ? 60 : 100}%"></i>`).join('')}</div>`).join('')}</div>
<div style="position:absolute;right:40px;bottom:40px;width:440px;height:589px;background:url('${img('09_ZEITUNGSWERBUNG/RM6_ZEITUNG_VIERTELSEITE_HOCH_112x150_4C_VORSCHAU.jpg')}') center/cover;filter:saturate(.9) contrast(.95)"></div>
<div style="position:absolute;left:40px;bottom:40px;width:440px">${Array.from({ length: 22 }, (_, i) => `<i style="display:block;height:10px;margin:9px 0;background:#c9c3b8;width:${i % 7 === 6 ? 50 : 100}%"></i>`).join('')}</div></div>`,
  },
  {
    file: 'RM6_MOCKUP_GROSSWERBEFLAECHE', t: 'Großbanner 300 × 150 cm',
    body: `<div style="position:absolute;inset:0;background:${sky}"></div><div style="position:absolute;left:0;right:0;bottom:0;height:24%;background:linear-gradient(180deg,#26241f,#0f0e0c)"></div><div style="position:absolute;left:860px;top:640px;width:30px;height:420px;background:#3c3c3c"></div><div style="position:absolute;left:1030px;top:640px;width:30px;height:420px;background:#3c3c3c"></div>
<div style="position:absolute;left:460px;top:130px;width:1000px;height:520px;padding:14px;background:#222;box-shadow:0 40px 70px rgba(0,0,0,.6)"><div style="width:100%;height:100%;background:url('${img('02_BANNER/Grossbanner/RM6_GROSSBANNER_300x150_A_BLACKGOLD_VORSCHAU.jpg')}') center/cover"></div></div>`,
  },
  {
    file: 'RM6_MOCKUP_FAHRZEUG_SUV', t: 'Fahrzeugbeschriftung (schematischer SUV)',
    body: `<div style="position:absolute;inset:0;background:radial-gradient(60% 55% at 50% 45%,#2a2722,#0b0b0c)"></div><div style="position:absolute;left:210px;top:240px;width:1500px;height:600px">${SUV}
<div style="position:absolute;left:37%;top:51%;width:24%;height:22%;background:url('${img('10_FAHRZEUGWERBUNG/RM6_FAHRZEUGMAGNET_600x400_A_VORSCHAU.jpg')}') center/cover;border-radius:6px;box-shadow:0 6px 16px rgba(0,0,0,.6)"></div>
<div style="position:absolute;left:6.5%;top:63%;width:28%;height:7%;background:url('${img('10_FAHRZEUGWERBUNG/RM6_PREMIUM_DEZENT_700x180_C_VORSCHAU.jpg')}') center/cover;mix-blend-mode:screen;opacity:.95"></div></div>
<p style="position:absolute;left:28px;bottom:24px;color:#B9B4AA;font:400 18px Geist">Schematische Darstellung – reale Flächenmaße am Fahrzeug aufnehmen</p>`,
  },
  {
    file: 'RM6_MOCKUP_MONITOR', t: 'Digital Screen 1920 × 1080',
    body: `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#d9d4cb,#bdb6aa)"></div><div style="position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(180deg,#6b5a46,#4d4032)"></div>
<div style="position:absolute;left:400px;top:110px;width:1120px;height:660px;background:#050505;border-radius:18px;padding:22px;box-shadow:0 40px 80px rgba(0,0,0,.45)"><div style="width:100%;height:100%;background:url('${img('18_SOCIAL_MEDIA_EXPORTS/Digital_Screens/RM6_DIGITAL_SCREEN_1920x1080_A_BRAND.jpg')}') center/cover"></div></div><div style="position:absolute;left:900px;top:770px;width:120px;height:110px;background:linear-gradient(90deg,#2a2a2a,#444,#2a2a2a)"></div><div style="position:absolute;left:800px;top:870px;width:320px;height:22px;border-radius:8px;background:#333"></div>`,
  },
  {
    file: 'RM6_MOCKUP_SMARTPHONE_INSTAGRAM', t: 'Social Media auf dem Smartphone',
    body: `<div style="position:absolute;inset:0;background:radial-gradient(60% 70% at 50% 40%,#2c2924,#0b0b0c)"></div>
${[[560, 'RM6_INSTAGRAM_POST_1080x1350_D_ANGEBOT.jpg', -6], [1000, 'RM6_INSTAGRAM_STORY_1080x1920_D_NEU20.jpg', 5]].map(([x, f, r]) => `<div style="position:absolute;left:${x}px;top:120px;width:380px;height:800px;border-radius:56px;background:#111;padding:16px;transform:rotate(${r}deg);box-shadow:0 40px 80px rgba(0,0,0,.7);border:2px solid #333"><div style="width:100%;height:100%;border-radius:42px;overflow:hidden;background:#000;position:relative">${f.includes('STORY') ? `<img src="${img(`18_SOCIAL_MEDIA_EXPORTS/Instagram/${f}`)}" style="width:100%;height:100%;object-fit:cover">` : `<div style="height:56px;display:flex;align-items:center;gap:10px;padding:0 14px;color:#fff;font:600 15px Geist"><span style="width:30px;height:30px;border-radius:50%;background:url('${img('18_SOCIAL_MEDIA_EXPORTS/Google_Profil/RM6_GOOGLE_PROFIL_LOGO_720x720.png')}') center/cover"></span>rm6.autoaufbereitung</div><img src="${img(`18_SOCIAL_MEDIA_EXPORTS/Instagram/${f}`)}" style="width:100%"><div style="padding:10px 14px;color:#ddd;font:400 13px Geist">♡ ◯ ➤</div>`}</div></div>`).join('')}`,
  },
]

fs.mkdirSync(DIR, { recursive: true })
const browser = await chromium.launch()
for (const s of SCENES) {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${s.file}</title><style>${css(P)}html,body{background:#000}.stage{position:relative;width:${W}px;height:${H}px;overflow:hidden}</style></head><body><div class="stage">${s.body}${title(s.t)}${label}</div></body></html>`
  const src = path.join(DIR, `${s.file}.html`)
  fs.writeFileSync(src, html)
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  const pg = await ctx.newPage()
  await pg.goto(pathToFileURL(src).href, { waitUntil: 'load' })
  await pg.evaluate(async () => { await document.fonts.ready })
  await pg.waitForTimeout(300)
  const png = await pg.screenshot({ type: 'png' })
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(DIR, `${s.file}.jpg`))
  await ctx.close()
  console.log(`✔ ${s.file}.jpg`)
}
await browser.close()
