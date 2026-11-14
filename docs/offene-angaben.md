# Offene Angaben und Prüfpunkte

Stand: November 2026. Diese Liste nennt alles, was **nur der Inhaber** ergänzen, entscheiden oder prüfen lassen kann.
Auf der Website sind fehlende Angaben in den Rechtstexten sichtbar als Platzhalter markiert; jede Rechtsseite trägt den Hinweis
„Entwurf – rechtlich nicht geprüft“. **Vor dem Start mit echten Kunden müssen die Punkte in Abschnitt 1 und 2 erledigt sein.**

## 1. Unternehmensdaten (Admin → Einstellungen)

Diese Felder sind leer. Sie erscheinen nach dem Eintragen automatisch in Impressum, Datenschutzerklärung, AGB, Kontaktseite, Footer,
E-Mails und den strukturierten Daten für Google.

| Angabe | Wofür | Status |
| --- | --- | --- |
| Vor- und Nachname des Inhabers | Impressum (§ 5 ECG, § 25 MedienG), Datenschutz, Visitenkarte | fehlt |
| Rechtsform (z. B. Einzelunternehmen) | Impressum | fehlt |
| Geschäftsanschrift (Straße, PLZ, Ort) | Impressum, Datenschutz | fehlt |
| Telefonnummer | Kontakt, Stornobedingungen, E-Mails, Drucksachen | fehlt |
| WhatsApp-Nummer | WhatsApp-Button erscheint erst, wenn eine Nummer eingetragen ist | fehlt |
| E-Mail-Adresse | Kontakt, Widerruf von Einwilligungen, Antwortadresse der E-Mails | fehlt |
| UID-Nummer bzw. Hinweis Kleinunternehmer | Impressum, AGB Punkt 5 | fehlt |
| Firmenbuchnummer/-gericht (falls eingetragen) | Impressum | fehlt |
| Gewerbe, Gewerbebehörde, Kammerzugehörigkeit (WKO) | Impressum | fehlt |
| Link zum Google-Bewertungsformular | Button „Bewertung abgeben“ | optional |

Für die Drucksachen dieselben Angaben in `marketing/config.json` eintragen und `npm run marketing` ausführen.

## 2. Entscheidungen, die in den Rechtstexten als Platzhalter stehen

| Wo | Was fehlt |
| --- | --- |
| AGB Punkt 2 | Vertragsabschluss und Beschriftung des Buchungsbuttons (§ 8 FAGG „Button-Lösung“) |
| AGB Punkt 4 | Regelung zu Wasser- und Stromanschluss am Standort; Zulässigkeit der mobilen Außenwäsche |
| AGB Punkt 5 | Zahlungsarten und Fälligkeit; Umsatzsteuer bzw. Kleinunternehmerregelung |
| AGB Punkt 6 | Gutscheinbedingungen |
| AGB Punkt 8 | Belehrung zum Rücktrittsrecht (FAGG) samt Muster-Widerrufsformular |
| AGB Punkt 9 | Haftungsregelung gegenüber Verbrauchern (KSchG) |
| AGB Punkt 10 | Gerichtsstand |
| Stornobedingungen | Stornogebühr bei später Absage; Gebühr bei Nichterscheinen bzw. nicht zugänglichem Fahrzeug |
| Datenschutz Punkt 2 und 4 | konkrete Löschfristen |
| Datenschutz Punkt 3 | E-Mail-Anbieter (SMTP) und Sitz |
| Datenschutz Punkt 7 | Hosting- und Datenbank-Anbieter, Serverstandort, Grundlage für Drittlandübermittlung (aktuell Vercel und Neon) |

## 3. Bitte fachlich oder rechtlich prüfen lassen

Nichts auf der Website wurde anwaltlich geprüft. Empfohlene Stellen: Rechtsanwalt, Wirtschaftskammer Steiermark (Gründerservice), Steuerberater.

