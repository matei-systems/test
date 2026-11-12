'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '../icons'
import { fieldErrors, INQUIRY_TOPICS, inquirySchema } from '@/lib/validation'
import styles from './Pages.module.css'

type Values = { name: string; email: string; phone: string; topic: string; message: string; privacyAccepted: boolean; website: string }

const EMPTY: Values = { name: '', email: '', phone: '', topic: INQUIRY_TOPICS[0], message: '', privacyAccepted: false, website: '' }

/** Kontaktformular – wird serverseitig geprüft und gespeichert; der Erfolg wird erst nach dem Speichern angezeigt. */
export function ContactForm({ enabled }: { enabled: boolean }) {
  const [v, setV] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setV((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const parsed = inquirySchema.safeParse(v)
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error)
      setErrors(errs)
      const first = Object.keys(errs)[0]
      document.getElementById(`kontakt-${first}`)?.focus()
      return
    }
    setState('sending')
    try {
      const res = await fetch('/api/kontakt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
      const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string> }
      if (res.status === 201) {
        setState('sent')
        return
      }
      if (data.fields) setErrors(data.fields)
      setError(data.error ?? 'Deine Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.')
    } catch {
      setError('Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung und versuche es erneut.')
    }
    setState('idle')
  }

  if (state === 'sent') {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successIcon}>
          <Icon name="check" size={28} />
        </span>
        <h2 className="h3">Danke – deine Nachricht ist angekommen.</h2>
        <p className="muted">Wir melden uns so schnell wie möglich bei dir.</p>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            setV(EMPTY)
            setState('idle')
          }}
        >
          Weitere Nachricht schreiben
        </button>
      </div>
    )
  }

  if (!enabled) {
    return (
      <div className="notice">
        <Icon name="info" />
        <span>Das Kontaktformular wird gerade eingerichtet und ist in Kürze verfügbar.</span>
      </div>
    )
  }

  const err = (key: string) =>
    errors[key] ? (
      <p className="field-error" id={`kontakt-${key}-error`} role="alert">
        {errors[key]}
      </p>
    ) : null
  const aria = (key: string) => ({ 'aria-invalid': Boolean(errors[key]) || undefined, 'aria-describedby': errors[key] ? `kontakt-${key}-error` : undefined })

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.formRow}>
        <div className="field">
          <label htmlFor="kontakt-name">Name</label>
          <input id="kontakt-name" className="input" autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} {...aria('name')} />
          {err('name')}
        </div>
        <div className="field">
          <label htmlFor="kontakt-topic">Anliegen</label>
          <select id="kontakt-topic" className="select" value={v.topic} onChange={(e) => set('topic', e.target.value)}>
            {INQUIRY_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.formRow}>
        <div className="field">
          <label htmlFor="kontakt-email">E-Mail</label>
          <input
            id="kontakt-email"
            type="email"
            inputMode="email"
            className="input"
            autoComplete="email"
            value={v.email}
            onChange={(e) => set('email', e.target.value)}
            {...aria('email')}
          />
          {err('email')}
        </div>
        <div className="field">
          <label htmlFor="kontakt-phone">
            Telefon <span className="optional">(optional)</span>
          </label>
          <input
            id="kontakt-phone"
            type="tel"
            inputMode="tel"
            className="input"
            autoComplete="tel"
            value={v.phone}
            onChange={(e) => set('phone', e.target.value)}
            {...aria('phone')}
          />
          {err('phone')}
        </div>
      </div>
      <div className="field">
        <label htmlFor="kontakt-message">Deine Nachricht</label>
        <textarea
          id="kontakt-message"
          className="textarea"
          rows={6}
          maxLength={2000}
          value={v.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Worum geht es? Bei Flotten: Anzahl und Art der Fahrzeuge."
          {...aria('message')}
        />
        {err('message')}
      </div>

      {/* Honeypot gegen Spam-Bots – für Menschen unsichtbar */}
      <div className={styles.hp} aria-hidden="true">
        <label htmlFor="kontakt-website">Website</label>
        <input id="kontakt-website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set('website', e.target.value)} />
      </div>

      <div>
        <label className="checkbox">
          <input
            id="kontakt-privacyAccepted"
            type="checkbox"
            checked={v.privacyAccepted}
            onChange={(e) => set('privacyAccepted', e.target.checked)}
            {...aria('privacyAccepted')}
          />
          <span>
            Ich habe die{' '}
            <Link href="/datenschutz" target="_blank">
              Datenschutzerklärung
            </Link>{' '}
            gelesen und bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage verarbeitet werden.
          </span>
        </label>
        {err('privacyAccepted')}
      </div>

      {error && (
        <div className="notice notice--error" role="alert">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      <button type="submit" className="btn btn--primary" disabled={state === 'sending'} style={{ justifySelf: 'start' }}>
        {state === 'sending' ? 'Wird gesendet …' : 'Nachricht senden'} <Icon name="arrow-right" />
      </button>
    </form>
  )
}
