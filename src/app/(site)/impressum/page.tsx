import type { Metadata } from 'next'
import { LegalPage, Val } from '@/components/site/Legal'
import { getSettings } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum und Offenlegung gemäß § 5 ECG, § 14 UGB und § 25 MedienG.',
  alternates: { canonical: '/impressum' },
  robots: { index: true, follow: true },
}

export default async function ImpressumPage() {
  const { business: b } = await getSettings()
  return (
    <LegalPage title="Impressum" updated="November 2026">
      <p>Informationen und Offenlegung gemäß § 5 E-Commerce-Gesetz (ECG), § 14 Unternehmensgesetzbuch (UGB) und § 25 Mediengesetz (MedienG).</p>

      <h2>Medieninhaber &amp; Diensteanbieter</h2>
      <dl>
        <dt>Unternehmen</dt>
        <dd>
          <Val value={b.companyName} label="Firmenname" />
        </dd>
        <dt>Inhaber:in / Vertretung</dt>
        <dd>
          <Val value={b.ownerName} label="Name Inhaber:in" />
        </dd>
        <dt>Rechtsform</dt>
        <dd>
          <Val value={b.legalForm} label="Rechtsform" />
        </dd>
        <dt>Anschrift</dt>
        <dd>
          <Val value={b.street} label="Straße" />, <Val value={b.postalCode} label="PLZ" /> <Val value={b.city} label="Ort" />, {b.country || 'Österreich'}
        </dd>
        <dt>Telefon</dt>
        <dd>
          <Val value={b.phone} label="Telefonnummer" />
        </dd>
        <dt>E-Mail</dt>
        <dd>
          <Val value={b.email} label="E-Mail-Adresse" />
        </dd>
        <dt>UID-Nummer</dt>
        <dd>
          <Val value={b.vatId} label="UID-Nummer (falls vorhanden)" />
        </dd>
        <dt>Firmenbuch</dt>
        <dd>
          <Val value={b.companyRegister} label="Firmenbuchnummer & -gericht (falls eingetragen)" />
        </dd>
      </dl>

      <h2>Gewerberechtliche Angaben</h2>
      <dl>
        <dt>Unternehmensgegenstand / Gewerbe</dt>
        <dd>
          <Val value={b.trade} label="Gewerbewortlaut" />
        </dd>
        <dt>Gewerbebehörde</dt>
        <dd>
          <Val value={b.tradeAuthority} label="zuständige Gewerbebehörde" />
        </dd>
        <dt>Kammer</dt>
        <dd>
          <Val value={b.chamber} label="Kammerzugehörigkeit" />
        </dd>
        <dt>Berufsrecht</dt>
        <dd>Gewerbeordnung (GewO), abrufbar unter www.ris.bka.gv.at</dd>
      </dl>

      <h2>Grundlegende Richtung (Blattlinie)</h2>
      <p>Information über die Leistungen der mobilen Fahrzeugpflege und Online-Terminbuchung.</p>

      <h2>Online-Streitbeilegung</h2>
      <p>
        Verbraucher haben die Möglichkeit, Beschwerden an die Online-Streitbeilegungsplattform der EU zu richten:
        https://ec.europa.eu/consumers/odr. Du kannst allfällige Beschwerden auch an die oben angegebene E-Mail-Adresse richten.
      </p>

      <h2>Bildnachweis</h2>
      <p>
        Fahrzeugfotos und Gestaltungselemente: erstellt mit Canva (KI-generierte Bilder). Vorher-/Nachher-Darstellungen sind als
        Demo-Visualisierungen gekennzeichnet und zeigen keine Kundenfahrzeuge.
      </p>

      <h2>Haftung für Inhalte und Links</h2>
      <p>
        Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
        können wir jedoch keine Gewähr übernehmen. Für Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich.
      </p>
    </LegalPage>
  )
}
