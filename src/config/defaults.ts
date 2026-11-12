/**
 * Startwerte für die Datenbank (werden nur beim allerersten Start eingespielt).
 * Danach werden alle Werte ausschließlich im Admin-Bereich gepflegt:
 *   /admin/leistungen      → Leistungen, reguläre Preise, Dauer, Zusatzleistungen, Fahrzeugkategorien
 *   /admin/aktionen        → Einführungspreise & Rabattaktionen (−10/−20/−30/−40 % oder Aktionspreis)
 *   /admin/galerie         → Vorher/Nachher-Paare und Galeriebilder
 *   /admin/verfuegbarkeit  → Arbeitszeiten, Urlaub & Sperrzeiten, Buchungsregeln, Teams
 *   /admin/einstellungen   → Kontaktdaten, Unternehmensdaten, Einsatzgebiet
 *
 * PREISSTRATEGIE (Vorschlag – bitte prüfen und im Admin anpassen)
 * ───────────────────────────────────────────────────────────────
 * Kalkulationsbasis: mobiler Einsatz inkl. Anfahrt im Einsatzgebiet, Material und Rüstzeit.
 * Reguläre Preise entsprechen ca. 55–65 € je Arbeitsstunde; der Einführungsrabatt von 20 %
 * bleibt mit ca. 45–52 € je Arbeitsstunde wirtschaftlich tragfähig.
 *
 *   Leistung            regulär (Kleinwagen)   Einführungspreis −20 %   Dauer
 *   Innenraum Basic            99 €                    79 €            ca. 1,25 Std.
 *   Innenraum Premium         149 €                   119 €            ca. 2,5 Std.
 *   Außenpflege               124 €                    99 €            ca. 1,5 Std.
 *   Komplettpaket             249 €                   199 €            ca. 4 Std.
 *
 * Größere Fahrzeuge: Zuschlag je Kategorie (mehr Fläche, mehr Zeit) – siehe Preis-Matrix unten.
 * Die regulären Preise sind so gestaffelt (…99 / …19 / …24 / …49 / …69 / …74), dass der Einführungsrabatt
 * von 20 % glatte Preise ergibt (z. B. 149 € → 119 €, 169 € → 135 €, 299 € → 239 €).
 * Das Komplettpaket ist in jeder Kategorie günstiger als Innenraum Premium + Außenpflege einzeln.
 * Starke Verschmutzung und Tierhaare werden als Zusatzleistung transparent ausgewiesen.
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
  imageSrc?: string
  /** Regulärer Preis in Cent (null = auf Anfrage) und Dauer in Minuten je Fahrzeugkategorie */
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
  { id: 'kompaktklasse', name: 'Kompaktklasse', description: 'z. B. VW Golf, Audi A3, BMW 1er' },
  { id: 'limousine', name: 'Limousine', description: 'z. B. Audi A6, BMW 5er, Mercedes E-Klasse' },
  { id: 'kombi', name: 'Kombi', description: 'z. B. Škoda Octavia Combi, VW Passat Variant' },
  { id: 'suv', name: 'SUV', description: 'z. B. VW Tiguan, BMW X5, Audi Q7' },
  { id: 'van', name: 'Van', description: 'z. B. VW Multivan, Mercedes V-Klasse' },
]

