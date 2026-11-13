# GLANZMOBIL – Mobile Premium Fahrzeugpflege

Website mit Online-Buchungssystem und Admin-Bereich für einen mobilen Premium-Fahrzeugpflege-Service in Graz und Graz-Umgebung.

- **Website:** Startseite, Leistungen (inkl. Detailseiten), Preise, Galerie mit Vorher-Nachher-Reglern, Über uns, Kontakt (Formular), FAQ nach Themen, Einsatzgebiet (PLZ-Prüfung), Rechtstexte
- **Preise:** reguläre Preise je Fahrzeugkategorie plus Aktionen (Einführungspreis, −10/−20/−30/−40 % oder fester Aktionspreis, mit Zeitraum) – ehrlich ausgewiesen: zu zahlender Preis groß, Aktion + rotes Kennzeichen, regulärer Preis daneben
- **Buchung:** 6 Schritte – Leistung → Fahrzeug → Extras → Ort & Termin → Kontakt → Übersicht. Nur tatsächlich freie Termine, Live-Gesamtpreis, Online-Stornierung über den Bestätigungslink, Terminerinnerung per E-Mail
- **Admin:** Buchungen, Kalender (Tag/Woche/Monat), Anfragen, Kunden, Leistungen & Preise (inkl. Bild-Upload), Aktionen & Rabatte, Galerie (Upload, Vorher-Nachher-Paare), Statistiken, Verfügbarkeit (Arbeitszeiten, Urlaub, Teams), Einstellungen

---

## Schnellstart (lokal)

Voraussetzung: Node.js ≥ 20.9

```bash
npm install
cp .env.example .env.local
npm run admin:hash -- "DeinSicheresPasswort"   # Ausgabe als ADMIN_PASSWORD_HASH in .env.local eintragen
# SESSION_SECRET in .env.local setzen (mind. 32 Zeichen), z. B.:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
npm run dev
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin (Benutzer `admin` bzw. `ADMIN_USERNAME`)

Ohne `DATABASE_URL` startet die Entwicklungsumgebung automatisch eine eingebettete PostgreSQL-Datenbank (PGlite) im Ordner `.data/`. Tabellen und Startwerte (Leistungen, Preise, Arbeitszeiten) werden beim ersten Aufruf automatisch angelegt.

---

## Technik

| Bereich | Umsetzung |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Design | Eigenes Designsystem (CSS-Variablen + CSS-Module), Schriften Geist & Instrument Serif **lokal gehostet** (keine Google-Fonts-Anfragen) |
| Datenbank | PostgreSQL (z. B. Supabase, Neon, eigener Server) über `pg`; lokal PGlite |
| Validierung | zod – identische Regeln im Browser und auf dem Server |
| E-Mail | SMTP über nodemailer (jeder Anbieter, z. B. World4You, Microsoft 365, Resend SMTP) |
| Tests | Vitest (Verfügbarkeit, Preise, Validierung, Auth, Datenbank inkl. Doppelbuchungen) |

### Projektstruktur

```
src/
  app/(site)/          Öffentliche Seiten (Start, Leistungen, Preise, Galerie, Über uns, Kontakt, FAQ, Einsatzgebiet, Buchen, Rechtliches)
  app/admin/           Admin-Bereich (Übersicht, Buchungen, Kalender, Anfragen, Kunden, Leistungen, Aktionen, Galerie, Statistiken, Verfügbarkeit, Einstellungen)
  app/admin/actions.ts Alle Admin-Aktionen (jede prüft die Admin-Session)
  app/api/             availability, bookings (+ stornieren), kontakt, admin/media (Upload), cron/erinnerungen
  app/media/[id]/      Auslieferung hochgeladener Bilder (aus der Datenbank, lange cachebar)
  proxy.ts             Vorgelagerter Schutz für /admin und /api/admin
  components/          site/ (Header, Footer, Logo, PriceTag, MobileCta …), home/, pages/, booking/ (Wizard, Kalender), admin/
  config/defaults.ts   Startwerte: Leistungen, Preise, Dauer, Zusatzleistungen, Arbeitszeiten, Regeln, Einsatzgebiet
  config/site.ts       Marke, SEO-Keywords, Navigation
  content/             Bewertungen, FAQ (nach Themen), Bild-Alt-Texte, SEO-Texte je Leistung
  lib/availability.ts  Verfügbarkeitslogik (reine Funktionen, getestet)
  lib/bookings.ts      Buchung anlegen (Transaktion + Sperre + Constraint), Bestätigungsseite
  lib/pricing.ts       Preis-, Rabatt- und Dauerberechnung (Browser + Server, getestet)
  lib/email.ts         HTML-E-Mail-Vorlagen (Bestätigung, Änderung, Erinnerung, Stornierung, Anfragen, Fehler)
  lib/media.ts         Bild-Upload: verkleinern, WebP, Speicherung in der Datenbank
  lib/notify.ts        Optionaler Webhook (SMS/WhatsApp-Automationen)
  lib/db/              Datenbankverbindung, Migrationen, Startwerte
