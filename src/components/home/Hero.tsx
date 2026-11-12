import Link from 'next/link'
import { getImageProps } from 'next/image'
import { Icon } from '../icons'
import { DiscountBadge } from '../site/PriceTag'
import { formatEuro } from '@/lib/format'
import styles from './Hero.module.css'

export function Hero({
  fromPrice,
  promo,
  regions,
}: {
  fromPrice: number | null
  /** Laufende Aktion (z. B. Einführungspreis) – wird dezent unter den Buttons angezeigt */
  promo: { name: string; percent: number } | null
  regions: string[]
}) {
  const common = { alt: 'Schwarze, frisch polierte Limousine mit Tiefenglanz im Studiolicht', sizes: '100vw', quality: 80 }
  const {
    props: { srcSet: portrait },
  } = getImageProps({ ...common, src: '/images/hero-portrait.jpg', width: 708, height: 944 })
  const {
    props: { srcSet: landscape, ...rest },
  } = getImageProps({ ...common, src: '/images/hero.jpg', width: 1680, height: 944, priority: true })

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.media}>
        <picture>
          <source media="(max-width: 700px)" srcSet={portrait} />
          <source media="(min-width: 701px)" srcSet={landscape} />
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img {...rest} className={styles.img} fetchPriority="high" />
        </picture>
        <div className={styles.shade} />
        <div className={styles.sweep} aria-hidden="true" />
      </div>

      <div className={`container ${styles.content}`}>
        <p className={`eyebrow ${styles.eyebrow}`}>Mobile Premium Fahrzeugpflege · {regions[0] ?? 'Graz'}</p>
        <h1 id="hero-title" className={`display ${styles.title}`}>
          <span className={styles.line}>Dein Fahrzeug</span> <span className={styles.line}>verdient mehr als</span>{' '}
          <span className={styles.line}>
            nur eine <span className={`serif ${styles.accent}`}>Reinigung.</span>
          </span>
        </h1>
        <p className={`lead ${styles.lead}`}>
          <strong>Premium Fahrzeugpflege. Direkt bei dir vor Ort.</strong> Wir kommen nach Hause, zum Arbeitsplatz oder an deinen
          Wunschort in {regions.join(' & ')}.
        </p>
        <div className={styles.ctas}>
          <Link href="/buchen" className="btn btn--primary">
            Termin jetzt buchen <Icon name="arrow-right" />
          </Link>
          <Link href="/leistungen" className="btn btn--ghost">
            Unsere Leistungen
          </Link>
        </div>
        {fromPrice !== null && (
          <p className={styles.price}>
            {promo ? (
              <Link href="/preise" className={styles.promo}>
                <DiscountBadge percent={promo.percent} />
                <span>
                  {promo.name} – Pakete ab {formatEuro(fromPrice)}
                </span>
                <Icon name="arrow-right" size={14} />
              </Link>
            ) : (
              <>
                <Icon name="tag" size={16} /> Transparente Preise ab {formatEuro(fromPrice)} · in wenigen Klicks online gebucht
              </>
            )}
          </p>
        )}
      </div>

      <div className={styles.bar}>
        <ul className={`container ${styles.usps}`}>
          <li>
            <span className={styles.uspIcon}>
              <Icon name="van" />
            </span>
            <span>
              <strong>Mobile Fahrzeugpflege</strong>
              <span>Wir kommen zu dir</span>
            </span>
          </li>
          <li>
            <span className={styles.uspIcon}>
              <Icon name="sparkle" />
            </span>
            <span>
              <strong>Innen- und Außenpflege</strong>
              <span>Gründlich &amp; schonend von Hand</span>
            </span>
          </li>
          <li>
            <span className={styles.uspIcon}>
              <Icon name="pin" />
            </span>
            <span>
              <strong>{regions[0] ?? 'Graz'} und Umgebung</strong>
              <span>Regional für dich unterwegs</span>
            </span>
          </li>
        </ul>
      </div>
    </section>
  )
}
