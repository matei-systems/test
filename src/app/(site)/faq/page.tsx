import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { FaqList } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon } from '@/components/icons'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo'
import { FAQ, FAQ_CATEGORIES } from '@/content/faq'
import styles from '@/components/pages/Pages.module.css'

export const metadata: Metadata = {
  title: 'FAQ – häufige Fragen zur mobilen Fahrzeugpflege',
  description:
    'Antworten auf häufige Fragen zu RM Mobile Auto Aufbereitung: Buchung, Dauer, Preise, Anfahrt, Fahrzeugvorbereitung, Stornierung und mobile Durchführung in Graz & Graz-Umgebung.',
  alternates: { canonical: '/faq' },
}

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ)} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'FAQ', path: '/faq' }])} />
      <PageHero
        eyebrow="FAQ"
        title={
          <>
            Gut zu <span className="serif accent">wissen.</span>
          </>
        }
        lead="Alles Wichtige rund um Buchung, Ablauf, Preise und Stornierung – übersichtlich nach Themen."
      />
      <section className="section">
        <div className={`container ${styles.faqLayout}`}>
          <nav className={styles.faqNav} aria-label="FAQ-Themen">
            {FAQ_CATEGORIES.map((c) => (
              <a key={c.id} href={`#${c.id}`}>
                {c.title}
              </a>
            ))}
          </nav>
          <div>
            <div className={styles.faqGroups}>
              {FAQ_CATEGORIES.map((c) => (
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
