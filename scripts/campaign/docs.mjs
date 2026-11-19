// Erzeugt RM6_MARKETING/20_README_UND_PRODUKTIONSHINWEISE/WERBEMITTEL_LISTE.md aus manifest.json
// und zählt die tatsächlich vorhandenen Dateien. Aufruf: node scripts/campaign/docs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../RM6_MARKETING');
const DOCS = path.join(ROOT, '20_README_UND_PRODUKTIONSHINWEISE');
const manifest = JSON.parse(fs.readFileSync(path.join(DOCS, 'manifest.json'), 'utf8'));

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });

const files = walk(ROOT).map((f) => path.relative(ROOT, f));
const ext = (re) => files.filter((f) => re.test(f)).length;
const inDir = (dir, re = /./) => files.filter((f) => f.startsWith(dir + '/') && re.test(f)).length;

const missing = [];
for (const e of manifest) {
  const d = e.dateien || {};
  for (const f of [d.source, d.preview, d.pdf, d.pdfCmyk, ...(d.exports || [])].filter(Boolean)) {
    if (!fs.existsSync(path.join(ROOT, f))) missing.push(f);
  }
}

const by = (k) => manifest.reduce((m, e) => ((m[e[k]] = (m[e[k]] || 0) + 1), m), {});
const status = by('status');
const qrCount = manifest.reduce((s, e) => s + (e.qr || []).length, 0);
const qrTargets = [...new Set(manifest.flatMap((e) => (e.qr || []).map((q) => q.ziel)))];

const counts = {
  designs: manifest.length,
  print: manifest.filter((e) => e.art === 'print').length,
  digital: manifest.filter((e) => e.art === 'digital').length,
  druckfertig: status['druckfertig (technisch geprüft)'] || 0,
  entwurf: status['Entwurf'] || 0,
  digitalFertig: status['fertig'] || 0,
  pdfPrint: inDir('17_PRINT_READY_EXPORTS', /_PRINT\.pdf$/),
  pdfCmyk: inDir('17_PRINT_READY_EXPORTS', /_PRINT_CMYK\.pdf$/),
  pdfEntwurf: ext(/_ENTWURF\.pdf$/),
  pdfGrau: ext(/_GRAU\.pdf$/),
  socialExports: inDir('18_SOCIAL_MEDIA_EXPORTS', /\.(jpe?g|png)$/),
  previews: ext(/_VORSCHAU\.jpg$/),
  html: ext(/\.html$/),
  mp4: ext(/\.mp4$/),
  mockups: inDir('19_MOCKUPS_VORSCHAUEN', /^19_MOCKUPS_VORSCHAUEN\/RM6_MOCKUP_.*\.jpg$/),
  sheets: inDir('19_MOCKUPS_VORSCHAUEN', /UEBERSICHT_.*\.jpg$/),
  qrCount,
  allFiles: files.length,
};

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
const fileCell = (e) => {
  const d = e.dateien || {};
  const out = [];
  if (d.pdf) {
    const label = /_ENTWURF\.pdf$/.test(d.pdf) ? 'Entwurf-PDF' : /_GRAU\.pdf$/.test(d.pdf) ? 'Graustufen-PDF' : 'PDF RGB';
    out.push(`[${label}](../${d.pdf})`);
  }
  if (d.pdfCmyk) out.push(`[PDF CMYK](../${d.pdfCmyk})`);
  for (const x of d.exports || []) out.push(`[${path.extname(x).slice(1).toUpperCase()}](../${x})`);
  if (d.preview) out.push(`[Vorschau](../${d.preview})`);
  if (d.source) out.push(`[Quelle](../${d.source})`);
  return out.join(' · ');
};

const groups = {};
for (const e of manifest) (groups[e.kategorie.split('/')[0]] ||= []).push(e);

let md = `# RM6 Werbemittel – vollständige Liste

Automatisch erzeugt aus \`manifest.json\` mit \`node scripts/campaign/docs.mjs\`. Nicht von Hand bearbeiten.

## Zahlen

| | Anzahl |
| --- | ---: |
| Designs gesamt | ${counts.designs} |
| davon Druck | ${counts.print} |
| davon digital | ${counts.digital} |
| **Druckfertig (technisch geprüft)** | **${counts.druckfertig}** |
| Entwurf (Druck + digital, mit Grund) | ${counts.entwurf} |
| Digital fertig | ${counts.digitalFertig} |
| Druck-PDFs RGB / CMYK | ${counts.pdfPrint} / ${counts.pdfCmyk} |
| Entwurfs-PDFs / Graustufen-PDFs | ${counts.pdfEntwurf} / ${counts.pdfGrau} |
| Digitale Exporte (JPG/PNG) | ${counts.socialExports} |
| Vorschaubilder | ${counts.previews} |
| Videos (MP4) | ${counts.mp4} |
| Mockups / Übersichtsblätter | ${counts.mockups} / ${counts.sheets} |
| QR-Codes (alle maschinell ausgelesen) | ${counts.qrCount} |
| Dateien im Ordner RM6_MARKETING | ${counts.allFiles} |

QR-Ziele: ${qrTargets.map((t) => '`' + t + '`').join(', ')}

${missing.length ? `**Fehlende Dateien laut Manifest:** ${missing.map((m) => '`' + m + '`').join(', ')}` : 'Alle im Manifest genannten Dateien sind vorhanden (beim Erzeugen dieser Liste geprüft).'}

**Druckfertig (technisch geprüft)** heißt: Format, Beschnitt, Bildauflösung und QR-Code wurden geprüft.
Die inhaltliche Freigabe (Preise, Texte, Domain, Impressum) erteilen Sie. Siehe \`RECHT_UND_PRODUKTION_PRUEFLISTE.md\`.
`;

for (const [g, items] of Object.entries(groups)) {
  md += `\n## ${g.replace(/^\d+_/, '').replace(/_/g, ' ')}\n\n| Datei | Format | Beschnitt | Seiten | Status | Gründe / Hinweise | QR | min. dpi | Dateien |\n| --- | --- | --- | ---: | --- | --- | --- | ---: | --- |\n`;
  for (const e of items) {
    const notes = [...(e.gruende || []), ...(e.hinweise || []).map((h) => 'Hinweis: ' + h)].map(esc).join('<br>');
    const qr = (e.qr || []).map((q) => `${esc(q.ziel.replace('https://', ''))} (${q.groesse})`).join('<br>');
    md += `| ${esc(e.datei)} | ${esc(e.format)} | ${esc(e.beschnitt)} | ${e.seiten ?? ''} | ${esc(e.status)} | ${notes || '–'} | ${qr || '–'} | ${e.minDpi ?? '–'} | ${fileCell(e)} |\n`;
  }
}

fs.writeFileSync(path.join(DOCS, 'WERBEMITTEL_LISTE.md'), md);
fs.writeFileSync(path.join(DOCS, 'zahlen.json'), JSON.stringify(counts, null, 2) + '\n');
console.log(JSON.stringify(counts, null, 2));
if (missing.length) {
  console.error('FEHLEND:', missing);
  process.exitCode = 1;
}
