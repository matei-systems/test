import Link from 'next/link'
import { dashboardStats, upcomingAgenda } from '@/lib/admin-data'
import { getSettings } from '@/lib/catalog'
import { isEmailConfigured, adminRecipient } from '@/lib/email'
import { formatCalendarDate, formatEuro, formatTime } from '@/lib/format'
import { zonedParts } from '@/lib/time'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Icon } from '@/components/icons'

export const metadata = { title: 'Übersicht' }

export default async function DashboardPage() {
  const [stats, agenda, settings] = await Promise.all([dashboardStats(), upcomingAgenda(14), getSettings()])
  const b = settings.business
  const missingLegal = [!b.ownerName && 'Inhaber/Name', !b.street && 'Anschrift', !b.email && 'E-Mail', !b.phone && 'Telefon'].filter(Boolean)

  // Termine nach Tag gruppieren
  const groups = new Map<string, typeof agenda>()
  for (const item of agenda) {
    const day = zonedParts(new Date(item.starts_at)).date
    groups.set(day, [...(groups.get(day) ?? []), item])
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Übersicht</h1>
          <p>Neue Buchungen, anstehende Termine und offene Punkte auf einen Blick.</p>
        </div>
        <Link href="/admin/buchungen?status=neu" className="btn btn--primary btn--sm">
          Neue Buchungen prüfen
        </Link>
      </header>

      <div className="adm-stack" style={{ marginBottom: 16 }}>
        {!isEmailConfigured() && (
          <div className="adm-warn">
            <Icon name="alert" size={18} />
            <span>
              <strong>E-Mail-Versand nicht konfiguriert.</strong> Buchungen werden gespeichert, Kunden erhalten aber keine automatische
              Bestätigung. SMTP-Zugangsdaten als Umgebungsvariablen hinterlegen (siehe README).
            </span>
          </div>
        )}
        {isEmailConfigured() && !adminRecipient() && (
          <div className="adm-warn">
            <Icon name="alert" size={18} />
            <span>
              <code>ADMIN_NOTIFICATION_EMAIL</code> ist nicht gesetzt – du wirst über neue Buchungen nicht per E-Mail benachrichtigt.
            </span>
          </div>
        )}
        {missingLegal.length > 0 && (
          <div className="adm-warn">
            <Icon name="info" size={18} />
            <span>
              Unternehmensdaten unvollständig ({missingLegal.join(', ')}). Diese werden für Impressum und Kontakt benötigt –{' '}
              <Link href="/admin/einstellungen">jetzt ergänzen</Link>.
            </span>
          </div>
        )}
        {stats.emailProbleme > 0 && (
          <div className="adm-warn">
            <Icon name="mail" size={18} />
            <span>
              Bei {stats.emailProbleme} Buchung(en) konnte die Kunden-E-Mail nicht zugestellt werden. Bitte Kunden direkt kontaktieren.
            </span>
          </div>
        )}
      </div>

      <div className="adm-kpis">
        <Link href="/admin/buchungen?status=neu" className="adm-kpi adm-kpi--accent">
          <span>Neue Buchungen</span>
          <strong>{stats.neu}</strong>
        </Link>
        <Link href="/admin/buchungen?zeitraum=heute" className="adm-kpi">
          <span>Termine heute</span>
          <strong>{stats.heute}</strong>
        </Link>
        <Link href="/admin/buchungen?zeitraum=woche" className="adm-kpi">
          <span>Nächste 7 Tage</span>
          <strong>{stats.woche}</strong>
        </Link>
        <div className="adm-kpi">
          <span>Auftragsvolumen (Monat, {stats.monatAnzahl} Termine)</span>
          <strong>{formatEuro(stats.monatVolumen)}</strong>
        </div>
      </div>

      <section className="adm-card">
        <h2>Termine der nächsten 14 Tage</h2>
        <p className="adm-card-desc">Klicke auf einen Termin für Details und Aktionen.</p>
        {agenda.length === 0 ? (
          <p className="adm-empty">Keine anstehenden Termine.</p>
        ) : (
          <div>
            {[...groups.entries()].map(([day, items]) => (
              <div key={day}>
                <p className="adm-agenda-day">{formatCalendarDate(day)}</p>
                {items.map((bk) => (
                  <Link key={bk.id} href={`/admin/buchungen/${bk.id}`} className="adm-agenda-item">
                    <time>
                      {formatTime(bk.starts_at)}
                      <span className="sub">bis {formatTime(bk.ends_at)}</span>
                    </time>
                    <span>
                      <strong>
                        {bk.first_name} {bk.last_name}
                      </strong>
                      <span className="sub">
                        {bk.service_name} · {bk.vehicle_category_name} · {bk.postal_code} {bk.city}
                      </span>
                    </span>
                    <StatusBadge status={bk.status} />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
