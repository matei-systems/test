import Link from 'next/link'
import { Icon } from '../icons'
import { whatsappHref } from '@/lib/format'
import { SITE } from '@/config/site'
import styles from './WhatsAppButton.module.css'

/**
 * Schwebender WhatsApp-Kontakt.
 * Wird nur angezeigt, wenn im Admin-Bereich eine WhatsApp-Nummer hinterlegt ist.
 * Auf dem Smartphone übernimmt die feste Aktionsleiste (MobileCta) den WhatsApp-Kontakt.
 * In der lokalen Entwicklung erscheint ohne Nummer ein Hinweis-Button zur Einstellungsseite.
 */
export function WhatsAppButton({ number }: { number: string }) {
  if (!number) {
    if (process.env.NODE_ENV !== 'development') return null
    return (
      <Link href="/admin/einstellungen" className={`${styles.fab} ${styles.dev}`} title="Nur in der Entwicklung sichtbar">
        <Icon name="whatsapp" size={22} />
        <span className={styles.label}>WhatsApp-Nummer im Admin hinterlegen</span>
      </Link>
    )
  }
  return (
    <a
      href={whatsappHref(number, SITE.whatsappText)}
      className={styles.fab}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Kontakt über WhatsApp (öffnet WhatsApp)"
    >
      <Icon name="whatsapp" size={24} />
      <span className={styles.label}>WhatsApp</span>
    </a>
  )
}
