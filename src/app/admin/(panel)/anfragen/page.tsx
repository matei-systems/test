import Link from 'next/link'
import { listInquiries } from '@/lib/admin-data'
import { EMAIL_STATUS_LABELS, formatDateTime, telHref } from '@/lib/format'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { Icon } from '@/components/icons'
import { deleteInquiryAction, setInquiryStatusAction } from '../../actions'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Anfragen' }

const FILTERS = [
  { key: '', label: 'Alle' },
  { key: 'neu', label: 'Offen' },
  { key: 'erledigt', label: 'Erledigt' },
]

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin()
  const { status = '' } = await searchParams
  const items = await listInquiries(status)
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Anfragen</h1>
          <p>Nachrichten aus dem Kontaktformular der Website. Terminanfragen mit „Preis auf Anfrage“ findest du unter Buchungen.</p>
        </div>
      </header>

      <div className="adm-chips" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `/admin/anfragen?status=${f.key}` : '/admin/anfragen'} className="adm-chip" aria-current={status === f.key ? 'true' : undefined}>
            {f.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <section className="adm-card">
          <p className="adm-empty">Keine Anfragen{status === 'neu' ? ' offen' : ''}.</p>
        </section>
      ) : (
        <div className="adm-stack">
          {items.map((i) => (
            <article key={i.id} className="adm-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <h2 style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {i.name}
                  <span className={`adm-pill ${i.status === 'neu' ? 'adm-pill--on' : 'adm-pill--off'}`}>{i.status === 'neu' ? 'offen' : 'erledigt'}</span>
                </h2>
                <time style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{formatDateTime(i.created_at)}</time>
              </div>
              <p className="adm-card-desc">
                {i.topic || 'Allgemeine Frage'} · <a href={`mailto:${i.email}`}>{i.email}</a>
                {i.phone && (
                  <>
                    {' '}
                    · <a href={telHref(i.phone)}>{i.phone}</a>
                  </>
                )}
                {i.admin_email_status !== 'gesendet' && <> · Benachrichtigung per E-Mail: {EMAIL_STATUS_LABELS[i.admin_email_status] ?? i.admin_email_status}</>}
              </p>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '0.95rem' }}>{i.message}</p>
              <div className="adm-actions" style={{ marginTop: 16 }}>
                <a href={`mailto:${i.email}?subject=${encodeURIComponent('Deine Anfrage bei RM Mobile Auto Aufbereitung')}`} className="adm-btn">
                  <Icon name="mail" size={15} /> Per E-Mail antworten
                </a>
                <ActionForm action={setInquiryStatusAction}>
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="status" value={i.status === 'neu' ? 'erledigt' : 'neu'} />
                  <SubmitButton className={`adm-btn ${i.status === 'neu' ? 'adm-btn--ok' : ''}`} pendingText="…">
                    <Icon name={i.status === 'neu' ? 'check' : 'arrow-left'} size={15} /> {i.status === 'neu' ? 'Als erledigt markieren' : 'Wieder öffnen'}
                  </SubmitButton>
                </ActionForm>
                <ActionForm action={deleteInquiryAction} confirm="Anfrage endgültig löschen?">
                  <input type="hidden" name="id" value={i.id} />
                  <SubmitButton className="adm-btn adm-btn--danger" pendingText="…">
                    <Icon name="trash" size={15} /> Löschen
                  </SubmitButton>
                </ActionForm>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
