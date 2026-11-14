import { BUSINESS_TZ } from './time'

const NBSP = ' '

/** 11900 → "119 €", 2950 → "29,50 €" */
export function formatEuro(cents: number): string {
  const negative = cents < 0
  const abs = Math.abs(cents)
  const euros = Math.floor(abs / 100)
  const rest = abs % 100
  const eurosStr = euros.toLocaleString('de-AT').replace(/\s/g, '.')
  const body = rest === 0 ? eurosStr : `${eurosStr},${String(rest).padStart(2, '0')}`
  return `${negative ? '−' : ''}${body}${NBSP}€`
}

export function formatPrice(cents: number | null, opts: { from?: boolean } = {}): string {
  if (cents === null) return 'auf Anfrage'
  return `${opts.from ? `ab${NBSP}` : ''}${formatEuro(cents)}`
}

/** 150 → "2,5 Std.", 240 → "4 Std.", 345 → "5 Std. 45 Min.", 45 → "45 Min." */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}${NBSP}Min.`
  if (minutes % 30 === 0) {
    const hours = minutes / 60
    return `${Number.isInteger(hours) ? hours : String(hours).replace('.', ',')}${NBSP}Std.`
  }
  return `${Math.floor(minutes / 60)}${NBSP}Std. ${minutes % 60}${NBSP}Min.`
}

/**
 * Dauer-Spanne einer Leistung über alle Fahrzeugkategorien – mit denselben exakten Werten, die auch in der
 * Preisliste, in der Buchung und in der Bestätigung stehen (keine Rundung): "ca. 1 Std. 15 Min. – 2 Std.".
 */
export function formatDurationRange(min: number, max: number): string {
  if (min === max) return `ca. ${formatDuration(max)}`
  const unit = (s: string) => s.replace(/^[\d,]+/, '').trim()
  const a = formatDuration(min)
  const b = formatDuration(max)
  // Gleiche Einheit ("2,5 Std." und "3,5 Std.") → kompakt "ca. 2,5–3,5 Std."
  if (unit(a) === unit(b) && /^[\d,]+\s?\S+\.$/.test(a) && /^[\d,]+\s?\S+\.$/.test(b)) {
    return `ca. ${a.replace(/[^\d,].*$/, '')}–${b}`
  }
  return `ca. ${a} – ${b}`
}

const dateLong = new Intl.DateTimeFormat('de-AT', {
  timeZone: BUSINESS_TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const dateShort = new Intl.DateTimeFormat('de-AT', {
  timeZone: BUSINESS_TZ,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat('de-AT', { timeZone: BUSINESS_TZ, hour: '2-digit', minute: '2-digit' })
const dateTimeFmt = new Intl.DateTimeFormat('de-AT', {
  timeZone: BUSINESS_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** "Montag, 9. November 2026" */
export function formatDateLong(d: Date | string): string {
  return dateLong.format(toDate(d))
}
/** "Mo., 09.11.2026" */
export function formatDateShort(d: Date | string): string {
  return dateShort.format(toDate(d))
}
/** "09:30" */
export function formatTime(d: Date | string): string {
  return timeFmt.format(toDate(d))
}
export function formatDateTime(d: Date | string): string {
  return dateTimeFmt.format(toDate(d))
}

/** "31.01.2027" */
export function formatDateOnly(d: Date | string): string {
  return new Intl.DateTimeFormat('de-AT', { timeZone: BUSINESS_TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(toDate(d))
}

/** Kalenderdatum "YYYY-MM-DD" (ohne Zeitzonen-Verschiebung) → "Montag, 9. November 2026" */
export function formatCalendarDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('de-AT', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}

function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d
}

export const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export const STATUS_LABELS: Record<string, string> = {
  neu: 'Neu',
  bestaetigt: 'Bestätigt',
  in_bearbeitung: 'In Bearbeitung',
  abgeschlossen: 'Abgeschlossen',
  storniert: 'Storniert',
}

export const KIND_LABELS: Record<string, string> = {
  buchung: 'Buchung',
  anfrage: 'Terminanfrage',
}

export const EMAIL_STATUS_LABELS: Record<string, string> = {
  gesendet: 'gesendet',
  fehlgeschlagen: 'fehlgeschlagen',
  nicht_konfiguriert: 'nicht konfiguriert',
  ausstehend: 'ausstehend',
  nicht_gesendet: 'nicht gesendet',
}

/** Telefonnummer für tel:-Links normalisieren */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

/** WhatsApp-Link (wa.me erwartet internationale Nummer ohne + und Leerzeichen) */
export function whatsappHref(number: string, text?: string): string {
  let digits = number.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  else if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = `43${digits.slice(1)}`
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** ["Kleinwagen","Kompaktklasse"] → "Kleinwagen & Kompaktklasse"; ab drei Einträgen "Kleinwagen bis Kombi" */
export function formatVehicleList(names: string[]): string {
  if (names.length <= 2) return names.join(' & ')
  return `${names[0]} bis ${names[names.length - 1]}`
}
