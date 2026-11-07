/**
 * Galerie & Vorher-Nachher-Vergleiche.
 *
 * ⚠️  PLATZHALTER: Alle aktuellen Einträge sind DEMO-Visualisierungen (isDemo: true).
 *     Die "Nachher"-Bilder stammen aus Canva (KI-generiert), die "Vorher"-Bilder wurden daraus
 *     per Bildbearbeitung simuliert (scripts/build-brand-assets.mjs). Sie zeigen KEINE echten Kundenarbeiten
 *     und werden auf der Website deutlich als "Demo" gekennzeichnet.
 *
 * Eigene Fotos hinzufügen:
 *   1. Bilder nach public/images/galerie/ kopieren (z. B. 1600 px Breite, JPG).
 *   2. Neuen Eintrag unten ergänzen – isDemo: false setzen.
 *   3. Demo-Einträge entfernen, sobald echte Arbeiten vorhanden sind.
 */

export interface BeforeAfterItem {
  id: string
  title: string
  category: 'Innenraum' | 'Außen' | 'Details'
  description: string
  before: string
  after: string
  alt: string
  isDemo: boolean
}

export interface GalleryImage {
  src: string
  alt: string
  caption: string
  isDemo: boolean
}

export const BEFORE_AFTER: BeforeAfterItem[] = [
  {
    id: 'lack',
    title: 'Lack & Karosserie',
    category: 'Außen',
    description: 'Staubfilm, Wasserflecken und Laufspuren weichen sichtbarem Tiefenglanz.',
    before: '/images/demo/lack-vorher.jpg',
    after: '/images/demo/lack-nachher.jpg',
    alt: 'Dunkle Limousine von vorne',
    isDemo: true,
  },
  {
    id: 'innenraum',
    title: 'Innenraum & Leder',
    category: 'Innenraum',
    description: 'Krümel, Staub und matte Oberflächen – danach gepflegt und wie neu.',
    before: '/images/demo/innenraum-vorher.jpg',
    after: '/images/demo/innenraum-nachher.jpg',
    alt: 'Fahrzeuginnenraum mit Ledersitzen',
    isDemo: true,
  },
  {
    id: 'felge',
    title: 'Felgen & Details',
    category: 'Details',
    description: 'Bremsstaub und Schmutz an Felge und Front gründlich entfernt.',
    before: '/images/demo/felge-vorher.jpg',
    after: '/images/demo/felge-nachher.jpg',
    alt: 'Scheinwerfer und Felge einer dunklen Limousine',
    isDemo: true,
  },
]

export const GALLERY: GalleryImage[] = [
  { src: '/images/hero.jpg', alt: 'Schwarze Limousine mit Tiefenglanz im Studiolicht', caption: 'Tiefenglanz', isDemo: true },
  { src: '/images/wash.jpg', alt: 'Schonende Handwäsche mit Schaum', caption: 'Schonende Handwäsche', isDemo: true },
  { src: '/images/interior.jpg', alt: 'Gepflegter Innenraum mit Ledersitzen', caption: 'Innenraum Premium', isDemo: true },
  { src: '/images/graz-night.jpg', alt: 'Limousine bei Nacht vor dem Grazer Uhrturm', caption: 'Graz bei Nacht', isDemo: true },
]
