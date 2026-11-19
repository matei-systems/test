# RM6 Autoaufbereitung – Werbemittel-Kollektion

Alle Werbemittel der Kampagne, erzeugt aus editierbaren HTML-Quellen mit dem Kampagnen-Generator in `scripts/campaign/`.
Die vollständige Liste mit Format, Status, Gründen, QR-Zielen und Dateilinks steht in **[WERBEMITTEL_LISTE.md](WERBEMITTEL_LISTE.md)**.

## Dokumente in diesem Ordner

| Datei | Inhalt |
| --- | --- |
| [WERBEMITTEL_LISTE.md](WERBEMITTEL_LISTE.md) | Jedes Werbemittel mit Status, Gründen und Dateien (automatisch erzeugt) |
| [RECHT_UND_PRODUKTION_PRUEFLISTE.md](RECHT_UND_PRODUKTION_PRUEFLISTE.md) | Was vor Druck, Montage und Veröffentlichung zu klären ist (Graz/Steiermark, mit Quellen) |
| [RM6_WERBETEXTE_COPYDECK.md](RM6_WERBETEXTE_COPYDECK.md) | 30 Headlines, 20 Slogans, 10 Claims, 10 Aktionstexte, 10 Captions, 10 Flyer-Headlines, 10 CTAs, 5 Saisonkonzepte |
| [CANVA_HINWEISE.md](CANVA_HINWEISE.md) | Welche Dateien in Canva liegen und wie Sie sie dort bearbeiten |
| `manifest.json` / `zahlen.json` | Maschinenlesbare Liste und Zählung (Grundlage der Werbemittel-Liste) |

Die Markenrichtlinien (Farben mit HEX/RGB/CMYK, Schriften, Logo-Regeln, Bildsprache, Konzepte A–D) stehen als 10-seitiges PDF in
`01_BRAND_GUIDELINES/` bzw. `17_PRINT_READY_EXPORTS/01_BRAND_GUIDELINES/`.

## Ordnerstruktur

| Ordner | Inhalt |
| --- | --- |
| `01_BRAND_GUIDELINES` | Markenrichtlinien (HTML + Vorschau), Schriften mit OFL-Lizenzen |
| `02_BANNER` … `10_FAHRZEUGWERBUNG` | Druckwerbemittel: je Design die HTML-Quelle, ein Vorschau-JPG und bei Entwürfen das Entwurfs-PDF |
| `11_INSTAGRAM` … `14_WEBSITE_ONLINE` | Digitale Designs (HTML-Quellen) |
| `15_ANIMATIONEN_VIDEOS` | 6 MP4-Videos (5/6/10/15 s) mit HTML-Quelle und Standbild |
| `16_BILDER_ASSETS` | Logo, Fotos, Demo-Bilder – siehe [BILDQUELLEN.md](../16_BILDER_ASSETS/BILDQUELLEN.md) |
| `17_PRINT_READY_EXPORTS` | **Nur technisch geprüfte Druck-PDFs**, je in RGB und CMYK |
| `18_SOCIAL_MEDIA_EXPORTS` | Fertige JPG/PNG für Instagram, Facebook, Google, Screens, Website, Display-Ads, WhatsApp |
| `19_MOCKUPS_VORSCHAUEN` | 10 Mockups (als Visualisierung gekennzeichnet) und 6 Übersichtsblätter |
| `20_README_UND_PRODUKTIONSHINWEISE` | Diese Dokumentation |

## Dateinamen und Status

`RM6_<WERBEMITTEL>_<FORMAT>_<KONZEPT>_<ZUSATZ>` – Konzept **A** Black & Gold, **B** Performance, **C** Elite Detailing, **D** Aktion/Local Impact.

| Endung | Bedeutung |
| --- | --- |
| `_PRINT.pdf` / `_PRINT_CMYK.pdf` | **Druckfertig (technisch geprüft):** Format, Beschnitt, Bildauflösung und QR-Code wurden geprüft. Liegt in `17_PRINT_READY_EXPORTS`. |
| `_ENTWURF.pdf` | Entwurf: Ein Grund steht in der Werbemittel-Liste (z. B. fehlendes Impressum, unbekannte Anzeigenmaße, zu geringe Fotoauflösung). Nicht drucken. |
| `_GRAU.pdf` | Schwarz-Weiß-Fassung der Zeitungsanzeigen (Entwurf, Mediadaten fehlen). |
| `_VORSCHAU.jpg` | Bildschirmvorschau, nicht für den Druck. |

„Druckfertig (technisch geprüft)“ ist keine inhaltliche Freigabe. Preise, Texte, Domain und Impressum geben Sie frei.

## Technische Prüfung (tatsächlich durchgeführt)

- **Format und Beschnitt:** TrimBox/BleedBox in jedem Druck-PDF gesetzt; Stichproben mit `pdfinfo -box` geprüft (z. B. Visitenkarte 85 × 55 mm + 3 mm, Zaunbanner 300 × 100 cm + 1 cm).
- **Layout und Sicherheitsabstand:** Bei jedem Design wird gemessen, ob alle Texte, QR-Codes und das Logo innerhalb des Endformats
  liegen und den Sicherheitsabstand einhalten (3 mm kleine Drucksachen, 5 mm Plakate, 30 mm Banner/große Schilder). Passt es nicht,
  verkleinert der Generator die Schriftgrößen schrittweise (Hinweis in der Werbemittel-Liste); reicht das nicht, wird das Design
  zum Entwurf. Diese Prüfung kam bei der Endkontrolle hinzu: Sie hat abgeschnittene QR-Codes auf den Preislisten und zu knappe
  Ränder bei Postern und Aufstellern gefunden, die damit behoben sind. Einzeln ausführbar mit `npm run campaign:check`.
