import type { Metadata } from 'next'
import { PageHero } from '@/components/site/PageHero'
import { CompareSlider } from '@/components/home/BeforeAfter'
import { ImageSlider } from '@/components/home/ImageSlider'
import { FinalCta } from '@/components/home/Sections'
import { Icon } from '@/components/icons'
import { BEFORE_AFTER, GALLERY } from '@/content/gallery'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Galerie – Vorher & Nachher',
  description: 'Vorher-Nachher-Vergleiche und Eindrücke der mobilen Premium-Fahrzeugpflege von GLANZMOBIL in Graz & Graz-Umgebung.',
  alternates: { canonical: '/galerie' },
}

export default function GalleryPage() {
  const hasDemo = BEFORE_AFTER.some((b) => b.isDemo) || GALLERY.some((g) => g.isDemo)
  return (
    <>
      <PageHero
        eyebrow="Galerie"
        title={
          <>
            Vorher. Nachher. <span className="serif accent">Der Unterschied.</span>
          </>
        }
        lead="Ziehe den Regler, um den Unterschied zu sehen. Neue Arbeiten ergänzen wir laufend."
      />
      <section className="section">
        <div className="container">
          {hasDemo && (
            <div className="notice" style={{ marginBottom: 32 }}>
              <Icon name="info" />
              <span>
                Hinweis: Die aktuell gezeigten Bilder sind Demo-Visualisierungen und zeigen keine echten Kundenfahrzeuge. Sobald die ersten
                Aufträge abgeschlossen sind, findest du hier echte Ergebnisse.
              </span>
            </div>
          )}
          <ul className={styles.grid}>
            {BEFORE_AFTER.map((item, i) => (
              <li key={item.id} className={`${styles.item} ${i > 1 ? 'reveal' : ''}`}>
                <CompareSlider item={item} priority={i === 0} />
                <div className={styles.meta}>
                  <span className="badge badge--neutral">{item.category}</span>
                  <h2 className="h3">{item.title}</h2>
                  <p className="muted">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow">Eindrücke</p>
            <h2 className="h2">
              Liebe zum <span className="serif accent">Detail.</span>
            </h2>
          </div>
          <ImageSlider images={GALLERY} />
        </div>
      </section>
      <FinalCta />
    </>
  )
}
