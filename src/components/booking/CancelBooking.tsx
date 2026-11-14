'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icon } from '../icons'

/** Online-Stornierung über den persönlichen Bestätigungslink (mit Sicherheitsabfrage). */
export function CancelBooking({ token, until, kind }: { token: string; until: string; kind: 'buchung' | 'anfrage' }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const noun = kind === 'anfrage' ? 'Terminanfrage' : 'Termin'

  async function cancel() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/bookings/stornieren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (res.ok) {
        router.refresh()
        return
      }
      setError(data.error ?? 'Die Stornierung konnte nicht durchgeführt werden. Bitte kontaktieren Sie uns direkt.')
    } catch {
      setError('Keine Verbindung zum Server. Der Termin wurde NICHT storniert – bitte versuchen Sie es erneut.')
    }
    setBusy(false)
  }

  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      {!confirming ? (
        <>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(true)}>
            <Icon name="close" /> {noun} stornieren
          </button>
          <p className="field-hint">Kostenlose Online-Stornierung möglich bis {until}.</p>
        </>
      ) : (
        <div className="notice notice--warn" role="alertdialog" aria-label={`${noun} stornieren`} style={{ display: 'grid', gap: 12 }}>
          <span>
            Möchten Sie den Termin wirklich stornieren? Der Termin wird sofort wieder freigegeben.
          </span>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn btn--light btn--sm" onClick={cancel} disabled={busy} aria-busy={busy}>
              {busy ? 'Wird storniert …' : 'Ja, stornieren'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(false)} disabled={busy}>
              Nein, behalten
            </button>
          </span>
        </div>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
