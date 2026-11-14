'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div style={{ padding: 'calc(var(--header-h) + 80px) 0 120px' }}>
      <div className="container" style={{ display: 'grid', gap: 20, justifyItems: 'start', maxWidth: 680 }}>
        <p className="eyebrow">Technischer Fehler</p>
        <h1 className="h2">Da ist etwas schiefgelaufen.</h1>
        <p className="lead">
          Die Seite konnte gerade nicht geladen werden. Bitte versuchen Sie es in einem Moment erneut. Falls Sie eine Buchung abgeschickt und
          keine Buchungsnummer erhalten haben, wurde sie nicht gespeichert.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--primary" onClick={reset}>
            Erneut versuchen
          </button>
          <Link href="/" className="btn btn--ghost">
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
