/**
 * Startwerte für die Datenbank (werden nur beim allerersten Start eingespielt).
 * Danach werden alle Werte ausschließlich im Admin-Bereich gepflegt:
 *   /admin/leistungen      → Leistungen, Preise, Dauer, Zusatzleistungen, Fahrzeugkategorien
 *   /admin/verfuegbarkeit  → Arbeitszeiten, Urlaub & Sperrzeiten, Buchungsregeln
 *   /admin/einstellungen   → Kontaktdaten, Unternehmensdaten, Einsatzgebiet
 *
 * ⚠️  Vorgegebene Startpreise laut Briefing: Innenraum Premium 119 €, Außenreinigung Premium 99 €,
 *     Komplettreinigung Premium ab 189 €. Alle übrigen Preise (Aufpreise für größere Fahrzeuge,
 *     Zusatzleistungen) sowie Dauern und Arbeitszeiten sind PLATZHALTER und müssen geprüft werden.
 */

export interface DefaultVehicleCategory {
  id: string
  name: string
  description: string
}

export interface DefaultService {
  id: string
  name: string
  tagline: string
  description: string
  includes: string[]
  priceNote: string
  requiresAddon?: boolean
  featured?: boolean
  /** Preis in Cent (null = auf Anfrage) und Dauer in Minuten je Fahrzeugkategorie */
  prices: Record<string, { price: number | null; minutes: number }>
}

export interface DefaultAddon {
  id: string
  name: string
  description: string
  priceCents: number
  priceIsFrom?: boolean
  minutes: number
  bookableAlone: boolean
}

export const DEFAULT_VEHICLE_CATEGORIES: DefaultVehicleCategory[] = [
  { id: 'kleinwagen', name: 'Kleinwagen', description: 'z. B. VW Polo, Renault Clio, Mini' },
  { id: 'mittelklasse', name: 'Mittelklasse', description: 'z. B. VW Golf, Audi A3, BMW 1er' },
  { id: 'limousine', name: 'Limousine', description: 'z. B. Audi A6, BMW 5er, Mercedes E-Klasse' },
  { id: 'suv', name: 'SUV', description: 'z. B. VW Tiguan, BMW X5, Audi Q7' },
  { id: 'kombi', name: 'Kombi', description: 'z. B. Škoda Octavia Combi, VW Passat Variant' },
  { id: 'van', name: 'Van', description: 'z. B. VW Multivan, Mercedes V-Klasse' },
]

/** Hilfsfunktion: Preis (Euro) und Dauer je Kategorie in der Reihenfolge der Kategorien oben */
function matrix(rows: Array<[number | null, number]>): DefaultService['prices'] {
  const out: DefaultService['prices'] = {}
  DEFAULT_VEHICLE_CATEGORIES.forEach((c, i) => {
    const [euro, minutes] = rows[i]
    out[c.id] = { price: euro === null ? null : Math.round(euro * 100), minutes }
  })
  return out
}

