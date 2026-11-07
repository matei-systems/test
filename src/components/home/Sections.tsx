import Image from 'next/image'
import Link from 'next/link'
import { Icon, type IconName } from '../icons'
import type { FaqItem } from '@/content/faq'
import type { Testimonial } from '@/content/testimonials'
import type { ServiceArea } from '@/config/defaults'
import styles from './Sections.module.css'

// ─── So funktioniert es ─────────────────────────────────────────────────────────
const STEPS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'sparkle', title: 'Leistung auswählen', text: 'Paket und Fahrzeugkategorie wählen – Preis und Dauer siehst du sofort.' },
  { icon: 'calendar', title: 'Wunschtermin buchen', text: 'Freien Termin im Kalender wählen und Standort angeben. Dauert keine zwei Minuten.' },
  { icon: 'van', title: 'Wir kommen zu dir', text: 'Pünktlich an deinem Standort – zu Hause, im Büro oder am vereinbarten Ort.' },
  { icon: 'shield', title: 'Fahrzeugpflege genießen', text: 'Du nutzt deine Zeit, wir pflegen dein Fahrzeug mit Sorgfalt und Blick fürs Detail.' },
]

export function HowItWorks() {
  return (
    <section id="ablauf" className="section" aria-labelledby="ablauf-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="eyebrow">So funktioniert es</p>
          <h2 id="ablauf-title" className="h2">
            Vier Schritte zum <span className="serif accent">perfekten Glanz.</span>
          </h2>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s.title} className={`${styles.step} reveal`} style={{ ['--reveal-delay' as string]: `${i * 0.1}s` }}>
              <span className={styles.stepNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.stepIcon}>
                <Icon name={s.icon} size={22} />
              </span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepText}>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className={`${styles.center} reveal`}>
          <Link href="/buchen" className="btn btn--primary">
            Jetzt Termin wählen <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Vorteile ───────────────────────────────────────────────────────────────────
const BENEFITS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'van', title: 'Mobile Fahrzeugpflege', text: 'Kein Hinfahren, kein Warten. Wir kommen mit unserem Equipment direkt zu deinem Fahrzeug.' },
  { icon: 'calendar', title: 'Flexible Terminvereinbarung', text: 'Online rund um die Uhr buchen – du siehst nur Termine, die wirklich frei sind.' },
  { icon: 'tag', title: 'Transparente Preise', text: 'Klare Preise je Fahrzeugkategorie. Zusatzkosten werden immer vorab besprochen.' },
  { icon: 'polish', title: 'Professionelle Arbeitsweise', text: 'Sorgfältige Handarbeit, schonende Methoden und ein genauer Blick für jedes Detail.' },
  { icon: 'handshake', title: 'Persönlicher Service', text: 'Persönlicher Kontakt, ehrliche Beratung und Termine, die zu deinem Alltag passen.' },
  { icon: 'pin', title: 'Regional verfügbar', text: 'In Graz und Graz-Umgebung zu Hause – kurze Wege, schnelle Termine.' },
]

