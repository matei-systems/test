#!/usr/bin/env node
/**
 * Animierte RM6-Werbemittel: HTML/CSS-Zeitleiste → Einzelbilder (30 fps) → MP4 (H.264, ffmpeg).
 *   node scripts/campaign/animate.mjs [Filter]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { FACTS } from './config.mjs'
import { css, goldRule, logo, photo, qrSvg } from './kit.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = path.join(root, 'RM6_MARKETING/15_ANIMATIONEN_VIDEOS')
const P = '../'
const FPS = 30
const filter = process.argv[2]

const anim = `
@keyframes fadeUp{from{opacity:0;transform:translateY(4cqh)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeOut{from{opacity:1}to{opacity:0}}
@keyframes focus{from{opacity:0;filter:blur(2.4cqmin);transform:scale(1.08)}to{opacity:1;filter:none;transform:none}}
@keyframes kenburns{from{transform:scale(1.12) translateX(2%)}to{transform:scale(1) translateX(0)}}
@keyframes sweep{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(220%) skewX(-18deg)}}
@keyframes draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:none}}
.L{position:absolute;inset:0;container-type:size}
.a{animation-fill-mode:both;animation-timing-function:cubic-bezier(.22,1,.36,1)}
.scene{position:absolute;inset:0;opacity:0;animation:fadeIn .5s both}
.photo{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;animation:kenburns 4s linear both}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,11,.95) 0%,rgba(10,10,11,.7) 45%,rgba(10,10,11,.15) 100%)}
.shadeV{position:absolute;inset:0;background:linear-gradient(0deg,rgba(10,10,11,.97) 0%,rgba(10,10,11,.75) 45%,rgba(10,10,11,.2) 100%)}
.glow{position:absolute;inset:0;background:radial-gradient(55% 60% at 50% 45%,rgba(212,168,67,.25),transparent 70%),#0A0A0B}
.sweep{position:absolute;top:-10%;bottom:-10%;width:22%;background:linear-gradient(90deg,transparent,rgba(243,216,142,.35),transparent)}
`
const sceneWrap = (start, end, inner, extra = '') => `<div class="scene" style="animation:fadeIn .5s ${start}s both${end ? `, fadeOut .45s ${end - 0.45}s forwards` : ''};${extra}">${inner}</div>`
const endCard = (start, portrait, note = '') => sceneWrap(start, null, `<div class="glow"></div><div class="sweep a" style="animation:sweep 1.6s ${start + 0.3}s both"></div><div class="L" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${portrait ? '3cqh' : '4cqh'};text-align:center">${logo(P, 'logo a').replace('class="logo a"', `class="logo a" style="width:${portrait ? 78 : 44}cqw;animation:focus 1s ${start + 0.1}s both"`)}<span class="a" style="width:${portrait ? 50 : 26}cqw;font-size:${portrait ? 1.6 : 2.6}cqh;transform-origin:center;animation:draw .8s ${start + 0.7}s both">${goldRule()}</span><p class="cond a" style="font-size:${portrait ? 5.2 : 7}cqh;animation:fadeUp .7s ${start + 0.9}s both">Termin online <span class="gold">buchen</span></p><div class="a" style="display:flex;align-items:center;gap:${portrait ? '4cqw' : '2.4cqw'};animation:fadeUp .7s ${start + 1.2}s both"><div class="qrbox" style="width:${portrait ? 26 : 14}cqh;width:${portrait ? 30 : 12}cqw">${qrSvg(FACTS.qrBooking)}</div><div style="text-align:left"><p style="font-family:Barlow,sans-serif;font-weight:800;font-size:${portrait ? 4.6 : 6}cqh">${FACTS.phone}</p><p class="gold-solid" style="font-family:Barlow,sans-serif;font-weight:700;font-size:${portrait ? 3.8 : 5}cqh">${FACTS.web}</p></div></div>${note ? `<p class="a" style="font-size:${portrait ? 1.4 : 2}cqh;color:#A8A39A;animation:fadeIn .6s ${start + 1.5}s both">${note}</p>` : ''}</div>`)
const photoScene = (start, end, file, pos, eyebrow, headline, sub, portrait) => sceneWrap(start, end, `<img class="photo" src="${photo(P, file)}" style="object-position:${pos};animation-delay:${start}s;animation-duration:${end - start + 0.5}s"><div class="${portrait ? 'shadeV' : 'shade'}"></div><div class="L" style="display:flex;flex-direction:column;justify-content:${portrait ? 'flex-end' : 'center'};padding:${portrait ? '0 8cqw 16cqh' : '0 7cqw'};gap:2.4cqh">${logo(P, 'logo a').replace('class="logo a"', `class="logo a" style="width:${portrait ? 46 : 22}cqw;animation:fadeIn .6s ${start + 0.2}s both;margin-bottom:${portrait ? 3 : 4}cqh"`)}<p class="eyebrow a" style="font-size:${portrait ? 1.6 : 2.4}cqh;animation:fadeUp .6s ${start + 0.3}s both">${eyebrow}</p><h1 class="cond-i a" style="font-size:${portrait ? 6.6 : 11}cqh;animation:fadeUp .7s ${start + 0.45}s both">${headline}</h1>${sub ? `<p class="a" style="font-size:${portrait ? 2.4 : 3.6}cqh;color:#D9D5CC;max-width:${portrait ? 90 : 46}cqw;animation:fadeUp .7s ${start + 0.7}s both">${sub}</p>` : ''}</div>`)
const NOTE = '* Einführungspreise (−20 %) in der Startphase · regulärer Preis: Innenraum ab 99 €, Außenpflege ab 124 €, Komplettpaket ab 249 € · Endpreise inkl. Anfahrt'

const VIDEOS = [
  {
    id: 'LOGO_REVEAL', file: 'RM6_LOGO_REVEAL_5s_1920x1080', w: 1920, h: 1080, dur: 5,
    body: () => `<div class="glow"></div><div class="sweep a" style="animation:sweep 1.8s .6s both"></div><div class="L" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4cqh">${logo(P, 'logo a').replace('class="logo a"', 'class="logo a" style="width:52cqw;animation:focus 1.4s .2s both"')}<span class="a" style="width:30cqw;font-size:2.6cqh;animation:draw .9s 1.4s both">${goldRule()}</span><p class="eyebrow a" style="font-size:3cqh;animation:fadeUp .8s 2s both">Premium Fahrzeugpflege · Graz</p></div>`,
  },
  {
    id: 'SPOT10', file: 'RM6_SPOT_10s_1920x1080', w: 1920, h: 1080, dur: 10,
    body: () => photoScene(0, 3.6, 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', '70% 50%', 'Mobile Fahrzeugaufbereitung', '<span class="gold">Glanz,</span><br>der zu Ihnen kommt.', 'Premium-Fahrzeugpflege von Hand – direkt bei Ihnen in Graz & Umgebung.', false) + sceneWrap(3.6, 6.8, `<div class="glow"></div><div class="L" style="display:flex;flex-direction:column;justify-content:center;padding:0 9cqw;gap:3cqh"><p class="eyebrow a" style="font-size:2.4cqh;animation:fadeUp .6s 3.8s both">Unsere Leistungen</p>${['Innenraum', 'Außenpflege', 'Komplettpaket', 'Anfahrt inklusive'].map((t, i) => `<p class="cond a" style="font-size:10cqh;animation:fadeUp .6s ${4 + i * 0.35}s both">${i === 3 ? `<span class="gold">${t}</span>` : t}</p>`).join('')}</div>`) + endCard(6.8, false),
  },
  {
    id: 'SPOT15', file: 'RM6_SPOT_15s_1920x1080', w: 1920, h: 1080, dur: 15,
    body: () => photoScene(0, 3.2, 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', '70% 50%', 'RM6 Autoaufbereitung', 'Wir kommen.<br><span class="gold">Sie lehnen sich zurück.</span>', '', false) + photoScene(3.2, 6.2, 'RM6_FOTO_INNENRAUM.jpg', '50% 55%', 'Innenraum', 'Innenraum<br><span class="gold">ab 79 €*</span>', 'Basic oder Premium – bis in jede Fuge.', false) + photoScene(6.2, 9.2, 'RM6_FOTO_HANDWAESCHE.jpg', '50% 50%', 'Außenpflege', 'Außenpflege<br><span class="gold">ab 99 €*</span>', 'Schonende Handwäsche – an geeigneten, zulässigen Standorten.', false) + photoScene(9.2, 12, 'RM6_FOTO_GRAZ_NACHT.jpg', '60% 50%', 'Komplettpaket', 'Innen + außen<br><span class="gold">ab 199 €*</span>', 'Ein Termin. Preisvorteil gegenüber Einzelbuchung.', false) + endCard(12, false, NOTE),
  },
  {
    id: 'SPOT10_HOCH', file: 'RM6_SPOT_10s_1080x1920', w: 1080, h: 1920, dur: 10,
    body: () => photoScene(0, 3.6, 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', '68% 50%', 'Mobile Fahrzeugaufbereitung', '<span class="gold">Glanz,</span><br>der zu Ihnen kommt.', 'Premium-Fahrzeugpflege von Hand – direkt bei Ihnen in Graz & Umgebung.', true) + sceneWrap(3.6, 6.8, `<div class="glow"></div><div class="L" style="display:flex;flex-direction:column;justify-content:center;padding:0 9cqw;gap:2.4cqh"><p class="eyebrow a" style="font-size:1.6cqh;animation:fadeUp .6s 3.8s both">Unsere Leistungen</p>${['Innenraum', 'Außenpflege', 'Komplettpaket', 'Anfahrt inklusive'].map((t, i) => `<p class="cond a" style="font-size:6.4cqh;animation:fadeUp .6s ${4 + i * 0.35}s both">${i === 3 ? `<span class="gold">${t}</span>` : t}</p>`).join('')}</div>`) + endCard(6.8, true),
  },
  {
    id: 'REEL15', file: 'RM6_REEL_15s_1080x1920', w: 1080, h: 1920, dur: 15,
    body: () => photoScene(0, 3.2, 'RM6_FOTO_LIMOUSINE_STUDIO.jpg', '68% 50%', 'RM6 Autoaufbereitung', 'Wir kommen.<br><span class="gold">Sie lehnen sich zurück.</span>', '', true) + photoScene(3.2, 6.2, 'RM6_FOTO_INNENRAUM.jpg', '50% 55%', 'Innenraum', 'Innenraum<br><span class="gold">ab 79 €*</span>', 'Basic oder Premium – bis in jede Fuge.', true) + photoScene(6.2, 9.2, 'RM6_FOTO_HANDWAESCHE.jpg', '50% 50%', 'Außenpflege', 'Außenpflege<br><span class="gold">ab 99 €*</span>', 'Schonende Handwäsche – an geeigneten Standorten.', true) + photoScene(9.2, 12, 'RM6_FOTO_GRAZ_NACHT.jpg', '62% 50%', 'Komplettpaket', 'Innen + außen<br><span class="gold">ab 199 €*</span>', 'Ein Termin. Preisvorteil.', true) + endCard(12, true, NOTE),
  },
  {
    id: 'ANGEBOT6', file: 'RM6_ANGEBOT_ANIMIERT_6s_1080x1080', w: 1080, h: 1080, dur: 6,
    body: () => `<div class="glow"></div><div class="sweep a" style="animation:sweep 1.6s 1.2s both"></div><div class="L" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3.4cqh;text-align:center;padding:0 8cqw">${logo(P, 'logo a').replace('class="logo a"', 'class="logo a" style="width:56cqw;animation:focus 1s .1s both"')}<p class="eyebrow a" style="font-size:2.6cqh;animation:fadeUp .6s .7s both">Neukunden-Vorteil</p><p class="cond a" style="font-size:15cqh;animation:pop .8s 1s both"><span class="gold">20 €</span></p><p class="cond a" style="font-size:6cqh;animation:fadeUp .6s 1.5s both">mit Code NEU20</p><p class="a" style="font-size:2.4cqh;color:#B9B4AA;animation:fadeIn .6s 2s both">Erste Buchung ab 119 € · einmal je Kunde · online einlösbar · keine Barablöse</p><p class="a" style="font-family:Barlow,sans-serif;font-weight:700;font-size:5cqh;color:var(--gold);animation:fadeUp .6s 2.4s both">${FACTS.web}</p></div>`,
  },
]

fs.mkdirSync(DIR, { recursive: true })
const browser = await chromium.launch()
for (const v of VIDEOS.filter((x) => !filter || x.id.includes(filter))) {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${v.file}</title><style>${css(P)}${anim}html,body{background:#0A0A0B}.stage{position:relative;width:${v.w}px;height:${v.h}px;overflow:hidden;background:#0A0A0B;container-type:size}</style></head><body><div class="stage">${v.body()}</div></body></html>`
  const src = path.join(DIR, `${v.file}.html`)
  fs.writeFileSync(src, html)
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1 })
  const pg = await ctx.newPage()
  await pg.goto(pathToFileURL(src).href, { waitUntil: 'load' })
  await pg.evaluate(async () => { await document.fonts.ready })
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'rm6-frames-'))
  const frames = v.dur * FPS
  for (let f = 0; f < frames; f++) {
    const t = (f / FPS) * 1000
    await pg.evaluate((ms) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms } }, t)
    await pg.screenshot({ path: path.join(tmp, `f${String(f).padStart(4, '0')}.png`), type: 'png' })
    if (f === frames - 1) fs.copyFileSync(path.join(tmp, `f${String(f).padStart(4, '0')}.png`), path.join(DIR, `${v.file}_POSTER.png`))
  }
  await ctx.close()
  const out = path.join(DIR, `${v.file}.mp4`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%04d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out])
  fs.rmSync(tmp, { recursive: true, force: true })
  const kb = Math.round(fs.statSync(out).size / 1024)
  console.log(`✔ ${v.file}.mp4  ${v.w}×${v.h}, ${v.dur} s, ${kb} KB`)
}
await browser.close()
