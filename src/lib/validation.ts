import { z } from 'zod'
import { isValidDateString, isValidTimeString } from './time'

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

export const customerSchema = z.object({
  firstName: name('Vornamen'),
  lastName: name('Nachnamen'),
  phone: z
    .string()
    .trim()
    .min(6, 'Bitte gib eine gültige Telefonnummer ein.')
    .max(30, 'Telefonnummer ist zu lang.')
    .regex(/^\+?[\d\s/()-]{6,}$/, 'Bitte gib eine gültige Telefonnummer ein.')
    .refine((v) => v.replace(/\D/g, '').length >= 6, 'Bitte gib eine gültige Telefonnummer ein.'),
  email: z.string().trim().max(160, 'E-Mail-Adresse ist zu lang.').pipe(z.email('Bitte gib eine gültige E-Mail-Adresse ein.')),
  street: z.string().trim().min(3, 'Bitte gib Straße und Hausnummer ein.').max(120, 'Adresse ist zu lang.'),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Bitte gib eine gültige österreichische Postleitzahl (4 Ziffern) ein.'),
  city: z.string().trim().min(2, 'Bitte gib den Ort ein.').max(80, 'Ort ist zu lang.'),
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
  privacyAccepted: z.literal(true, 'Bitte bestätige die Datenschutzerklärung.'),
  termsAccepted: z.literal(true, 'Bitte akzeptiere die AGB und Stornobedingungen.'),
  /** Honeypot-Feld gegen Spam-Bots – muss leer bleiben */
  website: z.string().max(0).optional().default(''),
})

export type BookingRequest = z.infer<typeof bookingRequestSchema>
export type CustomerInput = z.infer<typeof customerSchema>

/** Zod-Fehler → { feldpfad: meldung } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
