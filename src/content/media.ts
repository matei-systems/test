import type { CatalogService } from '@/lib/pricing'

/**
 * Bildzuordnung für Leistungen.
 * Das Bild selbst wird im Admin-Bereich je Leistung gepflegt (Upload oder Standardbild);
 * hier liegen nur Alt-Texte und Bildausschnitte für die mitgelieferten Motive.
 */
const KNOWN: Record<string, { alt: string; position?: string }> = {
  '/images/leistung-innenraum-basic.jpg': { alt: 'Cockpit und Lenkrad eines gepflegten Fahrzeugs', position: '50% 50%' },
  '/images/interior.jpg': { alt: 'Gepflegter Fahrzeuginnenraum mit schwarzen Ledersitzen', position: '30% 50%' },
  '/images/wash.jpg': { alt: 'Schonende Handwäsche mit Schaum an einem dunklen Fahrzeug', position: '40% 50%' },
  '/images/hero.jpg': { alt: 'Schwarze Limousine mit Tiefenglanz', position: '72% 50%' },
  '/images/graz-night.jpg': { alt: 'Limousine bei Nacht vor dem Grazer Uhrturm', position: '75% 50%' },
}

const FALLBACK_SRC = '/images/wash.jpg'

export interface ServiceImage {
  src: string
  alt: string
  position: string
  /** Hochgeladene Bilder (/media/…) sind bereits optimiert und werden direkt ausgeliefert */
  unoptimized: boolean
}

export function serviceImage(service: Pick<CatalogService, 'name' | 'imageSrc'>): ServiceImage {
  const src = service.imageSrc || FALLBACK_SRC
  const known = KNOWN[src]
  return {
    src,
    alt: known?.alt ?? `${service.name} – Fahrzeugpflege von RM Mobile Auto Aufbereitung`,
    position: known?.position ?? '50% 50%',
    unoptimized: src.startsWith('/media/'),
  }
}
