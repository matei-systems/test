import type { Metadata } from 'next'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { getCatalog, getSettings } from '@/lib/catalog'
import { Icon } from '@/components/icons'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Termin online buchen',
  description:
    'Mobile Fahrzeugpflege in Graz & Graz-Umgebung online buchen: Leistung wählen, Fahrzeug angeben, freien Wunschtermin auswählen – in wenigen Klicks.',
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
            Dein Termin in <span className="serif accent">wenigen Klicks.</span>
          </h1>
          <p className={styles.points}>
            <span>
              <Icon name="check" size={16} /> Nur freie Termine
            </span>
            <span>
              <Icon name="check" size={16} /> Sofortige Buchungsnummer
            </span>
            <span>
              <Icon name="check" size={16} /> Wir kommen zu dir
            </span>
          </p>
        </header>
        {catalog.services.length === 0 || catalog.vehicles.length === 0 ? (
          <div className="notice notice--warn">
            <Icon name="info" /> Die Online-Buchung ist gerade nicht verfügbar. Bitte versuche es später erneut.
          </div>
        ) : (
          <BookingWizard
            catalog={catalog}
            initialService={str(params.leistung)}
            initialVehicle={str(params.fahrzeug)}
            maxAdvanceDays={settings.rules.maxAdvanceDays}
            bufferMinutes={settings.rules.bufferMinutes}
          />
        )}
      </div>
    </div>
  )
}
