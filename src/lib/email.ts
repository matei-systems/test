import 'server-only'
import { formatDateLong, formatDuration, formatPrice, formatTime, STATUS_LABELS } from './format'
import { getSiteUrl, SITE } from '@/config/site'
import type { BusinessInfo } from '@/config/defaults'

/**
 * E-Mail-Versand über SMTP (nodemailer).
 * Ist SMTP nicht konfiguriert, wird nichts versendet und der Status "nicht_konfiguriert"
 * zurückgegeben – der Admin sieht das je Buchung. Es wird nie ein Versand vorgetäuscht.
 */

export type EmailStatus = 'gesendet' | 'fehlgeschlagen' | 'nicht_konfiguriert'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM)
}

export function adminRecipient(): string | null {
  return process.env.ADMIN_NOTIFICATION_EMAIL || null
}

interface Mail {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

let transporterPromise: Promise<import('nodemailer').Transporter> | null = null

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = import('nodemailer').then((nodemailer) =>
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      }),
    )
  }
  return transporterPromise
}

export async function sendMail(mail: Mail): Promise<{ status: EmailStatus; error?: string }> {
  if (!isEmailConfigured()) return { status: 'nicht_konfiguriert' }
  try {
    const transporter = await getTransporter()
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo,
    })
    return { status: 'gesendet' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[email] Versand fehlgeschlagen:', message)
    return { status: 'fehlgeschlagen', error: message.slice(0, 500) }
  }
}

// ─── Vorlagen ───────────────────────────────────────────────────────────────────

