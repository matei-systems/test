import { describe, expect, it } from 'vitest'
import { calculateQuote, promotionPrice, resolvePrice, serviceFromPrice, type Catalog, type Promotion } from '@/lib/pricing'
import { DEFAULT_ADDONS, DEFAULT_PROMOTIONS, DEFAULT_SERVICES, DEFAULT_VEHICLE_CATEGORIES } from '@/config/defaults'
import { formatDuration, formatDurationRange, formatEuro, formatPrice, whatsappHref } from '@/lib/format'
import { postalCodeInRanges } from '@/lib/postal'
import { bookingRequestSchema, inquirySchema } from '@/lib/validation'

const NOW = Date.parse('2026-11-10T10:00:00Z')

function promo(p: Partial<Promotion>): Promotion {
  return {
    id: p.id ?? 'p',
    name: 'Einführungspreis',
    serviceId: null,
    vehicleId: null,
    discountPercent: null,
    promoPriceCents: null,
    startsAt: null,
    endsAt: null,
    active: true,
    showStrikethrough: false,
    ...p,
  }
}

function makeCatalog(promotions: Promotion[]): Catalog {
  return {
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
      imageSrc: s.imageSrc ?? null,
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
    promotions,
  }
}

const plain = makeCatalog([])
const intro = makeCatalog(DEFAULT_PROMOTIONS.map((p, i) => promo({ id: `d${i}`, name: p.name, discountPercent: p.discountPercent, promoPriceCents: p.promoPriceCents })))
const svc = (c: Catalog, id: string) => c.services.find((s) => s.id === id)!

describe('Startangebot (Einführungspreise −20 %)', () => {
  it('reguläre Preise und Einführungspreise für Kleinwagen', () => {
    const p = (id: string) => resolvePrice(intro, svc(intro, id), 'kleinwagen', NOW)
    expect(p('innenraum-premium')).toMatchObject({ regularCents: 14900, priceCents: 11900 })
    expect(p('innenraum-premium').promotion?.percent).toBe(20)
    expect(p('innenraum-basic')).toMatchObject({ regularCents: 9900, priceCents: 7900 })
    expect(p('aussenpflege')).toMatchObject({ regularCents: 12400, priceCents: 9900 })
    expect(p('komplettpaket')).toMatchObject({ regularCents: 24900, priceCents: 19900 })
  })

  it('Komplettpaket ist günstiger als Innenraum Premium + Außenpflege einzeln', () => {
    for (const catalog of [plain, intro]) {
      for (const v of catalog.vehicles) {
        const get = (id: string) => resolvePrice(catalog, svc(catalog, id), v.id, NOW).priceCents as number
        expect(get('komplettpaket')).toBeLessThan(get('innenraum-premium') + get('aussenpflege'))
      }
    }
  })

  it('größere Fahrzeuge kosten nie weniger als kleinere', () => {
    for (const s of intro.services.filter((x) => !x.requiresAddon)) {
      const small = resolvePrice(intro, s, 'kleinwagen', NOW).priceCents as number
      for (const v of intro.vehicles) expect(resolvePrice(intro, s, v.id, NOW).priceCents as number).toBeGreaterThanOrEqual(small)
    }
  })

  it('„ab“-Preis einer Leistung berücksichtigt die Aktion', () => {
    const from = serviceFromPrice(intro, svc(intro, 'komplettpaket'), NOW)
    expect(from.min.priceCents).toBe(19900)
    expect(from.min.regularCents).toBe(24900)
    expect(from.varies).toBe(true)
    expect(from.minVehicles).toEqual(['Kleinwagen', 'Kompaktklasse'])
  })
})

