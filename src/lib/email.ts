import 'server-only'
import { formatDateLong, formatDuration, formatEuro, formatPrice, formatTime, STATUS_LABELS } from './format'
import { getSiteUrl, SITE } from '@/config/site'
import type { BusinessInfo } from '@/config/defaults'

/**
 * E-Mail-Versand über SMTP (nodemailer) im Markendesign.
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

export interface Mail {
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
  kind: 'buchung' | 'anfrage'
  serviceName: string
  vehicleCategoryName: string
  addons: Array<{ name: string; priceCents: number; priceIsFrom: boolean }>
  servicePriceCents: number | null
  regularPriceCents: number | null
  discountCents: number
  promotionName: string | null
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
  houseNumber: string
  postalCode: string
  city: string
  locationNote: string | null
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

export function addressLine(d: { street: string; houseNumber: string; postalCode: string; city: string }): string {
  return `${d.street}${d.houseNumber ? ` ${d.houseNumber}` : ''}, ${d.postalCode} ${d.city}`
}

function bookingRows(data: BookingMailData): Array<[string, string]> {
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
  out.push(['Standort', addressLine(data) + (data.locationNote ? ` – ${data.locationNote}` : '')])
  if (data.totalPriceCents === null) {
    out.push(['Preis', 'auf Anfrage – du erhältst vor Beginn ein verbindliches Angebot'])
  } else {
    if (data.discountCents > 0 && data.regularPriceCents !== null) {
      out.push(['Regulärer Preis', formatEuro(data.regularPriceCents)])
      out.push([data.promotionName || 'Rabatt', `−${formatEuro(data.discountCents)}`])
    }
    out.push(['Endpreis', formatPrice(data.totalPriceCents, { from: data.priceIsFrom })])
  }
  return out
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f3f2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f2ef;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0b0b0c;padding:28px 32px"><div style="color:#f4efe6;font-size:14px;letter-spacing:.2em;font-weight:600;text-transform:uppercase">${esc(SITE.name)}</div><div style="color:#c8b48a;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin-top:6px">${esc(SITE.claim)}</div></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:22px;color:#111;font-weight:600">${esc(title)}</h1>
${bodyHtml}
</td></tr></table>
<p style="color:#8a8a8a;font-size:11px;margin:16px 0 0">${esc(SITE.name)} · ${esc(SITE.claim)} · Graz &amp; Graz-Umgebung</p>
</td></tr></table></body></html>`
}

function table(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows
    .map(
      ([k, v]) => {
        // Der tatsächlich zu zahlende Preis wird hervorgehoben
        const strong = k === 'Endpreis'
        return `<tr><td style="padding:10px 0;color:${strong ? '#111' : '#6b6b6b'};font-size:13px;font-weight:${strong ? 600 : 400};width:42%;vertical-align:top;border-bottom:1px solid #eee">${esc(k)}</td><td style="padding:10px 0;color:#111;font-size:${strong ? 17 : 14}px;font-weight:${strong ? 600 : 400};vertical-align:top;border-bottom:1px solid #eee">${esc(v)}</td></tr>`
      },
    )
    .join('')}</table>`
}

function button(url: string, label: string): string {
  return `<p style="margin:28px 0 0"><a href="${esc(url)}" style="display:inline-block;background:#0b0b0c;color:#f4efe6;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:13px;letter-spacing:.08em;text-transform:uppercase">${esc(label)}</a></p>`
}

function bookingLayout(title: string, intro: string, data: BookingMailData, footer: string): string {
  return shell(
    title,
    `<p style="margin:0 0 24px;color:#333;font-size:15px;line-height:1.6">${intro}</p>
${table(bookingRows(data))}
${data.confirmationUrl ? button(data.confirmationUrl, 'Buchung ansehen') : ''}
<p style="margin:28px 0 0;color:#555;font-size:13px;line-height:1.6">${footer}</p>`,
  )
}

function strip(html: string): string {
  return html.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')
}

function bookingText(title: string, intro: string, data: BookingMailData, footer: string): string {
  return [
    title,
    '',
    strip(intro),
    '',
    ...bookingRows(data).map(([k, v]) => `${k}: ${v}`),
    '',
    data.confirmationUrl ? `Buchung ansehen: ${data.confirmationUrl}` : '',
    strip(footer),
  ].join('\n')
}

function contactLine(business: BusinessInfo): string {
  const parts: string[] = []
  if (business.phone) parts.push(`Telefon ${esc(business.phone)}`)
  if (business.email) parts.push(`E-Mail ${esc(business.email)}`)
  return parts.length
    ? `Fragen oder Änderungswünsche? Antworte einfach auf diese E-Mail oder erreiche uns unter ${parts.join(' bzw. ')}.`
    : 'Fragen oder Änderungswünsche? Antworte einfach auf diese E-Mail.'
}

function bookingMail(to: string, subject: string, title: string, intro: string, data: BookingMailData, footer: string, replyTo?: string): Mail {
  return { to, subject, html: bookingLayout(title, intro, data, footer), text: bookingText(title, intro, data, footer), replyTo }
}

/** Eingangsbestätigung an den Kunden (Buchung oder unverbindliche Terminanfrage). */
export function customerBookingMail(data: BookingMailData, business: BusinessInfo): Mail {
  const name = esc(data.firstName)
  let title: string
  let intro: string
  let subject: string
  if (data.kind === 'anfrage') {
    title = 'Deine Terminanfrage ist eingegangen'
    intro = `Hallo ${name}, vielen Dank für deine Anfrage! Dein Wunschtermin ist vorgemerkt. Die Anfrage ist unverbindlich – du erhältst von uns ein Angebot und buchst erst mit deiner Zusage.`
    subject = `Terminanfrage ${data.reference} – ${SITE.name}`
  } else if (data.status === 'bestaetigt') {
    title = 'Dein Termin ist bestätigt'
    intro = `Hallo ${name}, vielen Dank für deine Buchung! Dein Termin ist verbindlich bestätigt. Wir kommen zur vereinbarten Zeit an den angegebenen Standort.`
    subject = `Terminbestätigung ${data.reference} – ${SITE.name}`
  } else {
    title = 'Deine Buchung ist eingegangen'
    intro = `Hallo ${name}, vielen Dank für deine Buchung! Dein Termin ist für dich reserviert. Wir prüfen die Details und bestätigen dir den Termin in Kürze persönlich.`
    subject = `Buchungseingang ${data.reference} – ${SITE.name}`
  }
  const footer = `${contactLine(business)}<br><br>Es gelten unsere AGB und Stornobedingungen: ${esc(getSiteUrl())}/stornobedingungen`
  return bookingMail(data.email, subject, title, intro, data, footer, business.email || undefined)
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
      intro = `Hallo ${esc(data.firstName)}, vielen Dank, dass du ${esc(SITE.name)} dein Fahrzeug anvertraut hast. Wir freuen uns, wenn du uns wieder buchst${business.reviewUrl ? ` – und über deine ehrliche Bewertung: ${esc(business.reviewUrl)}` : ''}.`
      break
    default:
      return null
  }
  return bookingMail(data.email, `${title} – ${data.reference}`, title, intro, data, contactLine(business), business.email || undefined)
}

