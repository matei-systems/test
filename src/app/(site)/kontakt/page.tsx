import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { ContactForm } from '@/components/pages/ContactForm'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getSettings, getWorkingHours } from '@/lib/catalog'
import { isDatabaseConfigured } from '@/lib/db'
import { breadcrumbJsonLd } from '@/lib/seo'
import { telHref, WEEKDAYS_LONG, whatsappHref } from '@/lib/format'
import { SITE } from '@/config/site'
import styles from '@/components/pages/Pages.module.css'

export const metadata: Metadata = {
  title: 'Kontakt – mobile Fahrzeugpflege in Graz anfragen',
  description:
    'Kontakt zu RM Mobile Autoaufbereitung: Schreib uns über das Kontaktformular, per WhatsApp oder ruf an. Mobile Premium-Fahrzeugpflege in Graz & Graz-Umgebung – auch für Firmen und Autohäuser.',
  alternates: { canonical: '/kontakt' },
}

/** Aufeinanderfolgende Tage mit gleichen Zeiten zusammenfassen: „Montag – Freitag 08:00–18:00“ */
function groupHours(hours: Array<{ weekday: number; isOpen: boolean; open: string; close: string }>) {
  const out: Array<{ label: string; value: string }> = []
  const sorted = [...hours].sort((a, b) => a.weekday - b.weekday)
  let i = 0
  while (i < sorted.length) {
    const value = sorted[i].isOpen ? `${sorted[i].open} – ${sorted[i].close} Uhr` : 'geschlossen'
    let j = i
    while (j + 1 < sorted.length && (sorted[j + 1].isOpen ? `${sorted[j + 1].open} – ${sorted[j + 1].close} Uhr` : 'geschlossen') === value) j++
    const from = WEEKDAYS_LONG[sorted[i].weekday - 1]
    const to = WEEKDAYS_LONG[sorted[j].weekday - 1]
    out.push({ label: i === j ? from : `${from} – ${to}`, value })
    i = j + 1
  }
  return out
}

export default async function ContactPage() {
  const [{ business, area }, hours] = await Promise.all([getSettings(), getWorkingHours()])
  const hasDirect = Boolean(business.phone || business.whatsapp || business.email)
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Kontakt', path: '/kontakt' }])} />
      <PageHero
        eyebrow="Kontakt"
        title={
          <>
            Sprechen wir über <span className="serif accent">dein Fahrzeug.</span>
          </>
        }
        lead="Fragen zu Leistungen, ein Angebot für mehrere Fahrzeuge oder ein besonderer Wunsch? Schreib uns – wir melden uns so schnell wie möglich."
      />
      <section className="section">
        <div className={`container ${styles.contact}`}>
          <div>
            <h2 className="h3" style={{ marginBottom: 20 }}>
              Direkter Kontakt
            </h2>
            <ul className={styles.channels}>
              {business.whatsapp && (
                <li>
                  <a href={whatsappHref(business.whatsapp, SITE.whatsappText)} className={styles.channel} target="_blank" rel="noopener noreferrer">
                    <span className={styles.channelIcon}>
                      <Icon name="whatsapp" size={22} />
                    </span>
                    <span>
                      <strong>WhatsApp</strong>
                      <small>Nachricht mit vorbereitetem Text senden</small>
                    </span>
                    <Icon name="external" size={18} />
                  </a>
                </li>
              )}
              {business.phone && (
                <li>
                  <a href={telHref(business.phone)} className={styles.channel}>
                    <span className={styles.channelIcon}>
                      <Icon name="phone" size={22} />
                    </span>
                    <span>
                      <strong>{business.phone}</strong>
                      <small>Telefon</small>
                    </span>
                    <Icon name="arrow-right" size={18} />
                  </a>
                </li>
              )}
              {business.email && (
                <li>
                  <a href={`mailto:${business.email}`} className={styles.channel}>
                    <span className={styles.channelIcon}>
                      <Icon name="mail" size={22} />
                    </span>
                    <span>
                      <strong>{business.email}</strong>
                      <small>E-Mail</small>
                    </span>
                    <Icon name="arrow-right" size={18} />
                  </a>
                </li>
              )}
              <li>
                <Link href="/buchen" className={styles.channel}>
                  <span className={styles.channelIcon}>
                    <Icon name="calendar" size={22} />
                  </span>
                  <span>
                    <strong>Termin online buchen</strong>
                    <small>Freie Termine sofort sehen</small>
                  </span>
                  <Icon name="arrow-right" size={18} />
                </Link>
              </li>
              <li>
                <Link href="/einsatzgebiet" className={styles.channel}>
                  <span className={styles.channelIcon}>
                    <Icon name="pin" size={22} />
                  </span>
                  <span>
                    <strong>Einsatzgebiet</strong>
                    <small>{area.regions.join(' & ')}</small>
                  </span>
                  <Icon name="arrow-right" size={18} />
                </Link>
              </li>
            </ul>
            {!hasDirect && (
              <p className="field-hint" style={{ marginTop: 16 }}>
                Telefonnummer und WhatsApp folgen in Kürze – bis dahin erreichst du uns über das Formular.
              </p>
            )}
            <div className={styles.hours}>
              <h2>Einsatzzeiten</h2>
              {groupHours(hours).map((h) => (
                <div key={h.label}>
                  <span>{h.label}</span>
                  <span>{h.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formCard}>
            <h2 className="h3" style={{ marginBottom: 6 }}>
              Nachricht schreiben
            </h2>
            <p className="muted" style={{ marginBottom: 24, fontSize: '0.95rem' }}>
              Für einen konkreten Termin geht es am schnellsten über die{' '}
              <Link href="/buchen" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Online-Buchung
              </Link>
              .
            </p>
            <ContactForm enabled={isDatabaseConfigured()} />
          </div>
        </div>
      </section>
    </>
  )
}
