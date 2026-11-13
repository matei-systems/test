import { requireAdmin } from '@/lib/auth'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { AdminNav } from '@/components/admin/AdminNav'
import { LogoMark } from '@/components/site/Logo'
import { Icon } from '@/components/icons'
import { logoutAction } from '../actions'
import Link from 'next/link'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  const dbReady = isDatabaseConfigured()
  let newCount = 0
  let inquiryCount = 0
  if (dbReady) {
    const db = await getDb()
    const { rows } = await db.query<{ n: number }>("SELECT count(*) AS n FROM bookings WHERE status = 'neu' AND ends_at >= now()")
    newCount = Number(rows[0]?.n ?? 0)
    const inq = await db.query<{ n: number }>("SELECT count(*) AS n FROM inquiries WHERE status = 'neu'")
    inquiryCount = Number(inq.rows[0]?.n ?? 0)
  }
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={30} />
            <span>
              <span style={{ fontWeight: 600, letterSpacing: '0.24em', fontSize: '0.86rem' }}>RM</span>
              <small>Mobile Autoaufbereitung · Admin</small>
            </span>
          </Link>
          <form action={logoutAction} className="adm-mobile-logout">
            <button type="submit" className="adm-logout" aria-label="Abmelden">
              <Icon name="logout" size={16} />
            </button>
          </form>
        </div>
        <AdminNav newCount={newCount} inquiryCount={inquiryCount} />
        <div className="adm-side-foot">
          <span>Angemeldet als {session.username}</span>
          <Link href="/" target="_blank" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Icon name="external" size={14} /> Website ansehen
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="adm-logout">
              <Icon name="logout" size={16} /> Abmelden
            </button>
          </form>
        </div>
      </aside>
      <main className="adm-main" id="main">
        {dbReady ? (
          children
        ) : (
          <div className="adm-warn" role="alert">
            <Icon name="alert" size={18} />
            <span>
              <strong>Keine Datenbank verbunden.</strong> Setze die Umgebungsvariable <code>DATABASE_URL</code> (PostgreSQL, z. B. Supabase) im
              Hosting und deploye neu. Bis dahin ist die Online-Buchung deaktiviert und der Admin-Bereich nicht nutzbar (siehe README).
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
