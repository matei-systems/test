'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../icons'
import { Calendar } from './Calendar'
import type { Catalog } from '@/lib/pricing'
import { calculateQuote, servicePriceRange } from '@/lib/pricing'
import { formatCalendarDate, formatDuration, formatPrice, minutesToTimeLabel } from './helpers'
import { customerSchema } from '@/lib/validation'
import styles from './BookingWizard.module.css'

const STEPS = ['Leistung', 'Fahrzeug', 'Extras', 'Termin & Ort', 'Kontakt'] as const

type Customer = {
  firstName: string
  lastName: string
  phone: string
  email: string
  street: string
  postalCode: string
  city: string
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
  postalCode: '',
  city: '',
  vehicleModel: '',
  licensePlate: '',
  message: '',
}

const ADDRESS_FIELDS: Array<keyof Customer> = ['street', 'postalCode', 'city']
const CONTACT_FIELDS: Array<keyof Customer> = ['firstName', 'lastName', 'phone', 'email', 'vehicleModel', 'licensePlate', 'message']

interface Props {
  catalog: Catalog
  initialService?: string
  initialVehicle?: string
  maxAdvanceDays: number
  bufferMinutes: number
}

export function BookingWizard({ catalog, initialService, initialVehicle }: Props) {
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
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
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
    const r = calculateQuote(catalog, { serviceId, vehicleId, addonIds })
    return r.ok ? r.quote : null
  }, [catalog, serviceId, vehicleId, addonIds])

  const selectionKey = `${serviceId}|${vehicleId}|${addonIds.join(',')}`

  // Bei Änderung der Auswahl (Dauer!) gewählten Termin zurücksetzen
  useEffect(() => {
    setTime('')
    setSlots(null)
  }, [selectionKey])

  // Nicht mehr erlaubte Zusatzleistungen entfernen (z. B. nach Wechsel auf "Nur Zusatzleistungen")
  useEffect(() => {
    setAddonIds((ids) => ids.filter((id) => availableAddons.some((a) => a.id === id)))
  }, [availableAddons])

  // Fokus auf die Schritt-Überschrift (Screenreader & Tastatur)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
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
    if (date && step === 3) void loadSlots(date)
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
    return out
  }

  function canProceed(s: number): string | null {
    if (s === 0 && !serviceId) return 'Bitte wähle eine Leistung.'
    if (s === 1 && !vehicleId) return 'Bitte wähle deine Fahrzeugkategorie.'
    if (s === 2 && service?.requiresAddon && addonIds.length === 0) return 'Bitte wähle mindestens eine Zusatzleistung.'
    if (s === 2 && !quote) return 'Diese Auswahl ist leider nicht buchbar.'
    if (s === 3 && (!date || !time)) return 'Bitte wähle Datum und Uhrzeit.'
    return null
  }

  function next() {
    setFormError('')
    const problem = canProceed(step)
    if (problem) {
      setFormError(problem)
      return
    }
    if (step === 3) {
      const errs = validateCustomerFields(ADDRESS_FIELDS)
      setErrors(errs)
      if (Object.keys(errs).length) {
        setFormError('Bitte prüfe die markierten Felder.')
        focusFirstError(errs)
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

  async function submit() {
    setFormError('')
    const errs = validateCustomerFields([...ADDRESS_FIELDS, ...CONTACT_FIELDS])
    if (!privacy) errs.privacyAccepted = 'Bitte bestätige die Datenschutzerklärung.'
    if (!terms) errs.termsAccepted = 'Bitte akzeptiere die AGB und Stornobedingungen.'
    setErrors(errs)
    if (Object.keys(errs).length) {
      if (ADDRESS_FIELDS.some((f) => errs[`customer.${f}`])) {
        setStep(3)
      }
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
          privacyAccepted: privacy,
          termsAccepted: terms,
          website: honeypot,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 201 && data.token) {
        // Erst nach bestätigter Speicherung zur Bestätigungsseite
        router.push(`/buchen/bestaetigung/${data.token}`)
        return
      }
      if (res.status === 409) {
        setTime('')
        setCalendarKey((k) => k + 1)
        setStep(3)
        setFormError(data.error || 'Dieser Termin ist leider nicht mehr verfügbar. Bitte wähle eine andere Uhrzeit.')
        if (date) void loadSlots(date)
        return
      }
      if (data.fields) {
        setErrors(data.fields)
        if (Object.keys(data.fields).some((k: string) => ADDRESS_FIELDS.some((f) => k === `customer.${f}`))) setStep(3)
      }
      setFormError(data.error || 'Die Buchung konnte nicht gespeichert werden. Bitte versuche es erneut.')
    } catch {
      setFormError('Keine Verbindung zum Server. Deine Buchung wurde NICHT gespeichert – bitte prüfe deine Internetverbindung und versuche es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  const err = (k: keyof Customer) => errors[`customer.${k}`]

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
                  const range = servicePriceRange(s, catalog.vehicles)
                  const minAddon = s.requiresAddon
                    ? Math.min(...catalog.addons.filter((a) => a.bookableAlone).map((a) => a.priceCents))
                    : null
                  const selected = s.id === serviceId
                  return (
                    <label key={s.id} className={`${styles.option} ${selected ? styles.selected : ''}`}>
                      <input
                        type="radio"
                        name="service"
                        value={s.id}
                        checked={selected}
                        onChange={() => setServiceId(s.id)}
                        className="sr-only"
                      />
                      <span className={styles.radio} aria-hidden="true" />
                      <span className={styles.optionBody}>
                        <span className={styles.optionHead}>
                          <strong>{s.name}</strong>
                          {s.featured && <span className="badge">Beliebt</span>}
                        </span>
                        <span className={styles.optionText}>{s.tagline}</span>
                      </span>
                      <span className={styles.optionPrice}>
                        {s.requiresAddon
                          ? minAddon !== null && Number.isFinite(minAddon)
                            ? `ab ${formatPrice(minAddon)}`
                            : ''
                          : range.onRequest
                            ? 'auf Anfrage'
                            : `${range.min !== range.max ? 'ab ' : ''}${formatPrice(range.min)}`}
                      </span>
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
              <div className={`${styles.options} ${styles.optionsGrid}`}>
                {catalog.vehicles.map((v) => {
                  const p = service?.prices[v.id]
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
                      {p && !service?.requiresAddon && (
                        <span className={styles.vehiclePrice}>
                          {p.priceCents === null ? 'auf Anfrage' : formatPrice(p.priceCents)}
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
            </fieldset>
          )}

          {/* ── Schritt 4: Termin & Standort ────────────────────── */}
          {step === 3 && quote && (
            <div className={styles.fieldset}>
              <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
                Wann und wo dürfen wir kommen?
              </h2>
              <p className={styles.subtitle}>
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
                  }}
                />
                <div className={styles.slots}>
                  <h3 className={styles.slotsTitle}>{date ? formatCalendarDate(date) : 'Bitte zuerst ein Datum wählen'}</h3>
                  {date && slotsLoading && <p className={styles.muted}>Freie Uhrzeiten werden geladen …</p>}
                  {date && !slotsLoading && slotsError && <p className="field-error">{slotsError}</p>}
                  {date && !slotsLoading && slots && slots.length === 0 && !slotsError && (
                    <p className={styles.muted}>An diesem Tag ist leider kein Termin mehr frei. Bitte wähle einen anderen Tag.</p>
                  )}
                  {date && !slotsLoading && slots && slots.length > 0 && (
                    <div role="radiogroup" aria-label="Uhrzeit wählen" className={styles.slotGrid}>
                      {slots.map((t) => (
                        <label key={t} className={`${styles.slot} ${t === time ? styles.slotActive : ''}`}>
                          <input type="radio" name="time" value={t} checked={t === time} onChange={() => setTime(t)} className="sr-only" />
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

              <div className={styles.formGrid}>
                <h3 className={styles.groupTitle}>Standort des Fahrzeugs</h3>
                <div className={`field ${styles.full}`}>
                  <label htmlFor="f-street">Straße und Hausnummer</label>
                  <input
                    id="f-street"
                    className="input"
                    autoComplete="street-address"
                    value={customer.street}
                    onChange={(e) => updateCustomer('street', e.target.value)}
                    aria-invalid={Boolean(err('street'))}
                    aria-describedby={err('street') ? 'e-street' : undefined}
                  />
                  {err('street') && (
                    <p id="e-street" className="field-error">
                      {err('street')}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="f-postalCode">PLZ</label>
                  <input
                    id="f-postalCode"
                    className="input"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={4}
                    value={customer.postalCode}
                    onChange={(e) => updateCustomer('postalCode', e.target.value.replace(/\D/g, ''))}
                    aria-invalid={Boolean(err('postalCode'))}
                    aria-describedby={err('postalCode') ? 'e-postalCode' : undefined}
                  />
                  {err('postalCode') && (
                    <p id="e-postalCode" className="field-error">
                      {err('postalCode')}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="f-city">Ort</label>
                  <input
                    id="f-city"
                    className="input"
                    autoComplete="address-level2"
                    value={customer.city}
                    onChange={(e) => updateCustomer('city', e.target.value)}
                    aria-invalid={Boolean(err('city'))}
                    aria-describedby={err('city') ? 'e-city' : undefined}
                  />
                  {err('city') && (
                    <p id="e-city" className="field-error">
                      {err('city')}
                    </p>
                  )}
                </div>
                <div className={`field ${styles.full}`}>
                  <label htmlFor="f-message">
                    Nachricht <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    id="f-message"
                    className="textarea"
                    placeholder="z. B. Parkplatz-Hinweise, Zugang zur Tiefgarage, besondere Wünsche …"
                    maxLength={1000}
                    value={customer.message}
                    onChange={(e) => updateCustomer('message', e.target.value)}
                    aria-invalid={Boolean(err('message'))}
                  />
                  {err('message') && <p className="field-error">{err('message')}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Schritt 5: Kontakt & Bestätigung ────────────────── */}
          {step === 4 && quote && (
            <div className={styles.fieldset}>
              <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
                Fast geschafft – deine Kontaktdaten
              </h2>
              <div className={styles.formGrid}>
                <TextField id="firstName" label="Vorname" autoComplete="given-name" value={customer.firstName} error={err('firstName')} onChange={(v) => updateCustomer('firstName', v)} />
                <TextField id="lastName" label="Nachname" autoComplete="family-name" value={customer.lastName} error={err('lastName')} onChange={(v) => updateCustomer('lastName', v)} />
                <TextField id="phone" label="Telefonnummer" type="tel" autoComplete="tel" inputMode="tel" placeholder="+43 …" value={customer.phone} error={err('phone')} onChange={(v) => updateCustomer('phone', v)} />
                <TextField id="email" label="E-Mail-Adresse" type="email" autoComplete="email" inputMode="email" value={customer.email} error={err('email')} onChange={(v) => updateCustomer('email', v)} />
                <TextField id="vehicleModel" label="Fahrzeugmodell" placeholder="z. B. VW Golf" value={customer.vehicleModel} error={err('vehicleModel')} onChange={(v) => updateCustomer('vehicleModel', v)} />
                <TextField id="licensePlate" label="Kennzeichen" optional placeholder="z. B. G-123AB" value={customer.licensePlate} error={err('licensePlate')} onChange={(v) => updateCustomer('licensePlate', v.toUpperCase())} />
              </div>

              {/* Honeypot gegen Spam-Bots (für Menschen unsichtbar) */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="f-website">Website</label>
                <input id="f-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>

              <div className={styles.review}>
                <h3 className={styles.groupTitle}>Deine Buchung im Überblick</h3>
                <dl className={styles.reviewList}>
                  <div>
                    <dt>Leistung</dt>
                    <dd>{quote.serviceName}</dd>
                  </div>
                  <div>
                    <dt>Fahrzeug</dt>
                    <dd>
                      {quote.vehicleName}
                      {customer.vehicleModel ? ` – ${customer.vehicleModel}` : ''}
                    </dd>
                  </div>
                  {quote.addons.length > 0 && (
                    <div>
                      <dt>Zusatzleistungen</dt>
                      <dd>{quote.addons.map((a) => a.name).join(', ')}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Termin</dt>
                    <dd>
                      {formatCalendarDate(date)}, {time} Uhr
                      <small> · Dauer ca. {formatDuration(quote.durationMinutes)}</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Standort</dt>
                    <dd>
                      {customer.street}, {customer.postalCode} {customer.city}
                    </dd>
                  </div>
                </dl>
                <button type="button" className={styles.editLink} onClick={() => setStep(3)}>
                  <Icon name="edit" size={14} /> Termin oder Standort ändern
                </button>
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
                    gelesen. Meine Daten werden ausschließlich zur Abwicklung dieser Buchung verwendet.
                  </span>
                </label>
                {errors.privacyAccepted && <p className="field-error">{errors.privacyAccepted}</p>}
              </div>
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
              <button type="button" className="btn btn--ghost" onClick={back} disabled={submitting}>
                <Icon name="arrow-left" /> Zurück
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn--primary" onClick={next}>
                {step === 2 && !service?.requiresAddon && addonIds.length === 0 ? 'Ohne Extras weiter' : 'Weiter'} <Icon name="arrow-right" />
              </button>
            ) : (
              <button type="button" className={`btn btn--primary ${styles.submit}`} onClick={submit} disabled={submitting} aria-busy={submitting}>
                {submitting ? 'Buchung wird gespeichert …' : 'Termin verbindlich buchen'}
                {!submitting && <Icon name="check" />}
              </button>
            )}
          </div>
          {step === STEPS.length - 1 && (
            <p className={styles.legalHint}>
              Mit Klick auf „Termin verbindlich buchen“ gibst du eine verbindliche Buchung ab. Du erhältst sofort eine Buchungsnummer.
            </p>
          )}
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
              {quote?.addons.map((a) => (
                <li key={a.id}>
                  <span>+ {a.name}</span>
                  <strong>{formatPrice(a.priceCents, { from: a.priceIsFrom })}</strong>
                </li>
              ))}
              <li>
                <span>Termin</span>
                <strong>{date && time ? `${formatCalendarDate(date).replace(/^\w+, /, '')}, ${time}` : '—'}</strong>
              </li>
              {quote && (
                <li>
                  <span>Dauer</span>
                  <strong>ca. {formatDuration(quote.durationMinutes)}</strong>
                </li>
              )}
            </ul>
            <div className={styles.total}>
              <span>Gesamt</span>
              <strong>
                {quote ? (quote.totalPriceCents === null ? 'auf Anfrage' : formatPrice(quote.totalPriceCents, { from: quote.priceIsFrom })) : '—'}
              </strong>
            </div>
            {quote?.totalPriceCents === null && (
              <p className={styles.summaryNote}>Du erhältst vor Beginn ein verbindliches Angebot.</p>
            )}
            {quote?.priceIsFrom && <p className={styles.summaryNote}>„ab“-Preise: Endpreis nach Aufwand, Abstimmung vorab.</p>}
            <ul className={styles.trust}>
              <li>
                <Icon name="shield" size={16} /> Sichere Übertragung deiner Daten
              </li>
              <li>
                <Icon name="van" size={16} /> Wir kommen zu deinem Standort
              </li>
              <li>
                <Icon name="tag" size={16} /> Transparente Preise
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
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