brand/                 Logo-Varianten, Designsystem, Social-Media-Vorlagen, Canva-Exporte, Schriften
docs/                  Google-Unternehmensprofil vorbereiten
scripts/               admin:hash, build-brand-assets (Logos/Bilder), build-social-assets (Vorlagen/Designsystem)
tests/                 Vitest-Tests
```

---

## Konfiguration

Alle Geheimnisse ausschließlich als Umgebungsvariablen – niemals im Code oder im Frontend. Vorlage: [`.env.example`](.env.example).

| Variable | Pflicht | Zweck |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | ja (Produktion) | Öffentliche URL, z. B. `https://www.glanzmobil.at` (Sitemap, Open Graph, Links in E-Mails) |
| `DATABASE_URL` (oder `POSTGRES_URL`) | ja (Produktion) | PostgreSQL-Verbindung. Die Vercel-Neon-Integration setzt beide automatisch. **Ohne sie nimmt die Produktion keine Buchungen an** (Fehlermeldung statt Schein-Buchung) |
| `GLANZMOBIL_DB` | nein | Notschalter: `off` ignoriert die Datenbank-Variablen – die Website bleibt im Übergangsmodus erreichbar (Online-Buchung deaktiviert), die Datenbank wird nicht angefasst. Im Normalbetrieb leer lassen |
| `ADMIN_USERNAME` | nein | Standard `admin` |
| `ADMIN_PASSWORD_HASH` | ja | Erzeugen mit `npm run admin:hash -- "Passwort"` – oder ohne Node.js direkt auf der Website unter `/admin/login` (solange noch kein Admin eingerichtet ist) |
| `SESSION_SECRET` | optional | Zufälliger Schlüssel, mind. 32 Zeichen. Fehlt er, wird ein Schlüssel aus der (geheimen) Datenbank-URL abgeleitet |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | empfohlen | E-Mail-Versand (Kundenbestätigung, Statusänderungen) |
| `ADMIN_NOTIFICATION_EMAIL` | empfohlen | Empfänger für Benachrichtigungen (neue Buchung, neue Anfrage, Stornierung, technische Fehler) |
| `CRON_SECRET` | für Erinnerungen | Schützt `/api/cron/erinnerungen`. Vercel Cron ruft den Endpunkt täglich auf (`vercel.json`) und sendet den Schlüssel automatisch. Ohne ihn werden keine Terminerinnerungen versendet |
| `NOTIFY_WEBHOOK_URL`, `NOTIFY_WEBHOOK_SECRET` | optional | JSON-Webhook bei Buchung/Anfrage/Stornierung – z. B. für Make, Zapier oder n8n, um SMS- oder WhatsApp-Nachrichten auszulösen. Im Projekt liegen keine Zugangsdaten für solche Dienste |

### Datenbank (Supabase)

