import Image from 'next/image'
import { SITE } from '@/config/site'
import logo from '@/assets/rm6-logo.png'

/**
 * Logo von RM6 Autoaufbereitung.
 *
 * Verwendet ausschließlich das vom Inhaber gelieferte Logo (Original: brand/logo/RM6_Autoaufbereitung_Logo_Original.png).
 * src/assets/rm6-logo.png ist dieselbe Grafik, nur ohne die vollständig transparenten Außenränder und verkleinert
 * (scripts/build-brand-assets.mjs). Das Seitenverhältnis bleibt immer erhalten: Die Breite wird festgelegt,
 * die Höhe ergibt sich daraus; die Darstellungsgröße je Bildschirmbreite steuern die Klassen in globals.css.
 */
const VARIANTS = {
  header: 178,
  footer: 240,
  admin: 132,
  login: 240,
  page: 280,
} as const

export type LogoVariant = keyof typeof VARIANTS

export function Logo({ variant = 'header', eager = false }: { variant?: LogoVariant; eager?: boolean }) {
  const width = VARIANTS[variant]
  const height = Math.round((width * logo.height) / logo.width)
  return (
    <Image
      src={logo}
      alt={SITE.name}
      width={width}
      height={height}
      quality={80}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      placeholder="empty"
      className={`brand-logo brand-logo--${variant}`}
    />
  )
}
