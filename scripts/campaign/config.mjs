/**
 * RM6 Werbemittel-Kampagne – geprüfte Fakten und Design-Tokens.
 *
 * Alle Angaben stammen aus der Website bzw. Projektdateien (Stand der Prüfung: siehe README).
 * NICHTS hier erfinden – fehlende Angaben bleiben leer und werden in den Designs nicht gezeigt
 * bzw. als Platzhalter markiert (Status „Entwurf“).
 */

export const FACTS = {
  brand: 'RM6 Autoaufbereitung',
  claim: 'Premium Fahrzeugpflege',
  region: 'Graz & Graz-Umgebung',
  /** Vom Inhaber für die Heckscheiben-Werbung vorgegeben (RM6_HECKSCHEIBE_DRUCK/masse.json); auf der Website noch nicht eingetragen */
  phone: '0664 123 93 83',
  phoneHref: '+436641239383',
  /** Markendomain laut Inhaber. ⚠ Bei der Prüfung noch NICHT registriert – vor dem Druck registrieren und verbinden. */
  web: 'rm6.at',
  /** QR-Ziel: aktuell funktionierende Buchungsseite. Nach Verbindung der Domain auf https://rm6.at/buchen ändern und neu erzeugen. */
  qrBooking: 'https://glanzmobil.vercel.app/buchen',
  qrBase: 'https://glanzmobil.vercel.app',
  email: '', // nicht hinterlegt
  owner: '', // nicht hinterlegt (Impressum!)
  reviewUrl: '', // kein Google-Bewertungslink hinterlegt
  /** Buchbare Zeiten laut Website (Admin → Verfügbarkeit) */
  hours: [
    ['Montag – Freitag', '08:00 – 18:00'],
    ['Samstag', '09:00 – 15:00'],
    ['Sonntag', 'geschlossen'],
  ],
}

/** Preise laut Live-Website (geprüft): Einführungspreis −20 % in der Startphase, regulär daneben. */
export const VEHICLES = ['Kleinwagen', 'Kompaktklasse', 'Limousine', 'Kombi', 'SUV', 'Van']
export const PACKAGES = [
  {
    id: 'innenraum-basic',
    name: 'Innenraum Basic',
    short: 'Die gründliche Innenreinigung für zwischendurch',
    promo: [79, 79, 95, 95, 99, 119],
    regular: [99, 99, 119, 119, 124, 149],
    minutes: [75, 75, 90, 90, 105, 120],
    includes: ['Aussaugen von Sitzen, Fußräumen und Kofferraum', 'Armaturenbrett und Mittelkonsole feucht gereinigt', 'Fußmatten ausgesaugt', 'Scheiben innen streifenfrei'],
  },
  {
    id: 'innenraum-premium',
    name: 'Innenraum Premium',
    short: 'Innenraumaufbereitung bis ins Detail',
    promo: [119, 119, 135, 135, 139, 159],
    regular: [149, 149, 169, 169, 174, 199],
    minutes: [150, 150, 165, 165, 180, 210],
    includes: ['Alle Leistungen von Innenraum Basic', 'Türverkleidungen, Einstiege und Ablagen', 'Fugen, Lüftungsdüsen und Schalter im Detail', 'Fußmatten gründlich gereinigt', 'Kunststoffpflege im Innenraum'],
  },
  {
    id: 'aussenpflege',
    name: 'Außenpflege',
    short: 'Schonende Handwäsche für sichtbaren Glanz',
    promo: [99, 99, 99, 99, 119, 135],
    regular: [124, 124, 124, 124, 149, 169],
    minutes: [90, 90, 105, 105, 120, 135],
    includes: ['Schonende Handwäsche der Karosserie', 'Felgen- und Reifenreinigung', 'Scheiben außen streifenfrei', 'Trocknung mit Mikrofasertüchern', 'Reifenpflege'],
    exterior: true,
  },
  {
    id: 'komplettpaket',
    name: 'Komplettpaket',
    short: 'Innen und außen in einem Termin',
    promo: [199, 199, 215, 215, 239, 279],
    regular: [249, 249, 269, 269, 299, 349],
    minutes: [240, 240, 270, 270, 300, 330],
    includes: ['Alle Leistungen von Innenraum Premium', 'Alle Leistungen der Außenpflege', 'Abgestimmter Ablauf in einem Termin', 'Preisvorteil gegenüber Einzelbuchung'],
    featured: true,
    exterior: true,
  },
]
export const ADDONS = [
  { name: 'Tierhaarentfernung', price: '39 €', note: 'Sitzpolster, Teppichboden, Textil-Fußmatten, Kofferraum' },
  { name: 'Intensive Polsterreinigung', price: '59 €', note: 'Tiefenreinigung der Sitzpolster bei Flecken' },
  { name: 'Starke Verschmutzung', price: 'ab 29 €', note: 'Konkreter Preis vor Beginn – nur mit Ihrer Zustimmung' },
  { name: 'Zusätzliche Detailreinigung', price: '35 €', note: '30 Minuten für Bereiche Ihrer Wahl' },
]
export const COUPONS = {
  neu: { code: 'NEU20', amount: '20 €', min: '119 €', terms: 'Gültig für die erste Buchung ab 119 € Auftragswert, einmal je Kunde, online einlösbar, keine Barablöse.' },
  danke: { code: 'DANKE20', amount: '20 €', min: '119 €', terms: 'Ab 119 € Auftragswert, einmal je Kunde, online einlösbar, keine Barablöse.' },
}
export const PROMO_NOTE = 'Einführungspreise (−20 %) in der Startphase · regulärer Preis jeweils daneben'
export const EXTERIOR_NOTE = 'Außenwäsche nur an geeigneten, zulässigen Standorten – wir prüfen den Standort vorab.'