export const DEFAULT_SERVICES: DefaultService[] = [
  {
    id: 'innenraumreinigung',
    name: 'Innenraum Premium',
    tagline: 'Ein Innenraum, der sich wieder neu anfühlt.',
    description:
      'Gründliche Innenraumreinigung direkt bei dir vor Ort – vom Fußraum bis zum Dachhimmel-Rand, mit Blick fürs Detail und schonenden Pflegeprodukten.',
    includes: [
      'Gründliches Aussaugen von Sitzen, Fußräumen und Kofferraum',
      'Reinigung von Armaturenbrett, Mittelkonsole und Türverkleidungen',
      'Fugen, Lüftungsdüsen und Ablagen im Detail gereinigt',
      'Fußmatten gereinigt',
      'Scheiben innen streifenfrei',
      'Kunststoffpflege im Innenraum',
    ],
    priceNote: 'Bei starker Verschmutzung oder Tierhaaren fallen Zusatzleistungen an.',
    featured: false,
    prices: matrix([
      [119, 150], // Kleinwagen
      [119, 150], // Mittelklasse
      [129, 165], // Limousine
      [149, 180], // SUV
      [139, 165], // Kombi
      [169, 210], // Van
    ]),
  },
  {
    id: 'aussenreinigung',
    name: 'Außenreinigung Premium',
    tagline: 'Sichtbarer Glanz – schonend von Hand.',
    description:
      'Schonende Außenreinigung von Hand für Lack, Felgen und Scheiben. Wir kommen mit unserem Equipment zu dir – du musst nirgendwo hinfahren.',
    includes: [
      'Schonende Handwäsche der Karosserie',
      'Felgen- und Reifenreinigung',
      'Türeinstiege und Tankdeckelbereich gereinigt',
      'Scheiben außen streifenfrei',
      'Trocknung mit weichen Mikrofasertüchern',
      'Reifenpflege',
    ],
    priceNote: 'Bei starker Verschmutzung kann ein Zuschlag anfallen.',
    featured: false,
    prices: matrix([
      [99, 90],
      [99, 90],
      [109, 105],
      [119, 120],
      [109, 105],
      [129, 135],
    ]),
  },
  {
    id: 'komplettreinigung',
    name: 'Komplettreinigung Premium',
    tagline: 'Innen und außen. Ein Termin. Perfekter Glanz.',
    description:
      'Unser beliebtestes Paket: Innenraum Premium und Außenreinigung Premium in einem Termin – mit Preisvorteil gegenüber der Einzelbuchung.',
    includes: [
      'Alle Leistungen von Innenraum Premium',
      'Alle Leistungen von Außenreinigung Premium',
      'Abgestimmter Ablauf in einem Termin',
      'Preisvorteil gegenüber der Einzelbuchung',
    ],
    priceNote: 'Bei starker Verschmutzung oder Tierhaaren fallen Zusatzleistungen an.',
    featured: true,
    prices: matrix([
      [189, 240],
      [189, 240],
      [209, 270],
      [229, 300],
      [219, 270],
      [259, 330],
    ]),
  },
  {
    id: 'premium-aufbereitung',
    name: 'Premium-Aufbereitung',
    tagline: 'Für höchste Ansprüche – individuell abgestimmt.',
    description:
      'Umfassende Innen- und Außenaufbereitung für Fahrzeuge, die mehr verdienen. Umfang und Preis stimmen wir nach dem Fahrzeugzustand individuell mit dir ab.',
    includes: [
      'Alle Leistungen der Komplettreinigung Premium',
      'Intensive Detailarbeit innen und außen',
      'Umfang individuell nach Fahrzeugzustand',
      'Verbindliches Angebot vor Beginn der Arbeiten',
    ],
    priceNote: 'Preis auf Anfrage – du erhältst vor Beginn ein verbindliches Angebot.',
    featured: false,
    prices: matrix([
      [null, 420],
      [null, 420],
      [null, 450],
      [null, 480],
      [null, 450],
      [null, 480],
    ]),
  },
  {
    id: 'zusatzleistungen',
    name: 'Nur Zusatzleistungen',
    tagline: 'Gezielt das, was dein Fahrzeug gerade braucht.',
    description:
      'Du brauchst kein komplettes Paket? Buche einzelne Zusatzleistungen wie Tierhaarentfernung oder intensive Polsterreinigung separat.',
    includes: ['Freie Auswahl einzelner Zusatzleistungen', 'Ideal als Ergänzung zwischen zwei Komplettreinigungen'],
    priceNote: 'Der Preis ergibt sich aus den gewählten Zusatzleistungen.',
    requiresAddon: true,
    prices: matrix([
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ]),
  },
]

export const DEFAULT_ADDONS: DefaultAddon[] = [
  {
    id: 'tierhaarentfernung',
    name: 'Tierhaarentfernung',
    description: 'Gründliche Entfernung von Tierhaaren aus Polstern, Teppichen und Kofferraum.',
    priceCents: 3900,
    minutes: 45,
    bookableAlone: true,
  },
  {
    id: 'polsterreinigung',
    name: 'Intensive Polsterreinigung',
    description: 'Tiefenreinigung der Sitzpolster für Flecken und hartnäckige Verschmutzungen.',
    priceCents: 5900,
    minutes: 60,
    bookableAlone: true,
  },
  {
    id: 'starke-verschmutzung',
    name: 'Starke Verschmutzung',
    description: 'Zuschlag für stark verschmutzte Fahrzeuge. Endpreis nach tatsächlichem Aufwand, Abstimmung vor Ort.',
    priceCents: 2900,
    priceIsFrom: true,
    minutes: 45,
    bookableAlone: false,
  },
  {
    id: 'detailreinigung',
    name: 'Zusätzliche Detailreinigung',
    description: '30 Minuten zusätzliche Detailarbeit für Bereiche deiner Wahl – nach Absprache vor Ort.',
    priceCents: 3500,
    minutes: 30,
    bookableAlone: true,
  },
]