export function customerRescheduleMail(data: BookingMailData, business: BusinessInfo): Mail {
  const title = 'Dein Termin wurde geändert'
  const intro = `Hallo ${esc(data.firstName)}, dein Termin wurde wie besprochen geändert. Hier sind die aktuellen Details:`
  return bookingMail(data.email, `${title} – ${data.reference}`, title, intro, data, contactLine(business), business.email || undefined)
}

/** Terminerinnerung am Vortag. */
export function customerReminderMail(data: BookingMailData, business: BusinessInfo): Mail {
  const title = 'Erinnerung: Dein Termin bei RM Mobile Autoaufbereitung'
  const intro = `Hallo ${esc(data.firstName)}, wir freuen uns auf deinen Termin am <strong>${esc(formatDateLong(data.startsAt))} um ${esc(formatTime(data.startsAt))} Uhr</strong>. Bitte stelle sicher, dass dein Fahrzeug am vereinbarten Standort zugänglich ist und persönliche Gegenstände ausgeräumt sind.`
  return bookingMail(data.email, `Terminerinnerung ${data.reference} – ${SITE.name}`, title, intro, data, contactLine(business), business.email || undefined)
}

/** Bestätigung einer vom Kunden selbst durchgeführten Online-Stornierung. */
export function customerCancelledMail(data: BookingMailData, business: BusinessInfo): Mail {
  const title = 'Dein Termin wurde storniert'
  const intro = `Hallo ${esc(data.firstName)}, wir haben deine Stornierung erhalten. Der Termin ist storniert. Gerne kannst du jederzeit online einen neuen Termin buchen.`
  return bookingMail(data.email, `Stornierung ${data.reference} – ${SITE.name}`, title, intro, { ...data, status: 'storniert', confirmationUrl: undefined }, contactLine(business), business.email || undefined)
}

