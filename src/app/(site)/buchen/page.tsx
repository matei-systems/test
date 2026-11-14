import type { Metadata } from 'next'
import { BookingWizard } from '@/components/booking/BookingWizard'
import Link from 'next/link'
import { getCatalog, getSettings } from '@/lib/catalog'
import { isDatabaseConfigured } from '@/lib/db'
import { telHref, whatsappHref } from '@/lib/format'
import { Icon } from '@/components/icons'
import { SITE } from '@/config/site'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Termin online buchen',
  description:
    'Mobile Autoaufbereitung in Graz & Graz-Umgebung online buchen: Leistung wählen, Fahrzeug angeben, freien Wunschtermin auswählen – in wenigen Klicks.',
  alternates: { canonical: '/buchen' },
}

export default async function BookingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()])
  const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow">Online-Buchung</p>
          <h1 className="h2">
            Ihr Termin in <span className="serif accent">wenigen Klicks.</span>
          </h1>
          {isDatabaseConfigured() && (
          <p className={styles.points}>
            <span>
              <Icon name="check" size={16} /> Nur freie Termine
            </span>
            <span>
              <Icon name="check" size={16} /> Sofortige Buchungsnummer
            </span>
            <span>
              <Icon name="check" size={16} /> Wir kommen zu Ihnen
            </span>
          </p>
          )}
        </header>
        {!isDatabaseConfigured() ? (
          <div className={styles.soon}>
            <span className={styles.soonIcon} aria-hidden="true">
              <Icon name="calendar" size={28} />
            </span>
            <h2 className="h3">Die Online-Buchung startet in Kürze.</h2>
            <p className="muted">
              Wir richten die Terminbuchung gerade ein. Bis dahin werden hier keine Buchungen angenommen – damit kein Termin verloren geht.
            </p>
            {(settings.business.phone || settings.business.whatsapp || settings.business.email) && (
              <div className={styles.soonActions}>
                {settings.business.whatsapp && (
                  <a href={whatsappHref(settings.business.whatsapp, SITE.whatsappText)} className="btn btn--primary" target="_blank" rel="noopener noreferrer">
                    <Icon name="whatsapp" /> Per WhatsApp anfragen
                  </a>
                )}
                {settings.business.phone && (
                  <a href={telHref(settings.business.phone)} className="btn btn--ghost">
                    <Icon name="phone" /> {settings.business.phone}
                  </a>
                )}
                {settings.business.email && (
                  <a href={`mailto:${settings.business.email}`} className="btn btn--ghost">
                    <Icon name="mail" /> E-Mail schreiben
                  </a>
                )}
              </div>
            )}
            <Link href="/preise" className="link-arrow">
              Leistungen &amp; Preise ansehen <Icon name="arrow-right" />
            </Link>
          </div>
        ) : catalog.services.length === 0 || catalog.vehicles.length === 0 ? (
          <div className="notice notice--warn">
            <Icon name="info" /> Die Online-Buchung ist gerade nicht verfügbar. Bitte versuchen Sie es später erneut.
          </div>
        ) : (
          <BookingWizard
            catalog={catalog}
            initialService={str(params.leistung)}
            initialVehicle={str(params.fahrzeug)}
            now={Date.now()}
            postalCodes={settings.area.postalCodes}
            regions={settings.area.regions}
            cancelHours={settings.rules.cancelHours}
            autoConfirm={settings.rules.autoConfirm}
            initialCoupon={str(params.gutschein)}
          />
        )}
      </div>
    </div>
  )
}