export interface BookingMailData {
  reference: string
  status: string
  serviceName: string
  vehicleCategoryName: string
  addons: Array<{ name: string; priceCents: number; priceIsFrom: boolean }>
  servicePriceCents: number | null
  totalPriceCents: number | null
  priceIsFrom: boolean
  durationMinutes: number
  startsAt: Date
  endsAt: Date
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  postalCode: string
  city: string
  vehicleModel: string
  licensePlate: string | null
  customerMessage: string | null
  confirmationUrl?: string
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function rows(data: BookingMailData): Array<[string, string]> {
  const out: Array<[string, string]> = [
    ['Buchungsnummer', data.reference],
    ['Termin', `${formatDateLong(data.startsAt)}, ${formatTime(data.startsAt)} Uhr`],
    ['Voraussichtliche Dauer', formatDuration(data.durationMinutes)],
    ['Leistung', data.serviceName],
    ['Fahrzeug', `${data.vehicleCategoryName} – ${data.vehicleModel}${data.licensePlate ? ` (${data.licensePlate})` : ''}`],
  ]
  if (data.addons.length) {
    out.push(['Zusatzleistungen', data.addons.map((a) => `${a.name} (${formatPrice(a.priceCents, { from: a.priceIsFrom })})`).join(', ')])
  }
  out.push(['Standort', `${data.street}, ${data.postalCode} ${data.city}`])
  out.push([
    'Preis',
    data.totalPriceCents === null
      ? 'auf Anfrage – du erhältst vor Beginn ein verbindliches Angebot'
      : `${formatPrice(data.totalPriceCents, { from: data.priceIsFrom })} (Endpreis)`,
  ])
  return out
}

function layout(title: string, intro: string, data: BookingMailData, footer: string): string {
  const table = rows(data)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;color:#6b6b6b;font-size:13px;width:42%;vertical-align:top;border-bottom:1px solid #eee">${esc(k)}</td><td style="padding:10px 0;color:#111;font-size:14px;vertical-align:top;border-bottom:1px solid #eee">${esc(v)}</td></tr>`,
    )
    .join('')
  const button = data.confirmationUrl
    ? `<p style="margin:28px 0 0"><a href="${esc(data.confirmationUrl)}" style="display:inline-block;background:#0b0b0c;color:#f4efe6;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:13px;letter-spacing:.08em;text-transform:uppercase">Buchung ansehen</a></p>`
    : ''
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f3f2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f2ef;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0b0b0c;padding:28px 32px"><div style="color:#f4efe6;font-size:18px;letter-spacing:.32em;font-weight:600">GLANZMOBIL</div><div style="color:#c8b48a;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin-top:6px">${esc(SITE.claim)}</div></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:22px;color:#111;font-weight:600">${esc(title)}</h1>
<p style="margin:0 0 24px;color:#333;font-size:15px;line-height:1.6">${intro}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${table}</table>
${button}
<p style="margin:28px 0 0;color:#555;font-size:13px;line-height:1.6">${footer}</p>
</td></tr></table>
<p style="color:#8a8a8a;font-size:11px;margin:16px 0 0">${esc(SITE.name)} · ${esc(SITE.claim)} · Graz &amp; Graz-Umgebung</p>
</td></tr></table></body></html>`
}

function textVersion(title: string, intro: string, data: BookingMailData, footer: string): string {
  return [title, '', intro.replace(/<[^>]+>/g, ''), '', ...rows(data).map(([k, v]) => `${k}: ${v}`), '', data.confirmationUrl ? `Buchung ansehen: ${data.confirmationUrl}` : '', footer.replace(/<[^>]+>/g, '')]
    .filter((l) => l !== undefined)
    .join('\n')
}

function contactLine(business: BusinessInfo): string {
  const parts: string[] = []
  if (business.phone) parts.push(`Telefon ${esc(business.phone)}`)
  if (business.email) parts.push(`E-Mail ${esc(business.email)}`)
  return parts.length
    ? `Fragen oder Änderungswünsche? Antworte einfach auf diese E-Mail oder erreiche uns unter ${parts.join(' bzw. ')}.`
    : 'Fragen oder Änderungswünsche? Antworte einfach auf diese E-Mail.'
}

export function customerBookingMail(data: BookingMailData, business: BusinessInfo): Mail {
  const confirmed = data.status === 'bestaetigt'
  const title = confirmed ? 'Dein Termin ist bestätigt' : 'Deine Buchung ist eingegangen'
  const intro = confirmed
    ? `Hallo ${esc(data.firstName)}, vielen Dank für deine Buchung! Dein Termin ist verbindlich bestätigt. Wir kommen zur vereinbarten Zeit an den angegebenen Standort.`
    : `Hallo ${esc(data.firstName)}, vielen Dank für deine Buchung! Dein Termin ist für dich reserviert. Wir prüfen die Details und bestätigen dir den Termin in Kürze persönlich.`
  const footer = `${contactLine(business)}<br><br>Es gelten unsere AGB und Stornobedingungen: ${esc(getSiteUrl())}/stornobedingungen`
  return {
    to: data.email,
    subject: `${confirmed ? 'Terminbestätigung' : 'Buchungseingang'} ${data.reference} – ${SITE.name}`,
    html: layout(title, intro, data, footer),
    text: textVersion(title, intro, data, footer),
    replyTo: business.email || undefined,
  }
}

export function customerStatusMail(data: BookingMailData, business: BusinessInfo, reason?: string): Mail | null {
  let title: string
  let intro: string
  switch (data.status) {
    case 'bestaetigt':
      title = 'Dein Termin ist bestätigt'
      intro = `Hallo ${esc(data.firstName)}, dein Termin ist jetzt verbindlich bestätigt. Wir freuen uns auf dein Fahrzeug!`
      break
    case 'storniert':
      title = 'Dein Termin wurde storniert'
      intro = `Hallo ${esc(data.firstName)}, dein Termin wurde storniert.${reason ? ` Hinweis: ${esc(reason)}` : ''} Gerne kannst du jederzeit online einen neuen Termin buchen.`
      break
    case 'abgeschlossen':
      title = 'Vielen Dank für deinen Auftrag'
      intro = `Hallo ${esc(data.firstName)}, vielen Dank, dass du ${esc(SITE.name)} dein Fahrzeug anvertraut hast. Wir freuen uns, wenn du uns wieder buchst.`
      break
    default:
      return null
  }
  const footer = contactLine(business)
  return {
    to: data.email,
    subject: `${title} – ${data.reference}`,
    html: layout(title, intro, data, footer),
    text: textVersion(title, intro, data, footer),
    replyTo: business.email || undefined,
  }
}

export function customerRescheduleMail(data: BookingMailData, business: BusinessInfo): Mail {
  const title = 'Dein Termin wurde geändert'
  const intro = `Hallo ${esc(data.firstName)}, dein Termin wurde wie besprochen geändert. Hier sind die aktuellen Details:`
  const footer = contactLine(business)
  return {
    to: data.email,
    subject: `${title} – ${data.reference}`,
    html: layout(title, intro, data, footer),
    text: textVersion(title, intro, data, footer),
    replyTo: business.email || undefined,
  }
}

export function adminNewBookingMail(data: BookingMailData, adminUrl: string): Mail | null {
  const to = adminRecipient()
  if (!to) return null
  const title = `Neue Buchung ${data.reference}`
  const intro = `Neue Online-Buchung von <strong>${esc(data.firstName)} ${esc(data.lastName)}</strong> (${esc(data.phone)}, ${esc(data.email)}). Status: ${esc(STATUS_LABELS[data.status] ?? data.status)}.${data.customerMessage ? `<br><br>Nachricht: „${esc(data.customerMessage)}“` : ''}`
  const footer = `Im Admin-Bereich öffnen: <a href="${esc(adminUrl)}">${esc(adminUrl)}</a>`
  return {
    to,
    subject: `🗓 ${title} – ${formatDateLong(data.startsAt)} ${formatTime(data.startsAt)}`,
    html: layout(title, intro, { ...data, confirmationUrl: undefined }, footer),
    text: textVersion(title, intro, { ...data, confirmationUrl: undefined }, footer),
    replyTo: data.email,
  }
}
