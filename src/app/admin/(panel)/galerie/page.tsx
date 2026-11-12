import { getDb } from '@/lib/db'
import { loadGallery, type GalleryItem } from '@/lib/catalog'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Icon } from '@/components/icons'
import { deleteGalleryItemAction, saveGalleryItemAction } from '../../actions'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Galerie' }

const CATEGORIES = ['Innenraum', 'Außen', 'Details']

export default async function GalleryAdminPage() {
  await requireAdmin()
  const items = await loadGallery(await getDb(), true)
  const comparisons = items.filter((i) => i.kind === 'vergleich')
  const images = items.filter((i) => i.kind === 'bild')
  const demoCount = items.filter((i) => i.isDemo && i.published).length

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Galerie</h1>
          <p>Vorher-Nachher-Paare und Einzelbilder für Startseite und Galerie. Hochgeladene Bilder werden automatisch verkleinert und optimiert.</p>
        </div>
        <a href="/galerie" target="_blank" className="adm-btn">
          <Icon name="external" size={15} /> Galerie ansehen
        </a>
      </header>

      {demoCount > 0 && (
        <div className="adm-warn" style={{ marginBottom: 16 }}>
          <Icon name="info" size={18} />
          <span>
            <strong>{demoCount} Demo-Einträge sichtbar.</strong> Sie sind auf der Website als „Demo-Visualisierung“ gekennzeichnet und zeigen
            keine echten Kundenfahrzeuge. Ersetze sie durch eigene Fotos (mit Einverständnis der Kund:innen) und entferne oder verberge die
            Demos danach.
          </span>
        </div>
      )}

      <div className="adm-grid adm-grid--halves">
        <section className="adm-card">
          <h2>Neues Vorher-Nachher-Paar</h2>
          <p className="adm-card-desc">Beide Fotos möglichst aus derselben Perspektive und im Querformat aufnehmen – dann wirkt der Regler am besten.</p>
          <GalleryForm kind="vergleich" />
        </section>
        <section className="adm-card">
          <h2>Neues Einzelbild</h2>
          <p className="adm-card-desc">Detailaufnahmen und Fahrzeugbilder für den Bereich „Eindrücke“.</p>
          <GalleryForm kind="bild" />
        </section>
      </div>

      <section className="adm-card" style={{ marginTop: 16 }}>
        <h2>Vorher-Nachher-Paare ({comparisons.length})</h2>
        <p className="adm-card-desc">Die ersten fünf veröffentlichten Paare erscheinen auf der Startseite. Reihenfolge: kleinste Zahl zuerst.</p>
        {comparisons.length === 0 ? <p className="adm-empty">Noch keine Paare angelegt.</p> : <ItemList items={comparisons} />}
      </section>

      <section className="adm-card" style={{ marginTop: 16 }}>
        <h2>Einzelbilder ({images.length})</h2>
        {images.length === 0 ? <p className="adm-empty">Noch keine Bilder angelegt.</p> : <ItemList items={images} />}
      </section>
    </>
  )
}

function ItemList({ items }: { items: GalleryItem[] }) {
  return (
    <div className="adm-stack" style={{ marginTop: 12 }}>
      {items.map((item) => (
        <details key={item.id} className="adm-card adm-gallery-item" style={{ padding: 14, background: 'transparent' }}>
          <summary>
            <span className="adm-thumbs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {item.kind === 'vergleich' ? (
                <>
                  <img src={item.beforeSrc ?? ''} alt="" loading="lazy" />
                  <img src={item.afterSrc ?? ''} alt="" loading="lazy" />
                </>
              ) : (
                <img src={item.imageSrc ?? ''} alt="" loading="lazy" />
              )}
            </span>
            <span className="adm-gallery-meta">
              <strong>{item.title}</strong>
              <span>
                {item.category || 'ohne Kategorie'} · Reihenfolge {item.sort}
              </span>
            </span>
            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {item.isDemo && <span className="adm-pill">Demo</span>}
              <span className={`adm-pill ${item.published ? 'adm-pill--on' : 'adm-pill--off'}`}>{item.published ? 'sichtbar' : 'verborgen'}</span>
            </span>
          </summary>
          <GalleryForm kind={item.kind} item={item} />
          <ActionForm action={deleteGalleryItemAction} confirm={`„${item.title}“ endgültig löschen? Hochgeladene Bilder werden mit entfernt.`}>
            <input type="hidden" name="id" value={item.id} />
            <SubmitButton className="adm-btn adm-btn--danger" pendingText="…">
              <Icon name="trash" size={15} /> Eintrag löschen
            </SubmitButton>
          </ActionForm>
        </details>
      ))}
    </div>
  )
}

function GalleryForm({ kind, item }: { kind: 'vergleich' | 'bild'; item?: GalleryItem }) {
  const key = item?.id ?? `neu-${kind}`
  return (
    <ActionForm action={saveGalleryItemAction} className="adm-form" key={key}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="kind" value={kind} />
      {kind === 'vergleich' ? (
        <div className="adm-form-grid" style={{ marginTop: 12 }}>
          <ImageUpload name="beforeSrc" label="Vorher" defaultValue={item?.beforeSrc ?? ''} />
          <ImageUpload name="afterSrc" label="Nachher" defaultValue={item?.afterSrc ?? ''} />
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <ImageUpload name="imageSrc" label="Bild" defaultValue={item?.imageSrc ?? ''} />
        </div>
      )}
      <div className="adm-form-grid">
        <div className="field">
          <label htmlFor={`gt-${key}`}>Titel</label>
          <input id={`gt-${key}`} name="title" className="input" defaultValue={item?.title ?? ''} placeholder={kind === 'vergleich' ? 'z. B. Fahrersitz nach Polsterreinigung' : 'z. B. Felge im Detail'} required />
        </div>
        <div className="field">
          <label htmlFor={`gc-${key}`}>Kategorie</label>
          <input id={`gc-${key}`} name="category" className="input" list={`gcl-${key}`} defaultValue={item?.category ?? ''} placeholder="z. B. Innenraum" />
          <datalist id={`gcl-${key}`}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="field full">
          <label htmlFor={`gd-${key}`}>Beschreibung</label>
          <input id={`gd-${key}`} name="description" className="input" defaultValue={item?.description ?? ''} maxLength={300} />
        </div>
        <div className="field">
          <label htmlFor={`ga-${key}`}>Bildbeschreibung (Alt-Text)</label>
          <input id={`ga-${key}`} name="alt" className="input" defaultValue={item?.alt ?? ''} placeholder="Was ist zu sehen?" maxLength={160} />
          <span className="field-hint">Für Suchmaschinen und Screenreader. Leer = Titel.</span>
        </div>
        <div className="field">
          <label htmlFor={`go-${key}`}>Reihenfolge</label>
          <input id={`go-${key}`} name="sort" type="number" className="input" defaultValue={item?.sort ?? ''} placeholder="automatisch (ganz vorne)" />
        </div>
      </div>
      <label className="adm-check">
        <input type="checkbox" name="published" defaultChecked={item?.published ?? true} /> Auf der Website sichtbar
      </label>
      <label className="adm-check">
        <input type="checkbox" name="isDemo" defaultChecked={item?.isDemo ?? false} /> Demo-Visualisierung (keine echte Kundenarbeit) – wird entsprechend gekennzeichnet
      </label>
      <div className="adm-actions">
        <SubmitButton className="adm-btn">{item ? 'Eintrag speichern' : 'Eintrag anlegen'}</SubmitButton>
      </div>
    </ActionForm>
  )
}
