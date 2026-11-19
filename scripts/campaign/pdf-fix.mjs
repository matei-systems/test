import fs from 'node:fs'
import { PDFDict, PDFDocument, PDFName, PDFStream } from 'pdf-lib'

// Ghostscript wandelt alle Farben nach CMYK bzw. Grau, übernimmt aber den Mischfarbraum der
// Transparenzgruppen (Chromium: /CS /DeviceRGB). Der wird hier passend gesetzt, damit die
// Druckerei-RIP Transparenzen nicht über RGB verrechnet.
export function fixBlendSpace(pdf, mode) {
  const target = PDFName.of(mode === 'gray' ? 'DeviceGray' : 'DeviceCMYK')
  let n = 0
  for (const [, obj] of pdf.context.enumerateIndirectObjects()) {
    const dicts = [obj instanceof PDFStream ? obj.dict : obj]
    for (const d of dicts) {
      if (!(d instanceof PDFDict)) continue
      const g = d.lookup(PDFName.of('Group'))
      for (const x of [d, g]) {
        if (x instanceof PDFDict && x.get(PDFName.of('S')) === PDFName.of('Transparency') && x.has(PDFName.of('CS'))) {
          x.set(PDFName.of('CS'), target)
          n++
        }
      }
    }
  }
  return n
}

// Nachträglich auf vorhandene Dateien anwenden: node scripts/campaign/pdf-fix.mjs <pdf> [...]
if (process.argv[1] && process.argv[1].endsWith('pdf-fix.mjs')) {
  for (const file of process.argv.slice(2)) {
    const mode = /_GRAU\.pdf$/.test(file) ? 'gray' : 'cmyk'
    const pdf = await PDFDocument.load(fs.readFileSync(file), { updateMetadata: false })
    const n = fixBlendSpace(pdf, mode)
    if (n) fs.writeFileSync(file, await pdf.save({ useObjectStreams: false }))
    console.log(`${n} Gruppe(n) → ${mode}: ${file}`)
  }
}
