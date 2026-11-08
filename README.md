# GLANZMOBIL – Mobile Premium Fahrzeugpflege

Website mit Online-Buchungssystem und Admin-Bereich für einen mobilen Premium-Fahrzeugpflege-Service in Graz und Graz-Umgebung.

- **Website:** Startseite, Leistungen (inkl. Detailseiten je Leistung), Preise je Fahrzeugkategorie, Vorher/Nachher-Galerie, FAQ, Rechtstexte
- **Buchung:** 5 Schritte – Leistung → Fahrzeug → Extras → Termin & Ort → Kontakt & Bestätigung. Es werden nur tatsächlich freie Termine angezeigt
- **Admin:** Buchungen (Status, Termine verschieben, Daten bearbeiten), Kunden, Arbeitszeiten, Urlaub/Sperrzeiten, Preise & Leistungen, Kontakt- und Unternehmensdaten

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
  app/(site)/          Öffentliche Seiten (Start, Leistungen, Galerie, Buchen, Rechtliches)
  app/admin/           Admin-Bereich (Login, Übersicht, Buchungen, Kunden, Verfügbarkeit, Leistungen, Einstellungen)
  app/admin/actions.ts Alle Admin-Aktionen (jede prüft die Admin-Session)
  app/api/             availability (freie Termine), bookings (Buchung anlegen)
  components/          site/ (Header, Footer, Logo …), home/ (Abschnitte), booking/ (Wizard, Kalender), admin/
  config/defaults.ts   Startwerte: Leistungen, Preise, Dauer, Zusatzleistungen, Arbeitszeiten, Regeln, Einsatzgebiet
  config/site.ts       Marke, SEO-Keywords, Navigation
  content/             Galerie, Bewertungen, FAQ, Bildzuordnung, SEO-Texte je Leistung
  lib/availability.ts  Verfügbarkeitslogik (reine Funktionen, getestet)
  lib/bookings.ts      Buchung anlegen (Transaktion + Sperre + Constraint), Bestätigungsseite
  lib/pricing.ts       Preis-/Dauerberechnung
  lib/db/              Datenbankverbindung, Migrationen, Startwerte
brand/                 Logo-Dateien, Canva-Exporte, Schriften
scripts/               admin:hash, build-brand-assets (Bilder/Logos/OG-Bild erzeugen)
tests/                 Vitest-Tests
```

---

## Konfiguration

Alle Geheimnisse ausschließlich als Umgebungsvariablen – niemals im Code oder im Frontend. Vorlage: [`.env.example`](.env.example).

| Variable | Pflicht | Zweck |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | ja (Produktion) | Öffentliche URL, z. B. `https://www.glanzmobil.at` (Sitemap, Open Graph, Links in E-Mails) |
| `DATABASE_URL` (oder `POSTGRES_URL`) | ja (Produktion) | PostgreSQL-Verbindung. Die Vercel-Neon-Integration setzt beide automatisch. **Ohne sie nimmt die Produktion keine Buchungen an** (Fehlermeldung statt Schein-Buchung) |
| `ADMIN_USERNAME` | nein | Standard `admin` |
| `ADMIN_PASSWORD_HASH` | ja | Erzeugen mit `npm run admin:hash -- "Passwort"` – oder ohne Node.js direkt auf der Website unter `/admin/login` (solange noch kein Admin eingerichtet ist) |
| `SESSION_SECRET` | optional | Zufälliger Schlüssel, mind. 32 Zeichen. Fehlt er, wird ein Schlüssel aus der (geheimen) Datenbank-URL abgeleitet |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | empfohlen | E-Mail-Versand (Kundenbestätigung, Statusänderungen) |
| `ADMIN_NOTIFICATION_EMAIL` | empfohlen | Empfänger für „Neue Buchung“-Benachrichtigungen |

### Datenbank (Supabase)

1. In Supabase ein **neues Projekt** anlegen (Region z. B. `eu-central-1`, Frankfurt).
2. *Project Settings → Database → Connection string → Transaction pooler* (Port 6543) kopieren und als `DATABASE_URL` setzen, ergänzt um `?sslmode=require&uselibpqcompat=true`.
3. Fertig – Tabellen werden beim ersten Aufruf automatisch angelegt. Row Level Security wird auf allen Tabellen aktiviert, damit die öffentliche Supabase-API keinen Zugriff auf Buchungsdaten hat.

Hinweis: Im verbundenen Supabase-Konto existiert noch kein Projekt für GLANZMOBIL; bestehende Projekte anderer Anwendungen wurden bewusst nicht verwendet.

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
- Preise, Dauer je Fahrzeugkategorie, Leistungstexte, Leistungen anlegen/deaktivieren/löschen
- Zusatzleistungen, Fahrzeugkategorien
- Arbeitszeiten, Urlaub & Sperrzeiten, Pufferzeit, Mindestvorlauf, Buchungshorizont, automatische Bestätigung
- Unternehmens- und Kontaktdaten (Impressum, Footer, E-Mails, Google-Schema), **WhatsApp-Nummer** (aktiviert den WhatsApp-Button), Einsatzgebiet inkl. erlaubter Postleitzahlen