export function adminNewBookingMail(data: BookingMailData, adminUrl: string): Mail | null {
  const to = adminRecipient()
  if (!to) return null
  const label = data.kind === 'anfrage' ? 'Neue Terminanfrage' : 'Neue Buchung'
  const title = `${label} ${data.reference}`
  const intro = `${label} von <strong>${esc(data.firstName)} ${esc(data.lastName)}</strong> (${esc(data.phone)}, ${esc(data.email)}). Status: ${esc(STATUS_LABELS[data.status] ?? data.status)}.${data.customerMessage ? `<br><br>Nachricht: „${esc(data.customerMessage)}“` : ''}`
  const footer = `Im Admin-Bereich öffnen: <a href="${esc(adminUrl)}">${esc(adminUrl)}</a>`
  const d = { ...data, confirmationUrl: undefined }
  return bookingMail(to, `${title} – ${formatDateLong(data.startsAt)} ${formatTime(data.startsAt)}`, title, intro, d, footer, data.email)
}

export function adminCancelledMail(data: BookingMailData, adminUrl: string): Mail | null {
  const to = adminRecipient()
  if (!to) return null
  const title = `Stornierung ${data.reference}`
  const intro = `<strong>${esc(data.firstName)} ${esc(data.lastName)}</strong> hat den Termin online storniert. Der Zeitraum ist wieder frei.`
  const footer = `Im Admin-Bereich öffnen: <a href="${esc(adminUrl)}">${esc(adminUrl)}</a>`
  return bookingMail(to, `${title} – ${formatDateLong(data.startsAt)} ${formatTime(data.startsAt)}`, title, intro, { ...data, status: 'storniert', confirmationUrl: undefined }, footer, data.email)
}

export interface InquiryMailData {
  name: string
  email: string
  phone: string
  topic: string
  message: string
}

export function adminInquiryMail(data: InquiryMailData, adminUrl: string): Mail | null {
  const to = adminRecipient()
  if (!to) return null
  const title = `Neue Anfrage: ${data.topic}`
  const rows: Array<[string, string]> = [
    ['Name', data.name],
    ['E-Mail', data.email],
  ]
  if (data.phone) rows.push(['Telefon', data.phone])
  rows.push(['Thema', data.topic])
  const html = shell(
    title,
    `${table(rows)}<p style="margin:20px 0 0;color:#111;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(data.message)}</p>
<p style="margin:24px 0 0;color:#555;font-size:13px">Im Admin-Bereich öffnen: <a href="${esc(adminUrl)}">${esc(adminUrl)}</a></p>`,
  )
  const text = [title, '', ...rows.map(([k, v]) => `${k}: ${v}`), '', data.message, '', adminUrl].join('\n')
  return { to, subject: `${title} – ${data.name}`, html, text, replyTo: data.email }
}

/** Eingangsbestätigung für das Kontaktformular. */
export function customerInquiryMail(data: InquiryMailData, business: BusinessInfo): Mail {
  const title = 'Wir haben deine Nachricht erhalten'
  const html = shell(
    title,
    `<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.6">Hallo ${esc(data.name)}, vielen Dank für deine Nachricht. Wir melden uns so schnell wie möglich bei dir.</p>
<p style="margin:0;color:#555;font-size:14px;line-height:1.6;white-space:pre-wrap;border-left:3px solid #c8b48a;padding-left:14px">${esc(data.message)}</p>`,
  )
  const text = [title, '', `Hallo ${data.name}, vielen Dank für deine Nachricht. Wir melden uns so schnell wie möglich bei dir.`, '', data.message].join('\n')
  return { to: data.email, subject: `Deine Anfrage bei ${SITE.name}`, html, text, replyTo: business.email || undefined }
}

/** Technischer Fehler → Hinweis an den Administrator (höchstens einmal je 15 Minuten und Fehlerart). */
const lastErrorMail = new Map<string, number>()
export async function notifyAdminError(context: string, err: unknown): Promise<void> {
  const to = adminRecipient()
  if (!to || !isEmailConfigured()) return
  const now = Date.now()
  if (now - (lastErrorMail.get(context) ?? 0) < 15 * 60_000) return
  lastErrorMail.set(context, now)
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  const title = 'Technischer Fehler auf der Website'
  const html = shell(
    title,
    `<p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6">Bereich: <strong>${esc(context)}</strong></p>
<p style="margin:0;color:#555;font-size:13px;line-height:1.6;font-family:monospace;white-space:pre-wrap">${esc(message.slice(0, 1500))}</p>
<p style="margin:16px 0 0;color:#555;font-size:13px">Zeitpunkt: ${esc(new Date(now).toISOString())}. Weitere Details stehen in den Server-Logs des Hostings.</p>`,
  )
  await sendMail({ to, subject: `⚠ ${title}: ${context}`, html, text: `${title}\n${context}\n${message}` })
}
