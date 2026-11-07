'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '../icons'

const ITEMS: Array<{ href: string; label: string; icon: IconName; exact?: boolean }> = [
  { href: '/admin', label: 'Übersicht', icon: 'grid', exact: true },
  { href: '/admin/buchungen', label: 'Buchungen', icon: 'calendar' },
  { href: '/admin/kunden', label: 'Kunden', icon: 'user' },
  { href: '/admin/verfuegbarkeit', label: 'Verfügbarkeit', icon: 'clock' },
  { href: '/admin/leistungen', label: 'Leistungen & Preise', icon: 'tag' },
  { href: '/admin/einstellungen', label: 'Einstellungen', icon: 'settings' },
]

export function AdminNav({ newCount }: { newCount: number }) {
  const pathname = usePathname()
  return (
    <nav className="adm-nav" aria-label="Admin-Navigation">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
            <Icon name={item.icon} size={18} />
            {item.label}
            {item.href === '/admin/buchungen' && newCount > 0 && <span className="count">{newCount}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
