import Image from 'next/image'
import Link from 'next/link'
import { Icon, type IconName } from '../icons'
import type { FaqItem } from '@/content/faq'
import type { Testimonial } from '@/content/testimonials'
import type { ServiceArea } from '@/config/defaults'
import styles from './Sections.module.css'

// ─── So funktioniert es ─────────────────────────────────────────────────────────
function steps(autoConfirm: boolean): Array<{ icon: IconName; title: string; text: string }> {
  return [
    { icon: 'sparkle', title: 'Leistung auswählen', text: 'Paket wählen – Leistungsumfang, Preis und ungefähre Dauer sehen Sie sofort.' },
    { icon: 'car', title: 'Fahrzeugdaten angeben', text: 'Fahrzeugkategorie und Modell angeben, bei Bedarf Zusatzleistungen ergänzen.' },
    { icon: 'calendar', title: 'Wunschort und Termin wählen', text: 'Adresse eingeben und einen freien Termin im Kalender auswählen – angezeigt werden nur tatsächlich freie Zeiten.' },
    {
      icon: 'list',
      title: 'Buchung absenden',
      text: 'Alle Angaben und den Gesamtpreis prüfen, dann absenden. Sie erhalten sofort eine Buchungsnummer, der Termin ist für Sie reserviert. Online ist keine Zahlung nötig.',
    },
    {
      icon: 'mail',
      title: 'Terminbestätigung erhalten',
      text: autoConfirm
        ? 'Ihr Termin wird sofort bestätigt – Sie erhalten die Bestätigung mit allen Details per E-Mail.'
        : 'Wir prüfen anschließend Ihre Angaben und bestätigen Ihren Termin persönlich per E-Mail. Erst danach ist Ihr Termin verbindlich bestätigt.',
    },
    { icon: 'shield', title: 'Fahrzeug aufbereiten lassen', text: 'Wir kommen zur vereinbarten Zeit zu Ihnen und pflegen Ihr Fahrzeug mit Sorgfalt und Blick fürs Detail.' },
  ]
}

