/**
 * Statische Marken- und SEO-Konfiguration.
 * Veränderliche Geschäftsdaten (Preise, Arbeitszeiten, Kontaktdaten) liegen in der Datenbank
 * und werden im Admin-Bereich gepflegt – siehe src/config/defaults.ts.
 */

export const SITE = {
  name: 'GLANZMOBIL',
  claim: 'Mobile Premium Fahrzeugpflege',
  headline: 'Dein Fahrzeug. Unser Anspruch. Perfekter Glanz.',
  subline: 'Premium Fahrzeugpflege – direkt bei dir vor Ort.',
  description:
    'GLANZMOBIL ist deine mobile Premium-Fahrzeugpflege in Graz und Graz-Umgebung: Innenraumreinigung, Außenreinigung und Komplettreinigung direkt bei dir zu Hause oder am Arbeitsplatz. Transparente Preise, Termin online buchen.',
  locale: 'de_AT',
  language: 'de-AT',
  timezone: 'Europe/Vienna',
  currency: 'EUR',
  keywords: [
    'Autoaufbereitung Graz',
    'mobile Autoreinigung Graz',
    'Innenreinigung Auto Graz',
    'Fahrzeugpflege Graz Umgebung',
    'mobile Fahrzeugpflege Steiermark',
    'Autopflege Graz',
    'Fahrzeugaufbereitung Graz',
  ],
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
  { href: '/#preise', label: 'Preise' },
  { href: '/galerie', label: 'Galerie' },
  { href: '/#ablauf', label: 'Ablauf' },
  { href: '/#faq', label: 'FAQ' },
] as const

export const LEGAL_LINKS = [
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
  { href: '/stornobedingungen', label: 'Stornobedingungen' },
] as const
