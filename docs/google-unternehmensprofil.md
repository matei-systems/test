# Google-Unternehmensprofil vorbereiten

> Stand: Es wurde **noch kein** Google-Unternehmensprofil angelegt. Diese Anleitung bereitet alles vor,
> damit das Profil in wenigen Minuten vollständig und einheitlich zur Website eingerichtet werden kann.
> Bitte ausschließlich echte Unternehmensdaten eintragen.

## 1. Profil anlegen

1. <https://www.google.com/business/> öffnen und mit dem Google-Konto des Unternehmens anmelden.
2. **Unternehmensname:** `GLANZMOBIL` (ohne Zusätze wie „Graz“ oder „günstig“ – Keywords im Namen verstoßen gegen die Richtlinien).
3. **Unternehmenstyp:** „Dienstleistungen im Einzugsgebiet“ (mobiler Service, Kunden kommen nicht zu einem Standort).
4. **Kategorie:** primär „Autoaufbereitung“ bzw. „Fahrzeugaufbereitungsservice“; optional zusätzlich „Autowaschanlage“ nur, wenn es wirklich passt.
5. **Adresse:** Geschäftsadresse angeben, aber **nicht öffentlich anzeigen** (bei mobilen Diensten ohne Ladenlokal üblich).
6. **Einzugsgebiet:** Graz, Bezirk Graz-Umgebung (identisch mit *Admin → Einstellungen → Einsatzgebiet*).
7. **Telefon & Website:** dieselbe Nummer wie auf der Website; Website-URL = Startseite.
8. Bestätigung (Verifizierung) durchführen – meist per Video, Telefon oder Postkarte.

## 2. Einheitliche Angaben (NAP)

Name, Adresse und Telefonnummer müssen überall exakt gleich geschrieben sein: Google-Profil, Impressum,
Footer, Social Media. Die Website liest diese Daten aus *Admin → Einstellungen* und gibt sie auch als
strukturierte Daten (schema.org `AutomotiveBusiness`) aus – leere Felder werden dort weggelassen, nicht erfunden.

## 3. Inhalte fürs Profil

| Feld | Vorschlag |
| --- | --- |
| Beschreibung | „GLANZMOBIL ist deine mobile Premium-Fahrzeugpflege in Graz und Graz-Umgebung. Wir kommen zu dir – nach Hause oder an den Arbeitsplatz – und pflegen dein Fahrzeug sorgfältig von Hand: Innenraumreinigung, Außenpflege und Komplettpaket. Transparente Preise, Termin online buchen.“ |
| Öffnungszeiten | wie *Admin → Verfügbarkeit* (Startwerte: Mo–Fr 8–18 Uhr, Sa 9–15 Uhr) |
| Terminlink | `https://<deine-domain>/buchen` |
| Leistungen | Innenraum Basic, Innenraum Premium, Außenpflege, Komplettpaket, Tierhaarentfernung, Polsterreinigung – mit denselben Namen und Preisen wie auf der Website |
| Logo / Titelbild | `brand/social/profilbild-1080.png`, `brand/canva/facebook-titelbild.jpg` |
| Fotos | Nur echte Fotos eigener Arbeiten hochladen (keine Demo- oder KI-Bilder) |

## 4. Nach der Einrichtung

1. **Bewertungslink** kopieren (Profil → „Um Rezensionen bitten“) und unter *Admin → Einstellungen → Bewertungslink* eintragen.
   Dann erscheint auf der Website der Button „Bewertung abgeben“.
2. Echte Bewertungen (mit Einverständnis) können zusätzlich in `src/content/testimonials.ts` gezeigt werden.
3. **Google Search Console:** Website bestätigen und `https://<deine-domain>/sitemap.xml` einreichen.
4. Bei Preis- oder Zeitänderungen Profil und Website gemeinsam aktualisieren.

## 5. Lokale Suchbegriffe (bereits auf der Website berücksichtigt)

Autoaufbereitung Graz · mobile Fahrzeugpflege Graz · Autoreinigung Graz · Innenraumreinigung Auto Graz ·
Fahrzeugaufbereitung Graz Umgebung · mobile Autoreinigung Steiermark

Die Seite `/einsatzgebiet` listet die tatsächlich angefahrenen Orte; jede Leistung hat eine eigene Seite mit
lokalem Titel. Bitte keine Ortsseiten für Gebiete anlegen, die nicht bedient werden.