1. In Supabase ein **neues Projekt** anlegen (Region z. B. `eu-central-1`, Frankfurt).
2. *Project Settings → Database → Connection string → Transaction pooler* (Port 6543) kopieren und als `DATABASE_URL` setzen, ergänzt um `?sslmode=require&uselibpqcompat=true`.
3. Fertig – Tabellen werden beim ersten Aufruf automatisch angelegt. Row Level Security wird auf allen Tabellen aktiviert, damit die öffentliche Supabase-API keinen Zugriff auf Buchungsdaten hat.

Hinweis: Im verbundenen Supabase-Konto existiert noch kein Projekt für GLANZMOBIL; bestehende Projekte anderer Anwendungen wurden bewusst nicht verwendet.

**Jede Anwendung braucht eine eigene Datenbank.** GLANZMOBIL migriert nur in eine leere (oder bereits eigene) Datenbank. Enthält sie Tabellen einer anderen Anwendung, bricht die Migration ab, bevor irgendetwas angelegt oder geändert wird (Fehler „Die verbundene Datenbank enthält bereits Tabellen einer anderen Anwendung“). Bei Vercel/Neon deshalb unter *Storage* eine **neue** Datenbank anlegen und nicht eine bestehende mit dem Projekt verbinden.

Die Datenbank muss die Erweiterung `btree_gist` erlauben (für den Doppelbuchungsschutz je Team) – bei Neon, Supabase und normalem PostgreSQL ist das der Fall. Hochgeladene Bilder werden verkleinert als WebP in der Datenbank gespeichert; ein zusätzlicher Speicherdienst ist nicht nötig.

### E-Mail

Ohne SMTP werden Buchungen trotzdem gespeichert – Kunden erhalten dann **keine** automatische E-Mail, und die Bestätigungsseite sagt das ehrlich („Wir melden uns persönlich“). Der Versandstatus ist je Buchung im Admin sichtbar. Unter *Admin → Einstellungen* gibt es einen Button „Test-E-Mail senden“.

---

## Deployment (Vercel)

**Live:** https://glanzmobil.vercel.app – Vercel-Projekt `glanzmobil` (Team „matei“), Funktionen in Frankfurt (`fra1`, siehe `vercel.json`).

Aktueller Stand: Die Website ist öffentlich erreichbar. Solange `DATABASE_URL` fehlt, läuft sie im **Übergangsmodus**: Leistungen und Preise werden aus den Startwerten angezeigt, die Online-Buchung ist sichtbar deaktiviert („startet in Kürze“) und nimmt **keine** Buchungen an (API antwortet mit 503). So geht kein Termin verloren.

**Online-Buchung und Admin aktivieren (Neon über Vercel, kostenlos):**
1. Vercel → Projekt `glanzmobil` → Reiter *Storage* → *Create Database* → **Neon** (Serverless Postgres) → Plan *Free*, Region **Frankfurt (eu-central-1)** → *Create* → mit dem Projekt `glanzmobil` verbinden (Environments: Production, optional Preview). Vercel setzt `DATABASE_URL`/`POSTGRES_URL` automatisch.
2. Neu deployen (*Deployments* → letztes Deployment → *Redeploy*). Ab jetzt ist die Online-Buchung aktiv; die Tabellen werden beim ersten Aufruf automatisch angelegt.
3. https://glanzmobil.vercel.app/admin/login öffnen → Admin-Passwort festlegen → angezeigten Wert in Vercel als `ADMIN_PASSWORD_HASH` (Production) eintragen → erneut deployen → anmelden (Benutzer `admin`).
4. Optional: SMTP-Variablen und `ADMIN_NOTIFICATION_EMAIL` für E-Mails ergänzen.

Hinweis: Das Repository ist noch nicht per Vercel-GitHub-App verbunden, daher löst ein `git push` kein automatisches Deployment aus. Für automatische Deployments in Vercel unter *Settings → Git* das Repository verbinden (dabei der Vercel-App auf GitHub Zugriff auf `matei-systems/test` geben) und als Production Branch den gewünschten Branch wählen.

Allgemein (neues Projekt):

