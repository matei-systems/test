import Link from 'next/link'
import { Logo } from './Logo'
import { Icon } from '../icons'
import { FOOTER_LINKS, LEGAL_LINKS, NAV_LINKS, SITE } from '@/config/site'
import type { BusinessInfo, ServiceArea } from '@/config/defaults'
import { telHref, whatsappHref } from '@/lib/format'
import styles from './Footer.module.css'

export function Footer({ business, area, bookingEnabled = true }: { business: BusinessInfo; area: ServiceArea; bookingEnabled?: boolean }) {
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
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
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
                    <a href={whatsappHref(business.whatsapp, SITE.whatsappText)} target="_blank" rel="noopener noreferrer">
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
              <p className={styles.muted}>
                {bookingEnabled ? (
                  <>
                    Schreib uns über das <Link href="/kontakt">Kontaktformular</Link> oder buche direkt online.
                  </>
                ) : (
                  'Online-Buchung und Kontaktmöglichkeiten folgen in Kürze.'
                )}
              </p>
            )}
            <p className={styles.area}>
              <Icon name="pin" size={16} /> <Link href="/einsatzgebiet">Einsatzgebiet: {area.regions.join(', ')}</Link>
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
        {SITE.shortName}
      </div>
    </footer>
  )
}
