/**
 * Kundenbewertungen.
 *
 * Es werden bewusst KEINE erfundenen Bewertungen angezeigt. Solange die Liste leer ist,
 * zeigt die Website einen ehrlichen Hinweis ("Wir sind neu – deine Meinung zählt").
 *
 * Echte Bewertungen (mit Einverständnis der Kund:innen, z. B. aus Google) hier eintragen:
 *   { name: 'Anna M.', location: 'Graz', text: '…', rating: 5, source: 'Google', date: '2026-11' }
 */
export interface Testimonial {
  name: string
  location?: string
  text: string
  rating: 1 | 2 | 3 | 4 | 5
  source: string
  date: string
}

export const TESTIMONIALS: Testimonial[] = []

/** Optionaler Link zur Bewertungsseite (z. B. Google-Unternehmensprofil). Leer = kein Button. */
export const REVIEW_URL = ''
