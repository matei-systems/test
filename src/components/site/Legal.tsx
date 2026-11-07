import { Icon } from '../icons'

/** Rahmen für Rechtstexte inkl. deutlichem Entwurfs-Hinweis. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 'calc(var(--header-h) + clamp(40px, 7vw, 88px)) 0 clamp(80px, 10vw, 140px)' }}>
      <div className="container">
        <p className="eyebrow">Rechtliches</p>
        <h1 className="h2" style={{ margin: '18px 0 12px' }}>
          {title}
        </h1>
        <p className="dim" style={{ fontSize: '0.85rem', marginBottom: 28 }}>
          Stand: {updated}
        </p>
        <div className="notice notice--warn" role="note" style={{ maxWidth: 760, marginBottom: 40 }}>
          <Icon name="alert" />
          <span>
            <strong>Entwurf – rechtlich nicht geprüft.</strong> Dieser Text ist eine Vorlage und muss vor der Veröffentlichung von einer
            fachkundigen Stelle (z. B. Rechtsanwalt, Wirtschaftskammer) geprüft und an das Unternehmen angepasst werden. Markierte Stellen
            fehlen noch.
          </span>
        </div>
        <div className="prose">{children}</div>
      </div>
    </div>
  )
}

/** Wert anzeigen oder deutlich als fehlend markieren. */
export function Val({ value, label }: { value?: string; label: string }) {
  if (value && value.trim()) return <>{value}</>
  return <span className="placeholder-mark">[{label} fehlt]</span>
}

/** Vorschlagswert, der vom Unternehmen festgelegt werden muss. */
export function Todo({ children }: { children: React.ReactNode }) {
  return <span className="placeholder-mark">{children}</span>
}
