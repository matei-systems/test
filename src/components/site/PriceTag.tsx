import type { PriceInfo } from '@/lib/pricing'
import { formatDateOnly, formatEuro } from '@/lib/format'
import styles from './PriceTag.module.css'

/** „gültig bis“-Datum einer Aktion (das Ende ist exklusiv, daher 1 ms zurück). */
export function promoEndLabel(endsAt: string | null): string | null {
  if (!endsAt) return null
  return formatDateOnly(new Date(new Date(endsAt).getTime() - 1))
}

/** Rotes Rabatt-Kennzeichen, z. B. „−20 %“. */
export function DiscountBadge({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <span className={`${styles.badge} ${className}`}>
      <span className="sr-only">Rabatt: </span>−{percent}&nbsp;%
    </span>
  )
}

/**
 * Einheitliche Preisdarstellung.
 *  - Der tatsächlich zu zahlende Preis steht immer groß und eindeutig im Mittelpunkt.
 *  - Läuft eine Aktion, erscheinen ihr Name (z. B. „Einführungspreis“), das rote Rabatt-Kennzeichen
 *    und der reguläre Preis („Regulär 149 €“). Durchgestrichen wird der reguläre Preis nur,
 *    wenn das bei der Aktion im Admin-Bereich ausdrücklich aktiviert wurde.
 */
export function PriceTag({
  info,
  from = false,
  size = 'md',
  align = 'start',
  showEnd = true,
  suffix,
}: {
  info: PriceInfo
  /** „ab“ voranstellen (Preis gilt für die günstigste Fahrzeugkategorie) */
  from?: boolean
  size?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end'
  showEnd?: boolean
  suffix?: React.ReactNode
}) {
  if (info.priceCents === null) {
    return (
      <div className={`${styles.tag} ${styles[size]} ${styles[align]}`}>
        <p className={styles.request}>Preis auf Anfrage</p>
      </div>
    )
  }
  const promo = info.promotion && info.regularCents !== null && info.regularCents > info.priceCents ? info.promotion : null
  const end = promo && showEnd ? promoEndLabel(promo.endsAt) : null
  return (
    <div className={`${styles.tag} ${styles[size]} ${styles[align]}`}>
      {promo && (
        <p className={styles.label}>
          <span>{promo.name}</span>
          <DiscountBadge percent={promo.percent} />
        </p>
      )}
      <p className={styles.price}>
        {from && <span className={styles.from}>ab</span>}
        <span className={styles.amount}>{formatEuro(info.priceCents)}</span>
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </p>
      {promo && info.regularCents !== null && (
        <p className={styles.regular}>
          {promo.showStrikethrough ? (
            <>
              <span className="sr-only">Regulärer Preis: </span>
              <s>{formatEuro(info.regularCents)}</s>
            </>
          ) : (
            <>
              Regulär {from ? 'ab ' : ''}
              {formatEuro(info.regularCents)}
            </>
          )}
          {end && <span className={styles.until}> · gültig bis {end}</span>}
        </p>
      )}
    </div>
  )
}
