import { z } from 'zod'
import { isValidDateString, isValidTimeString } from './time'

// Kein eval/new Function (kompatibel mit unserer Content-Security-Policy ohne 'unsafe-eval')
z.config({ jitless: true })

/** Gemeinsame Validierung – im Browser (Sofort-Feedback) und auf dem Server (verbindlich). */

const slug = z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/)

export const quoteSchema = z.object({
  serviceId: slug,
  vehicleId: slug,
  addonIds: z.array(slug).max(12).default([]),
})

export const dateSchema = z.string().refine(isValidDateString, 'Ungültiges Datum.')
export const timeSchema = z.string().refine(isValidTimeString, 'Ungültige Uhrzeit.')

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Bitte gib deinen ${label} ein.`)
    .max(60, `${label} ist zu lang.`)
    .regex(/^[\p{L}\p{M}' .-]+$/u, `Bitte gib einen gültigen ${label} ein.`)

const phone = z
  .string()
  .trim()
  .min(6, 'Bitte gib eine gültige Telefonnummer ein.')
  .max(30, 'Telefonnummer ist zu lang.')
  .regex(/^\+?[\d\s/()-]{6,}$/, 'Bitte gib eine gültige Telefonnummer ein.')
  .refine((v) => v.replace(/\D/g, '').length >= 6, 'Bitte gib eine gültige Telefonnummer ein.')

const email = z.string().trim().max(160, 'E-Mail-Adresse ist zu lang.').pipe(z.email('Bitte gib eine gültige E-Mail-Adresse ein.'))

export const customerSchema = z.object({
  firstName: name('Vornamen'),
  lastName: name('Nachnamen'),
  phone,
  email,
  street: z.string().trim().min(2, 'Bitte gib die Straße ein.').max(100, 'Straße ist zu lang.'),
  houseNumber: z
    .string()
    .trim()
    .min(1, 'Bitte gib die Hausnummer ein.')
    .max(20, 'Hausnummer ist zu lang.')
    .regex(/^[\p{L}\d\s/.-]+$/u, 'Bitte gib eine gültige Hausnummer ein.'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Bitte gib eine gültige österreichische Postleitzahl (4 Ziffern) ein.'),
  city: z.string().trim().min(2, 'Bitte gib den Ort ein.').max(80, 'Ort ist zu lang.'),
  locationNote: z.string().trim().max(300, 'Der Hinweis darf maximal 300 Zeichen lang sein.').optional().default(''),
  vehicleModel: z.string().trim().min(2, 'Bitte gib Marke und Modell an.').max(80, 'Fahrzeugangabe ist zu lang.'),
  licensePlate: z
    .string()
    .trim()
    .max(15, 'Kennzeichen ist zu lang.')
    .regex(/^[\p{L}\d\s-]*$/u, 'Bitte gib ein gültiges Kennzeichen ein.')
    .optional()
    .default(''),
  message: z.string().trim().max(1000, 'Die Nachricht darf maximal 1000 Zeichen lang sein.').optional().default(''),
})

export const bookingRequestSchema = quoteSchema.extend({
  date: dateSchema,
  time: timeSchema,
  customer: customerSchema,
  /** Endpreis in Cent, den der Kunde gesehen hat (null = Preis auf Anfrage) – der Server prüft ihn gegen seine Berechnung */
  expectedTotalCents: z.number().int().min(0).max(10_000_000).nullable(),
  privacyAccepted: z.literal(true, 'Bitte bestätige die Datenschutzerklärung.'),
  termsAccepted: z.literal(true, 'Bitte akzeptiere die AGB und Stornobedingungen.'),
  /** Optionale Einwilligung in Angebote/Neuigkeiten per E-Mail */
  marketingConsent: z.boolean().optional().default(false),
  /** Honeypot-Feld gegen Spam-Bots – muss leer bleiben */
  website: z.string().max(0).optional().default(''),
})

export type BookingRequest = z.infer<typeof bookingRequestSchema>
export type CustomerInput = z.infer<typeof customerSchema>

export const INQUIRY_TOPICS = ['Allgemeine Frage', 'Terminanfrage', 'Firmen & Flotten', 'Autohaus / Händler', 'Sonstiges'] as const

export const inquirySchema = z.object({
  name: z.string().trim().min(2, 'Bitte gib deinen Namen ein.').max(100, 'Name ist zu lang.'),
  email,
  phone: z.union([z.literal(''), phone]).optional().default(''),
  topic: z.enum(INQUIRY_TOPICS).default('Allgemeine Frage'),
  message: z.string().trim().min(10, 'Bitte beschreibe dein Anliegen (mind. 10 Zeichen).').max(2000, 'Die Nachricht darf maximal 2000 Zeichen lang sein.'),
  privacyAccepted: z.literal(true, 'Bitte bestätige die Datenschutzerklärung.'),
  website: z.string().max(0).optional().default(''),
})

export type InquiryRequest = z.infer<typeof inquirySchema>

/** Zod-Fehler → { feldpfad: meldung } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
