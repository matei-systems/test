import { describe, expect, it } from 'vitest'
import { calculateQuote, servicePriceRange, type Catalog } from '@/lib/pricing'
import { DEFAULT_ADDONS, DEFAULT_SERVICES, DEFAULT_VEHICLE_CATEGORIES } from '@/config/defaults'
import { formatDuration, formatDurationRange, formatEuro, formatPrice, whatsappHref } from '@/lib/format'
import { isPostalCodeAllowed } from '@/lib/catalog'
import { bookingRequestSchema } from '@/lib/validation'

const catalog: Catalog = {
  vehicles: DEFAULT_VEHICLE_CATEGORIES.map((v, i) => ({ ...v, sort: i, active: true })),
  services: DEFAULT_SERVICES.map((s, i) => ({
    id: s.id,
    name: s.name,
    tagline: s.tagline,
    description: s.description,
    includes: s.includes,
    priceNote: s.priceNote,
    requiresAddon: Boolean(s.requiresAddon),
    featured: Boolean(s.featured),
    sort: i,
    active: true,
    prices: Object.fromEntries(Object.entries(s.prices).map(([k, p]) => [k, { priceCents: p.price, durationMinutes: p.minutes }])),
  })),
  addons: DEFAULT_ADDONS.map((a, i) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    priceCents: a.priceCents,
    priceIsFrom: Boolean(a.priceIsFrom),
    durationMinutes: a.minutes,
    bookableAlone: a.bookableAlone,
    sort: i,
    active: true,
  })),
}

describe('Startpreise laut Briefing', () => {
  it('Innenraum Premium 119 €, Außenreinigung Premium 99 €, Komplettreinigung ab 189 €', () => {
    const range = (id: string) => servicePriceRange(catalog.services.find((s) => s.id === id)!, catalog.vehicles)
    expect(range('innenraumreinigung').min).toBe(11900)
    expect(range('aussenreinigung').min).toBe(9900)
    expect(range('komplettreinigung').min).toBe(18900)
    expect(range('premium-aufbereitung').onRequest).toBe(true)
  })
})

