/**
 * Statische Marken- und SEO-Konfiguration.
 * Veränderliche Geschäftsdaten (Preise, Arbeitszeiten, Kontaktdaten) liegen in der Datenbank
 * und werden im Admin-Bereich gepflegt – siehe src/config/defaults.ts.
 */

export const SITE = {
  name: 'RM Mobile Auto Aufbereitung',
  /** Kurzform für enge Stellen (App-Icon-Beschriftung, Admin-Kopf) */
  shortName: 'RM',
  claim: 'Premium Fahrzeugpflege',
  headline: 'Premium Fahrzeugaufbereitung. Direkt bei Ihnen.',
  subline: 'Professionelle mobile Fahrzeugpflege in Graz und Umgebung – bequem bei Ihnen vor Ort.',
  description:
    'RM Mobile Auto Aufbereitung ist Ihre mobile Autoaufbereitung in Graz und Graz-Umgebung: Innenraumreinigung, Außenpflege und Komplettpaket direkt bei Ihnen zu Hause oder am Arbeitsplatz. Transparente Preise, Termin online buchen.',
  locale: 'de_AT',
  language: 'de-AT',
  timezone: 'Europe/Vienna',
  currency: 'EUR',
  keywords: [
    'Mobile Autoaufbereitung Graz',
    'Autoaufbereitung Graz Umgebung',
    'Auto Innenreinigung Graz',
    'Polsterreinigung Auto Graz',
    'Mobile Fahrzeugpflege Graz',
    'Autoreinigung beim Kunden',
    'Autoreinigung Graz',
    'Fahrzeugaufbereitung Graz',
  ],
  /**
   * Beschriftung des Buttons, der eine verbindliche Buchung auslöst.
   * Rechtlich prüfen lassen (§ 8 FAGG „Button-Lösung“): Bei zahlungspflichtigen Online-Verträgen mit
   * Verbrauchern muss die Beschriftung eindeutig auf die Zahlungspflicht hinweisen. Falls nötig hier
   * z. B. auf „Zahlungspflichtig buchen“ ändern – der Hinweistext direkt über dem Button bleibt bestehen.
   */
  bookingButtonLabel: 'Termin jetzt buchen',
  /** Vorbefüllter Text für den WhatsApp-Kontakt */
  whatsappText: 'Guten Tag, ich interessiere mich für eine Fahrzeugaufbereitung und möchte einen Termin vereinbaren.',
} as const

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export const NAV_LINKS = [
  { href: '/leistungen', label: 'Leistungen' },
  { href: '/preise', label: 'Preise' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/ueber-uns', label: 'Über uns' },
  { href: '/faq', label: 'FAQ' },
  { href: '/kontakt', label: 'Kontakt' },
] as const

/** Zusätzliche Links im Footer */
export const FOOTER_LINKS = [
  { href: '/einsatzgebiet', label: 'Einsatzgebiet' },
  { href: '/buchen', label: 'Online buchen' },
] as const

export const LEGAL_LINKS = [
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
  { href: '/stornobedingungen', label: 'Stornobedingungen' },
] as const