1. **Mobile Außenwäsche und Abwasser.** Die Website verspricht bewusst keine Außenwäsche an jedem Standort: Sie nennt als Voraussetzung
   einen geeigneten, zulässigen Standort mit ordnungsgemäßer Abwasserableitung und schließt öffentliche Straßen und unbefestigten
   Untergrund aus. **Ob und unter welchen Bedingungen eine gewerbliche mobile Außenwäsche in Graz und den Umlandgemeinden zulässig ist,
   ist nicht geklärt** – eine Recherche hat dazu keine belastbare österreichische Quelle geliefert (gefunden wurden nur Regelungen aus
   Deutschland). Maßgeblich dürften das Wasserrechtsgesetz, die Kanalordnung der jeweiligen Gemeinde und das Gewerberecht sein. Bitte vor
   dem Angebot der Außenpflege bei Gemeinde bzw. Holding Graz (Kanal), Bezirkshauptmannschaft oder WKO klären – auch, ob ein
   wassersparendes Verfahren oder eine Auffangmatte nötig ist.
2. **Gewerbeberechtigung** für Fahrzeugaufbereitung und die Pflichtangaben im Impressum.
3. **Preisdarstellung.** Der Einführungspreis wird als „−20 %“ mit dem regulären Preis daneben gezeigt, nicht durchgestrichen.
   Preisgegenüberstellungen dürfen nicht irreführend sein (UWG, Preisauszeichnungsgesetz). Bitte prüfen lassen, bevor ein regulärer Preis
   durchgestrichen dargestellt wird.
4. **Gutscheine NEU20 und DANKE20** (20 € ab 119 € Auftragswert): Bedingungen stehen in AGB Punkt 6, auf Flyer und Dankeskarte.
5. **Versicherung.** Die Website macht keine Aussage zu einer Betriebshaftpflicht. Falls vorhanden, kann das ergänzt werden – erst nach Vorlage der Polizze.
6. **Flyer:** Impressumszeile („Medieninhaber: Name, Ort“) ist als Platzhalter vorgesehen. Bitte prüfen, ob und in welcher Form sie für Ihre Werbemittel nötig ist; unadressierte Verteilung nur dort, wo keine „Bitte keine Werbung“-Hinweise angebracht sind.
7. **Heckscheiben-Aufkleber:** Sichtfeld des Lenkers und Vorschriften zur Fahrzeugverglasung (KFG/KDV) – siehe `marketing/README.md`.
8. **Datenschutz:** Auftragsverarbeitungsverträge mit Hosting-, Datenbank- und E-Mail-Anbieter abschließen.

## 4. Externe Einrichtung (technisch vorbereitet, noch nicht aktiv)

| Funktion | Was fehlt | Wo eintragen |
| --- | --- | --- |
| E-Mails an Kunden (Eingang, Bestätigung, Storno, Erinnerung) | Zugangsdaten eines E-Mail-Postfachs: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Vercel → Projekt → Environment Variables |
| Benachrichtigung an den Betreiber bei neuer Buchung | `ADMIN_NOTIFICATION_EMAIL` | Vercel |
| Automatische Terminerinnerung am Vortag | `CRON_SECRET` (selbst erzeugtes Geheimnis) | Vercel |
| Eigene Domain | Domain kaufen und verbinden; danach `NEXT_PUBLIC_SITE_URL` setzen und `buchungsUrl` in `marketing/config.json` anpassen | Registrar, Vercel |
| Google-Unternehmensprofil | Profil anlegen – Anleitung in `docs/google-unternehmensprofil.md` | Google |

Ohne SMTP-Zugang speichert das System Buchungen vollständig und zeigt sie im Admin-Bereich; Kunden sehen ihre Buchung auf der
Bestätigungsseite, erhalten aber **keine E-Mail**. Die Bestätigungsseite weist in diesem Fall darauf hin, die Buchungsnummer zu notieren.

## 5. Inhalte

- **Galerie:** Alle Vorher-Nachher-Bilder sind als „Demo“ gekennzeichnete Visualisierungen. Echte Fotos im Admin-Bereich unter „Galerie“ hochladen (nur mit Einverständnis, ohne Kennzeichen).
- **Bewertungen:** Es werden keine Bewertungen angezeigt, solange keine echten vorliegen (`src/content/testimonials.ts`).
- **Teppichreinigung:** Auf dem Flyer steht „Intensive Polsterreinigung“, weil nur diese als Zusatzleistung angelegt ist. Eine Teppichreinigung kann im Admin-Bereich als Zusatzleistung ergänzt werden.
