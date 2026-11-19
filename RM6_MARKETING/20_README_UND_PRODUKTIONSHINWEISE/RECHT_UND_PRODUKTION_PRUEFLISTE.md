# Prüfliste vor Druck, Montage und Veröffentlichung

**Wichtig:** Diese Liste ist eine Orientierung aus öffentlich zugänglichen Quellen, **keine Rechtsberatung** und nicht anwaltlich
geprüft. Eine gestalterisch mögliche Werbefläche ist nicht automatisch eine genehmigungsfähige Werbefläche. Vor Montage bzw.
Veröffentlichung bitte bei den genannten Stellen nachfragen.

## A. Blockierende Punkte (gelten für fast alle Werbemittel)

| # | Punkt | Warum | Was zu tun ist |
| --- | --- | --- | --- |
| 1 | **Domain rm6.at ist (Stand Prüfung) nicht registriert** | Alle Werbemittel nennen rm6.at. Solange die Domain nicht Ihnen gehört und verbunden ist, führt sie ins Leere – und Dritte könnten sie registrieren. | rm6.at registrieren, mit dem Vercel-Projekt verbinden, dann in `scripts/campaign/config.mjs` `qrBooking` auf `https://rm6.at/buchen` stellen und `node scripts/campaign/build.mjs` ausführen. Erst danach drucken. |
| 2 | **QR-Codes zeigen derzeit auf die technische Vercel-Adresse** | Funktioniert heute, wird aber nach Domainumstellung ersetzt; gedruckte QR-Codes lassen sich nicht ändern. | Nach Punkt 1 neu erzeugen (ein Befehl). |
| 3 | **Impressum auf Flyern** (§ 24 MedienG) | Flyer/Prospekte sind Medienwerke: Medieninhaber, Hersteller und Herstellungsort sind anzugeben. Platzhalter sind in den Flyern rot markiert. | Name/Anschrift (Medieninhaber) und Druckerei/Herstellungsort eintragen. |
| 4 | **Unternehmensangaben** (Briefpapier, Angebot, Rechnung) | Inhaber, Anschrift, UID bzw. Kleinunternehmer-Hinweis, ggf. Firmenbuch fehlen. | Daten liefern; Rechnungsvorlage mit Steuerberater prüfen. |
| 5 | **E-Mail-Adresse** | Fehlt auf Visitenkarten und Briefpapier; wird auch für die persönliche Terminbestätigung gebraucht. | Adresse festlegen und in Admin → Einstellungen eintragen. |