1. Repository in Vercel importieren (Framework: Next.js, keine weiteren Build-Einstellungen nötig).
2. Umgebungsvariablen aus der Tabelle oben eintragen.
3. Deployen, dann `/admin` aufrufen und unter **Einstellungen** die Unternehmensdaten eintragen.
4. Eigene Domain verbinden und `NEXT_PUBLIC_SITE_URL` darauf setzen.

Das Rate-Limiting nutzt die vom Hosting gesetzte `x-forwarded-for`-IP (Vercel setzt sie zuverlässig). Bei eigenem Server einen Reverse-Proxy verwenden, der diesen Header überschreibt.

---

## Inhalte pflegen

**Im Admin-Bereich (ohne Code):**
- **Leistungen & Preise:** reguläre Preise und Dauer je Fahrzeugkategorie, Texte, Bild je Leistung (Upload), Leistungen anlegen/deaktivieren/löschen, Zusatzleistungen, Fahrzeugkategorien
- **Aktionen & Rabatte:** Bezeichnung (z. B. „Einführungspreis“), Rabatt in Prozent oder fester Aktionspreis, Leistung, Fahrzeugkategorie, Start-/Enddatum, aktiv/inaktiv, optional durchgestrichener regulärer Preis
- **Galerie:** Bilder hochladen, Vorher-Nachher-Paare anlegen, Beschreibungen, Reihenfolge, sichtbar/verborgen, Demo-Kennzeichnung
- **Kalender & Verfügbarkeit:** Tag/Woche/Monat, Arbeitszeiten, Urlaub & Sperrzeiten, Pufferzeit, Mindestvorlauf, Buchungshorizont, Anzahl Teams, Frist für die Online-Stornierung, automatische Bestätigung
- **Anfragen:** Nachrichten aus dem Kontaktformular beantworten, als erledigt markieren, löschen
- **Statistiken:** Buchungen und Umsatz pro Monat, Ø Auftragswert, beliebteste Leistungen und Zusatzleistungen
- **Einstellungen:** Unternehmens- und Kontaktdaten (Impressum, Footer, E-Mails, Google-Schema), **WhatsApp-Nummer**, Bewertungslink (Google), Einsatzgebiet inkl. Postleitzahlen

**Im Code (`src/content/`):**
- `testimonials.ts` – echte Kundenbewertungen (nur mit Einverständnis)
- `faq.ts` – häufige Fragen, nach Themen gegliedert
- `seo.ts` – Seitentitel je Leistung

### Preisstrategie (Startwerte – Vorschlag, bitte prüfen)

| Paket | Regulär (Kleinwagen … Van) | Einführungspreis −20 % | Dauer |
| --- | --- | --- | --- |
| Innenraum Basic | 99 – 149 € | 79 – 119 € | ca. 1¼ – 2 Std. |
| Innenraum Premium | 149 – 199 € | 119 – 159 € | ca. 2½ – 3½ Std. |
| Außenpflege | 124 – 169 € | 99 – 135 € | ca. 1½ – 2¼ Std. |
| Komplettpaket | 249 – 349 € | 199 – 279 € | ca. 4 – 5½ Std. |

Kalkulationsbasis und vollständige Matrix: [`src/config/defaults.ts`](src/config/defaults.ts). Die Startwerte werden nur in eine **leere** Datenbank eingespielt; danach gilt ausschließlich, was im Admin steht. Prozent-Rabatte werden zugunsten des Kunden auf volle Euro abgerundet. Der Server berechnet jeden Preis neu und lehnt eine Buchung ab, wenn der bestätigte Gesamtpreis nicht mehr stimmt (z. B. Aktion abgelaufen) – der Kunde sieht dann die aktualisierte Übersicht.

---

## ⚠️ Vor dem Livegang zu erledigen

