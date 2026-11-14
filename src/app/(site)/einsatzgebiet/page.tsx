import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { PostalCheck } from '@/components/pages/PostalCheck'
import { FinalCta } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog, getSettings } from '@/lib/catalog'
import { breadcrumbJsonLd } from '@/lib/seo'
import styles from '@/components/pages/Pages.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { area } = await getSettings()
  return {
    title: `Einsatzgebiet – mobile Fahrzeugpflege in ${area.regions.join(' & ')}`,
    description: `RM Mobile Auto Aufbereitung kommt zu Ihnen: mobile Autoaufbereitung und Autoreinigung in ${area.regions.join(', ')} – Steiermark. Postleitzahl prüfen und online buchen.`,
    alternates: { canonical: '/einsatzgebiet' },
  }
}

export default async function ServiceAreaPage() {
  const [{ area }, catalog] = await Promise.all([getSettings(), getCatalog()])
  const packages = catalog.services.filter((s) => !s.requiresAddon)
  const regions = area.regions.join(' & ')
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Einsatzgebiet', path: '/einsatzgebiet' }])} />
      <PageHero
        eyebrow="Einsatzgebiet · Steiermark"
        title={
          <>
            Mobile Fahrzeugpflege in <span className="serif accent">{regions}.</span>
          </>
        }
        lead="Wir kommen zu Ihnen nach Hause, an Ihren Arbeitsplatz oder an einen vereinbarten Standort – Sie müssen nirgendwo hinfahren."
        image="/images/graz-night.jpg"
        imagePosition="60% 50%"
      />
      <section className="section">
        <div className={`container ${styles.areaGrid}`}>
          <div style={{ display: 'grid', gap: 28 }}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <p className="eyebrow">Hier sind wir unterwegs</p>
              <h2 className="h2">
                Orte in unserem <span className="serif accent">Einsatzgebiet.</span>
              </h2>
            </div>
            {area.communities.length > 0 && (
              <ul className={styles.places}>
                {area.communities.map((c) => (
                  <li key={c}>
                    <Icon name="pin" size={16} /> {c}
                  </li>
                ))}
              </ul>
            )}
            <p className="field-hint">
              Ihr Ort ist nicht dabei? Prüfen Sie Ihre Postleitzahl oder{' '}
              <Link href="/kontakt" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                fragen Sie direkt bei uns an
              </Link>
              .
            </p>
          </div>
          <PostalCheck ranges={area.postalCodes} />
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ display: 'grid', gap: 40 }}>
          <div className={styles.seoText}>
            <h2 className="h3">Autoaufbereitung in {area.regions[0] ?? 'Graz'} – direkt vor Ihrer Tür</h2>
            <p>
              Eine klassische Autoaufbereitung bedeutet: Termin vereinbaren, hinfahren, warten oder abholen lassen. Als mobile
              Fahrzeugpflege drehen wir das um. Wir bringen unsere Ausrüstung mit und pflegen Ihr Fahrzeug dort, wo es steht – in der
              Einfahrt, in der Garage (sofern erlaubt) oder am Firmenparkplatz.
            </p>
            <p>
              Ob Innenraumreinigung, Außenpflege oder das Komplettpaket: Bei der Online-Buchung geben Sie einfach die Adresse an, an der
              Ihr Fahrzeug steht. Die Anfahrt innerhalb des Einsatzgebiets ist im Preis enthalten.
            </p>
            <p>
              Wichtig für die Außenpflege: Eine Außenwäsche führen wir nur an geeigneten und zulässigen Standorten durch – auf befestigter
              Fläche mit ordnungsgemäßer Abwasserableitung nach den örtlichen Vorschriften, nicht auf öffentlichen Straßen oder unbefestigtem
              Untergrund. Ob Ihr Standort passt, klären wir vor der Terminbestätigung. Innenraumleistungen sind davon nicht betroffen.
            </p>
          </div>
          <ul className={styles.linkCards}>
            {packages.map((s) => (
              <li key={s.id}>
                <Link href={`/leistungen/${s.id}`}>
                  <span>
                    <strong>
                      {s.name} in {area.regions[0] ?? 'Graz'}
                    </strong>
                    <small>{s.tagline}</small>
                  </span>
                  <Icon name="arrow-right" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <FinalCta />
    </>
  )
}
