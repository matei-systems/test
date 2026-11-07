import type { Metadata } from 'next'
import Link from 'next/link'
import { Hero } from '@/components/home/Hero'
import { Services } from '@/components/home/Services'
import { Pricing } from '@/components/home/Pricing'
import { BeforeAfterShowcase } from '@/components/home/BeforeAfter'
import { Benefits, Faq, FinalCta, HowItWorks, ServiceAreaSection, Testimonials } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog, getSettings, getWorkingHours } from '@/lib/catalog'
import { servicePriceRange } from '@/lib/pricing'
import { faqJsonLd, localBusinessJsonLd } from '@/lib/seo'
import { FAQ } from '@/content/faq'
import { BEFORE_AFTER } from '@/content/gallery'
import { REVIEW_URL, TESTIMONIALS } from '@/content/testimonials'
import { SITE } from '@/config/site'
import { formatEuro } from '@/lib/format'

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getCatalog()
  const price = (id: string) => {
    const s = catalog.services.find((x) => x.id === id)
    return s ? servicePriceRange(s, catalog.vehicles).min : null
  }
  const parts = [
    ['Innenreinigung', price('innenraumreinigung')],
    ['Außenreinigung', price('aussenreinigung')],
    ['Komplettreinigung', price('komplettreinigung')],
  ]
    .filter(([, p]) => p !== null)
    .map(([n, p]) => `${n} ab ${formatEuro(p as number)}`)
  return {
    title: { absolute: `${SITE.name} – Mobile Autoaufbereitung & Autoreinigung in Graz und Umgebung` },
    description: `Mobile Premium-Fahrzeugpflege in Graz & Graz-Umgebung${parts.length ? `: ${parts.join(', ')}` : ''}. Wir kommen zu dir – Termin online buchen.`,
    alternates: { canonical: '/' },
  }
}

export default async function HomePage() {
  const [catalog, settings, hours] = await Promise.all([getCatalog(), getSettings(), getWorkingHours()])
  const prices = catalog.services
    .filter((s) => !s.requiresAddon)
    .map((s) => servicePriceRange(s, catalog.vehicles).min)
    .filter((p): p is number => p !== null)
  const fromPrice = prices.length ? Math.min(...prices) : null

  return (
    <>
      <JsonLd data={localBusinessJsonLd({ business: settings.business, area: settings.area, catalog, hours })} />
      <JsonLd data={faqJsonLd(FAQ)} />

      <Hero fromPrice={fromPrice} regions={settings.area.regions} />
      <Services catalog={catalog} />
      <Pricing catalog={catalog} />

      <section id="vorher-nachher" className="section" aria-labelledby="ba-title" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head section-head--split reveal">
            <div style={{ display: 'grid', gap: 20 }}>
              <p className="eyebrow">Vorher · Nachher</p>
              <h2 id="ba-title" className="h2">
                Der Unterschied ist <span className="serif accent">sichtbar.</span>
              </h2>
            </div>
            <p className="lead">
              Ziehe den Regler und sieh selbst, was gründliche Pflege ausmacht. Die Beispiele sind Demo-Visualisierungen – echte Ergebnisse
              unserer Kundenfahrzeuge folgen in der Galerie.
            </p>
          </div>
          <div className="reveal">
            <BeforeAfterShowcase items={BEFORE_AFTER} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <Link href="/galerie" className="link-arrow">
              Zur Galerie <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </section>

      <HowItWorks />
      <Benefits />
      <Testimonials items={TESTIMONIALS} reviewUrl={REVIEW_URL} />
      <ServiceAreaSection area={settings.area} />
      <Faq items={FAQ} />
      <FinalCta />
    </>
  )
}