/** ISO-Wochentag (1 = Montag … 7 = Sonntag) */
export const DEFAULT_WORKING_HOURS: Array<{ weekday: number; isOpen: boolean; open: string; close: string }> = [
  { weekday: 1, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 2, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 3, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 4, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 5, isOpen: true, open: '08:00', close: '18:00' },
  { weekday: 6, isOpen: true, open: '09:00', close: '15:00' },
  { weekday: 7, isOpen: false, open: '09:00', close: '15:00' },
]

export interface BookingRules {
  /** Pufferzeit nach jedem Termin (Anfahrt, Auf-/Abbau) in Minuten */
  bufferMinutes: number
  /** Raster der angebotenen Startzeiten in Minuten */
  slotIntervalMinutes: number
  /** Mindestvorlauf für Online-Buchungen in Stunden */
  minLeadHours: number
  /** Wie viele Tage im Voraus gebucht werden kann */
  maxAdvanceDays: number
  /** Neue Buchungen automatisch bestätigen (sonst Status "Neu" → manuelle Bestätigung) */
  autoConfirm: boolean
}

export const DEFAULT_BOOKING_RULES: BookingRules = {
  bufferMinutes: 30,
  slotIntervalMinutes: 30,
  minLeadHours: 24,
  maxAdvanceDays: 60,
  autoConfirm: false,
}

/**
 * Unternehmens- und Kontaktdaten. Leere Felder werden auf der Website nicht angezeigt
 * bzw. im Impressum deutlich als fehlend markiert. KEINE Daten erfinden.
 */
export interface BusinessInfo {
  companyName: string
  ownerName: string
  legalForm: string
  street: string
  postalCode: string
  city: string
  country: string
  phone: string
  whatsapp: string
  email: string
  vatId: string
  companyRegister: string
  tradeAuthority: string
  chamber: string
  trade: string
}

export const DEFAULT_BUSINESS: BusinessInfo = {
  companyName: 'GLANZMOBIL',
  ownerName: '',
  legalForm: '',
  street: '',
  postalCode: '',
  city: '',
  country: 'Österreich',
  phone: '',
  whatsapp: '',
  email: '',
  vatId: '',
  companyRegister: '',
  tradeAuthority: '',
  chamber: '',
  trade: '',
}

export interface ServiceArea {
  /** Kurzbezeichnung der Regionen, z. B. für Hero und SEO */
  regions: string[]
  /** Orte/Gemeinden im Einsatzgebiet (Anzeige auf der Website) */
  communities: string[]
  /**
   * Erlaubte Postleitzahlen für Online-Buchungen, z. B. "8010-8077, 8101-8160, 8501".
   * Leer = keine Einschränkung.
   */
  postalCodes: string
}

export const DEFAULT_SERVICE_AREA: ServiceArea = {
  regions: ['Graz', 'Graz-Umgebung'],
  communities: [
    'Graz (alle Bezirke)',
    'Seiersberg-Pirka',
    'Feldkirchen bei Graz',
    'Kalsdorf bei Graz',
    'Premstätten',
    'Lieboch',
    'Hart bei Graz',
    'Raaba-Grambach',
    'Hausmannstätten',
    'Fernitz-Mellach',
    'Gratkorn',
    'Gratwein-Straßengel',
    'Stattegg',
    'Kumberg',
    'Eggersdorf bei Graz',
    'Laßnitzhöhe',
    'Hitzendorf',
    'Thal',
  ],
  postalCodes: '8010-8077, 8101-8160, 8301-8302, 8401-8402, 8501',
}
