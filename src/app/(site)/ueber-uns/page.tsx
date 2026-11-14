import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageHero } from '@/components/site/PageHero'
import { FinalCta } from '@/components/home/Sections'
import { JsonLd } from '@/components/site/JsonLd'
import { Icon, type IconName } from '@/components/icons'
import { getSettings } from '@/lib/catalog'
import { breadcrumbJsonLd } from '@/lib/seo'
import styles from '@/components/pages/Pages.module.css'

export const metadata: Metadata = {
  title: 'Über uns – mobile Autoaufbereitung in Graz mit Anspruch',
  description:
    'RM Mobile Auto Aufbereitung steht für mobile Autoaufbereitung in Graz & Graz-Umgebung: sorgfältige Handarbeit, transparente Preise und ein Service, der zu Ihnen kommt.',
  alternates: { canonical: '/ueber-uns' },
}

// Bewusst ohne Zahlen, Auszeichnungen oder Zertifikate: Hier steht nur, wofür die Marke steht.
const PILLARS: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: 'gem',
    title: 'Markenphilosophie',
    text: 'Ein gepflegtes Fahrzeug ist ein gutes Gefühl – jeden Tag. Wir möchten, dass Sie dieses Gefühl erleben, ohne dafür Zeit opfern zu müssen.',
  },
  {
    icon: 'polish',
    title: 'Qualitätsanspruch',
    text: 'Wir arbeiten von Hand, gründlich und schonend. Lieber nehmen wir uns für ein Fahrzeug Zeit, als viele Fahrzeuge schnell abzufertigen.',
  },
  {
    icon: 'van',
    title: 'Mobiler Service',
    text: 'Wir kommen mit unserer Ausrüstung zu Ihnen – nach Hause, an den Arbeitsplatz oder an einen vereinbarten Standort im Einsatzgebiet.',
  },
  {
    icon: 'handshake',
    title: 'Ehrlich & transparent',
    text: 'Klare Endpreise je Fahrzeugkategorie, verständliche Leistungen und eine offene Abstimmung, bevor zusätzliche Kosten entstehen.',
  },
]

const METHOD: Array<{ title: string; text: string }> = [
  { title: 'Blick aufs Fahrzeug', text: 'Vor dem Start sehen wir uns Ihr Fahrzeug gemeinsam an und klären Besonderheiten, Wünsche und eventuelle Zusatzleistungen.' },
  { title: 'Schonend von Hand', text: 'Jede Oberfläche wird mit passender Methode behandelt – innen wie außen. Sorgfalt geht vor Tempo.' },
  { title: 'Detail für Detail', text: 'Fugen, Ablagen, Einstiege und Felgen: Es sind die Details, die den Unterschied zwischen sauber und gepflegt ausmachen.' },
  { title: 'Gemeinsame Übergabe', text: 'Am Ende gehen wir das Ergebnis gemeinsam mit Ihnen durch – offen, ehrlich und ohne Zeitdruck.' },
]

export default async function AboutPage() {
  const { area } = await getSettings()
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Über uns', path: '/ueber-uns' }])} />
      <PageHero
        eyebrow="Über uns"
        title={
          <>
            Fahrzeugpflege mit <span className="serif accent">Haltung.</span>
          </>
        }
        lead={`RM Mobile Auto Aufbereitung ist die mobile Premium-Fahrzeugpflege für ${area.regions.join(' & ')}. Unser Anspruch: Pflege, die man sieht – und ein Service, der sich nach Ihnen richtet.`}
        image="/images/interior.jpg"
        imagePosition="30% 40%"
      />

      <section className="section">
        <div className={`container ${styles.manifest}`}>
          <p className={`${styles.manifestQuote} reveal`}>
            Ihr Fahrzeug verdient mehr als nur eine <span className="serif accent">Reinigung.</span>
          </p>
          <div className={`${styles.manifestText} reveal`}>
            <p>
              Für viele ist das Auto mehr als ein Verkehrsmittel: Es begleitet durch den Alltag, zur Arbeit, in den Urlaub. Entsprechend
              sorgfältig sollte es gepflegt werden – nicht im Vorbeifahren, sondern mit Ruhe und einem genauen Blick.
            </p>
            <p>
              Genau dafür gibt es RM Mobile Auto Aufbereitung. Wir bringen professionelle Fahrzeugpflege dorthin, wo Ihr Fahrzeug steht. Sie buchen online,
              wir kommen zum vereinbarten Termin – und Sie nutzen Ihre Zeit für alles andere.
            </p>
            <p>
              Wir sind neu in {area.regions[0] ?? 'Graz'} und bauen unser Angebot Schritt für Schritt auf. Deshalb finden Sie hier keine
              großen Zahlen und keine geliehenen Versprechen – sondern klare Leistungen, klare Preise und den Anspruch, jeden Auftrag so
              auszuführen, dass Sie uns gerne weiterempfehlen.
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="werte-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow">Wofür wir stehen</p>
            <h2 id="werte-title" className="h2">
              Vier Grundsätze. <span className="serif accent">Jeden Tag.</span>
            </h2>
          </div>
          <ul className={styles.pillars}>
            {PILLARS.map((p, i) => (
              <li key={p.title} className={`${styles.pillar} reveal`} style={{ ['--reveal-delay' as string]: `${(i % 2) * 0.08}s` }}>
                <span className={styles.pillarIcon}>
                  <Icon name={p.icon} size={22} />
                </span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.band} aria-labelledby="mobil-title">
        <Image src="/images/graz-night.jpg" alt="" fill sizes="100vw" quality={70} />
        <div className={styles.bandShade} />
        <div className="container">
          <div className={`${styles.bandInner} reveal`}>
          <p className="eyebrow">Mobiler Service</p>
          <h2 id="mobil-title" className="h2">
            Wir kommen dorthin, wo Ihr <span className="serif accent">Fahrzeug steht.</span>
          </h2>
          <p className="lead">
            Zu Hause in der Einfahrt, am Firmenparkplatz oder an einem vereinbarten Standort in {area.regions.join(' & ')}.
          </p>
          <Link href="/einsatzgebiet" className="link-arrow">
            Einsatzgebiet ansehen <Icon name="arrow-right" />
          </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="arbeitsweise-title">
        <div className="container">
          <div className="section-head reveal">
            <p className="eyebrow">Arbeitsweise</p>
            <h2 id="arbeitsweise-title" className="h2">
              So arbeiten wir an <span className="serif accent">Ihrem Fahrzeug.</span>
            </h2>
          </div>
          <ol className={styles.method}>
            {METHOD.map((m) => (
              <li key={m.title} className="reveal">
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <FinalCta />
    </>
  )
}