export function HowItWorks({ autoConfirm }: { autoConfirm: boolean }) {
  return (
    <section id="ablauf" className="section" aria-labelledby="ablauf-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="eyebrow">So läuft es ab</p>
          <h2 id="ablauf-title" className="h2">
            In sechs Schritten zum <span className="serif accent">gepflegten Fahrzeug.</span>
          </h2>
          <p className="lead">
            {autoConfirm
              ? 'Ihre Online-Buchung wird sofort bestätigt.'
              : 'Gut zu wissen: Mit dem Absenden ist Ihr Termin reserviert – verbindlich fix ist er, sobald wir ihn per E-Mail bestätigt haben.'}
          </p>
        </div>
        <ol className={styles.steps}>
          {steps(autoConfirm).map((s, i) => (
            <li key={s.title} className={`${styles.step} reveal`} style={{ ['--reveal-delay' as string]: `${(i % 3) * 0.12}s` }}>
              <span className={styles.stepNum} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
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
const BENEFITS: Array<{ icon: IconName; title: string; text: string; href?: string; cta?: string }> = [
  {
    icon: 'handshake',
    title: 'Persönlicher Service',
    text: 'Wir bestätigen jeden Termin persönlich und stimmen Besonderheiten – etwa Standort oder starke Verschmutzung – vorab mit Ihnen ab.',
  },
  {
    icon: 'van',
    title: 'Mobile Durchführung',
    text: 'Kein Hinfahren, kein Warten: Wir kommen mit unserer Ausrüstung zu Ihrem Fahrzeug – nach Hause, an den Arbeitsplatz oder an einen vereinbarten Standort.',
  },
  {
    icon: 'tag',
    title: 'Transparente Preise',
    text: 'Endpreise je Fahrzeugkategorie inklusive Anfahrt. Zusatzkosten entstehen nur nach Ihrer Zustimmung.',
    href: '/preise',
    cta: 'Zur Preisliste',
  },
  {
    icon: 'polish',
    title: 'Sorgfältige Arbeit',
    text: 'Handarbeit mit schonenden Methoden. Was enthalten ist – und was nicht –, steht bei jeder Leistung offen dabei.',
    href: '/leistungen',
    cta: 'Leistungen ansehen',
  },
  {
    icon: 'calendar',
    title: 'Einfache Terminvereinbarung',
    text: 'Freie Termine online sehen und reservieren. Nach dem Absenden erhalten Sie sofort eine Buchungsnummer.',
    href: '/buchen',
    cta: 'Termin wählen',
  },
  {
    icon: 'pin',
    title: 'Graz und Graz-Umgebung',
    text: 'Unterwegs in Graz und den Gemeinden rund um Graz. Ob Ihr Standort dazugehört, prüfen Sie mit Ihrer Postleitzahl.',
    href: '/einsatzgebiet',
    cta: 'Einsatzgebiet prüfen',
  },
]

export function Benefits() {
  return (
    <section className={`section ${styles.benefitsSection}`} aria-labelledby="vorteile-title">
      <div className="container">
        <div className="section-head section-head--split reveal">
          <div style={{ display: 'grid', gap: 20 }}>
            <p className="eyebrow">Ihre Vorteile</p>
            <h2 id="vorteile-title" className="h2">
              Fahrzeugpflege, der Sie <span className="serif accent">vertrauen können.</span>
            </h2>
          </div>
          <p className="lead">
            Keine leeren Versprechen: klare Leistungen, Endpreise vor der Buchung und ein Termin, den wir persönlich mit Ihnen bestätigen.
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
              {b.href && (
                <Link href={b.href} className="link-arrow" style={{ marginTop: 'auto', fontSize: '0.86rem' }}>
                  {b.cta} <Icon name="arrow-right" />
                </Link>
              )}
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
            Was zählt, ist <span className="serif accent">Ihr Eindruck.</span>
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
              <h3 className="h3">Neu in Graz – Ihre Meinung zählt.</h3>
              <p className="muted">
                Wir sind neu am Markt und zeigen hier ausschließlich echte Bewertungen unserer Kundinnen und Kunden – keine erfundenen
                Stimmen. Nach Ihrem abgeschlossenen Termin freuen wir uns über Ihr ehrliches Feedback.
              </p>
            </div>
            {reviewUrl && (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                Bewertung abgeben <Icon name="external" />
              </a>
            )}
          </div>
        )}
        {items.length > 0 && reviewUrl && (
          <div className={`${styles.center} reveal`}>
            <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
              Alle Bewertungen ansehen <Icon name="external" />
            </a>
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
            Mobile Autoaufbereitung in <span className="serif accent">{area.regions.join(' & ')}.</span>
          </h2>
          <p className="lead">
            Wir kommen zu Ihnen nach Hause, an Ihren Arbeitsplatz oder an einen vereinbarten Standort. Ob Innenraumreinigung, Außenpflege
            oder Komplettpaket – in Graz und der ganzen Umgebung.
          </p>
          <Link href="/einsatzgebiet" className="link-arrow">
            Einsatzgebiet &amp; Postleitzahl prüfen <Icon name="arrow-right" />
          </Link>
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
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
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
  )
}

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
          <Link href="/faq" className="link-arrow">
            Alle Fragen &amp; Antworten <Icon name="arrow-right" />
          </Link>
        </div>
        <FaqList items={items} />
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
        <p className="lead">Wählen Sie Leistung und Wunschtermin – wir kümmern uns um den Rest. Direkt bei Ihnen vor Ort.</p>
        <div className={styles.ctaButtons}>
          <Link href="/buchen" className="btn btn--primary">
            Jetzt Termin buchen <Icon name="arrow-right" />
          </Link>
          <Link href="/kontakt?anliegen=angebot" className="btn btn--ghost">
            Individuelles Angebot anfragen
          </Link>
        </div>
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          Noch unsicher, welches Paket passt?{' '}
          <Link href="/leistungen" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Alle Leistungen entdecken
          </Link>{' '}
          oder{' '}
          <Link href="/preise" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Preise vergleichen
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
