# Zur Freigabe: Formulierungen und Abgrenzungen

Stand: November 2026. Diese Punkte sind auf der Website **als Entwurf** formuliert, weil die genaue Abgrenzung noch nicht von Ihnen
festgelegt wurde. Bitte prüfen, bestätigen oder korrigieren. Die Texte stehen an einer Stelle im Code bzw. im Admin-Bereich und sind
schnell änderbar.

Preise, Dauern und Fahrzeugkategorien wurden **nicht** verändert. Die Einstiegspreise (Innenraum Basic 79 €, Innenraum Premium 119 €,
Außenpflege 99 €, Komplettpaket 199 €) und die Zusatzleistungen (39 € / 59 € / ab 29 € / 35 €) sind unverändert und werden automatisch
gegen das Buchungssystem geprüft.

## 1. Zusatzleistungen – genaue Abgrenzung

Ausführliche Texte: `src/content/addons.ts` („Genau erklärt“ auf Leistungs- und Preisseite). Kurzbeschreibung für Buchung und Listen:
Admin → Leistungen → Zusatzleistungen.

| Zusatzleistung | Neu formuliert (bitte bestätigen) | Noch offen |
| --- | --- | --- |
| Tierhaarentfernung (39 €) | Bereiche: Sitzpolster, Teppichboden, Textil-Fußmatten, Kofferraum. Grenze: bei sehr starkem oder tief eingearbeitetem Tierhaarbesatz lässt sich nicht jedes Haar entfernen; deutlicher Mehraufwand nur mit Zuschlag nach Ihrer Zustimmung. Nicht enthalten: Geruchsbehandlung | Gehören Kindersitze oder Hundeboxen dazu? Wie viel Mehraufwand ist noch im Preis? |
| Intensive Polsterreinigung (59 €) | Sitzflächen, Rückenlehnen und Seitenwangen der Vorder- und Rücksitze; keine Tiefenreinigung des gesamten Innenraums (Dachhimmel, Teppichboden, Verkleidungen nicht enthalten); keine Zusage vollständiger Fleckentfernung; Leder wird vorab abgeklärt; Trocknungszeit | Gilt der Preis für alle Sitze oder nur Vordersitze? Wird Leder überhaupt angeboten? |
| Starke Verschmutzung (ab 29 €) | Beispiele: viel Sand/Erde/Schlamm/Streusplitt, große Mengen Krümel/Essensreste, verschüttete Getränke, außen starker Insekten-/Teer-/Baumharzbefall. „ab 29 €“ = Mindestzuschlag. Konkreter Preis **vor** Beginn der Zusatzarbeit, Durchführung erst nach Zustimmung | Wie wird der Endbetrag berechnet (z. B. je angefangene 30 Minuten)? Was passiert, wenn der Kunde ablehnt (gebuchte Leistung im normalen Umfang)? |
| Zusätzliche Detailreinigung (35 € / 30 Min.) | Einsatzbeispiele: Fugen/Düsen/Schalter, Einstiege und Türfalze, Kofferraum, bei Außenpflege Felgen/Tankdeckel/Einstiege. Kunde legt zu Beginn fest, wofür die Zeit genutzt wird | Mehrfach buchbar (60, 90 Minuten)? |

## 2. Außenwäsche

- Neu: Ist ein Standort nicht geeignet, „schlagen wir eine Alternative vor – etwa einen anderen geeigneten Standort oder eine reine
  Innenraumleistung“ (Website, FAQ, Voraussetzungen der Pakete).
- Offen: Wird bei Umstellung auf eine reine Innenraumleistung der Preis automatisch angepasst (Differenz zum gebuchten Paket)?
- Unverändert offen (siehe `docs/offene-angaben.md`): Zulässigkeit der mobilen Außenwäsche in Graz/Umgebung rechtlich klären.

## 3. Buchung und Terminbestätigung

- Der von Ihnen vorgegebene Satz steht jetzt vor dem Absenden, auf der Bestätigungsseite, in der Eingangs-E-Mail und in den FAQ:
  „Nach dem Absenden erhalten Sie eine Buchungsnummer. Wir prüfen anschließend Ihre Angaben und bestätigen Ihren Termin persönlich per
  E-Mail. Erst danach ist Ihr Termin verbindlich bestätigt.“
- **Bitte prüfen lassen:** AGB Punkt 2 (Vertragsabschluss) muss dazu passen – der Vertrag kommt demnach erst mit Ihrer Bestätigung
  zustande. Ebenso die Beschriftung des Buchungsbuttons („Termin jetzt buchen“, § 8 FAGG).
- **Voraussetzung:** Für die persönliche Bestätigung per E-Mail braucht es eine E-Mail-Adresse des Unternehmens (Admin → Einstellungen)
  und für automatische E-Mails die SMTP-Zugangsdaten (siehe `docs/offene-angaben.md`). Ohne SMTP erhalten Kunden keine automatische
  Eingangs-E-Mail; die Bestätigungsseite zeigt die Buchungsnummer.

## 4. Einführungspreis

- Es ist kein Enddatum hinterlegt. Die Website sagt deshalb: „Gültig während der Startphase. Ein festes Enddatum gibt es derzeit nicht –
  maßgeblich ist der Gesamtpreis in Ihrer Buchungsübersicht.“ Kein Countdown, keine erfundene Frist.
- Sobald ein Ende feststeht: Admin → Aktionen → Enddatum eintragen; die Texte passen sich automatisch an.

## 5. FAQ-Antworten, die eine Geschäftsentscheidung enthalten

| Frage | Aktuelle Antwort | Bitte entscheiden |
| --- | --- | --- |
| Wie erfolgt die Bezahlung? | Keine Online-Zahlung; bezahlt wird nach der Durchführung vor Ort; Zahlungsarten werden mit der Terminbestätigung mitgeteilt | Welche Zahlungsarten (bar, Karte, Überweisung)? |
| Was passiert bei schlechtem Wetter? | Innenraum meist wetterunabhängig; Außenpflege wird in Absprache **kostenlos** verschoben | Bestätigen, dass die Verschiebung kostenlos ist |
| Standorte außerhalb des Einsatzgebiets | „nur nach vorheriger Absprache“ | Gibt es eine Anfahrtspauschale? |

## 6. Kontaktdaten (nicht erfunden – bitte eintragen)

- Telefonnummer: Für die Heckscheibe haben Sie 0664 123 93 83 angegeben. Auf der Website erscheint sie erst, wenn sie unter
  Admin → Einstellungen eingetragen ist (dann auch im Menü, auf der Kontaktseite und im Footer).
- E-Mail-Adresse, WhatsApp-Nummer, Inhaber und Anschrift: Admin → Einstellungen.

## 7. Galerie

- Alle Vorher-Nachher-Bilder sind als „Demo“ gekennzeichnet. Im Admin unter „Galerie“ steht ein Fotoplan mit sechs Themen (Sitze &
  Polster, Innenraum, Fußmatten & Teppiche, Felgen & Lack, Bei der Arbeit, Ausrüstung). Fotos mit diesen Kategorien erscheinen
  automatisch; danach die Demos ausblenden.

## 8. Design

- Die Akzentfarbe der Website wurde von Champagner (#C8B48A) auf ein Gold abgestimmt, das zu den Goldtönen des Logos passt (#D4A843).
  Die gedruckten Visitenkarten, der Flyer und die Dankeskarte verwenden noch den Champagner-Ton – auf Wunsch angleichen und neu erzeugen.