Quellen MedienG: [WKO – Das korrekte Impressum für Flyer (PDF)](https://wko.at/oe/internetrecht/das-korrekte-impressum-flyer.pdf),
[WKO Steiermark – Impressumvorschriften im Printbereich](https://www.wko.at/stmk/information-consulting/druck/impressum-vorschriften-auswirkung-auf-den-printbereich),
[USP – Impressumspflicht gemäß § 24 Mediengesetz](https://www.usp.gv.at/brancheninformationen/information-und-kommunikation/impressumspflicht-gemaess-para-24-mediengesetz.html),
[§ 24 MedienG (jusline)](https://www.jusline.at/gesetz/medieng/paragraf/24.pdf).

## B. Außenwerbung

| Werbemittel | Prüfpunkt | Zuständig / Quelle |
| --- | --- | --- |
| **Aufsteller/Kundenstopper auf Gehsteigen** | Nutzung öffentlichen Gutes zu verkehrsfremden Zwecken ist nach § 82 StVO bewilligungspflichtig; in Graz ggf. zusätzlich Gebrauchsabgabe. Der Grazer Gemeinderat hat sich zu mobilen Großplakatständern auf städtischem Grund restriktiv positioniert. | Straßenamt Graz (Europaplatz 20, 8020 Graz) – aktuelles Formular und Gebühren erfragen. [USP – Straßenbenützung zu verkehrsfremden Zwecken](https://www.usp.gv.at/themen/betrieb-und-umwelt/transport-und-verkehr/weitere-informationen-transport-und-verkehr/strassenbenuetzung-verkehrsfremde-zwecke-bewilligung.html), [Gemeinderatsantrag Graz (PDF)](https://www.graz.at/cms/dokumente/10372881_8106610/8c5f839b/02_OEVP.pdf) |
| **Aufsteller/Schilder auf Privatgrund** | Zustimmung des Grundeigentümers. Sichtbarkeit von der Straße: siehe Zeile Banner. | Grundeigentümer, Gemeinde |
| **Zaun- und Grundstücksbanner** | Stmk. Baugesetz: Werbe- und Ankündigungseinrichtungen an bestehenden baulichen Anlagen bis gesamt 2 m² sind (vorbehaltlich Gemeindeverordnung) **anzeigepflichtig**, größere Anlagen ggf. bewilligungspflichtig. Ortsbildschutz (in Graz u. a. Altstadtschutz) beachten. | Baubehörde der Gemeinde (in Graz: Bau- und Anlagenbehörde). [RIS Stmk. BauG § 21](https://www.ris.bka.gv.at/eli/lgbl/ST/1995/59/P21/LST40017003), [jusline § 21 Stmk. BauG](https://www.jusline.at/gesetz/stmk_baug/paragraf/21.pdf) |
| **Banner außerhalb des Ortsgebiets** | § 84 StVO: Werbungen und Ankündigungen an Straßen außerhalb von Ortsgebieten innerhalb von 100 m vom Fahrbahnrand sind grundsätzlich verboten (Ausnahmebewilligung nur eng). Aufstellen vor Bewilligung ist unzulässig. | Bezirkshauptmannschaft. [§ 84 StVO (gesetzefinden)](https://gesetzefinden.at/bundesrecht/bundesgesetze/stvo-1960/para-84), [§ 84 StVO (jusline)](https://www.jusline.at/gesetz/stvo/paragraf/84.pdf) |
| **Außenwerbung an Gebäuden** | Wie Banner (Baurecht, Ortsbild); bei Mietobjekten Zustimmung des Vermieters/der Eigentümergemeinschaft. | Baubehörde, Vermieter |

## C. Fahrzeugwerbung

| Prüfpunkt | Hinweis |
| --- | --- |
| Beschriftung am eigenen, zugelassenen Betriebsfahrzeug | Grundsätzlich üblich; keine Verwechslung mit Einsatzfahrzeugen, keine reflektierenden Warnfarben in Verbindung mit Blaulicht-Anmutung. |
| **Abstellen eines Fahrzeugs/Anhängers vorwiegend zu Werbezwecken** auf öffentlicher Straße | Kann nach § 82 StVO bewilligungspflichtig sein (Rechtsprechung zu Werbeanhängern). Das Werbefahrzeug nicht als „Plakatständer“ dauerhaft parken. [USP – Straßenbenützung](https://www.usp.gv.at/themen/betrieb-und-umwelt/transport-und-verkehr/weitere-informationen-transport-und-verkehr/strassenbenuetzung-verkehrsfremde-zwecke-bewilligung.html), [§ 82 StVO (RIS)](https://www.ris.bka.gv.at/eli/bgbl/1960/159/P82/NOR12146677) |
| Folien auf Scheiben | Sichtfeld und Fahrzeugverglasung (KFG/KDV) prüfen – siehe `RM6_HECKSCHEIBE_DRUCK/DRUCKANLEITUNG.md`. |
| Leasing-/Firmenfahrzeug | Zustimmung des Eigentümers/Leasinggebers für Folierung. |
| Maße | Alle Fahrzeuglayouts sind **skalierbare Entwürfe**: Flächen (Türen, Heckklappe, Seiten) am realen Fahrzeug aufmessen und vom Folierer freigeben lassen. |

## D. Zeitungsanzeigen

- Die Anzeigen liegen als **neutrale Ausgangsformate** vor (ganzseitig 230 × 310, halbseitig 230 × 150, Viertel 112 × 150 bzw.
  230 × 73, Achtel 112 × 73, kompakt 54 × 90 mm, jeweils 4c und Schwarz-Weiß).
- Die tatsächlichen Formate, Spaltenbreiten, Druckverfahren (Rasterweite, Farbprofil, maximaler Farbauftrag) und Anlieferfristen
  der Kleinen Zeitung, der regionalen Wochenzeitungen oder Gemeindezeitungen wurden **nicht** verbindlich ermittelt (keine
  öffentlichen Mediadaten gefunden). Vor Buchung Mediadaten anfordern und Dateien anpassen lassen.
- Rechtlich: als Werbung erkennbar gestalten; Preisangaben wie auf der Website (Einführungspreis mit regulärem Preis).

## E. QR-Codes, Kontaktformulare, Datenschutz

| Prüfpunkt | Hinweis |
| --- | --- |
| QR-Ziel | Führt auf die Buchungsseite (mit Datenschutzerklärung, ohne Tracking-Cookies). Gutschein-QR-Codes enthalten nur den Code-Parameter, keine personenbezogenen Daten. |
| Kontaktformular/Buchung | Datenschutzerklärung (Website) ist als Entwurf markiert und rechtlich zu prüfen; Auftragsverarbeitungsverträge mit Hosting, Datenbank und E-Mail-Anbieter abschließen (siehe `docs/offene-angaben.md`). |
| Newsletter/E-Mail-Werbung | Nur mit ausdrücklicher Einwilligung (§ 174 TKG 2021); das Buchungsformular hat dafür ein freiwilliges Häkchen. |
| Bewertungen | Nur echte, freigegebene Bewertungen verwenden; keine gekauften oder geschönten Bewertungen. Die Bewertungs-Vorlagen sind als Entwurf markiert. |
| Vorher-Nachher | Die vorhandenen Bilder sind Demo-Visualisierungen und als solche gekennzeichnet; vor Veröffentlichung durch echte Fotos (mit Einverständnis, ohne Kennzeichen) ersetzen. |
| Unadressierte Verteilung | Hinweise „Bitte keine Werbung“ an Briefkästen respektieren. |

## F. Produktion

| Prüfpunkt | Hinweis |
| --- | --- |
| Farbmodus | Druck-PDFs liegen in CMYK (Ghostscript-Standardprofil) und RGB vor. Die Druckerei kann ein bestimmtes Profil (z. B. FOGRA39/51, PSO) verlangen – dann von der Druckerei konvertieren lassen; **Proof** anfordern, vor allem für Gold und Tiefschwarz. |
| PDF/X | Die Dateien sind saubere Druck-PDFs mit TrimBox/BleedBox, aber **nicht formal PDF/X-4 zertifiziert**. Falls verlangt: Preflight/Konvertierung bei der Druckerei. |
| Gold | Gold wird als CMYK-Verlauf gedruckt (kein Metallic). Für echten Metalleffekt: Heißfolie/Sonderfarbe bei der Druckerei anfragen (eigene Druckdatei nötig). |
| Logo-Auflösung | Logo nur als Pixelgrafik (2116 px). Für Banner > 90 cm Logobreite, Folienplott, Stickerei: Vektorfassung beauftragen. |
| Fotos | Vorhandene Motive (Canva-KI, ca. 1.700 px) reichen bis A3/A2. Für Banner mit Foto (Konzept B), A1/A0 mit Foto und Fahrzeugfolien: echtes Fotoshooting (≥ 6.000 px). |
| Banner | Saum und Ösen mit der Druckerei abstimmen; Sicherheitsabstand im Layout ≥ 4 cm (eingehalten). Windlast: Mesh-Banner für Zäune erwägen. |
| Druckfreigabe | „Druckfertig (technisch geprüft)“ bedeutet: Format, Beschnitt, Bildauflösung und QR geprüft. Inhaltliche Freigabe (Preise, Texte, Domain, Impressum) erteilen Sie. |
