# Druckfertige PDFs (technisch geprüft)

Hier liegen nur Dateien, die der Generator technisch geprüft hat: Endformat und Beschnitt (TrimBox/BleedBox), Bildauflösung,
Lage aller Texte, QR-Codes und des Logos innerhalb des Sicherheitsabstands (3 mm bei kleinen Drucksachen, 5 mm bei Plakaten,
30 mm bei Bannern und großen Schildern) und lesbare QR-Codes.

- `*_PRINT.pdf`: RGB-Fassung, wenn die Druckerei selbst konvertiert (oft die bessere Wahl bei Digitaldruck).
- `*_PRINT_CMYK.pdf`: in CMYK umgerechnet (Ghostscript-Standardprofil), Transparenz-Mischfarbraum CMYK.
  Kein formales PDF/X-4 und kein bestimmtes Druckerei-Profil. Verlangt die Druckerei FOGRA39/51 o. Ä., die RGB-Fassung schicken
  und dort konvertieren lassen. **Proof anfordern** (Gold, Tiefschwarz).

**Nicht drucken, solange die Domain rm6.at nicht registriert und verbunden ist.** Die QR-Codes führen derzeit auf
`glanzmobil.vercel.app/buchen`. Nach der Domainumstellung `scripts/campaign/config.mjs` anpassen und neu erzeugen
(siehe `20_README_UND_PRODUKTIONSHINWEISE/README.md`).

Die inhaltliche Freigabe (Preise, Texte, Impressum, Genehmigungen) liegt bei Ihnen: `20_README_UND_PRODUKTIONSHINWEISE/RECHT_UND_PRODUKTION_PRUEFLISTE.md`.
