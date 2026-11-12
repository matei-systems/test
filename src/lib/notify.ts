import 'server-only'

/**
 * Optionale Anbindung externer Kanäle (SMS, WhatsApp Business, Slack, Automationen …).
 *
 * Ist NOTIFY_WEBHOOK_URL gesetzt, wird bei wichtigen Ereignissen ein JSON-POST gesendet:
 *   { event: 'buchung.neu' | 'anfrage.neu' | 'buchung.storniert' | 'buchung.status' | 'kontakt.neu', data: {…}, sentAt }
 * Damit lassen sich z. B. über Make/Zapier/n8n oder einen eigenen Dienst SMS (Twilio) oder
 * WhatsApp-Business-Nachrichten auslösen – ohne dass Zugangsdaten in diesem Projekt liegen.
 * Optional signiert mit NOTIFY_WEBHOOK_SECRET (Header "x-glanzmobil-signature": HMAC-SHA256 des Bodys, hex).
 */
export type NotifyEvent = 'buchung.neu' | 'anfrage.neu' | 'buchung.storniert' | 'buchung.status' | 'kontakt.neu'

export async function notifyWebhook(event: NotifyEvent, data: Record<string, unknown>): Promise<'gesendet' | 'fehlgeschlagen' | 'nicht_konfiguriert'> {
  const url = process.env.NOTIFY_WEBHOOK_URL
  if (!url) return 'nicht_konfiguriert'
  try {
    const body = JSON.stringify({ event, data, sentAt: new Date().toISOString() })
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    const secret = process.env.NOTIFY_WEBHOOK_SECRET
    if (secret) {
      const { createHmac } = await import('node:crypto')
      headers['x-glanzmobil-signature'] = createHmac('sha256', secret).update(body).digest('hex')
    }
    const res = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(5000) })
    return res.ok ? 'gesendet' : 'fehlgeschlagen'
  } catch (err) {
    console.error('[notify] Webhook fehlgeschlagen:', err instanceof Error ? err.message : err)
    return 'fehlgeschlagen'
  }
}
