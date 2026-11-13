import type { Metadata } from 'next'
import './admin.css'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | RM Admin' },
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