- **QR-Codes:** im Generator jeder QR-Code gelesen; zusätzlich alle druckfertigen CMYK-PDFs gerastert und die QR-Codes daraus
  ausgelesen, ebenso die Endbilder der Videos. Ziel jeweils wie vorgesehen.
- **Bildauflösung:** für jedes Foto und das Logo aus der Platzierung berechnet; Grenzwerte 150 dpi (Nahbetrachtung), 100 dpi (Poster), 60 dpi (Großformat). Unterschreitung ⇒ automatisch Entwurf.
- **CMYK:** alle 51 `_PRINT_CMYK.pdf` enthalten nur CMYK-/Graubilder; der Mischfarbraum der Transparenzgruppen ist auf DeviceCMYK gesetzt (keine DeviceRGB-Verweise mehr). Kein formales PDF/X-4, kein Druckerei-Profil (siehe Prüfliste F).
- **Inhalte:** Preise in allen druckfertigen PDFs und digitalen Designs gegen den Katalog abgeglichen (keine Abweichung; Katalog zuvor mit der Live-Preisseite verglichen). Einzige Telefonnummer: 0664 123 93 83 (aus `RM6_HECKSCHEIBE_DRUCK/masse.json`). Keine E-Mail-Adressen, keine Platzhalter in druckfertigen Dateien.
- **Markenname:** keine alten Markennamen in Quellen, Texten und PDFs. `glanzmobil.vercel.app` kommt nur als technische QR-Zieladresse vor. Das Wort „Glanz“ in der Headline „Glanz, der zu Ihnen kommt.“ ist ein normales Wort, kein Markenname.
- **Rechtschreibung:** alle sichtbaren Texte mit `hunspell` (de_AT) geprüft; gemeldet wurden nur Eigennamen, Fachbegriffe und Komposita, keine Fehler.

## Neu erzeugen

```bash
node scripts/campaign/build.mjs              # alle Designs (Filter möglich, z. B. "VISITENKARTE"; --no-cmyk = schneller)
node scripts/campaign/animate.mjs            # Videos (braucht ffmpeg)
node scripts/campaign/mockups.mjs            # Mockups
node scripts/campaign/contact-sheets.mjs     # Übersichtsblätter
node scripts/campaign/docs.mjs               # Werbemittel-Liste und Zählung
```

Oder per npm: `npm run campaign:build`, `campaign:animate`, `campaign:mockups`, `campaign:sheets`, `campaign:docs`.
Voraussetzungen: Node, das installierte Playwright-Chromium, Ghostscript (`gs`) für CMYK, `ffmpeg` für Videos.
Alle Unternehmensdaten stehen zentral in `scripts/campaign/config.mjs` (`FACTS`, Pakete, Preise, Gutscheine).

## Vor dem ersten Druck (blockierend)

1. **Domain rm6.at registrieren und verbinden.** Sie ist derzeit nicht registriert, steht aber auf allen Werbemitteln. Danach in
   `config.mjs` `qrBooking` auf `https://rm6.at/buchen` umstellen und `build.mjs` neu ausführen. Gedruckte QR-Codes lassen sich nicht ändern.
2. **Impressum auf Flyern** (Medieninhaber, Hersteller, Herstellungsort) – deshalb sind alle 9 Flyer Entwürfe.
3. **E-Mail-Adresse, Inhaber, Anschrift, UID/Kleinunternehmer** für Briefpapier, Angebot, Rechnung, Auftragsbestätigung.
4. Fehlt außerdem: Google-Bewertungslink, Ablauf für Wert-/Geschenkgutscheine, Treueprogramm-Regeln, echte Vorher-Nachher-Fotos,
   hochaufgelöste Fotos (≥ 6.000 px) für Großformate mit Foto, Vektorfassung des Logos, Mediadaten der Zeitungen, Fahrzeugmaße.

Politur, Lackkorrektur und Keramikversiegelung werden in keinem Werbemittel als buchbare Leistung beworben.

## Empfehlung für den ersten Einsatz (nach Punkt 1)

1. Visitenkarte A Schwarz-Gold (`06_VISITENKARTEN`)
2. Klappaufsteller A1, Vorder- und Rückseite (`03_SCHILDER_AUFSTELLER`)
3. Zaunbanner 300 × 100 A Black & Gold (`02_BANNER`) – Anzeige-/Bewilligungspflicht prüfen
4. Preisliste A4 (`08_PREISLISTEN_ANGEBOTE`) und Dankeskarte DANKE20 (`07_GUTSCHEINE_KUNDENKARTEN`) für jeden Auftrag
5. Flyer A5 Image A – nach Eintragen des Impressums
6. Digital: Instagram-Set (Feed A/C/D, Story NEU20, Karussell), Google-Profil-Bilder, Facebook-Titelbild, Screen 1920 × 1080 A, Spot 15 s