| Thema | Was fehlt |
| --- | --- |
| Unternehmensdaten | Inhaber, Anschrift, Telefon, E-Mail, ggf. UID/Firmenbuch, Gewerbe, Behörde, Kammer → *Admin → Einstellungen*. Fehlende Angaben sind im Impressum gelb markiert |
| WhatsApp | Nummer unter *Admin → Einstellungen* eintragen – erst dann erscheint der WhatsApp-Button (lokal zeigt ein gestrichelter Hinweis-Button die Stelle) |
| Rechtstexte | Impressum, Datenschutz, AGB und Stornobedingungen sind **Entwürfe** und als „rechtlich nicht geprüft“ gekennzeichnet. Markierte Stellen (Zahlungsarten, USt./Kleinunternehmer, FAGG-Rücktrittsbelehrung, Stornofristen/-gebühren, Hosting-/E-Mail-Anbieter) ergänzen und rechtlich prüfen lassen |
| Preise | Alle regulären Preise, der Einführungsrabatt und alle Dauern sind **Vorschläge** (siehe „Preisstrategie“). Hinweis: Das Komplettpaket startet beim Einführungspreis mit 199 € (früher „ab 189 €“). In *Admin → Leistungen* und *Admin → Aktionen* anpassen |
| Preisdarstellung | Regulärer Preis wird als „Regulär 149 €“ genannt, **nicht** durchgestrichen. Durchstreichen (Schalter je Aktion) nur, wenn der reguläre Preis tatsächlich gilt bzw. gegolten hat – Preisgegenüberstellung rechtlich prüfen lassen |
| Buchungs-Button | Beschriftung „Termin jetzt buchen“ (`src/config/site.ts` → `bookingButtonLabel`) mit Hinweis „Verbindliche Buchung zum Gesamtpreis …“ direkt darüber. Ob die Beschriftung den Anforderungen an zahlungspflichtige Online-Verträge (§ 8 FAGG) genügt, bitte rechtlich prüfen lassen |
| Zahlung & Anfahrt | Texte gehen von „Zahlung nach der Durchführung vor Ort“ und „Anfahrt im Einsatzgebiet inklusive“ aus – bitte bestätigen oder anpassen (FAQ, AGB, Preisseite) |
| Stornofrist | Online-Stornierung bis 24 Stunden vor dem Termin (*Admin → Verfügbarkeit*). Gebühren für spätere Absagen in den Stornobedingungen festlegen |
| Über uns / FAQ | Texte beschreiben Arbeitsweise und Abläufe als Vorschlag – bitte an die tatsächliche Praxis anpassen |
| Leistungsbeschreibungen | Enthaltene Leistungen in *Admin → Leistungen* an das tatsächliche Angebot anpassen |
| Arbeitszeiten | Startwerte Mo–Fr 8–18 Uhr, Sa 9–15 Uhr → anpassen |
| Galerie | Alle aktuellen Bilder sind **Demo-Visualisierungen** (deutlich gekennzeichnet). In *Admin → Galerie* durch echte Vorher/Nachher-Fotos ersetzen (mit Einverständnis, ohne Kennzeichen) |
| Bewertungen | Keine erfundenen Bewertungen. Echte Bewertungen in `src/content/testimonials.ts` ergänzen; Bewertungslink in *Admin → Einstellungen* |
| Infrastruktur | Datenbank verbinden, `ADMIN_PASSWORD_HASH`, SMTP-Daten, `ADMIN_NOTIFICATION_EMAIL`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` setzen |
| Google | Google-Unternehmensprofil anlegen – Schritt-für-Schritt-Vorbereitung: [`docs/google-unternehmensprofil.md`](docs/google-unternehmensprofil.md). Sitemap in der Search Console einreichen: `/sitemap.xml` |

---

## Sicherheit & Datenschutz

- **Doppelbuchungsschutz** dreifach: Verfügbarkeitsprüfung → Datenbank-Sperre (Advisory Lock) in derselben Transaktion → PostgreSQL-`EXCLUDE`-Constraint auf `[Start, Ende + Puffer)`. Getestet mit gleichzeitigen Anfragen (genau eine Buchung gewinnt)
- **Keine Schein-Buchungen:** Die Bestätigungsseite wird erst nach erfolgreicher Speicherung aufgerufen und lädt die Buchung aus der Datenbank
- **Preise** werden immer serverseitig berechnet; der vom Kunden bestätigte Gesamtpreis wird gegen die Server-Berechnung geprüft
- **Buchung vs. Terminanfrage:** Fester Preis → verbindliche Buchung. „Preis auf Anfrage“ → unverbindliche Terminanfrage (eigene Kennzeichnung, nie automatisch bestätigt)
- **Admin:** scrypt-Passwort-Hash, HMAC-signiertes httpOnly-Cookie (SameSite=Strict, Secure), 12 h gültig, ungültig nach Passwortwechsel; Login-Rate-Limit (5 Versuche / 15 Min.). Die Session wird vierfach geprüft: vorgelagert (`proxy.ts`), in jeder Admin-Seite, in jeder Server-Action und in der Datenzugriffsschicht – ein Layout allein schützt in Next.js keine Seite
- **Uploads:** nur für angemeldete Admins, nur JPG/PNG/WebP bis 6 MB, werden neu kodiert (WebP, max. 1800 px, Metadaten wie GPS entfernt)
- **Rollen:** Es gibt genau eine Rolle (Administrator). Mehrere Benutzer/Rollen sind bewusst nicht eingebaut, solange nur eine Person verwaltet
- **API:** Herkunftsprüfung (Origin), Honeypot gegen Bots, Rate-Limit (10 Buchungen / Stunde / IP), IP-Adressen nur gehasht gespeichert
- **Header:** Content-Security-Policy, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **DSGVO:** keine Tracking-/Werbe-Cookies (daher kein Cookie-Banner nötig), Schriften und Bilder lokal, Einwilligung zu Datenschutz & AGB wird mit Zeitstempel gespeichert, optionale Einwilligung für Angebote per E-Mail getrennt erfasst, Buchungen können im Admin **anonymisiert** oder (storniert) gelöscht werden

---

## Tests & Qualität

```bash
npm test                                                         # Unit- + Integrationstests (PGlite)
TEST_DATABASE_URL=postgres://user@host:5432/db npm test          # zusätzlich gegen echtes PostgreSQL
npm run typecheck
npm run build
```

Durchgeführte Prüfungen (Produktions-Build gegen lokales PostgreSQL – keine Testdaten in einer Produktivdatenbank):
- 61 automatisierte Tests (+ 12 gegen echtes PostgreSQL): Preise/Rabatte/Rundung, Aktionszeiträume, Preisstaffel, Verfügbarkeit, Teams, Doppelbuchung (auch gleichzeitig), Preisprüfung, Online-Stornierung, Erinnerungen, Terminanfrage, Validierung
- Komplette Buchung im Browser (Desktop & Smartphone) inkl. Fehlermeldungen je Schritt, PLZ außerhalb des Einsatzgebiets, Rabatt in Übersicht und Bestätigung, Kalenderdatei
- API: falscher Preis → abgelehnt, fremde Herkunft → 403, zwei gleichzeitige Buchungen → 1× gespeichert / 1× abgewiesen, Honeypot, Stornierung gibt den Termin wieder frei
- Kontaktformular (Validierung, Speicherung, Anzeige im Admin), PLZ-Prüfung
- Admin: Login (falsches Passwort), Buchung bestätigen, Kalender (Tag/Woche/Monat), Aktion anlegen → sofort auf der Preisseite sichtbar → löschen, Bild-Upload → Galerie → Auslieferung → löschen, ungültige Uploads abgewiesen, Statistiken
- Zugriffsschutz: alle Admin-Seiten (auch als direkte RSC-Anfrage), Upload und Cron ohne Berechtigung gesperrt
- Lighthouse (Mobil, gedrosselt): Accessibility 100, Best Practices 100, SEO 100, Performance 90–93
- axe-core (WCAG 2.1 AA): 0 Verstöße auf allen öffentlichen Seiten, allen Buchungsschritten und allen Admin-Seiten – Desktop und Smartphone
- Keine Fehler in der Browser-Konsole, kein horizontales Scrollen auf Smartphones

---

## Marke & Canva

Siehe [`brand/README.md`](brand/README.md) – Logo-Dateien, Farben, Schriften sowie die in Canva erstellten Designs.
