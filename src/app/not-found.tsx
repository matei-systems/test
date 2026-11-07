import Link from 'next/link'
import { Logo } from '@/components/site/Logo'

export const metadata = { title: 'Seite nicht gefunden', robots: { index: false } }

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(50% 40% at 50% 0%, rgba(200,180,138,0.1), transparent 70%), var(--bg)',
      }}
    >
      <div style={{ display: 'grid', gap: 24, justifyItems: 'center', textAlign: 'center', maxWidth: 520 }}>
        <Link href="/" aria-label="Zur Startseite">
          <Logo />
        </Link>
        <p className="eyebrow">Fehler 404</p>
        <h1 className="h2">
          Diese Seite glänzt <span className="serif accent">durch Abwesenheit.</span>
        </h1>
        <p className="lead" style={{ marginInline: 'auto' }}>
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <Link href="/" className="btn btn--light">
            Zur Startseite
          </Link>
          <Link href="/buchen" className="btn btn--primary">
            Termin buchen
          </Link>
        </div>
      </div>
    </main>
  )
}
