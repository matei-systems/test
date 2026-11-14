# RM Mobile Auto Aufbereitung – Drucksachen

Alle Motive entstehen aus **einer Quelle**: `marketing/config.json` (Kontaktdaten, Domain, Gutscheine) und `scripts/build-marketing.mjs` (Gestaltung).
Nach jeder Änderung neu erzeugen:

```bash
npm run marketing
```

Übersicht aller Motive: `previews/uebersicht.jpg`

## Status: Druckvorlagen – noch **nicht** druckfertig

Die Dateien sind technisch geprüft (siehe unten), enthalten aber noch **rot markierte Platzhalter in eckigen Klammern**, weil im Projekt keine verifizierten Kontaktdaten hinterlegt sind. Vor dem Druck in `config.json` ergänzen und neu erzeugen:

| Feld | Erscheint auf | Platzhalter |
| --- | --- | --- |
| `inhaber` | Visitenkarte | `[Vor- und Nachname]` |
| `telefon` | Visitenkarte, Flyer | `[Telefonnummer]` |
| `email` | Visitenkarte, Flyer | `[E-Mail-Adresse]` |
| `website` | Visitenkarte, Flyer | `[www.ihre-domain.at]` |
| `medieninhaber` | Flyer (Impressumszeile) | `[Name, Ort]` |
| `buchungsUrl` | alle QR-Codes | zeigt derzeit auf `https://glanzmobil.vercel.app/buchen` |

**Wichtig zu den QR-Codes:** Sie führen auf die aktuelle Live-Adresse. Sobald eine eigene Domain verbunden ist, `buchungsUrl` anpassen und neu erzeugen – ein gedruckter QR-Code lässt sich nachträglich nicht mehr ändern.

## Dateien

| Motiv | Endformat | Dateien (jeweils `.svg` + `.pdf`, Vorschau in `previews/`) |
| --- | --- | --- |
| Visitenkarte **A „Monogramm“** (Empfehlung) | 85 × 55 mm | `visitenkarte/visitenkarte-a-vorderseite`, `…-a-rueckseite` |
| Visitenkarte B „Zeile“ | 85 × 55 mm | `visitenkarte/visitenkarte-b-vorderseite`, `…-b-rueckseite` |
| Flyer | DIN A6, 105 × 148 mm | `flyer-a6/flyer-a6-vorderseite`, `…-rueckseite` |
| Dankeskarte | 85,6 × 54 mm (Bankkarte) | `dankeskarte/dankeskarte-vorderseite`, `…-rueckseite` |
| Aufkleber **Minimal** (ohne Logo) | 250 × 70 mm und 400 × 112 mm | `heckscheiben-aufkleber/aufkleber-minimal-kompakt-250x70mm`, `…-gross-400x112mm` |
| Aufkleber **Premium** (mit RM-Zeichen und Name) | 250 × 70 mm und 400 × 112 mm | `heckscheiben-aufkleber/aufkleber-premium-kompakt-250x70mm`, `…-gross-400x112mm` |
| Logos, Farben, Schriften | – | `brand-assets/` |

**Warum Visitenkarte A?** Das zentrierte RM-Zeichen mit Glanzpunkt ist das stärkste Wiedererkennungsmerkmal der Marke und wirkt auf der kleinen Fläche am ruhigsten. Variante B stellt den Slogan in den Mittelpunkt und eignet sich, wenn die Karte vor allem die Leistung erklären soll.

## Technische Prüfung (bei jedem Erzeugen automatisch)

- **Format und Beschnitt:** Karten und Flyer haben 3 mm Beschnitt umlaufend; die PDF-Seiten entsprechen Endformat + Beschnitt, `TrimBox` und `BleedBox` sind gesetzt. Texte halten mindestens 3,5 mm Abstand zum Endformat. Aufkleber sind Konturdateien ohne Beschnitt.
- **Schrift:** kleinste Schriftgröße auf Karten und Flyer 2,1 mm (≈ 6 pt).
- **QR-Codes:** werden nach dem Rendern aus der PNG-Vorschau zurückgelesen und mit der Zieladresse verglichen – stimmt etwas nicht, bricht das Skript ab. Standard-Polarität (dunkle Module auf heller Fläche), Fehlerkorrektur M, Ruhezone 4 Module.
- **Vektor:** alle PDFs sind Vektordateien mit eingebetteten Schriften; einzige Pixelgrafik ist das Foto auf der Flyer-Vorderseite.

