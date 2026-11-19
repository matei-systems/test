import type { Metadata } from 'next'
import { catalogFaq } from '@/content/faq-catalog'
import { getCatalog } from '@/lib/catalog'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { FaqList } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { breadcrumbJsonLd, faqJsonLd, withOg } from '@/lib/seo'
import { FAQ_CATEGORIES } from '@/content/faq'
import styles from '@/components/pages/Pages.module.css'

export const metadata: Metadata = withOg({
  title: 'FAQ – Fragen zur mobilen Autoaufbereitung in Graz',
  description:
    'Antworten auf häufige Fragen zu RM6 Autoaufbereitung: Buchung, Dauer, Preise, Anfahrt, Fahrzeugvorbereitung, Stornierung und mobile Durchführung in Graz & Graz-Umgebung.',
  alternates: { canonical: '/faq' },
})

export default async function FaqPage() {
  const catalog = await getCatalog()
  const categories = [catalogFaq(catalog, Date.now()), ...FAQ_CATEGORIES].filter((c) => c.items.length > 0)
  return (
    <>
      <JsonLd data={faqJsonLd(categories.flatMap((c) => c.items))} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'FAQ', path: '/faq' }])} />
      <PageHero
        eyebrow="FAQ"
        title={
          <>
            Gut zu <span className="serif accent">wissen.</span>
          </>
        }
        lead="Alles Wichtige rund um Leistungen, Preise, Buchung, Ablauf und Stornierung – übersichtlich nach Themen."
      />
      <section className="section">
        <div className={`container ${styles.faqLayout}`}>
          <nav className={styles.faqNav} aria-label="FAQ-Themen">
            {categories.map((c) => (
              <a key={c.id} href={`#${c.id}`}>
                {c.title}
              </a>
            ))}
          </nav>
          <div>
            <div className={styles.faqGroups}>
              {categories.map((c) => (
                <section key={c.id} id={c.id} className={styles.faqGroup} aria-labelledby={`${c.id}-title`}>
                  <h2 id={`${c.id}-title`}>{c.title}</h2>
                  <FaqList items={c.items} />
                </section>
              ))}
            </div>
            <div className={styles.faqHelp}>
              <div>
                <h2 className="h3">Ihre Frage war nicht dabei?</h2>
                <p className="muted">Schreiben Sie uns – wir antworten persönlich.</p>
              </div>
              <Link href="/kontakt" className="btn btn--ghost">
                Zum Kontakt <Icon name="arrow-right" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
