import type { Metadata } from 'next'
import { PageHero } from '@/components/site/PageHero'
import { CompareSlider } from '@/components/home/BeforeAfter'
import { ImageSlider } from '@/components/home/ImageSlider'
import { FinalCta } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getGallery } from '@/lib/catalog'
import { toCompareItems, toGalleryImages } from '@/lib/gallery'
import { breadcrumbJsonLd } from '@/lib/seo'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Galerie – Vorher & Nachher',
  description: 'Vorher-Nachher-Vergleiche und Eindrücke der mobilen Premium-Fahrzeugpflege von RM Mobile Autoaufbereitung in Graz & Graz-Umgebung.',
  alternates: { canonical: '/galerie' },
}

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
        lead="Ziehe den Regler, um den Unterschied zu sehen. Neue Arbeiten ergänzen wir laufend."
      />
      <section className="section">
        <div className="container">
          {hasDemo && (
            <div className="notice" style={{ marginBottom: 32 }}>
              <Icon name="info" />
              <span>
                Hinweis: Mit „Demo“ gekennzeichnete Bilder sind Visualisierungen und zeigen keine echten Kundenfahrzeuge. Sobald die ersten
                Aufträge abgeschlossen sind, findest du hier echte Ergebnisse.
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