/** Hilfsfunktion: regulärer Preis (Euro) und Dauer je Kategorie in der Reihenfolge der Kategorien oben */
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
    id: 'innenraum-basic',
    name: 'Innenraum Basic',
    tagline: 'Die gründliche Innenreinigung für zwischendurch.',
    description:
      'Frischer Innenraum in kurzer Zeit: gründliches Aussaugen, saubere Oberflächen und klare Scheiben – direkt bei dir vor Ort.',
    includes: [
      'Aussaugen von Sitzen, Fußräumen und Kofferraum',
      'Armaturenbrett und Mittelkonsole feucht gereinigt',
      'Fußmatten ausgesaugt',
      'Scheiben innen streifenfrei',
    ],
    priceNote: 'Für gepflegte Fahrzeuge mit normaler Verschmutzung. Bei starker Verschmutzung oder Tierhaaren fallen Zusatzleistungen an.',
    imageSrc: '/images/leistung-innenraum-basic.jpg',
    prices: matrix([
      [99, 75], // Kleinwagen → Einführungspreis 79 €
      [99, 75], // Kompaktklasse → 79 €
      [119, 90], // Limousine → 95 €
      [119, 90], // Kombi → 95 €
      [124, 105], // SUV → 99 €
      [149, 120], // Van → 119 €
    ]),
  },
  {
    id: 'innenraum-premium',
    name: 'Innenraum Premium',
    tagline: 'Premium-Innenraumaufbereitung bis ins Detail.',
    description:
      'Die intensive Innenraumaufbereitung: Jede Fuge, jede Ablage und jede Oberfläche wird sorgfältig gereinigt und gepflegt – für ein Fahrgefühl wie am ersten Tag.',
    includes: [
      'Alle Leistungen von Innenraum Basic',
      'Türverkleidungen, Einstiege und Ablagen gereinigt',
      'Fugen, Lüftungsdüsen und Schalter im Detail gereinigt',
      'Fußmatten gründlich gereinigt',
      'Sitzflächen abgesaugt und Oberflächen gereinigt',
      'Kunststoffpflege im Innenraum',
    ],
    priceNote: 'Bei starker Verschmutzung, Flecken in Polstern oder Tierhaaren fallen Zusatzleistungen an.',
    imageSrc: '/images/interior.jpg',
    prices: matrix([
      [149, 150], // → 119 €
      [149, 150], // → 119 €
      [169, 165], // → 135 €
      [169, 165], // → 135 €
      [174, 180], // → 139 €
      [199, 210], // → 159 €
    ]),
  },
  {
    id: 'aussenpflege',
    name: 'Außenpflege',
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
    priceNote: 'Bei starker Verschmutzung (z. B. Insekten, Teer, Baumharz) kann ein Zuschlag anfallen.',
    imageSrc: '/images/wash.jpg',
    prices: matrix([
      [124, 90], // → 99 €
      [124, 90], // → 99 €
      [124, 105], // → 99 €
      [124, 105], // → 99 €
      [149, 120], // → 119 €
      [169, 135], // → 135 €
    ]),
  },
  {
    id: 'komplettpaket',
    name: 'Komplettpaket',
    tagline: 'Innen und außen. Ein Termin. Perfekter Glanz.',
    description:
      'Unser beliebtestes Paket: Innenraum Premium und Außenpflege in einem Termin – mit Preisvorteil gegenüber der Einzelbuchung.',
    includes: [
      'Alle Leistungen von Innenraum Premium',
      'Alle Leistungen der Außenpflege',
      'Abgestimmter Ablauf in einem Termin',
      'Preisvorteil gegenüber der Einzelbuchung',
    ],
    priceNote: 'Bei starker Verschmutzung oder Tierhaaren fallen Zusatzleistungen an.',
    featured: true,
    imageSrc: '/images/hero.jpg',
    prices: matrix([
      [249, 240], // → 199 €
      [249, 240], // → 199 €
      [269, 270], // → 215 €
      [269, 270], // → 215 €
      [299, 300], // → 239 €
      [349, 330], // → 279 €
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

/** Einführungsangebot zum Marktstart (im Admin unter „Aktionen“ änderbar oder abschaltbar). */
export interface DefaultPromotion {
  name: string
  serviceId: string | null
  vehicleId: string | null
  discountPercent: number | null
  promoPriceCents: number | null
  showStrikethrough: boolean
}

export const DEFAULT_PROMOTIONS: DefaultPromotion[] = [
  {
    name: 'Einführungspreis',
    serviceId: null, // gilt für alle Pakete
    vehicleId: null, // gilt für alle Fahrzeugkategorien
    discountPercent: 20,
    promoPriceCents: null,
    // Der reguläre Preis wird als „Regulär 149 €“ genannt. Durchgestrichen wird er erst, wenn er
    // tatsächlich verlangt wurde und die Preisgegenüberstellung rechtlich geprüft ist.
    showStrikethrough: false,
  },
]

/** Demo-Inhalte der Galerie (deutlich als Demo gekennzeichnet; im Admin unter „Galerie“ ersetzbar). */
export interface DefaultGalleryItem {
  kind: 'vergleich' | 'bild'
  title: string
  description: string
  category: string
  beforeSrc?: string
  afterSrc?: string
  imageSrc?: string
  alt: string
}

export const DEFAULT_GALLERY: DefaultGalleryItem[] = [
  {
    kind: 'vergleich',
    title: 'Sitze & Polster',
    description: 'Krümel, Staub und Flecken weichen einem sauberen, gepflegten Sitz.',
    category: 'Innenraum',
    beforeSrc: '/images/demo/sitz-vorher.jpg',
    afterSrc: '/images/demo/sitz-nachher.jpg',
    alt: 'Autositz aus schwarzem Leder',
  },
  {
    kind: 'vergleich',
    title: 'Mittelkonsole & Cockpit',
    description: 'Staub in Fugen und Ablagen gründlich entfernt, Oberflächen gepflegt.',
    category: 'Innenraum',
    beforeSrc: '/images/demo/mittelkonsole-vorher.jpg',
    afterSrc: '/images/demo/mittelkonsole-nachher.jpg',
    alt: 'Mittelkonsole mit Schalthebel',
  },
  {
    kind: 'vergleich',
    title: 'Felgen & Reifen',
    description: 'Bremsstaub und Straßenschmutz entfernt – Felgen und Reifen wie neu.',
    category: 'Außen',
    beforeSrc: '/images/demo/felge-vorher.jpg',
    afterSrc: '/images/demo/felge-nachher.jpg',
    alt: 'Leichtmetallfelge einer dunklen Limousine',
  },
  {
    kind: 'vergleich',
    title: 'Innenraum komplett',
    description: 'Vom Fußraum bis zum Armaturenbrett: ein Innenraum, der sich wieder neu anfühlt.',
    category: 'Innenraum',
    beforeSrc: '/images/demo/innenraum-vorher.jpg',
    afterSrc: '/images/demo/innenraum-nachher.jpg',
    alt: 'Fahrzeuginnenraum mit Ledersitzen',
  },
  {
    kind: 'vergleich',
    title: 'Lack & Karosserie',
    description: 'Staubfilm, Wasserflecken und Laufspuren weichen sichtbarem Tiefenglanz.',
    category: 'Außen',
    beforeSrc: '/images/demo/lack-vorher.jpg',
    afterSrc: '/images/demo/lack-nachher.jpg',
    alt: 'Dunkle Limousine von vorne',
  },
  { kind: 'bild', title: 'Tiefenglanz', description: '', category: 'Außen', imageSrc: '/images/hero.jpg', alt: 'Schwarze Limousine mit Tiefenglanz im Studiolicht' },
  { kind: 'bild', title: 'Schonende Handwäsche', description: '', category: 'Außen', imageSrc: '/images/wash.jpg', alt: 'Schonende Handwäsche mit Schaum' },
  { kind: 'bild', title: 'Innenraum Premium', description: '', category: 'Innenraum', imageSrc: '/images/interior.jpg', alt: 'Gepflegter Innenraum mit Ledersitzen' },
  { kind: 'bild', title: 'Graz bei Nacht', description: '', category: 'Details', imageSrc: '/images/graz-night.jpg', alt: 'Limousine bei Nacht vor dem Grazer Uhrturm' },
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
  /** Anzahl der Teams/Mitarbeiter, die gleichzeitig Termine durchführen können */
  teams: number
  /** Kunden können online bis X Stunden vor dem Termin stornieren (0 = Online-Stornierung aus) */
  cancelHours: number
}

export const DEFAULT_BOOKING_RULES: BookingRules = {
  bufferMinutes: 30,
  slotIntervalMinutes: 30,
  minLeadHours: 24,
  maxAdvanceDays: 60,
  autoConfirm: false,
  teams: 1,
  cancelHours: 24,
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
  /** Link zum Google-Unternehmensprofil / Bewertungsformular (leer = kein Button) */
  reviewUrl: string
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
  reviewUrl: '',
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