describe('Rabattlogik', () => {
  it('Prozent-Aktion rundet auf volle Euro ab (mindestens der ausgewiesene Rabatt)', () => {
    for (const percent of [10, 20, 30, 40]) {
      for (const regular of [9900, 12400, 14900, 16900, 24900, 33900]) {
        const r = promotionPrice(promo({ discountPercent: percent }), regular)!
        expect(r.priceCents % 100).toBe(0)
        expect(r.priceCents).toBeLessThanOrEqual(Math.round(regular * (1 - percent / 100)))
        expect(regular - r.priceCents).toBeGreaterThanOrEqual((regular * percent) / 100)
        expect(r.percent).toBe(percent)
      }
    }
    expect(promotionPrice(promo({ discountPercent: 20 }), 14900)).toEqual({ priceCents: 11900, percent: 20 })
    expect(promotionPrice(promo({ discountPercent: 10 }), 14900)).toEqual({ priceCents: 13400, percent: 10 })
    expect(promotionPrice(promo({ discountPercent: 30 }), 14900)).toEqual({ priceCents: 10400, percent: 30 })
    expect(promotionPrice(promo({ discountPercent: 40 }), 14900)).toEqual({ priceCents: 8900, percent: 40 })
  })

  it('Fixpreis-Aktion: Prozentwert wird abgerundet, teurer als regulär wird ignoriert', () => {
    expect(promotionPrice(promo({ promoPriceCents: 18900 }), 23900)).toEqual({ priceCents: 18900, percent: 20 })
    expect(promotionPrice(promo({ promoPriceCents: 30000 }), 23900)).toBeNull()
  })

  it('beachtet Start- und Enddatum sowie den Aktiv-Schalter', () => {
    const s = svc(plain, 'innenraum-premium')
    const price = (p: Promotion, now = NOW) => resolvePrice(makeCatalog([p]), s, 'kleinwagen', now).priceCents
    expect(price(promo({ discountPercent: 20, startsAt: '2026-12-01T00:00:00Z' }))).toBe(14900)
    expect(price(promo({ discountPercent: 20, startsAt: '2026-11-01T00:00:00Z', endsAt: '2026-11-30T23:00:00Z' }))).toBe(11900)
    expect(price(promo({ discountPercent: 20, endsAt: '2026-11-09T00:00:00Z' }))).toBe(14900)
    expect(price(promo({ discountPercent: 20, active: false }))).toBe(14900)
  })

  it('spezifischere Aktion gewinnt, bei gleicher Spezifität der günstigere Preis', () => {
    const s = svc(plain, 'innenraum-premium')
    const c = makeCatalog([
      promo({ id: 'alle', discountPercent: 40 }),
      promo({ id: 'leistung', serviceId: 'innenraum-premium', discountPercent: 10 }),
      promo({ id: 'suv', serviceId: 'innenraum-premium', vehicleId: 'suv', promoPriceCents: 12900 }),
    ])
    expect(resolvePrice(c, s, 'kleinwagen', NOW)).toMatchObject({ priceCents: 13400, promotion: { id: 'leistung', percent: 10 } })
    expect(resolvePrice(c, s, 'suv', NOW)).toMatchObject({ priceCents: 12900, promotion: { id: 'suv', percent: 25 } })
    expect(resolvePrice(c, svc(c, 'aussenpflege'), 'kleinwagen', NOW)).toMatchObject({ priceCents: 7400, promotion: { id: 'alle' } })
    const tie = makeCatalog([promo({ id: 'a', discountPercent: 10 }), promo({ id: 'b', discountPercent: 30 })])
    expect(resolvePrice(tie, s, 'kleinwagen', NOW).promotion?.id).toBe('b')
  })

  it('Aktionen gelten nicht für Zusatzleistungen oder Preise auf Anfrage', () => {
    const q = calculateQuote(intro, { serviceId: 'zusatzleistungen', vehicleId: 'van', addonIds: ['polsterreinigung'] }, NOW)
    expect(q.ok && q.quote.totalPriceCents).toBe(5900)
    expect(q.ok && q.quote.discountCents).toBe(0)
    const c = makeCatalog([promo({ discountPercent: 20 })])
    svc(c, 'komplettpaket').prices.van.priceCents = null
    const r = calculateQuote(c, { serviceId: 'komplettpaket', vehicleId: 'van', addonIds: [] }, NOW)
    expect(r.ok && r.quote.totalPriceCents).toBeNull()
    expect(r.ok && r.quote.isRequest).toBe(true)
  })
})

