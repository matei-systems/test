'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from './Logo'
import { Icon } from '../icons'
import { NAV_LINKS } from '@/config/site'
import styles from './Header.module.css'

export function Header({ phone }: { phone?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Menü bei Navigation schließen
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const isBooking = pathname?.startsWith('/buchen')

  return (
    <header className={`${styles.header} ${scrolled || open ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <Logo />
        </Link>

        <nav className={styles.nav} aria-label="Hauptnavigation">
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.navLink}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          {!isBooking && (
            <Link href="/buchen" className={`btn btn--primary btn--sm ${styles.cta}`}>
              Termin buchen
            </Link>
          )}
          <button
            type="button"
            className={styles.burger}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className={`${styles.mobile} ${open ? styles.mobileOpen : ''}`} hidden={!open}>
        <nav aria-label="Mobile Navigation" className="container">
          <ul className={styles.mobileList}>
            {NAV_LINKS.map((l, i) => (
              <li key={l.href} style={{ ['--i' as string]: i }}>
                <Link href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                  <Icon name="arrow-right" size={20} />
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.mobileFoot}>
            <Link href="/buchen" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
              Termin jetzt buchen
              <Icon name="arrow-right" />
            </Link>
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="btn btn--ghost btn--block">
                <Icon name="phone" /> {phone}
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
