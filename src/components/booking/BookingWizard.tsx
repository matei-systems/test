'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../icons'
import { DiscountBadge, PriceTag } from '../site/PriceTag'
import { Calendar } from './Calendar'
import type { Catalog, Quote } from '@/lib/pricing'
import { calculateQuote, minStandaloneAddonPrice, resolvePrice, serviceDurationRange, serviceFromPrice } from '@/lib/pricing'
import { formatCalendarDate, formatDuration, formatPrice, minutesToTimeLabel } from './helpers'
import { formatDurationRange, formatEuro } from '@/lib/format'
import { postalCodeInRanges } from '@/lib/postal'
import { customerSchema } from '@/lib/validation'
import { serviceImage } from '@/content/media'
import { SITE } from '@/config/site'
import styles from './BookingWizard.module.css'

const STEPS = ['Leistung', 'Fahrzeug', 'Extras', 'Ort & Termin', 'Kontakt', 'Übersicht'] as const
const STEP_PLACE = 3
const STEP_CONTACT = 4
const STEP_REVIEW = 5

type Customer = {
  firstName: string
  lastName: string
  phone: string
  email: string
  street: string
  houseNumber: string
  postalCode: string
  city: string
  locationNote: string
  vehicleModel: string
  licensePlate: string
  message: string
}

const EMPTY_CUSTOMER: Customer = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  locationNote: '',
  vehicleModel: '',
  licensePlate: '',
  message: '',
}

const ADDRESS_FIELDS: Array<keyof Customer> = ['street', 'houseNumber', 'postalCode', 'city', 'locationNote']
const CONTACT_FIELDS: Array<keyof Customer> = ['firstName', 'lastName', 'phone', 'email', 'vehicleModel', 'licensePlate', 'message']

interface Props {
  catalog: Catalog
  initialService?: string
  initialVehicle?: string
  /** Server-Zeitpunkt der Seitenauslieferung – damit Server und Browser dieselben Aktionspreise zeigen */
  now: number
  /** Postleitzahl-Bereiche des Einsatzgebiets (für die Sofort-Prüfung) */
  postalCodes: string
  regions: string[]
  /** Online-Stornierung bis X Stunden vor dem Termin (0 = aus) */
  cancelHours: number
}

