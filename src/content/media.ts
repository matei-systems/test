/** Bildzuordnung für Leistungen (Slug → Bild). Neue Leistungen erhalten automatisch das Standardbild. */
export const SERVICE_IMAGES: Record<string, { src: string; alt: string; position?: string }> = {
  innenraumreinigung: { src: '/images/interior.jpg', alt: 'Gepflegter Fahrzeuginnenraum mit schwarzen Ledersitzen', position: '30% 50%' },
  aussenreinigung: { src: '/images/wash.jpg', alt: 'Schonende Handwäsche mit Schaum an einem dunklen Fahrzeug', position: '40% 50%' },
  komplettreinigung: { src: '/images/hero.jpg', alt: 'Schwarze Limousine mit Tiefenglanz', position: '72% 50%' },
  'premium-aufbereitung': { src: '/images/graz-night.jpg', alt: 'Limousine bei Nacht vor dem Grazer Uhrturm', position: '75% 50%' },
}

export const DEFAULT_SERVICE_IMAGE = { src: '/images/wash.jpg', alt: 'Fahrzeugpflege von GLANZMOBIL', position: '50% 50%' }

export function serviceImage(id: string) {
  return SERVICE_IMAGES[id] ?? DEFAULT_SERVICE_IMAGE
}