export function Benefits() {
  return (
    <section className={`section ${styles.benefitsSection}`} aria-labelledby="vorteile-title">
      <div className="container">
        <div className="section-head section-head--split reveal">
          <div style={{ display: 'grid', gap: 20 }}>
            <p className="eyebrow">Warum GLANZMOBIL</p>
            <h2 id="vorteile-title" className="h2">
              Vertrauen, das man <span className="serif accent">sieht.</span>
            </h2>
          </div>
          <p className="lead">
            Dein Fahrzeug ist mehr als ein Verkehrsmittel. Deshalb behandeln wir es mit genau der Sorgfalt, die wir uns selbst wünschen
            würden.
          </p>
        </div>
        <ul className={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <li key={b.title} className={`${styles.benefit} reveal`} style={{ ['--reveal-delay' as string]: `${(i % 3) * 0.08}s` }}>
              <span className={styles.benefitIcon}>
                <Icon name={b.icon} size={22} />
              </span>
              <h3 className={styles.benefitTitle}>{b.title}</h3>
              <p className={styles.benefitText}>{b.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─── Kundenbewertungen ──────────────────────────────────────────────────────────
export function Testimonials({ items, reviewUrl }: { items: Testimonial[]; reviewUrl: string }) {
  return (
    <section className="section section--tight" aria-labelledby="bewertungen-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="eyebrow">Kundenbewertungen</p>
          <h2 id="bewertungen-title" className="h2">
            Was zählt, ist <span className="serif accent">dein Eindruck.</span>
          </h2>
        </div>
        {items.length > 0 ? (
          <ul className={styles.reviews}>
            {items.map((t) => (
              <li key={`${t.name}-${t.date}`} className={`card ${styles.review} reveal`}>
                <p className={styles.stars} aria-label={`${t.rating} von 5 Sternen`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon key={i} name="star" size={16} fill={i < t.rating ? 'currentColor' : 'none'} />
                  ))}
                </p>
                <blockquote className={styles.quote}>„{t.text}“</blockquote>
                <p className={styles.reviewer}>
                  {t.name}
                  {t.location ? `, ${t.location}` : ''} <span>· {t.source}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={`${styles.reviewEmpty} reveal`}>
            <span className={styles.benefitIcon}>
              <Icon name="star" size={22} />
            </span>
            <div>
              <h3 className="h3">Neu in Graz – und stolz auf jedes Detail.</h3>
              <p className="muted">
                Wir veröffentlichen hier ausschließlich echte Bewertungen unserer Kundinnen und Kunden. Nach deinem Termin freuen wir uns
                über dein ehrliches Feedback.
              </p>
            </div>
            {reviewUrl && (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                Bewertung abgeben <Icon name="external" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Einsatzgebiet ──────────────────────────────────────────────────────────────
export function ServiceAreaSection({ area }: { area: ServiceArea }) {
  return (
    <section className={styles.area} aria-labelledby="gebiet-title">
      <Image src="/images/graz-night.jpg" alt="" fill sizes="100vw" quality={70} className={styles.areaImg} />
      <div className={styles.areaShade} />
      <div className={`container ${styles.areaInner}`}>
        <div className="reveal" style={{ display: 'grid', gap: 20, maxWidth: 560 }}>
          <p className="eyebrow">Einsatzgebiet</p>
          <h2 id="gebiet-title" className="h2">
            Mobile Fahrzeugpflege in <span className="serif accent">{area.regions.join(' & ')}.</span>
          </h2>
          <p className="lead">
            Wir kommen zu dir nach Hause, an deinen Arbeitsplatz oder an einen vereinbarten Standort. Ob Innenreinigung, Außenreinigung
            oder Komplettaufbereitung – in Graz und der ganzen Umgebung.
          </p>
        </div>
        {area.communities.length > 0 && (
          <ul className={`${styles.places} reveal`} aria-label="Orte im Einsatzgebiet">
            {area.communities.map((c) => (
              <li key={c}>
                <Icon name="pin" size={14} /> {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// ─── FAQ ────────────────────────────────────────────────────────────────────────
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className={`container ${styles.faqGrid}`}>
        <div className={`${styles.faqHead} reveal`}>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="h2">
            Gut zu <span className="serif accent">wissen.</span>
          </h2>
          <p className="lead">Die wichtigsten Antworten rund um Ablauf, Preise und Termine.</p>
        </div>
        <div className={styles.faqList}>
          {items.map((f, i) => (
            <details key={f.q} className={`${styles.faqItem} reveal`} style={{ ['--reveal-delay' as string]: `${Math.min(i, 4) * 0.05}s` }}>
              <summary>
                <span>{f.q}</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  <Icon name="plus" size={18} />
                </span>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Abschluss-CTA ──────────────────────────────────────────────────────────────
export function FinalCta() {
  return (
    <section className={styles.cta} aria-labelledby="cta-title">
      <Image src="/images/wash.jpg" alt="" fill sizes="100vw" quality={70} className={styles.ctaImg} />
      <div className={styles.ctaShade} />
      <div className={`container ${styles.ctaInner} reveal`}>
        <p className="eyebrow">Termin sichern</p>
        <h2 id="cta-title" className="display" style={{ fontSize: 'clamp(2.4rem, 5.6vw, 4.8rem)' }}>
          Bereit für <span className="serif accent">perfekten Glanz?</span>
        </h2>
        <p className="lead">Wähle Leistung und Wunschtermin – wir kümmern uns um den Rest. Direkt bei dir vor Ort.</p>
        <div className={styles.ctaButtons}>
          <Link href="/buchen" className="btn btn--primary">
            Termin jetzt buchen <Icon name="arrow-right" />
          </Link>
          <Link href="/leistungen" className="btn btn--ghost">
            Alle Leistungen
          </Link>
        </div>
      </div>
    </section>
  )
}
