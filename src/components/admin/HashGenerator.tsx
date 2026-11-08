'use client'

import { startTransition, useActionState, useState } from 'react'
import { generateHashAction } from '@/app/admin/actions'

/** Hilft beim Einrichten: erzeugt den Wert für ADMIN_PASSWORD_HASH, ohne lokal Node.js zu benötigen. */
export function HashGenerator() {
  const [state, dispatch, pending] = useActionState(generateHashAction, null)
  const [copied, setCopied] = useState(false)
  return (
    <div className="adm-form" style={{ marginTop: 20 }}>
      <form
        className="adm-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          setCopied(false)
          const fd = new FormData(e.currentTarget)
          startTransition(() => dispatch(fd))
        }}
      >
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          <strong>Schritt 1:</strong> Wunsch-Passwort für den Admin-Bereich festlegen (mind. 12 Zeichen). Es wird nicht gespeichert.
        </p>
        <div className="field">
          <label htmlFor="hg-password">Neues Admin-Passwort</label>
          <input id="hg-password" name="password" type="password" className="input" autoComplete="new-password" minLength={12} required />
        </div>
        <div className="field">
          <label htmlFor="hg-confirm">Passwort wiederholen</label>
          <input id="hg-confirm" name="confirm" type="password" className="input" autoComplete="new-password" minLength={12} required />
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={pending}>
          {pending ? 'Wird erzeugt …' : 'Passwort-Hash erzeugen'}
        </button>
      </form>
      {state && !state.ok && (
        <p role="alert" className="adm-msg adm-msg--err">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <div className="adm-form" role="status">
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <strong>Schritt 2:</strong> In Vercel → Projekt → <em>Settings → Environment Variables</em> eine Variable{' '}
            <code>ADMIN_PASSWORD_HASH</code> (Environment: Production) mit diesem Wert anlegen und danach neu deployen:
          </p>
          <textarea className="textarea" readOnly value={state.message} rows={3} onFocus={(e) => e.currentTarget.select()} aria-label="Erzeugter Passwort-Hash" />
          <button
            type="button"
            className="adm-btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.message)
                setCopied(true)
              } catch {
                setCopied(false)
              }
            }}
          >
            {copied ? 'Kopiert ✓' : 'Wert kopieren'}
          </button>
        </div>
      )}
    </div>
  )
}
