import { SITE } from '@/config/site'

/**
 * Markenzeichen von RM Mobile Autoaufbereitung: das Monogramm „RM“ (Geist SemiBold, als Pfad) mit einem
 * goldenen Glanzpunkt. Funktioniert auf dunklem (tone="light") und hellem Hintergrund (tone="dark").
 *
 * Die Pfaddaten sind identisch zu scripts/build-brand-assets.mjs (Logo-Dateien, Favicon, Open-Graph-Bild).
 */
export const RM_MONOGRAM_PATH =
  'M6.59 40L2.69 40L2.69 18.70L11.59 18.70Q13.90 18.70 15.58 19.48Q17.27 20.26 18.20 21.70Q19.13 23.14 19.13 25.09Q19.13 27.01 18.06 28.34Q17 29.68 15.43 30.16Q18.50 30.61 18.77 33.85L19.30 40L15.34 40L14.89 34.42Q14.80 33.13 14.08 32.55Q13.37 31.96 11.69 31.96L6.59 31.96L6.59 40M6.59 22.09L6.59 28.54L11.36 28.54Q13.09 28.54 14.10 27.71Q15.11 26.89 15.11 25.33Q15.11 23.77 14.08 22.93Q13.06 22.09 11.17 22.09 M26.95 40L23.05 40L23.05 18.70L28.30 18.70L34.18 35.20L40.06 18.70L45.31 18.70L45.31 40L41.41 40L41.41 25.30L36.04 39.97L32.32 39.97L26.95 25.30'
export const GLINT_PATH = 'M41 3.6Q41 9 46.4 9 41 9 41 14.4 41 9 35.6 9 41 9 41 3.6Z'

export function LogoMark({ size = 36, tone = 'light', title }: { size?: number; tone?: 'light' | 'dark'; title?: string }) {
  const ink = tone === 'light' ? '#f4f1ea' : '#0b0b0c'
  const glint = tone === 'light' ? '#c8b48a' : '#9a8256'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={RM_MONOGRAM_PATH} fill={ink} />
      <path d={GLINT_PATH} fill={glint} />
    </svg>
  )
}

/**
 * Logo-Lockup: Monogramm „RM“ + zweizeilig „MOBILE / AUTOAUFBEREITUNG“. Zusammen gelesen ergibt das den Namen
 * „RM Mobile Autoaufbereitung“; Screenreader bekommen den vollständigen Namen vorgelesen.
 */
export function Logo({ tone = 'light', compact = false }: { tone?: 'light' | 'dark'; compact?: boolean }) {
  const color = tone === 'light' ? 'var(--text)' : '#0b0b0c'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? 10 : 12, color }}>
      <span className="sr-only">{SITE.name}</span>
      <LogoMark size={compact ? 30 : 34} tone={tone} />
      <span aria-hidden="true" style={{ display: 'grid', lineHeight: 1 }}>
        <span
          className="logo-eyebrow"
          style={{
            marginBottom: 5,
            fontSize: 8.5,
            fontWeight: 500,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            color: tone === 'light' ? 'var(--accent)' : '#8a7448',
          }}
        >
          Mobile
        </span>
        <span style={{ fontSize: compact ? 11.5 : 12.5, fontWeight: 600, letterSpacing: '0.22em', marginRight: '-0.22em' }}>AUTOAUFBEREITUNG</span>
      </span>
    </span>
  )
}