**Im Code (`src/content/`):**
- `gallery.ts` – Vorher/Nachher-Paare und Galeriebilder. Eigene Fotos nach `public/images/galerie/` legen, Eintrag mit `isDemo: false` ergänzen, Demo-Einträge entfernen
- `testimonials.ts` – echte Kundenbewertungen (nur mit Einverständnis); optional Link zum Google-Profil
- `faq.ts` – häufige Fragen
- `media.ts` – Bild je Leistung

---

## ⚠️ Vor dem Livegang zu erledigen

| Thema | Was fehlt |
| --- | --- |
| Unternehmensdaten | Inhaber, Anschrift, Telefon, E-Mail, ggf. UID/Firmenbuch, Gewerbe, Behörde, Kammer → *Admin → Einstellungen*. Fehlende Angaben sind im Impressum gelb markiert |
| WhatsApp | Nummer unter *Admin → Einstellungen* eintragen – erst dann erscheint der WhatsApp-Button (lokal zeigt ein gestrichelter Hinweis-Button die Stelle) |
| Rechtstexte | Impressum, Datenschutz, AGB und Stornobedingungen sind **Entwürfe** und als „rechtlich nicht geprüft“ gekennzeichnet. Markierte Stellen (Zahlungsarten, USt./Kleinunternehmer, FAGG-Rücktrittsbelehrung, Stornofristen/-gebühren, Hosting-/E-Mail-Anbieter) ergänzen und rechtlich prüfen lassen |
| Preise | Vorgegeben: Innenraum Premium 119 €, Außenreinigung Premium 99 €, Komplettreinigung Premium ab 189 €. **Platzhalter, bitte prüfen:** Aufpreise für Limousine/SUV/Kombi/Van, Preise der Zusatzleistungen, alle Dauern, Premium-Aufbereitung („auf Anfrage“) |
| Leistungsbeschreibungen | Enthaltene Leistungen in *Admin → Leistungen* an das tatsächliche Angebot anpassen |
| Arbeitszeiten | Startwerte Mo–Fr 8–18 Uhr, Sa 9–15 Uhr → anpassen |
| Galerie | Alle aktuellen Bilder sind **Demo-Visualisierungen** (deutlich gekennzeichnet). Durch echte Vorher/Nachher-Fotos ersetzen |
| Bewertungen | Keine erfundenen Bewertungen. Echte Bewertungen in `src/content/testimonials.ts` ergänzen |
| Infrastruktur | `DATABASE_URL`, SMTP-Daten, `ADMIN_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_SITE_URL` setzen |
| Google | Google-Unternehmensprofil anlegen (Servicegebiet Graz/Graz-Umgebung), Sitemap in der Search Console einreichen: `/sitemap.xml` |

---

## Sicherheit & Datenschutz

- **Doppelbuchungsschutz** dreifach: Verfügbarkeitsprüfung → Datenbank-Sperre (Advisory Lock) in derselben Transaktion → PostgreSQL-`EXCLUDE`-Constraint auf `[Start, Ende + Puffer)`. Getestet mit gleichzeitigen Anfragen (genau eine Buchung gewinnt)
- **Keine Schein-Buchungen:** Die Bestätigungsseite wird erst nach erfolgreicher Speicherung aufgerufen und lädt die Buchung aus der Datenbank
- **Preise** werden immer serverseitig berechnet; Preisangaben aus dem Browser werden ignoriert
- **Admin:** scrypt-Passwort-Hash, HMAC-signiertes httpOnly-Cookie (SameSite=Strict, Secure), 12 h gültig, ungültig nach Passwortwechsel; jede Server-Action prüft die Session; Login-Rate-Limit (5 Versuche / 15 Min.)
- **API:** Herkunftsprüfung (Origin), Honeypot gegen Bots, Rate-Limit (10 Buchungen / Stunde / IP), IP-Adressen nur gehasht gespeichert
- **Header:** Content-Security-Policy, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **DSGVO:** keine Tracking-/Werbe-Cookies, Schriften und Bilder lokal, Einwilligung zu Datenschutz & AGB wird mit Zeitstempel gespeichert, Buchungen können im Admin **anonymisiert** oder (storniert) gelöscht werden

---

## Tests & Qualität

```bash
npm test                                                         # Unit- + Integrationstests (PGlite)
TEST_DATABASE_URL=postgres://user@host:5432/db npm test          # zusätzlich gegen echtes PostgreSQL
npm run typecheck
npm run build
```

Durchgeführte Prüfungen (Produktions-Build gegen PostgreSQL):
- Komplette Buchung im Browser (Desktop & iPhone-Viewport) inkl. Validierungsfehlern, Kalender, Bestätigungsseite
- Admin-Login, Status ändern, Daten bearbeiten, Termin verschieben, Sperrzeit eintragen (API zeigt danach keine Termine), Preisänderung sofort auf der Website, Logout (Desktop & Mobil)
- 5 gleichzeitige Buchungen auf denselben Termin → 1× gespeichert, 4× abgewiesen
- Lighthouse (Mobil, gedrosselt): Accessibility 100, Best Practices 100, SEO 100, Performance 85–92
- axe-core (WCAG 2.1 AA): 0 Verstöße auf allen öffentlichen Seiten, allen Buchungsschritten und allen Admin-Seiten
- Keine Fehler in der Browser-Konsole, keine CSP-Verstöße, kein horizontales Scrollen auf Smartphones

---

## Marke & Canva

Siehe [`brand/README.md`](brand/README.md) – Logo-Dateien, Farben, Schriften sowie die in Canva erstellten Designs.