describe('calculateQuote', () => {
  it('berechnet regulären Preis, Rabatt, Endpreis und Dauer inkl. Zusatzleistungen', () => {
    const r = calculateQuote(intro, { serviceId: 'innenraum-premium', vehicleId: 'suv', addonIds: ['tierhaarentfernung'] }, NOW)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // SUV: regulär 174 €, Einführungspreis 139 € (−20 %, auf volle Euro abgerundet)
    expect(r.quote.serviceRegularCents).toBe(17400)
    expect(r.quote.servicePriceCents).toBe(13900)
    expect(r.quote.regularTotalCents).toBe(17400 + 3900)
    expect(r.quote.discountCents).toBe(3500)
    expect(r.quote.totalPriceCents).toBe(13900 + 3900)
    expect(r.quote.promotion).toMatchObject({ name: 'Einführungspreis', percent: 20 })
    expect(r.quote.durationMinutes).toBe(180 + 45)
    expect(r.quote.isRequest).toBe(false)
  })

  it('ohne Aktion: Endpreis = regulärer Preis', () => {
    const r = calculateQuote(plain, { serviceId: 'aussenpflege', vehicleId: 'kleinwagen', addonIds: [] }, NOW)
    expect(r.ok && r.quote).toMatchObject({ totalPriceCents: 12400, regularTotalCents: 12400, discountCents: 0, promotion: null })
  })

  it('kennzeichnet "ab"-Preise', () => {
    const r = calculateQuote(plain, { serviceId: 'aussenpflege', vehicleId: 'kleinwagen', addonIds: ['starke-verschmutzung'] }, NOW)
    expect(r.ok && r.quote.priceIsFrom).toBe(true)
  })

  it('"Nur Zusatzleistungen" verlangt mindestens eine allein buchbare Zusatzleistung', () => {
    expect(calculateQuote(plain, { serviceId: 'zusatzleistungen', vehicleId: 'van', addonIds: [] }, NOW).ok).toBe(false)
    expect(calculateQuote(plain, { serviceId: 'zusatzleistungen', vehicleId: 'van', addonIds: ['starke-verschmutzung'] }, NOW).ok).toBe(false)
  })

  it('lehnt unbekannte oder doppelte Auswahl ab', () => {
    expect(calculateQuote(plain, { serviceId: 'gibtsnicht', vehicleId: 'suv', addonIds: [] }, NOW).ok).toBe(false)
    expect(calculateQuote(plain, { serviceId: 'aussenpflege', vehicleId: 'lkw', addonIds: [] }, NOW).ok).toBe(false)
    expect(calculateQuote(plain, { serviceId: 'aussenpflege', vehicleId: 'suv', addonIds: ['x'] }, NOW).ok).toBe(false)
    expect(calculateQuote(plain, { serviceId: 'aussenpflege', vehicleId: 'suv', addonIds: ['detailreinigung', 'detailreinigung'] }, NOW).ok).toBe(false)
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
    expect(formatDuration(345)).toBe('5 Std. 45 Min.')
    expect(formatDurationRange(90, 135)).toBe('ca. 1,5–2,5 Std.')
    expect(formatDurationRange(150, 210)).toBe('ca. 2,5–3,5 Std.')
  })
  it('WhatsApp-Link', () => {
    expect(whatsappHref('0664 123 45 67')).toBe('https://wa.me/436641234567')
    expect(whatsappHref('+43 664 1234567', 'Hallo')).toBe('https://wa.me/436641234567?text=Hallo')
  })
})

describe('Einsatzgebiet', () => {
  const ranges = '8010-8077, 8101-8160, 8501'
  it('erlaubt Graz und Graz-Umgebung', () => {
    expect(postalCodeInRanges('8010', ranges)).toBe(true)
    expect(postalCodeInRanges('8054', ranges)).toBe(true)
    expect(postalCodeInRanges('8501', ranges)).toBe(true)
  })
  it('lehnt andere Regionen ab', () => {
    expect(postalCodeInRanges('1010', ranges)).toBe(false)
    expect(postalCodeInRanges('8700', ranges)).toBe(false)
  })
  it('leere Konfiguration erlaubt alles', () => {
    expect(postalCodeInRanges('1010', '')).toBe(true)
  })
})

