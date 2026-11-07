/**
 * GLANZMOBIL Markenzeichen: ein offenes „G“ – wie die Lichtkante auf poliertem Lack –
 * mit einem Glanzpunkt in der Öffnung. Funktioniert auf dunklem (tone="light") und
 * hellem Hintergrund (tone="dark").
 */
export function LogoMark({ size = 36, tone = 'light', title }: { size?: number; tone?: 'light' | 'dark'; title?: string }) {
  const stroke = tone === 'light' ? '#f4f1ea' : '#0b0b0c'
  const glint = tone === 'light' ? '#c8b48a' : '#9a8256'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d="M36.2 12.3A17 17 0 1 0 41 24H27.5" stroke={stroke} strokeWidth="2.6" strokeLinecap="square" />
      <path d="M41 3.6Q41 9 46.4 9 41 9 41 14.4 41 9 35.6 9 41 9 41 3.6Z" fill={glint} />
    </svg>
  )
}

export function Logo({ tone = 'light', compact = false }: { tone?: 'light' | 'dark'; compact?: boolean }) {
  const color = tone === 'light' ? 'var(--text)' : '#0b0b0c'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color }}>
      <LogoMark size={compact ? 30 : 34} tone={tone} />
      <span style={{ display: 'grid', lineHeight: 1 }}>
        <span style={{ fontSize: compact ? 15 : 16, fontWeight: 600, letterSpacing: '0.32em', marginRight: '-0.32em' }}>GLANZMOBIL</span>
        {!compact && (
          <span
            style={{
              marginTop: 6,
              fontSize: 8.5,
              fontWeight: 500,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: tone === 'light' ? 'var(--accent)' : '#8a7448',
            }}
          >
            Mobile Premium Fahrzeugpflege
          </span>
        )}
      </span>
    </span>
  )
}