## Was die Druckerei wissen muss – und was noch zu prüfen ist

- **Farbraum RGB, nicht CMYK.** Die verwendeten Werkzeuge erzeugen kein CMYK-PDF. Online-Druckereien wandeln RGB in der Regel automatisch um; das tiefe Schwarz (`#0B0B0C`) und der Champagner-Ton (`#C8B48A`) können im Druck leicht abweichen. Für farbverbindliche Ergebnisse einen Proof bestellen oder die SVG-Dateien von der Druckerei/einem Grafiker in CMYK anlegen lassen.
- **Flyer-Foto:** ca. 250 dpi im Endformat (generiertes Markenbild, kein Kundenfahrzeug). Für A6 ausreichend, für größere Formate nicht.
- **Dunkle Vollflächen:** Empfehlung Bilderdruck matt mit Soft-Touch- oder Mattfolie – verhindert Fingerabdrücke und Kantenabrieb auf Schwarz.
- **Editieren:** Karten und Flyer enthalten echten Text. Zum Bearbeiten der SVG die Schriften *Geist* (`brand/fonts/`) und *Instrument Serif* (`src/app/fonts/`, beide SIL Open Font License) installieren – sonst zeigt das Grafikprogramm eine Ersatzschrift. Die PDFs sind davon unabhängig.

## Heckscheiben-Aufkleber

- Die Produktionsdateien enthalten **schwarze Konturen ohne Hintergrund** (alle Texte als Pfade). Die Folienfarbe **Weiß** wird bei der Bestellung gewählt; die Vorschauen zeigen Weiß auf dunklem Glas.
- **Empfohlene Herstellung:** Digitaldruck bzw. Plot auf weißer Folie, außen auf die Scheibe geklebt. Für einen reinen **Folienplot** ist der QR-Code die Grenze: Er ist als weiße Fläche mit ausgesparten Modulen angelegt (Modulgröße 1,6 mm kompakt / 2,5 mm groß). Das lässt sich plotten und entgittern, ist aber aufwendig – im Zweifel die Werkstatt fragen oder den QR-Teil als gedruckten Aufkleber fertigen lassen.
- **Lesbarkeit:** Die Hauptzeile ist in der kompakten Größe rund 9 mm hoch (gut lesbar bis etwa 3–4 m), in der großen rund 15 mm (etwa 6 m). Der QR-Code ist für das Scannen am geparkten Fahrzeug gedacht, nicht für den fließenden Verkehr.
- **Zulässigkeit:** Der Aufkleber darf die Sicht des Lenkers nicht beeinträchtigen. Bitte so anbringen, dass das Sichtfeld nach hinten frei bleibt (unterer Scheibenrand, außerhalb des Wischerfelds), und die österreichischen kraftfahrrechtlichen Vorschriften zur Verglasung (KFG/KDV) vorab prüfen – z. B. bei ÖAMTC, ARBÖ oder der Werkstatt. Das ist hier **nicht** rechtlich geprüft.

## Gutscheine auf den Drucksachen

| Code | Drucksache | Bedingungen (gedruckt und im System identisch) |
| --- | --- | --- |
| `NEU20` | Flyer | 20 € ab 119 € Auftragswert, nur erste Buchung, einmal je Kunde, online einlösbar, keine Barablöse |
| `DANKE20` | Dankeskarte | 20 € ab 119 € Auftragswert, einmal je Kunde, online einlösbar, keine Barablöse |

Beide Codes sind im Buchungssystem angelegt und im Admin-Bereich unter **Gutscheine** änderbar. Wer dort Betrag oder Mindestwert ändert, muss die Drucksachen anpassen – gedruckte Bedingungen gelten gegenüber Kunden. Kein künstliches Ablaufdatum: Die Aktion läuft, bis sie im Admin-Bereich beendet wird.

**Kalkulation:** Mit Einführungspreis kostet das günstigste einlösbare Paket 119 € (Innenraum Premium, Kleinwagen) – mit Gutschein 99 €. Der zusätzliche Nachlass beträgt damit höchstens 16,8 %; beim Komplettpaket (ab 199 €) rund 10 %. Pakete unter 119 € sind nur zusammen mit Zusatzleistungen einlösbar.

## Canva

Die Drucksachen sind zusätzlich als Seiten im Canva-Design „RM Mobile Auto Aufbereitung – Drucksachen“ abgelegt, sofern im Abschlussbericht nichts anderes steht. Maßgeblich für den Druck bleiben die Dateien in diesem Ordner.
