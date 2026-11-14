'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from '../icons'
import { postalCodeInRanges } from '@/lib/postal'
import styles from './Pages.module.css'

/** Sofort-Prüfung, ob eine Postleitzahl im Einsatzgebiet liegt (gleiche Logik wie bei der Buchung). */
export function PostalCheck({ ranges }: { ranges: string }) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<'ok' | 'outside' | 'invalid' | null>(null)

  function check(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(value.trim())) return setResult('invalid')
    setResult(postalCodeInRanges(value.trim(), ranges) ? 'ok' : 'outside')
  }

  return (
    <form className={styles.check} onSubmit={check} noValidate>
      <div>
        <h2 className="h3">Kommen wir zu Ihnen?</h2>
        <p className="muted" style={{ fontSize: '0.95rem' }}>
          Geben Sie Ihre Postleitzahl ein und prüfen Sie sofort, ob Ihr Standort in unserem Einsatzgebiet liegt.
        </p>
      </div>
      <div className="field">
        <label htmlFor="plz-check">Postleitzahl</label>
        <div className={styles.checkRow}>
          <input
            id="plz-check"
            className="input"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={4}
            placeholder="z. B. 8010"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/\D/g, ''))
              setResult(null)
            }}
            aria-describedby="plz-check-result"
          />
          <button type="submit" className="btn btn--primary">
            Prüfen
          </button>
        </div>
      </div>
      <div id="plz-check-result" className={styles.checkResult} aria-live="polite">
        {result === 'ok' && (
          <div className="notice notice--success">
            <Icon name="check" />
            <span>
              Ja – {value} liegt in unserem Einsatzgebiet.{' '}
              <Link href="/buchen" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Jetzt Termin buchen
              </Link>
            </span>
          </div>
        )}
        {result === 'outside' && (
          <div className="notice notice--warn">
            <Icon name="info" />
            <span>
              {value} liegt aktuell außerhalb unseres Einsatzgebiets.{' '}
              <Link href="/kontakt" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Trotzdem anfragen
              </Link>{' '}
              – oft finden wir eine Lösung.
            </span>
          </div>
        )}
        {result === 'invalid' && (
          <div className="notice notice--error" role="alert">
            <Icon name="alert" />
            <span>Bitte geben Sie eine vierstellige österreichische Postleitzahl ein.</span>
          </div>
        )}
      </div>
    </form>
  )
}
