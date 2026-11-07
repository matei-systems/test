import Link from 'next/link'
import { Logo } from './Logo'
import { Icon } from '../icons'
import { LEGAL_LINKS, NAV_LINKS, SITE } from '@/config/site'
import type { BusinessInfo, ServiceArea } from '@/config/defaults'
import { telHref, whatsappHref } from '@/lib/format'
import styles from './Footer.module.css'

export function Footer({ business, area }: { business: BusinessInfo; area: ServiceArea }) {
  const year = new Date().getFullYear()
  const hasContact = Boolean(business.phone || business.email || business.whatsapp)
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Logo />
            <p className={styles.claim}>
              Mobile Premium-Fahrzeugpflege in {area.regions.join(' & ')}. Wir kommen zu dir – nach Hause, zum Arbeitsplatz oder an
              einen vereinbarten Standort.
            </p>
            <Link href="/buchen" className="btn btn--primary btn--sm">
              Termin buchen <Icon name="arrow-right" />
            </Link>
          </div>

          <nav aria-label="Footer-Navigation" className={styles.col}>
            <p className={styles.colTitle}>Entdecken</p>
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/buchen">Online buchen</Link>
              </li>
            </ul>
          </nav>

          <div className={styles.col}>
            <p className={styles.colTitle}>Kontakt</p>
            {hasContact ? (
              <ul>
                {business.phone && (
                  <li>
                    <a href={telHref(business.phone)}>
                      <Icon name="phone" size={16} /> {business.phone}
                    </a>
                  </li>
                )}
                {business.whatsapp && (
                  <li>
                    <a href={whatsappHref(business.whatsapp)} target="_blank" rel="noopener noreferrer">
                      <Icon name="whatsapp" size={16} /> WhatsApp
                    </a>
                  </li>
                )}
                {business.email && (
                  <li>
                    <a href={`mailto:${business.email}`}>
                      <Icon name="mail" size={16} /> {business.email}
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className={styles.muted}>Am schnellsten erreichst du uns über die Online-Buchung.</p>
            )}
            <p className={styles.area}>
              <Icon name="pin" size={16} /> Einsatzgebiet: {area.regions.join(', ')}
            </p>
          </div>

          <nav aria-label="Rechtliches" className={styles.col}>
            <p className={styles.colTitle}>Rechtliches</p>
            <ul>
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p>
            © {year} {business.companyName || SITE.name}. Alle Rechte vorbehalten.
          </p>
          <p className={styles.muted}>Keine Cookies zu Werbe- oder Analysezwecken.</p>
        </div>
      </div>
      <div className={styles.wordmark} aria-hidden="true">
        GLANZMOBIL
      </div>
    </footer>
  )
}
