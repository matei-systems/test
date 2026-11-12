/**
 * Rendert die Social-Media-Vorlagen und das Designsystem-Board aus scripts/social/vorlagen.html
 * – mit den Schriften und Bildern der Website, damit alles exakt zur Marke passt.
 *
 *   node scripts/build-social-assets.mjs
 *
 * Ausgabe:
 *   brand/social/*.jpg              fertige Grafiken (direkt verwendbar)
 *   brand/social/hintergrund/*.jpg  dieselben Layouts ohne Texte (Basis für editierbare Canva-Vorlagen)
 *   brand/designsystem.png          Übersicht: Farben, Typografie, Logo, Komponenten, Bildstil
 *
 * Benötigt Playwright mit Chromium (einmalig: npx playwright install chromium).
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Playwright wird per require geladen, damit auch eine global installierte Version gefunden wird
const { chromium } = createRequire(import.meta.url)('playwright')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = pathToFileURL(path.join(root, 'scripts/social/vorlagen.html')).href
const out = (...p) => {
  const file = path.join(root, 'brand', ...p)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  return file
}

const SOCIAL = ['instagram-einfuehrungspreis', 'instagram-leistung', 'instagram-vorher-nachher', 'werbebanner']

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 2000, height: 1400 }, deviceScaleFactor: 1 })
await page.goto(source)
await page.evaluate(() => document.fonts.ready)
await page.waitForLoadState('networkidle')

for (const id of SOCIAL) {
  await page.locator(`#${id}`).screenshot({ path: out('social', `${id}.jpg`), type: 'jpeg', quality: 92 })
}
await page.locator('#designsystem').screenshot({ path: out('designsystem.png'), type: 'png' })

// Varianten ohne austauschbare Texte
await page.evaluate(() => document.body.classList.add('notext'))
for (const id of SOCIAL) {
  await page.locator(`#${id}`).screenshot({ path: out('social', 'hintergrund', `${id}.jpg`), type: 'jpeg', quality: 92 })
}
await browser.close()
console.log('✔ Social-Media-Vorlagen und Designsystem erzeugt.')