describe('Validierung', () => {
  const valid = {
    serviceId: 'komplettpaket',
    vehicleId: 'suv',
    addonIds: [],
    date: '2026-11-20',
    time: '09:30',
    customer: {
      firstName: 'Anna',
      lastName: 'Muster-Huber',
      phone: '+43 664 1234567',
      email: 'anna@example.com',
      street: 'Herrengasse',
      houseNumber: '16/2',
      postalCode: '8010',
      city: 'Graz',
      locationNote: 'Tiefgarage, Platz 12',
      vehicleModel: 'VW Tiguan',
      licensePlate: 'G-12345A',
      message: '',
    },
    expectedTotalCents: 23900,
    privacyAccepted: true,
    termsAccepted: true,
    marketingConsent: false,
    website: '',
  }
  it('akzeptiert gültige Daten', () => {
    expect(bookingRequestSchema.safeParse(valid).success).toBe(true)
    expect(bookingRequestSchema.safeParse({ ...valid, expectedTotalCents: null }).success).toBe(true)
  })
  it('lehnt fehlende Zustimmung, ungültige E-Mail, PLZ, Hausnummer und Honeypot ab', () => {
    expect(bookingRequestSchema.safeParse({ ...valid, privacyAccepted: false }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, customer: { ...valid.customer, email: 'kaputt' } }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, customer: { ...valid.customer, postalCode: '80100' } }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, customer: { ...valid.customer, houseNumber: '' } }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, date: '2026-02-30' }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, time: '25:00' }).success).toBe(false)
    expect(bookingRequestSchema.safeParse({ ...valid, expectedTotalCents: undefined }).success).toBe(false)
  })
  it('Kontaktanfrage', () => {
    const ok = { name: 'Max Muster', email: 'max@example.com', phone: '', topic: 'Firmen & Flotten', message: 'Wir haben fünf Fahrzeuge.', privacyAccepted: true, website: '' }
    expect(inquirySchema.safeParse(ok).success).toBe(true)
    expect(inquirySchema.safeParse({ ...ok, message: 'kurz' }).success).toBe(false)
    expect(inquirySchema.safeParse({ ...ok, privacyAccepted: false }).success).toBe(false)
    expect(inquirySchema.safeParse({ ...ok, website: 'bot' }).success).toBe(false)
  })
})

describe('Preisstrategie (Startwerte)', () => {
  const now = NOW
  const c = makeCatalog(DEFAULT_PROMOTIONS.map((p, i) => promo({ ...p, id: `start-${i}` })))
  const price = (serviceId: string, vehicleId: string) => resolvePrice(c, c.services.find((s) => s.id === serviceId)!, vehicleId, now)

  it('Einführungspreise sind in jeder Kategorie glatte Beträge (…9 oder …5)', () => {
    for (const s of c.services.filter((x) => !x.requiresAddon)) {
      for (const v of c.vehicles) {
        const p = price(s.id, v.id)
        expect(p.promotion?.percent).toBe(20)
        expect([5, 9]).toContain(((p.priceCents as number) / 100) % 10)
      }
    }
  })

  it('Komplettpaket ist günstiger als Innenraum Premium + Außenpflege einzeln (regulär und mit Aktion)', () => {
    for (const v of c.vehicles) {
      const combo = price('komplettpaket', v.id)
      const inner = price('innenraum-premium', v.id)
      const outer = price('aussenpflege', v.id)
      expect(combo.regularCents as number).toBeLessThan((inner.regularCents as number) + (outer.regularCents as number))
      expect(combo.priceCents as number).toBeLessThan((inner.priceCents as number) + (outer.priceCents as number))
    }
  })

  it('größere Fahrzeuge kosten nie weniger als kleinere', () => {
    for (const s of c.services.filter((x) => !x.requiresAddon)) {
      const prices = c.vehicles.map((v) => s.prices[v.id].priceCents as number)
      expect([...prices].sort((a, b) => a - b)).toEqual(prices)
    }
  })
})