/** Design-Tokens. CMYK = Richtwerte für Proof/Druckerei (Konvertierung je nach Druckverfahren und Profil). */
export const COLORS = [
  { key: 'black', name: 'RM6 Schwarz', hex: '#0A0A0B', rgb: '10 10 11', cmyk: '60 / 50 / 50 / 100 (Tiefschwarz für Flächen) · Text: 0 / 0 / 0 / 100', use: 'Basisfarbe, Hintergründe' },
  { key: 'carbon', name: 'RM6 Carbon', hex: '#17171A', rgb: '23 23 26', cmyk: '70 / 60 / 55 / 85', use: 'Flächen, Karten, Abstufung' },
  { key: 'gold', name: 'RM6 Gold', hex: '#D4A843', rgb: '212 168 67', cmyk: '15 / 33 / 85 / 2', use: 'Akzent, Linien, Hervorhebungen' },
  { key: 'goldLight', name: 'Gold hell', hex: '#E6C06A', rgb: '230 192 106', cmyk: '8 / 23 / 68 / 0', use: 'Glanzlicht im Goldverlauf' },
  { key: 'goldDark', name: 'Gold dunkel', hex: '#9A7420', rgb: '154 116 32', cmyk: '30 / 48 / 100 / 18', use: 'Gold auf hellem Grund, Schatten im Verlauf' },
  { key: 'silver', name: 'RM6 Silber', hex: '#C9CCD1', rgb: '201 204 209', cmyk: '20 / 13 / 12 / 0', use: 'Sekundärtext, Linien, Chrom-Anmutung' },
  { key: 'white', name: 'Weiß', hex: '#FFFFFF', rgb: '255 255 255', cmyk: '0 / 0 / 0 / 0', use: 'Text auf Schwarz' },
  { key: 'ivory', name: 'Elfenbein', hex: '#F4F1EA', rgb: '244 241 234', cmyk: '3 / 4 / 8 / 0', use: 'Heller Grund (Elite Detailing)' },
  { key: 'red', name: 'Signalrot', hex: '#C8372D', rgb: '200 55 45', cmyk: '10 / 90 / 85 / 2', use: 'Ausschließlich Rabatt-Kennzeichen (−20 %)' },
]
