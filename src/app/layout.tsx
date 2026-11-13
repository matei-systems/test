import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { getSiteUrl, SITE } from '@/config/site'
import './globals.css'

const geist = localFont({
  src: './fonts/Geist-Variable.woff2',
  variable: '--font-geist',
  weight: '100 900',
  display: 'swap',
})

const instrument = localFont({
  src: [
    { path: './fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--font-instrument',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE.name} – Fahrzeugpflege in Graz & Umgebung`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: SITE.name,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: SITE.name,
    title: `${SITE.name} – ${SITE.claim} in Graz`,
    description: SITE.description,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${SITE.name} – ${SITE.claim} in Graz` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} – ${SITE.claim} in Graz`,
    description: SITE.description,
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#09090a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-AT" className={`${geist.variable} ${instrument.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Aktiviert Scroll-Animationen nur, wenn JavaScript verfügbar ist (kein Aufblitzen) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
