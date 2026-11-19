# RM6 Autoaufbereitung – Drucksachen

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
| `website` | Visitenkarte, Flyer | eingetragen: `rm6.at` |
| `medieninhaber` | Flyer (Impressumszeile) | `[Name, Ort]` |
| `buchungsUrl` | alle QR-Codes | zeigt derzeit auf `https://glanzmobil.vercel.app/buchen` (technische Vercel-Adresse, bis rm6.at verbunden ist) |

**Wichtig zu den QR-Codes:** Sie führen auf die aktuelle Live-Adresse. rm6.at ist noch nicht mit dem Hosting verbunden; sobald die Domain funktioniert, `buchungsUrl` auf `https://rm6.at/buchen` ändern und neu erzeugen – ein gedruckter QR-Code lässt sich nachträglich nicht mehr ändern. Bis dahin nicht drucken, wenn die Karten lange im Umlauf bleiben sollen.

## Dateien

| Motiv | Endformat | Dateien (jeweils `.svg` + `.pdf`, Vorschau in `previews/`) |
| --- | --- | --- |
| Visitenkarte **A „Logo zentriert“** (Empfehlung) | 85 × 55 mm | `visitenkarte/visitenkarte-a-vorderseite`, `…-a-rueckseite` |
| Visitenkarte B „Zeile“ | 85 × 55 mm | `visitenkarte/visitenkarte-b-vorderseite`, `…-b-rueckseite` |
| Flyer | DIN A6, 105 × 148 mm | `flyer-a6/flyer-a6-vorderseite`, `…-rueckseite` |
| Dankeskarte | 85,6 × 54 mm (Bankkarte) | `dankeskarte/dankeskarte-vorderseite`, `…-rueckseite` |
| Heckscheiben-Werbung (weiß auf transparent) | 70 × 22,7 cm, anpassbar | eigener Ordner `RM6_HECKSCHEIBE_DRUCK/` (`npm run heckscheibe`) |
| Logo, Farben, Schriften | – | `brand-assets/` |

**Warum Visitenkarte A?** Das große, zentrierte RM6-Logo ist das stärkste Wiedererkennungsmerkmal der Marke und wirkt auf der kleinen Fläche am ruhigsten. Variante B stellt den Slogan in den Mittelpunkt und eignet sich, wenn die Karte vor allem die Leistung erklären soll.

## Technische Prüfung (bei jedem Erzeugen automatisch)

- **Format und Beschnitt:** Karten und Flyer haben 3 mm Beschnitt umlaufend; die PDF-Seiten entsprechen Endformat + Beschnitt, `TrimBox` und `BleedBox` sind gesetzt. Texte halten mindestens 3,5 mm Abstand zum Endformat.
- **Schrift:** kleinste Schriftgröße auf Karten und Flyer 2,1 mm (≈ 6 pt).
- **QR-Codes:** werden nach dem Rendern aus der PNG-Vorschau zurückgelesen und mit der Zieladresse verglichen – stimmt etwas nicht, bricht das Skript ab. Standard-Polarität (dunkle Module auf heller Fläche), Fehlerkorrektur M, Ruhezone 4 Module.
- **Logo:** ausschließlich die gelieferte Logo-Datei (`brand/logo/RM6_Autoaufbereitung_Logo_transparent.png`), eingebettet mit mindestens 600 dpi im Endformat, Seitenverhältnis unverändert.
- **Vektor:** Texte, Linien und QR-Codes sind Vektor mit eingebetteten Schriften; Pixelgrafiken sind nur das Logo (es liegt nur als PNG vor) und das Foto auf der Flyer-Vorderseite.

## Was die Druckerei wissen muss – und was noch zu prüfen ist

- **Farbraum RGB, nicht CMYK.** Die verwendeten Werkzeuge erzeugen kein CMYK-PDF. Online-Druckereien wandeln RGB in der Regel automatisch um; das tiefe Schwarz (`#0B0B0C`) und der Champagner-Ton (`#C8B48A`) können im Druck leicht abweichen. Für farbverbindliche Ergebnisse einen Proof bestellen oder die SVG-Dateien von der Druckerei/einem Grafiker in CMYK anlegen lassen.
- **Flyer-Foto:** ca. 250 dpi im Endformat (generiertes Markenbild, kein Kundenfahrzeug). Für A6 ausreichend, für größere Formate nicht.
- **Dunkle Vollflächen:** Empfehlung Bilderdruck matt mit Soft-Touch- oder Mattfolie – verhindert Fingerabdrücke und Kantenabrieb auf Schwarz.
- **Editieren:** Karten und Flyer enthalten echten Text. Zum Bearbeiten der SVG die Schriften *Geist* (`brand/fonts/`) und *Instrument Serif* (`src/app/fonts/`, beide SIL Open Font License) installieren – sonst zeigt das Grafikprogramm eine Ersatzschrift. Die PDFs sind davon unabhängig.

## Heckscheiben-Werbung

Die frühere Aufkleber-Serie mit altem Logo wurde entfernt. Die aktuelle Heckscheiben-Werbung für RM6 Autoaufbereitung liegt in `RM6_HECKSCHEIBE_DRUCK/` (Vektor, weiß auf transparent, mit Druckanleitung). Sie enthält den Schriftzug als Pfade, nicht das farbige Logo: Chrom- und Goldverläufe lassen sich nicht als einfarbige Folie plotten.

## Gutscheine auf den Drucksachen

| Code | Drucksache | Bedingungen (gedruckt und im System identisch) |
| --- | --- | --- |
| `NEU20` | Flyer | 20 € ab 119 € Auftragswert, nur erste Buchung, einmal je Kunde, online einlösbar, keine Barablöse |
| `DANKE20` | Dankeskarte | 20 € ab 119 € Auftragswert, einmal je Kunde, online einlösbar, keine Barablöse |

Beide Codes sind im Buchungssystem angelegt und im Admin-Bereich unter **Gutscheine** änderbar. Wer dort Betrag oder Mindestwert ändert, muss die Drucksachen anpassen – gedruckte Bedingungen gelten gegenüber Kunden. Kein künstliches Ablaufdatum: Die Aktion läuft, bis sie im Admin-Bereich beendet wird.

**Kalkulation:** Mit Einführungspreis kostet das günstigste einlösbare Paket 119 € (Innenraum Premium, Kleinwagen) – mit Gutschein 99 €. Der zusätzliche Nachlass beträgt damit höchstens 16,8 %; beim Komplettpaket (ab 199 €) rund 10 %. Pakete unter 119 € sind nur zusammen mit Zusatzleistungen einlösbar.

## Canva

Die Drucksachen liegen derzeit nur als Dateien in diesem Ordner vor, nicht in Canva (die älteren Canva-Designs zeigen noch das frühere Logo). Die SVG-Dateien lassen sich in Canva hochladen; maßgeblich für den Druck sind die PDFs.
