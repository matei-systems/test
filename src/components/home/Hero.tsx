import Link from 'next/link'
import { getImageProps } from 'next/image'
import { Icon } from '../icons'
import { formatEuro } from '@/lib/format'
import styles from './Hero.module.css'

export function Hero({ fromPrice, regions }: { fromPrice: number | null; regions: string[] }) {
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
          <span className={styles.line}>Dein Fahrzeug.</span>
          <span className={styles.line}>Unser Anspruch.</span>
          <span className={`${styles.line} serif ${styles.accent}`}>Perfekter Glanz.</span>
        </h1>
        <p className={`lead ${styles.lead}`}>
          Premium Fahrzeugpflege – direkt bei dir vor Ort. Wir kommen nach Hause, zum Arbeitsplatz oder an deinen Wunschort in{' '}
          {regions.join(' & ')}.
        </p>
        <div className={styles.ctas}>
          <Link href="/buchen" className="btn btn--primary">
            Termin jetzt buchen <Icon name="arrow-right" />
          </Link>
          <Link href="/#leistungen" className="btn btn--ghost">
            Leistungen entdecken
          </Link>
        </div>
        {fromPrice !== null && (
          <p className={styles.price}>
            <Icon name="tag" size={16} /> Transparente Preise ab {formatEuro(fromPrice)} · in wenigen Klicks online gebucht
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
              <strong>Innen- und Außenreinigung</strong>
              <span>Gründlich &amp; schonend von Hand</span>
            </span>
          </li>
          <li>
            <span className={styles.uspIcon}>
              <Icon name="pin" />
            </span>
            <span>
              <strong>{regions.join(' und ')}</strong>
              <span>Regional für dich unterwegs</span>
            </span>
          </li>
        </ul>
      </div>
    </section>
  )
}
