'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '../icons'

const ITEMS: Array<{ href: string; label: string; icon: IconName; exact?: boolean; badge?: 'bookings' | 'inquiries' }> = [
  { href: '/admin', label: 'Übersicht', icon: 'grid', exact: true },
  { href: '/admin/buchungen', label: 'Buchungen', icon: 'list', badge: 'bookings' },
  { href: '/admin/kalender', label: 'Kalender', icon: 'calendar' },
  { href: '/admin/anfragen', label: 'Anfragen', icon: 'inbox', badge: 'inquiries' },
  { href: '/admin/kunden', label: 'Kunden', icon: 'users' },
  { href: '/admin/leistungen', label: 'Leistungen & Preise', icon: 'tag' },
  { href: '/admin/aktionen', label: 'Aktionen & Rabatte', icon: 'percent' },
  { href: '/admin/galerie', label: 'Galerie', icon: 'image' },
  { href: '/admin/statistiken', label: 'Statistiken', icon: 'chart' },
  { href: '/admin/verfuegbarkeit', label: 'Verfügbarkeit', icon: 'clock' },
  { href: '/admin/einstellungen', label: 'Einstellungen', icon: 'settings' },
]

export function AdminNav({ newCount, inquiryCount = 0 }: { newCount: number; inquiryCount?: number }) {
  const pathname = usePathname()
  return (
    <nav className="adm-nav" aria-label="Admin-Navigation">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const count = item.badge === 'bookings' ? newCount : item.badge === 'inquiries' ? inquiryCount : 0
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
            <Icon name={item.icon} size={18} />
            {item.label}
            {count > 0 && (
              <span className="count" aria-label={`${count} neu`}>
                {count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
