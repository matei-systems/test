import { NextResponse, type NextRequest } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { getSettings } from '@/lib/catalog'
import { adminInquiryMail, customerInquiryMail, notifyAdminError, sendMail } from '@/lib/email'
import { isSameOrigin } from '@/lib/http'
import { notifyWebhook } from '@/lib/notify'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { fieldErrors, inquirySchema } from '@/lib/validation'
import { getSiteUrl } from '@/config/site'

export const dynamic = 'force-dynamic'

/** POST /api/kontakt – Kontaktanfrage speichern und Administrator benachrichtigen. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Ungültige Herkunft der Anfrage.' }, { status: 403 })
  const parsed = inquirySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bitte prüfen Sie Ihre Angaben.', fields: fieldErrors(parsed.error) }, { status: 422 })
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Das Kontaktformular ist gerade nicht verfügbar. Bitte kontaktieren Sie uns direkt.' }, { status: 503 })
  }
  try {
    const limit = await rateLimit('kontakt', clientIp(request.headers), 5, 60 * 60)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' }, { status: 429 })
    }
    const d = parsed.data
    const db = await getDb()
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO inquiries (name, email, phone, topic, message, privacy_accepted_at) VALUES ($1,$2,$3,$4,$5, now()) RETURNING id`,
      [d.name, d.email.toLowerCase(), d.phone, d.topic, d.message],
    )
    // Ab hier ist die Anfrage gespeichert – E-Mail-Probleme sind im Admin-Bereich sichtbar
    const settings = await getSettings()
    const adminUrl = `${getSiteUrl()}/admin/anfragen`
    const adminMail = adminInquiryMail(d, adminUrl)
    const [adminRes] = await Promise.all([
      adminMail ? sendMail(adminMail) : Promise.resolve({ status: 'nicht_konfiguriert' as const }),
      sendMail(customerInquiryMail(d, settings.business)),
      notifyWebhook('kontakt.neu', { name: d.name, topic: d.topic, phone: d.phone, adminUrl }),
    ])
    await db.query('UPDATE inquiries SET admin_email_status = $2 WHERE id = $1', [rows[0].id, adminRes.status]).catch(() => undefined)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[api/kontakt]', err)
    void notifyAdminError('Kontaktformular', err)
    return NextResponse.json({ error: 'Ihre Nachricht konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.' }, { status: 500 })
  }
}