describe('calculateQuote', () => {
  it('berechnet Preis und Dauer inkl. Zusatzleistungen', () => {
    const r = calculateQuote(catalog, { serviceId: 'innenraumreinigung', vehicleId: 'suv', addonIds: ['tierhaarentfernung'] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.quote.servicePriceCents).toBe(14900)
    expect(r.quote.totalPriceCents).toBe(14900 + 3900)
    expect(r.quote.durationMinutes).toBe(180 + 45)
    expect(r.quote.priceIsFrom).toBe(false)
  })

  it('kennzeichnet "ab"-Preise', () => {
    const r = calculateQuote(catalog, { serviceId: 'aussenreinigung', vehicleId: 'kleinwagen', addonIds: ['starke-verschmutzung'] })
    expect(r.ok && r.quote.priceIsFrom).toBe(true)
  })

  it('Preis auf Anfrage bleibt null', () => {
    const r = calculateQuote(catalog, { serviceId: 'premium-aufbereitung', vehicleId: 'van', addonIds: [] })
    expect(r.ok && r.quote.totalPriceCents).toBe(null)
  })

  it('"Nur Zusatzleistungen" verlangt mindestens eine allein buchbare Zusatzleistung', () => {
    expect(calculateQuote(catalog, { serviceId: 'zusatzleistungen', vehicleId: 'van', addonIds: [] }).ok).toBe(false)
    expect(calculateQuote(catalog, { serviceId: 'zusatzleistungen', vehicleId: 'van', addonIds: ['starke-verschmutzung'] }).ok).toBe(false)
    const r = calculateQuote(catalog, { serviceId: 'zusatzleistungen', vehicleId: 'van', addonIds: ['polsterreinigung'] })
    expect(r.ok && r.quote.totalPriceCents).toBe(5900)
  })

  it('lehnt unbekannte oder doppelte Auswahl ab', () => {
    expect(calculateQuote(catalog, { serviceId: 'gibtsnicht', vehicleId: 'suv', addonIds: [] }).ok).toBe(false)
    expect(calculateQuote(catalog, { serviceId: 'aussenreinigung', vehicleId: 'lkw', addonIds: [] }).ok).toBe(false)
    expect(calculateQuote(catalog, { serviceId: 'aussenreinigung', vehicleId: 'suv', addonIds: ['x'] }).ok).toBe(false)
    expect(
      calculateQuote(catalog, { serviceId: 'aussenreinigung', vehicleId: 'suv', addonIds: ['detailreinigung', 'detailreinigung'] }).ok,
    ).toBe(false)
  })

  it('Komplettreinigung ist günstiger als Innen + Außen einzeln', () => {
    for (const v of catalog.vehicles) {
      const get = (id: string) => {
        const r = calculateQuote(catalog, { serviceId: id, vehicleId: v.id, addonIds: [] })
        return r.ok ? (r.quote.totalPriceCents as number) : NaN
      }
      expect(get('komplettreinigung')).toBeLessThan(get('innenraumreinigung') + get('aussenreinigung'))
    }
  })
})

describe('Formatierung', () => {
  it('Euro', () => {
    expect(formatEuro(11900)).toBe('119 €')
    expect(formatEuro(2950)).toBe('29,50 €')
    expect(formatPrice(18900, { from: true })).toBe('ab 189 €')
    expect(formatPrice(null)).toBe('auf Anfrage')
  })
  it('Dauer', () => {
    expect(formatDuration(150)).toBe('2,5 Std.')
    expect(formatDuration(240)).toBe('4 Std.')
    expect(formatDuration(45)).toBe('45 Min.')
  })
  it('WhatsApp-Link', () => {
    expect(whatsappHref('0664 123 45 67')).toBe('https://wa.me/436641234567')
    expect(whatsappHref('+43 664 1234567', 'Hallo')).toBe('https://wa.me/436641234567?text=Hallo')
  })
})

describe('Einsatzgebiet', () => {
  const ranges = '8010-8077, 8101-8160, 8501'
  it('erlaubt Graz und Graz-Umgebung', () => {
    expect(isPostalCodeAllowed('8010', ranges)).toBe(true)
    expect(isPostalCodeAllowed('8054', ranges)).toBe(true)
    expect(isPostalCodeAllowed('8501', ranges)).toBe(true)
  })
  it('lehnt andere Regionen ab', () => {
    expect(isPostalCodeAllowed('1010', ranges)).toBe(false)
    expect(isPostalCodeAllowed('8700', ranges)).toBe(false)
  })
  it('leere Konfiguration erlaubt alles', () => {
    expect(isPostalCodeAllowed('1010', '')).toBe(true)
  })
})

describe('Validierung', () => {
  const valid = {
    serviceId: 'komplettreinigung',
    vehicleId: 'suv',
    addonIds: [],
    date: '2026-11-20',
    time: '09:30',
    customer: {
      firstName: 'Anna',
      lastName: 'Muster-Huber',
      phone: '+43 664 1234567',
      email: 'anna@example.com',
      street: 'Herrengasse 1',
      postalCode: '8010',
      city: 'Graz',
      vehicleModel: 'VW Tiguan',
      licensePlate: 'G-12345A',
      message: '',
    },
    privacyAccepted: true,
    termsAccepted: true,
    website: '',
  }
  it('akzeptiert gültige Daten', () => {
    expect(bookingRequestSchema.safeParse(valid).success).toBe(true)
  })
  it('lehnt fehlende Zustimmung, ungültige E-Mail, PLZ und Honeypot ab', () => {
    expect(bookingRequestSchema.safeParse({ ...valid, privacyAccepted: false }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, customer: { ...valid.customer, email: 'kaputt' } }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, customer: { ...valid.customer, postalCode: '80100' } }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, date: '2026-02-30' }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, time: '25:00' }).success).toBe(false)
  })
})
