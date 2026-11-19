# RM6 Autoaufbereitung – Heckscheiben-Werbung: Druckanleitung

Motiv: **RM6 · AUTOAUFBEREITUNG · PREMIUM FAHRZEUGPFLEGE · 0664 123 93 83 · rm6.at**
Ausführung: einfarbig **Weiß (#FFFFFF)** auf transparentem Untergrund, ohne Hintergrund, alle Texte in Pfade umgewandelt.

## Dateien

| Datei | Wofür |
| --- | --- |
| `RM6_Heckscheibe_Druck.svg` | Hauptdatei: reine Vektorpfade, Maße in mm, verlustfrei skalierbar |
| `RM6_Heckscheibe_Druck.pdf` | Dieselbe Grafik als Vektor-PDF (Weiß als RGB #FFFFFF), z. B. für den **Folienplot** |
| `RM6_Heckscheibe_Weissdruck_Sonderfarbe.pdf` | Dieselbe Grafik, Weiß als **Sonderfarbe „White“** – für Digitaldruck mit Weiß auf transparenter Folie |
| `RM6_Heckscheibe_Transparent.png` | Pixelbild mit echtem Alphakanal, 300 dpi im Endmaß (Ansicht, Angebot, Social Media) |
| `masse.json` | Maße, Sicherheitsabstand, Sonderfarbname und Texte – hier ändern, dann `npm run heckscheibe` |
| `vorschau/` | Ansichten auf dunkler und heller Scheibe, Vergleich der Entwürfe – **nicht drucken** |
| `entwuerfe/` | Die drei Entwurfsrichtungen A, B, C als SVG (zum Vergleich) |
| `optional/` | Variante in Schwarz für sehr helle Scheiben (siehe „Kontrast“) |
| `pruefprotokoll.json` | Ergebnis der automatischen Prüfung |

**Hinweis zur Ansicht:** Weiß auf transparentem Hintergrund ist in vielen Programmen und Browsern auf weißem Grund unsichtbar. Das ist kein Fehler – zum Ansehen die Vorschaubilder verwenden.

## Maße (aktuell)

**70,0 × 22,7 cm** (inkl. 10 mm Sicherheitsabstand rundum).

| Element | Versalhöhe | grobe Lesedistanz* |
| --- | --- | --- |
| RM6 | 7,3 cm | 22–36 m |
| Telefonnummer | 4,5 cm | 14–23 m |
| Website | 3,0 cm | 9–15 m |
| AUTOAUFBEREITUNG | 1,5 cm | 4–7 m |
| PREMIUM FAHRZEUGPFLEGE | 0,8 cm | 2–4 m |

\* Gängige Faustregel der Schilderbranche: etwa 3–5 m Lesedistanz je Zentimeter Buchstabenhöhe – bei gutem Kontrast und Licht, ohne Bewegung. Im fließenden Verkehr und bei hellem Glas deutlich weniger.

**Andere Größe:** In `masse.json` `breite_mm` (und bei Bedarf `max_hoehe_mm`) eintragen und `npm run heckscheibe` ausführen – alle Dateien, Maße und diese Anleitung werden neu erzeugt und erneut geprüft. Alternativ die SVG/PDF in jedem Grafikprogramm **proportional** skalieren. Empfehlung: nicht schmaler als etwa 50 cm, damit die Telefonnummer mindestens rund 3 cm hoch bleibt.

## Entwürfe und Auswahl

Alle Varianten im selben Rahmen verglichen (höchstens 80 × 30 cm, Werte = Versalhöhe):

| Variante | Hierarchie wie gewünscht | Format | RM6 | Telefon | Website | kleinste Zeile |
| --- | --- | --- | --- | --- | --- | --- |
| A – Zentriert | ja | 588 × 300 mm | 83 mm | 52 mm | 30 mm | 9.4 mm |
| B – Split | nein – Kontakt rechts neben der Marke | 800 × 161 mm | 75 mm | 43 mm | 24 mm | 10.0 mm |
| C – Band | teilweise – AUTOAUFBEREITUNG neben RM6 | 800 × 213 mm | 77 mm | 54 mm | 32 mm | 10.8 mm |
| **Final – A perfektioniert** | ja | 800 × 257 mm | 84 mm | 52 mm | 34 mm | 9.5 mm |

- **A – Zentriert** folgt exakt der gewünschten Hierarchie und ist symmetrisch, wird mit der Website unter der Nummer aber sehr hoch (bei 70 cm Breite rund 35 cm).
- **B – Split** ist flach, hat aber die kleinste Telefonnummer, und die Kontaktdaten stehen neben statt unter der Marke.
- **C – Band** bringt die größte Telefonnummer, setzt AUTOAUFBEREITUNG jedoch neben RM6 – weicht also von der Hierarchie ab.

**Gewählt: A, perfektioniert (Final).** Die Website steht rechts neben der Telefonnummer, getrennt durch einen Punkt, auf derselben Grundlinie. Dadurch wird der Aufkleber deutlich flacher als A, ohne die Hierarchie aufzugeben: oben RM6 mit dem Glanzpunkt an der „6“, darunter AUTOAUFBEREITUNG, in der Mitte PREMIUM FAHRZEUGPFLEGE zwischen feinen Linien mit Punkten, unten die Telefonnummer als breiteste Zeile. Die Linien nehmen exakt die Breite der Kontaktzeile auf; alles ist auf eine Mittelachse ausgerichtet.
Ist die Scheibe besonders niedrig, ist C die Alternative (`entwuerfe/RM6_Entwurf_C_Band.svg`).

## Herstellung – zwei Wege

### 1. Empfohlen: Folienplot (Schneideplot) aus weißer Folie
Die Buchstaben werden aus weißer Klebefolie geschnitten, entgittert und mit Übertragungsfolie geliefert. Es gibt **keinen Hintergrund und keinen Weißdruck** – genau das gewünschte Ergebnis „nur Weiß auf der Scheibe“, sehr haltbar.
- Datei: `RM6_Heckscheibe_Druck.svg` oder `RM6_Heckscheibe_Druck.pdf` (die Pfade sind die Schneidkonturen).
- Folie: weiße **gegossene (Cast-)Folie** für Außenanwendung; für gewölbte Heckscheiben besonders geeignet.
- Kleinste Details: dünnster Schriftstrich ca. 1.3 mm, Linien 1.6 mm, Punkte Ø 5.0 mm – nach üblicher Erfahrung plot- und entgitterbar; **von der Werbetechnik bestätigen lassen**.

### 2. Digitaldruck auf transparenter Folie (nur mit Weißdruck)
Normale Drucker drucken kein Weiß: Eine PNG- oder CMYK-Datei ergibt auf transparenter Folie **keine weiße Schrift**. Nötig ist ein Drucker mit weißer Tinte (Weiß als Sonderfarbe), meist mit Konturschnitt.
- Datei: `RM6_Heckscheibe_Weissdruck_Sonderfarbe.pdf` – alle Flächen in der Sonderfarbe **„White“** (100 %).
- Den genauen **Namen der Weiß-Sonderfarbe gibt die Druckerei vor** (z. B. White, Weiss, Spot_White, RDG_WHITE). In `masse.json` → `weiss_sonderfarbe_name` anpassen und neu erzeugen.
- Ob ein- oder mehrfach Weiß gedruckt wird (Deckkraft), entscheidet die Druckerei.

## Was die Druckerei noch bestätigen muss

Diese Punkte sind **nicht** freigegeben, nur vorbereitet:
1. Herstellungsweg (Folienplot oder Weißdruck) und das gewünschte Dateiformat.
2. Bei Weißdruck: Name und Anlage der Weiß-Sonderfarbe.
3. Folientyp, Außenhaltbarkeit und Eignung für die gewölbte Heckscheibe (und Heckscheibenheizung).
4. Mindestdetailgrößen fürs Schneiden und Entgittern.
5. Endmaß – vorher an der Scheibe nachmessen (sichtbarer Glasbereich ohne Siebdruckrand, Wischerbereich aussparen).

## Kontrast: dunkle und helle Scheiben

Weiß wirkt am stärksten auf **getönten oder dunklen** Scheiben (`vorschau/RM6_Vorschau_dunkle_Scheibe.png`). Auf **hellem, ungetöntem** Glas mit hellem Innenraum oder Himmelsspiegelung sinkt der Kontrast deutlich (`vorschau/RM6_Vorschau_helle_Scheibe.png`). Das Motiv nutzt deshalb nur kräftige Schnitte und keine Haarlinien. Ist die Scheibe sehr hell, ist eine Ausführung in Schwarz oder Anthrazit lesbarer – vorbereitet in `optional/`.

## Montage

Außen auf die saubere, fettfreie Scheibe kleben (Verarbeitungstemperatur laut Folienhersteller, meist ab ca. 10 °C). Nicht in den Wischerbereich – der Wischer hebt mit der Zeit die Kanten an. Auf ausreichende Sicht nach hinten achten.

## Rechtliches (Österreich) – bitte vor dem Kleben prüfen

Die Sicht nach hinten darf nicht unzulässig eingeschränkt werden. Für Folien auf der Heckscheibe (Tönungs- und Lochfolien) verlangen die Landesbehörden u. a. **zwei Außenrückspiegel**, außerdem gelten Regeln zu typengenehmigten Scheibenfolien. Ob und wie diese Regeln für geplottete Beschriftungen gelten, ist hier **nicht rechtlich geprüft** – bitte bei der Landesprüfstelle, dem ÖAMTC oder der Werbetechnik nachfragen.