export function BookingWizard({ catalog, initialService, initialVehicle, now, postalCodes, regions, cancelHours }: Props) {
  const router = useRouter()
  const validService = catalog.services.some((s) => s.id === initialService) ? initialService! : ''
  const validVehicle = catalog.vehicles.some((v) => v.id === initialVehicle) ? initialVehicle! : ''

  const [step, setStep] = useState(validService ? (validVehicle ? 2 : 1) : 0)
  const [serviceId, setServiceId] = useState(validService)
  const [vehicleId, setVehicleId] = useState(validVehicle)
  const [addonIds, setAddonIds] = useState<string[]>([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER)
  const [privacy, setPrivacy] = useState(false)
  const [terms, setTerms] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [slots, setSlots] = useState<string[] | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [calendarKey, setCalendarKey] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  const service = catalog.services.find((s) => s.id === serviceId)
  const vehicle = catalog.vehicles.find((v) => v.id === vehicleId)
  const availableAddons = useMemo(
    () => catalog.addons.filter((a) => (service?.requiresAddon ? a.bookableAlone : true)),
    [catalog.addons, service?.requiresAddon],
  )

  const quote = useMemo(() => {
    if (!serviceId || !vehicleId) return null
    const r = calculateQuote(catalog, { serviceId, vehicleId, addonIds }, now)
    return r.ok ? r.quote : null
  }, [catalog, serviceId, vehicleId, addonIds, now])

  const selectionKey = `${serviceId}|${vehicleId}|${addonIds.join(',')}`
  const postalComplete = /^\d{4}$/.test(customer.postalCode)
  const postalOk = postalComplete && postalCodeInRanges(customer.postalCode, postalCodes)
  const isRequest = Boolean(quote?.isRequest)
  const submitLabel = isRequest ? 'Termin unverbindlich anfragen' : SITE.bookingButtonLabel

  // Bei Änderung der Auswahl (Dauer!) gewählten Termin zurücksetzen
  useEffect(() => {
    setTime('')
    setSlots(null)
  }, [selectionKey])

  // Nicht mehr erlaubte Zusatzleistungen entfernen (z. B. nach Wechsel auf "Nur Zusatzleistungen")
  useEffect(() => {
    setAddonIds((ids) => ids.filter((id) => availableAddons.some((a) => a.id === id)))
  }, [availableAddons])

  // Fokus auf die Schritt-Überschrift (Screenreader & Tastatur) und an den Anfang des Schritts scrollen
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
    const top = document.getElementById('buchung')?.getBoundingClientRect().top ?? 0
    if (top < 0) window.scrollBy({ top: top - 90, behavior: 'smooth' })
  }, [step])

  const loadSlots = useCallback(
    async (d: string) => {
      if (!serviceId || !vehicleId) return
      setSlotsLoading(true)
      setSlotsError('')
      try {
        const qs = new URLSearchParams({ service: serviceId, vehicle: vehicleId, addons: addonIds.join(','), date: d })
        const res = await fetch(`/api/availability?${qs}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Fehler')
        setSlots(data.slots)
      } catch {
        setSlots([])
        setSlotsError('Die freien Uhrzeiten konnten nicht geladen werden. Bitte versuche es erneut.')
      } finally {
        setSlotsLoading(false)
      }
    },
    [serviceId, vehicleId, addonIds],
  )

  useEffect(() => {
    if (date && step === STEP_PLACE) void loadSlots(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selectionKey, step])

  function updateCustomer<K extends keyof Customer>(key: K, value: Customer[K]) {
    setCustomer((c) => ({ ...c, [key]: value }))
    setFormError('')
    setErrors((e) => {
      if (!e[`customer.${key}`]) return e
      const next = { ...e }
      delete next[`customer.${key}`]
      return next
    })
  }

  function validateCustomerFields(fields: Array<keyof Customer>): Record<string, string> {
    const res = customerSchema.safeParse(customer)
    const out: Record<string, string> = {}
    if (!res.success) {
      for (const issue of res.error.issues) {
        const key = issue.path[0] as keyof Customer
        if (fields.includes(key) && !out[`customer.${key}`]) out[`customer.${key}`] = issue.message
      }
    }
    if (fields.includes('postalCode') && !out['customer.postalCode'] && postalComplete && !postalOk) {
      out['customer.postalCode'] = `Außerhalb unseres Einsatzgebiets (${regions.join(' & ')}).`
    }
    return out
  }

  function canProceed(s: number): string | null {
    if (s === 0 && !serviceId) return 'Bitte wähle eine Leistung.'
    if (s === 1 && !vehicleId) return 'Bitte wähle deine Fahrzeugkategorie.'
    if (s === 2 && service?.requiresAddon && addonIds.length === 0) return 'Bitte wähle mindestens eine Zusatzleistung.'
    if (s === 2 && !quote) return 'Diese Auswahl ist leider nicht buchbar.'
    return null
  }

  function next() {
    setFormError('')
    setNotice('')
    const problem = canProceed(step)
    if (problem) {
      setFormError(problem)
      return
    }
    if (step === STEP_PLACE || step === STEP_CONTACT) {
      const errs = validateCustomerFields(step === STEP_PLACE ? ADDRESS_FIELDS : CONTACT_FIELDS)
      setErrors(errs)
      if (Object.keys(errs).length) {
        setFormError('Bitte prüfe die markierten Felder.')
        focusFirstError(errs)
        return
      }
      if (step === STEP_PLACE && (!date || !time)) {
        setFormError('Bitte wähle Datum und Uhrzeit.')
        document.getElementById('termin')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  function back() {
    setFormError('')
    setStep((s) => Math.max(0, s - 1))
  }

  function goTo(s: number) {
    if (s >= step) return
    setFormError('')
    setStep(s)
  }

  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0]
    if (!first) return
    requestAnimationFrame(() => document.getElementById(`f-${first.replace('customer.', '')}`)?.focus())
  }

  /** Springt zum ersten Schritt, in dem ein fehlerhaftes Feld liegt. */
  function stepForErrors(errs: Record<string, string>): number | null {
    if (ADDRESS_FIELDS.some((f) => errs[`customer.${f}`])) return STEP_PLACE
    if (CONTACT_FIELDS.some((f) => errs[`customer.${f}`])) return STEP_CONTACT
    return null
  }

  async function submit() {
    if (!quote) return
    setFormError('')
    setNotice('')
    const errs = validateCustomerFields([...ADDRESS_FIELDS, ...CONTACT_FIELDS])
    if (!terms) errs.termsAccepted = 'Bitte akzeptiere die AGB und Stornobedingungen.'
    if (!privacy) errs.privacyAccepted = 'Bitte bestätige die Datenschutzerklärung.'
    setErrors(errs)
    if (Object.keys(errs).length) {
      const target = stepForErrors(errs)
      if (target !== null) setStep(target)
      setFormError('Bitte prüfe die markierten Felder.')
      focusFirstError(errs)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          vehicleId,
          addonIds,
          date,
          time,
          customer,
          expectedTotalCents: quote.totalPriceCents,
          privacyAccepted: privacy,
          termsAccepted: terms,
          marketingConsent: marketing,
          website: honeypot,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 201 && data.token) {
        // Erst nach bestätigter Speicherung zur Bestätigungsseite
        router.push(`/buchen/bestaetigung/${data.token}`)
        return
      }
      if (res.status === 409 && data.code === 'price_changed') {
        // Preise/Aktionen neu vom Server laden – der Kunde bestätigt danach den aktuellen Preis
        router.refresh()
        setNotice('Der Preis hat sich inzwischen geändert (z. B. weil eine Aktion begonnen oder geendet hat). Bitte prüfe die aktualisierte Übersicht und bestätige erneut.')
        return
      }
      if (res.status === 409) {
        setTime('')
        setCalendarKey((k) => k + 1)
        setStep(STEP_PLACE)
        setFormError(data.error || 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wähle eine andere Uhrzeit.')
        if (date) void loadSlots(date)
        return
      }
      if (data.fields) {
        setErrors(data.fields)
        const target = stepForErrors(data.fields)
        if (target !== null) setStep(target)
      }
      setFormError(data.error || 'Die Buchung konnte nicht gespeichert werden. Bitte versuche es erneut.')
    } catch {
      setFormError('Keine Verbindung zum Server. Deine Buchung wurde NICHT gespeichert – bitte prüfe deine Internetverbindung und versuche es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  const err = (k: keyof Customer) => errors[`customer.${k}`]
  const totalLabel = quote ? (quote.totalPriceCents === null ? 'auf Anfrage' : formatPrice(quote.totalPriceCents, { from: quote.priceIsFrom })) : null
  const nextLabel = step === 2 && !service?.requiresAddon && addonIds.length === 0 ? 'Ohne Extras weiter' : step === STEP_CONTACT ? 'Zur Übersicht' : 'Weiter'

  return (
    <div id="buchung" className={styles.wrap}>
      {/* Fortschritt */}
      <nav aria-label="Buchungsschritte" className={styles.progress}>
        <ol>
          {STEPS.map((label, i) => (
            <li key={label} className={`${i === step ? styles.current : ''} ${i < step ? styles.done : ''}`}>
              <button type="button" onClick={() => goTo(i)} disabled={i >= step} aria-current={i === step ? 'step' : undefined}>
                <span className={styles.dot}>{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
                <span className={styles.stepLabel}>{label}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className={styles.bar} aria-hidden="true">
          <span style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </nav>

      <div className={styles.layout}>
        <div className={styles.main}>
          <p className={styles.stepCount}>
            Schritt {step + 1} von {STEPS.length}
          </p>

          {/* ── Schritt 1: Leistung ─────────────────────────────── */}
          {step === 0 && (
            <fieldset className={styles.fieldset}>
              <legend className="sr-only">Leistung wählen</legend>
              <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
                Welche Leistung wünschst du?
              </h2>
              <div className={styles.options}>
                {catalog.services.map((s) => {
                  const from = serviceFromPrice(catalog, s, now)
                  const duration = serviceDurationRange(s, catalog.vehicles)
                  const minAddon = s.requiresAddon ? minStandaloneAddonPrice(catalog.addons) : null
                  const img = serviceImage(s)
                  const selected = s.id === serviceId
                  return (
                    <label key={s.id} className={`${styles.option} ${styles.service} ${selected ? styles.selected : ''}`}>
                      <input type="radio" name="service" value={s.id} checked={selected} onChange={() => setServiceId(s.id)} className="sr-only" />
                      <span className={styles.serviceMedia} aria-hidden="true">
                        {s.requiresAddon ? (
                          <Icon name="plus" size={26} />
                        ) : (
                          <Image src={img.src} alt="" fill sizes="128px" quality={70} unoptimized={img.unoptimized} style={{ objectFit: 'cover', objectPosition: img.position }} />
                        )}
                      </span>
                      <span className={styles.optionBody}>
                        <span className={styles.optionHead}>
                          <strong>{s.name}</strong>
                          {s.featured && <span className="badge">Beliebt</span>}
                        </span>
                        <span className={styles.optionText}>{s.tagline}</span>
                        {s.includes.length > 0 && (
                          <span className={styles.serviceIncludes}>
                            {s.includes.slice(0, 3).map((item) => (
                              <span key={item}>
                                <Icon name="check" size={13} /> {item}
                              </span>
                            ))}
                            {s.includes.length > 3 && <span className={styles.more}>+ {s.includes.length - 3} weitere Leistungen</span>}
                          </span>
                        )}
                        <span className={styles.serviceFoot}>
                          {s.requiresAddon ? (
                            <span className={styles.optionPrice}>{minAddon !== null ? `ab ${formatPrice(minAddon)}` : ''}</span>
                          ) : (
                            <PriceTag info={from.min} from={from.varies} size="sm" showEnd={false} />
                          )}
                          {duration.max > 0 && (
                            <span className={styles.serviceDuration}>
                              <Icon name="clock" size={14} /> {formatDurationRange(duration.min, duration.max)}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className={styles.radio} aria-hidden="true" />
                    </label>
                  )
                })}
              </div>
              <p className={styles.helper}>
                <Icon name="info" size={16} /> Zusatzleistungen wie Tierhaarentfernung oder Polsterreinigung kannst du in Schritt 3 ergänzen.
              </p>
            </fieldset>
          )}

          {/* ── Schritt 2: Fahrzeug ─────────────────────────────── */}
          {step === 1 && (
            <fieldset className={styles.fieldset}>
              <legend className="sr-only">Fahrzeugkategorie wählen</legend>
              <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
                Welches Fahrzeug dürfen wir pflegen?
              </h2>
              <p className={styles.subtitle}>Preis und Dauer richten sich nach der Fahrzeuggröße.</p>
              <div className={`${styles.options} ${styles.optionsGrid}`}>
                {catalog.vehicles.map((v) => {
                  const p = service?.prices[v.id]
                  const info = service && p ? resolvePrice(catalog, service, v.id, now) : null
                  const selected = v.id === vehicleId
                  return (
                    <label key={v.id} className={`${styles.option} ${styles.vehicle} ${selected ? styles.selected : ''}`}>
                      <input type="radio" name="vehicle" value={v.id} checked={selected} onChange={() => setVehicleId(v.id)} className="sr-only" />
                      <span className={styles.vehicleIcon} aria-hidden="true">
                        <Icon name={v.id === 'van' ? 'van' : 'car'} size={26} />
                      </span>
                      <span className={styles.optionBody}>
                        <strong>{v.name}</strong>
                        <span className={styles.optionText}>{v.description}</span>
                      </span>
                      {p && info && !service?.requiresAddon && (
                        <span className={styles.vehiclePrice}>
                          <span>
                            {info.priceCents === null ? 'auf Anfrage' : formatEuro(info.priceCents)}
                            {info.promotion && info.regularCents !== null && (
                              <span className={styles.vehicleRegular}>
                                {info.promotion.showStrikethrough ? <s>{formatEuro(info.regularCents)}</s> : <>regulär {formatEuro(info.regularCents)}</>}
                              </span>
                            )}
                          </span>
                          <small>ca. {formatDuration(p.durationMinutes)}</small>
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {/* ── Schritt 3: Zusatzleistungen ─────────────────────── */}
          {step === 2 && (
            <fieldset className={styles.fieldset}>
              <legend className="sr-only">Zusatzleistungen wählen</legend>
              <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
                {service?.requiresAddon ? 'Welche Zusatzleistungen möchtest du?' : 'Möchtest du etwas ergänzen?'}
              </h2>
              <p className={styles.subtitle}>
                {service?.requiresAddon ? 'Wähle mindestens eine Leistung.' : 'Optional – du kannst diesen Schritt auch überspringen.'}
              </p>
              <div className={styles.options}>
                {availableAddons.map((a) => {
                  const checked = addonIds.includes(a.id)
                  return (
                    <label key={a.id} className={`${styles.option} ${checked ? styles.selected : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setAddonIds((ids) => (e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id)))}
                        className="sr-only"
                      />
                      <span className={styles.checkbox} aria-hidden="true">
                        {checked && <Icon name="check" size={14} />}
                      </span>
                      <span className={styles.optionBody}>
                        <strong>{a.name}</strong>
                        <span className={styles.optionText}>
                          {a.description} · ca. {formatDuration(a.durationMinutes)}
                        </span>
                      </span>
                      <span className={styles.optionPrice}>+ {formatPrice(a.priceCents, { from: a.priceIsFrom })}</span>
                    </label>
                  )
                })}
              </div>
              {quote && (
                <p className={styles.liveTotal} aria-live="polite">
                  <span>Aktueller Gesamtpreis</span>
                  <strong>{totalLabel}</strong>
                </p>
              )}
            </fieldset>
          )}

          {/* ── Schritt 4: Standort & Termin ────────────────────── */}
          {step === STEP_PLACE && quote && (
            <div className={styles.fieldset}>
              <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
                Wo und wann dürfen wir kommen?
              </h2>
              <p className={styles.subtitle}>Wir kommen zu deinem Fahrzeug – zu Hause, am Arbeitsplatz oder an einem vereinbarten Ort.</p>

              <div className={`${styles.formGrid} ${styles.addressGrid}`}>
                <h3 className={styles.groupTitle}>Standort des Fahrzeugs</h3>
                <div className={styles.street}>
                  <TextField id="street" label="Straße" autoComplete="address-line1" value={customer.street} error={err('street')} onChange={(v) => updateCustomer('street', v)} />
                </div>
                <div className={styles.houseNumber}>
                  <TextField id="houseNumber" label="Hausnummer" autoComplete="address-line2" value={customer.houseNumber} error={err('houseNumber')} onChange={(v) => updateCustomer('houseNumber', v)} />
                </div>
                <div className={styles.postal}>
                  <TextField
                    id="postalCode"
                    label="PLZ"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={4}
                    value={customer.postalCode}
                    error={err('postalCode')}
                    onChange={(v) => updateCustomer('postalCode', v.replace(/\D/g, ''))}
                  />
                </div>
                <div className={styles.city}>
                  <TextField id="city" label="Ort" autoComplete="address-level2" value={customer.city} error={err('city')} onChange={(v) => updateCustomer('city', v)} />
                </div>
                <div className={styles.full} aria-live="polite">
                  {postalComplete && postalOk && (
                    <p className={styles.areaOk}>
                      <Icon name="check" size={16} /> {customer.postalCode} liegt in unserem Einsatzgebiet.
                    </p>
                  )}
                  {postalComplete && !postalOk && (
                    <div className="notice notice--warn">
                      <Icon name="info" />
                      <span>
                        {customer.postalCode} liegt außerhalb unseres Einsatzgebiets ({regions.join(' & ')}). Online-Buchungen sind dort nicht
                        möglich –{' '}
                        <Link href="/kontakt" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                          frag uns gerne individuell an
                        </Link>
                        .
                      </span>
                    </div>
                  )}
                </div>
                <div className={`field ${styles.full}`}>
                  <label htmlFor="f-locationNote">
                    Zusätzliche Informationen zum Standort <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    id="f-locationNote"
                    className="textarea"
                    rows={2}
                    placeholder="z. B. Parkplatz im Innenhof, Tiefgarage Ebene −1, Klingel „Müller“ …"
                    maxLength={300}
                    value={customer.locationNote}
                    onChange={(e) => updateCustomer('locationNote', e.target.value)}
                    aria-invalid={Boolean(err('locationNote'))}
                  />
                  {err('locationNote') && <p className="field-error">{err('locationNote')}</p>}
                </div>
              </div>

              <h3 id="termin" className={`${styles.groupTitle} ${styles.groupSpaced}`}>
                Wunschtermin
              </h3>
              <p className={styles.subtitle} style={{ marginTop: 6 }}>
                Es werden nur tatsächlich freie Termine angezeigt (Dauer ca. {formatDuration(quote.durationMinutes)}).
              </p>
              <div className={styles.schedule}>
                <Calendar
                  key={calendarKey}
                  serviceId={serviceId}
                  vehicleId={vehicleId}
                  addonIds={addonIds}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d)
                    setTime('')
                    setFormError('')
                  }}
                />
                <div className={styles.slots}>
                  <h4 className={styles.slotsTitle}>{date ? formatCalendarDate(date) : 'Bitte zuerst ein Datum wählen'}</h4>
                  {date && slotsLoading && <p className={styles.muted}>Freie Uhrzeiten werden geladen …</p>}
                  {date && !slotsLoading && slotsError && <p className="field-error">{slotsError}</p>}
                  {date && !slotsLoading && slots && slots.length === 0 && !slotsError && (
                    <p className={styles.muted}>An diesem Tag ist leider kein Termin mehr frei. Bitte wähle einen anderen Tag.</p>
                  )}
                  {date && !slotsLoading && slots && slots.length > 0 && (
                    <div role="radiogroup" aria-label="Uhrzeit wählen" className={styles.slotGrid}>
                      {slots.map((t) => (
                        <label key={t} className={`${styles.slot} ${t === time ? styles.slotActive : ''}`}>
                          <input
                            type="radio"
                            name="time"
                            value={t}
                            checked={t === time}
                            onChange={() => {
                              setTime(t)
                              setFormError('')
                            }}
                            className="sr-only"
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                  )}
                  {time && (
                    <p className={styles.slotInfo}>
                      <Icon name="clock" size={16} /> {time} – ca. {minutesToTimeLabel(time, quote.durationMinutes)} Uhr
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Schritt 5: Kontaktdaten ─────────────────────────── */}
          {step === STEP_CONTACT && quote && (
            <div className={styles.fieldset}>
              <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
                Deine Kontaktdaten
              </h2>
              <p className={styles.subtitle}>Damit wir den Termin bestätigen und dich am Tag der Durchführung erreichen können.</p>
              <div className={styles.formGrid}>
                <TextField id="firstName" label="Vorname" autoComplete="given-name" value={customer.firstName} error={err('firstName')} onChange={(v) => updateCustomer('firstName', v)} />
                <TextField id="lastName" label="Nachname" autoComplete="family-name" value={customer.lastName} error={err('lastName')} onChange={(v) => updateCustomer('lastName', v)} />
                <TextField id="phone" label="Telefonnummer" type="tel" autoComplete="tel" inputMode="tel" placeholder="+43 …" value={customer.phone} error={err('phone')} onChange={(v) => updateCustomer('phone', v)} />
                <TextField id="email" label="E-Mail-Adresse" type="email" autoComplete="email" inputMode="email" value={customer.email} error={err('email')} onChange={(v) => updateCustomer('email', v)} />
                <TextField id="vehicleModel" label="Fahrzeugmodell" placeholder="z. B. VW Golf" value={customer.vehicleModel} error={err('vehicleModel')} onChange={(v) => updateCustomer('vehicleModel', v)} />
                <TextField id="licensePlate" label="Kennzeichen" optional placeholder="z. B. G-123AB" value={customer.licensePlate} error={err('licensePlate')} onChange={(v) => updateCustomer('licensePlate', v.toUpperCase())} />
                <div className={`field ${styles.full}`}>
                  <label htmlFor="f-message">
                    Nachricht an uns <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    id="f-message"
                    className="textarea"
                    rows={3}
                    placeholder="z. B. besondere Wünsche oder Hinweise zum Fahrzeug …"
                    maxLength={1000}
                    value={customer.message}
                    onChange={(e) => updateCustomer('message', e.target.value)}
                    aria-invalid={Boolean(err('message'))}
                  />
                  {err('message') && <p className="field-error">{err('message')}</p>}
                </div>
              </div>

              {/* Honeypot gegen Spam-Bots (für Menschen unsichtbar) */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="f-website">Website</label>
                <input id="f-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Schritt 6: Buchungsübersicht ────────────────────── */}
          {step === STEP_REVIEW && quote && (
            <div className={styles.fieldset}>
              <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
                {isRequest ? 'Deine Anfrage im Überblick' : 'Deine Buchung im Überblick'}
              </h2>
              <p className={styles.subtitle}>Bitte prüfe deine Angaben. Du kannst jeden Abschnitt noch ändern.</p>

              {notice && (
                <div className="notice notice--warn" role="status" style={{ marginTop: 20 }}>
                  <Icon name="info" />
                  <span>{notice}</span>
                </div>
              )}

              <div className={styles.reviewGrid}>
                <ReviewBlock title="Leistung" onEdit={() => setStep(0)}>
                  <p>
                    <strong>{quote.serviceName}</strong>
                  </p>
                  <p>{quote.vehicleName}</p>
                  {quote.addons.length > 0 && <p>+ {quote.addons.map((a) => a.name).join(', ')}</p>}
                </ReviewBlock>
                <ReviewBlock title="Termin" onEdit={() => setStep(STEP_PLACE)}>
                  <p>
                    <strong>{formatCalendarDate(date)}</strong>
                  </p>
                  <p>
                    {time} – ca. {minutesToTimeLabel(time, quote.durationMinutes)} Uhr
                  </p>
                  <p>Dauer ca. {formatDuration(quote.durationMinutes)}</p>
                </ReviewBlock>
                <ReviewBlock title="Standort" onEdit={() => setStep(STEP_PLACE)}>
                  <p>
                    <strong>
                      {customer.street} {customer.houseNumber}
                    </strong>
                  </p>
                  <p>
                    {customer.postalCode} {customer.city}
                  </p>
                  {customer.locationNote && <p>{customer.locationNote}</p>}
                </ReviewBlock>
                <ReviewBlock title="Kontakt & Fahrzeug" onEdit={() => setStep(STEP_CONTACT)}>
                  <p>
                    <strong>
                      {customer.firstName} {customer.lastName}
                    </strong>
                  </p>
                  <p>
                    {customer.phone} · {customer.email}
                  </p>
                  <p>
                    {customer.vehicleModel}
                    {customer.licensePlate ? ` · ${customer.licensePlate}` : ''}
                  </p>
                </ReviewBlock>
              </div>

              <div className={styles.priceBox}>
                <h3 className={styles.groupTitle}>Preis</h3>
                <PriceLines quote={quote} />
              </div>

              <div className={styles.consents}>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => {
                      setTerms(e.target.checked)
                      setErrors(({ termsAccepted: _, ...rest }) => rest)
                    }}
                    aria-invalid={Boolean(errors.termsAccepted)}
                    id="f-termsAccepted"
                  />
                  <span>
                    Ich akzeptiere die{' '}
                    <Link href="/agb" target="_blank">
                      AGB
                    </Link>{' '}
                    und{' '}
                    <Link href="/stornobedingungen" target="_blank">
                      Stornobedingungen
                    </Link>
                    .
                  </span>
                </label>
                {errors.termsAccepted && <p className="field-error">{errors.termsAccepted}</p>}
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={privacy}
                    onChange={(e) => {
                      setPrivacy(e.target.checked)
                      setErrors(({ privacyAccepted: _, ...rest }) => rest)
                    }}
                    aria-invalid={Boolean(errors.privacyAccepted)}
                    id="f-privacyAccepted"
                  />
                  <span>
                    Ich habe die{' '}
                    <Link href="/datenschutz" target="_blank">
                      Datenschutzerklärung
                    </Link>{' '}
                    gelesen. Meine Daten werden zur Abwicklung dieser {isRequest ? 'Anfrage' : 'Buchung'} verwendet.
                  </span>
                </label>
                {errors.privacyAccepted && <p className="field-error">{errors.privacyAccepted}</p>}
                <label className="checkbox">
                  <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} id="f-marketingConsent" />
                  <span>
                    Ich möchte gelegentlich Angebote und Neuigkeiten von GLANZMOBIL per E-Mail erhalten{' '}
                    <span className="optional">(optional, jederzeit widerrufbar)</span>.
                  </span>
                </label>
              </div>

              <p className={styles.binding}>
                {isRequest ? (
                  <>
                    <Icon name="info" size={16} />
                    <span>
                      <strong>Unverbindliche Terminanfrage:</strong> Für deine Auswahl ist kein fester Preis hinterlegt. Wir reservieren den
                      Termin und melden uns mit einem Angebot – erst mit deiner Zustimmung kommt der Auftrag zustande.
                    </span>
                  </>
                ) : (
                  <>
                    <Icon name="shield" size={16} />
                    <span>
                      <strong>Verbindliche Buchung</strong> zum Gesamtpreis von {totalLabel}. Online ist keine Zahlung nötig – bezahlt wird nach
                      der Durchführung vor Ort.
                      {cancelHours > 0 && <> Kostenlose Online-Stornierung bis {cancelHours} Stunden vor dem Termin.</>}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}

          {formError && (
            <div className="notice notice--error" role="alert" style={{ marginTop: 24 }}>
              <Icon name="alert" />
              <span>{formError}</span>
            </div>
          )}

          <div className={styles.nav}>
            {step > 0 ? (
              <button type="button" className={`btn btn--ghost ${styles.back}`} onClick={back} disabled={submitting} aria-label="Zurück zum vorherigen Schritt">
                <Icon name="arrow-left" /> <span>Zurück</span>
              </button>
            ) : (
              <span className={styles.backSpacer} />
            )}
            {totalLabel && step < STEP_REVIEW && (
              <p className={styles.navTotal}>
                <span>Gesamt</span>
                <strong>{totalLabel}</strong>
              </p>
            )}
            {step < STEP_REVIEW ? (
              <button type="button" className={`btn btn--primary ${styles.next}`} onClick={next}>
                {nextLabel} <Icon name="arrow-right" />
              </button>
            ) : (
              <button type="button" className={`btn btn--primary ${styles.submit}`} onClick={submit} disabled={submitting} aria-busy={submitting}>
                {submitting ? (isRequest ? 'Anfrage wird gesendet …' : 'Buchung wird gespeichert …') : submitLabel}
                {!submitting && <Icon name="check" />}
              </button>
            )}
          </div>
        </div>

        {/* Zusammenfassung */}
        <aside className={styles.summary} aria-label="Zusammenfassung">
          <div className={styles.summaryCard}>
            <p className={styles.summaryEyebrow}>Deine Auswahl</p>
            <ul className={styles.summaryList}>
              <li>
                <span>Leistung</span>
                <strong>{service?.name ?? '—'}</strong>
              </li>
              <li>
                <span>Fahrzeug</span>
                <strong>{vehicle?.name ?? '—'}</strong>
              </li>
              <li>
                <span>Termin</span>
                <strong>{date && time ? `${formatCalendarDate(date).replace(/^\S+ /, '')}, ${time}` : '—'}</strong>
              </li>
              {quote && (
                <li>
                  <span>Dauer</span>
                  <strong>ca. {formatDuration(quote.durationMinutes)}</strong>
                </li>
              )}
            </ul>
            {quote ? (
              <div className={styles.summaryPrice}>
                <PriceLines quote={quote} compact />
              </div>
            ) : (
              <div className={styles.total}>
                <span>Gesamt</span>
                <strong>—</strong>
              </div>
            )}
            {quote?.totalPriceCents === null && <p className={styles.summaryNote}>Du erhältst vor Beginn ein verbindliches Angebot.</p>}
            {quote?.priceIsFrom && <p className={styles.summaryNote}>„ab“-Preise: Endpreis nach Aufwand, Abstimmung vorab.</p>}
            <ul className={styles.trust}>
              <li>
                <Icon name="shield" size={16} /> Sichere Übertragung deiner Daten
              </li>
              <li>
                <Icon name="van" size={16} /> Wir kommen zu deinem Standort
              </li>
              <li>
                <Icon name="tag" size={16} /> Keine Online-Zahlung nötig
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Preisaufstellung: regulärer Paketpreis, Aktion, Zusatzleistungen und der tatsächlich zu zahlende Gesamtpreis. */
function PriceLines({ quote, compact = false }: { quote: Quote; compact?: boolean }) {
  const hasPromo = quote.promotion !== null && quote.discountCents > 0 && quote.serviceRegularCents !== null
  const showPackage = quote.serviceRegularCents === null || quote.serviceRegularCents > 0
  return (
    <dl className={`${styles.priceLines} ${compact ? styles.priceLinesCompact : ''}`}>
      {showPackage && (
        <div>
          <dt>
            {quote.serviceName}
            {hasPromo && <small>regulär</small>}
          </dt>
          <dd>{quote.serviceRegularCents === null ? 'auf Anfrage' : formatEuro(quote.serviceRegularCents)}</dd>
        </div>
      )}
      {hasPromo && quote.promotion && (
        <div className={styles.discountLine}>
          <dt>
            {quote.promotion.name} <DiscountBadge percent={quote.promotion.percent} />
          </dt>
          <dd>{formatEuro(-quote.discountCents)}</dd>
        </div>
      )}
      {quote.addons.map((a) => (
        <div key={a.id}>
          <dt>+ {a.name}</dt>
          <dd>{formatPrice(a.priceCents, { from: a.priceIsFrom })}</dd>
        </div>
      ))}
      <div className={styles.totalLine}>
        <dt>{quote.totalPriceCents === null ? 'Preis' : 'Gesamtpreis'}</dt>
        <dd>{quote.totalPriceCents === null ? 'auf Anfrage' : formatPrice(quote.totalPriceCents, { from: quote.priceIsFrom })}</dd>
      </div>
      {!compact && quote.totalPriceCents !== null && (
        <p className={styles.priceFoot}>
          Endpreis inkl. Anfahrt im Einsatzgebiet.
          {hasPromo && <> Du sparst {formatEuro(quote.discountCents)} gegenüber dem regulären Preis.</>}
          {quote.priceIsFrom && <> „ab“-Preise: Endpreis nach Aufwand, Abstimmung vorab.</>}
        </p>
      )}
    </dl>
  )
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className={styles.reviewBlock}>
      <header>
        <h3>{title}</h3>
        <button type="button" className={styles.editLink} onClick={onEdit} aria-label={`${title} ändern`}>
          <Icon name="edit" size={14} /> Ändern
        </button>
      </header>
      <div>{children}</div>
    </section>
  )
}

function TextField(props: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  type?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  optional?: boolean
  maxLength?: number
}) {
  return (
    <div className="field">
      <label htmlFor={`f-${props.id}`}>
        {props.label} {props.optional && <span className="optional">(optional)</span>}
      </label>
      <input
        id={`f-${props.id}`}
        className="input"
        type={props.type ?? 'text'}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={Boolean(props.error)}
        aria-describedby={props.error ? `e-${props.id}` : undefined}
        required={!props.optional}
      />
      {props.error && (
        <p id={`e-${props.id}`} className="field-error">
          {props.error}
        </p>
      )}
    </div>
  )
}
