'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '../icons'
import { telHref, whatsappHref } from '@/lib/format'
import { SITE } from '@/config/site'
import styles from './MobileCta.module.css'

/**
 * Feste Aktionsleiste am unteren Bildschirmrand (nur Smartphone):
 * Der Buchungsbutton ist jederzeit mit dem Daumen erreichbar, daneben WhatsApp und Anruf.
 * Im Buchungsprozess selbst wird sie ausgeblendet (dort gibt es eine eigene Leiste).
 */
export function MobileCta({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (pathname?.startsWith('/buchen')) return null

  return (
    <div className={`${styles.bar} ${visible ? styles.visible : ''}`} aria-hidden={!visible}>
      <Link href="/buchen" className={`btn btn--primary ${styles.book}`} tabIndex={visible ? 0 : -1}>
        Termin jetzt buchen <Icon name="arrow-right" />
      </Link>
      {whatsapp && (
        <a
          href={whatsappHref(whatsapp, SITE.whatsappText)}
          className={`${styles.icon} ${styles.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp-Nachricht senden"
          tabIndex={visible ? 0 : -1}
        >
          <Icon name="whatsapp" size={22} />
        </a>
      )}
      {phone && (
        <a href={telHref(phone)} className={styles.icon} aria-label={`Anrufen: ${phone}`} tabIndex={visible ? 0 : -1}>
          <Icon name="phone" size={20} />
        </a>
      )}
    </div>
  )
}
