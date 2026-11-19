import type { Metadata } from 'next'
import { GALLERY_TOPICS } from '@/content/gallery'
import { PageHero } from '@/components/site/PageHero'
import { CompareSlider } from '@/components/home/BeforeAfter'
import { ImageSlider } from '@/components/home/ImageSlider'
import { FinalCta } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getGallery } from '@/lib/catalog'
import { toCompareItems, toGalleryImages } from '@/lib/gallery'
import { breadcrumbJsonLd, withOg } from '@/lib/seo'
import styles from './page.module.css'

export const metadata: Metadata = withOg({
  title: 'Galerie – Vorher & Nachher der Autoaufbereitung in Graz',
  description: 'Vorher-Nachher-Vergleiche und Eindrücke von RM6 Autoaufbereitung – mobile Fahrzeugpflege in Graz & Graz-Umgebung.',
  alternates: { canonical: '/galerie' },
})

export default async function GalleryPage() {
  const items = await getGallery()
  const comparisons = toCompareItems(items)
  const images = toGalleryImages(items)
  const hasDemo = items.some((i) => i.isDemo)
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Galerie', path: '/galerie' }])} />
      <PageHero
        eyebrow="Galerie"
        title={
          <>
            Vorher. Nachher. <span className="serif accent">Der Unterschied.</span>
          </>
        }
        lead="Ziehen Sie den Regler, um den Unterschied zu sehen. Echte Ergebnisse aus unseren Aufträgen in Graz ergänzen wir laufend."
      />
      <section className="section">
        <div className="container">
          {hasDemo && (
            <div className="notice" style={{ marginBottom: 32 }}>
              <Icon name="info" />
              <span>
                Hinweis: Mit „Demo“ gekennzeichnete Bilder sind Visualisierungen und zeigen keine echten Kundenfahrzeuge. Sobald die ersten
                Aufträge abgeschlossen sind, finden Sie hier echte Ergebnisse.
              </span>
            </div>
          )}
          {comparisons.length > 0 ? (
            <ul className={styles.grid}>
              {comparisons.map((item, i) => (
                <li key={item.id} className={`${styles.item} ${i > 1 ? 'reveal' : ''}`}>
                  <CompareSlider item={item} priority={i === 0} />
                  <div className={styles.meta}>
                    {item.category && <span className="badge badge--neutral">{item.category}</span>}
                    <h2 className="h3">{item.title}</h2>
                    {item.description && <p className="muted">{item.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="lead">Die ersten Vorher-Nachher-Vergleiche folgen in Kürze.</p>
          )}
        </div>
      </section>
      {hasDemo && (
        <section className="section" style={{ paddingTop: 0 }} aria-labelledby="fotoplan-title">
          <div className="container">
            <div className={styles.topics}>
              <div>
                <p className="eyebrow">Echte Einblicke</p>
                <h2 id="fotoplan-title" className="h3">
                  Was Sie hier künftig sehen
                </h2>
                <p className="muted">
                  Sobald die ersten Aufträge abgeschlossen sind, zeigen wir echte Fotos aus Graz und Umgebung – nur mit Einverständnis unserer
                  Kundinnen und Kunden und ohne Kennzeichen. Keine gestellten Bilder, keine erfundenen Ergebnisse.
                </p>
              </div>
              <ul>
                {GALLERY_TOPICS.map((t) => (
                  <li key={t.category}>
                    <Icon name={t.icon} size={18} />
                    {t.category}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
      {images.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">Eindrücke</p>
              <h2 className="h2">
                Liebe zum <span className="serif accent">Detail.</span>
              </h2>
            </div>
            <ImageSlider images={images} />
          </div>
        </section>
      )}
      <FinalCta />
    </>
  )
}
