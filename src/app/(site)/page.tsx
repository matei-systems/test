import type { Metadata } from 'next'
import Link from 'next/link'
import { Hero } from '@/components/home/Hero'
import { Services } from '@/components/home/Services'
import { Pricing } from '@/components/home/Pricing'
import { BeforeAfterShowcase } from '@/components/home/BeforeAfter'
import { Benefits, Faq, FinalCta, HowItWorks, ServiceAreaSection, Testimonials } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { getCatalog, getGallery, getSettings, getWorkingHours } from '@/lib/catalog'
import { maxRunningDiscount, serviceFromPrice } from '@/lib/pricing'
import { toCompareItems } from '@/lib/gallery'
import { faqJsonLd, localBusinessJsonLd } from '@/lib/seo'
import { FAQ_TOP } from '@/content/faq'
import { TESTIMONIALS } from '@/content/testimonials'
import { SITE } from '@/config/site'
import { formatEuro } from '@/lib/format'

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getCatalog()
  const now = Date.now()
  const parts = catalog.services
    .filter((s) => !s.requiresAddon)
    .slice(0, 3)
    .map((s) => ({ name: s.name, from: serviceFromPrice(catalog, s, now) }))
    .filter((p) => p.from.min.priceCents !== null)
    .map((p) => `${p.name} ab ${formatEuro(p.from.min.priceCents as number)}`)
  return {
    title: { absolute: `${SITE.name} – Fahrzeugpflege in Graz und Umgebung` },
    description: `Mobile Premium-Fahrzeugpflege in Graz & Graz-Umgebung${parts.length ? `: ${parts.join(', ')}` : ''}. Wir kommen zu Ihnen – Termin online buchen.`,
    alternates: { canonical: '/' },
  }
}

export default async function HomePage() {
  const [catalog, settings, hours, gallery] = await Promise.all([getCatalog(), getSettings(), getWorkingHours(), getGallery()])
  const now = Date.now()
  const prices = catalog.services
    .filter((s) => !s.requiresAddon)
    .map((s) => serviceFromPrice(catalog, s, now).min.priceCents)
    .filter((p): p is number => p !== null)
  const fromPrice = prices.length ? Math.min(...prices) : null
  const best = maxRunningDiscount(catalog, now)
  const comparisons = toCompareItems(gallery).slice(0, 5)
  const allDemo = comparisons.every((c) => c.isDemo)

  return (
    <>
      <JsonLd data={localBusinessJsonLd({ business: settings.business, area: settings.area, catalog, hours })} />
      <JsonLd data={faqJsonLd(FAQ_TOP)} />

      <Hero fromPrice={fromPrice} promo={best ? { name: best.promotion.name, percent: best.percent } : null} regions={settings.area.regions} />
      <Services catalog={catalog} now={now} />
      <Pricing catalog={catalog} now={now} />

      {comparisons.length > 0 && (
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
                Ziehen Sie den Regler und sehen Sie selbst, was gründliche Pflege ausmacht.
                {allDemo && ' Die Beispiele sind illustrative Demo-Visualisierungen und keine Kundenaufträge – echte Ergebnisse folgen in der Galerie.'}
              </p>
            </div>
            <div className="reveal">
              <BeforeAfterShowcase items={comparisons} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <Link href="/galerie" className="link-arrow">
                Zur Galerie <Icon name="arrow-right" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <Benefits />
      <HowItWorks autoConfirm={settings.rules.autoConfirm} />
      <Testimonials items={TESTIMONIALS} reviewUrl={settings.business.reviewUrl} />
      <ServiceAreaSection area={settings.area} />
      <Faq items={FAQ_TOP} />
      <FinalCta />
    </>
  )
}
