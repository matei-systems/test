import type { Metadata } from 'next'
import { LegalPage, Todo, Val } from '@/components/site/Legal'
import { getSettings } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Informationen zur Verarbeitung personenbezogener Daten bei GLANZMOBIL gemäß DSGVO.',
  alternates: { canonical: '/datenschutz' },
}

export default async function PrivacyPage() {
  const { business: b } = await getSettings()
  return (
    <LegalPage title="Datenschutzerklärung" updated="November 2026">
      <p>
        Der Schutz deiner personenbezogenen Daten ist uns ein wichtiges Anliegen. Wir verarbeiten deine Daten ausschließlich auf Grundlage
        der gesetzlichen Bestimmungen (Datenschutz-Grundverordnung – DSGVO, Datenschutzgesetz – DSG, Telekommunikationsgesetz – TKG 2021).
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        <Val value={b.companyName} label="Firmenname" />, <Val value={b.ownerName} label="Name Inhaber:in" />
        <br />
        <Val value={b.street} label="Straße" />, <Val value={b.postalCode} label="PLZ" /> <Val value={b.city} label="Ort" />
        <br />
        E-Mail: <Val value={b.email} label="E-Mail-Adresse" /> · Telefon: <Val value={b.phone} label="Telefonnummer" />
      </p>

      <h2>2. Online-Terminbuchung</h2>
      <p>Wenn du über unsere Website einen Termin buchst, verarbeiten wir folgende Daten:</p>
      <ul>
        <li>Vor- und Nachname, Telefonnummer, E-Mail-Adresse</li>
        <li>Adresse des Einsatzorts (Standort des Fahrzeugs) und optional Hinweise zum Standort</li>
        <li>Fahrzeugkategorie, Fahrzeugmodell und optional das Kennzeichen</li>
        <li>gewählte Leistungen, Termin, Preis sowie optional deine Nachricht an uns</li>
        <li>Zeitpunkt deiner Zustimmung zu AGB und Datenschutzerklärung</li>
      </ul>
      <p>
        <strong>Zweck:</strong> Durchführung der Buchung und der Fahrzeugpflege, Kommunikation zum Termin (Bestätigung, Änderungen,
        Terminerinnerung, Stornierung), Abrechnung. <strong>Rechtsgrundlage:</strong> Vertragserfüllung bzw. vorvertragliche Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO) sowie
        gesetzliche Aufbewahrungspflichten (Art. 6 Abs. 1 lit. c DSGVO).
      </p>
      <p>
        <strong>Speicherdauer:</strong> Buchungsdaten werden gelöscht bzw. anonymisiert, sobald sie für die genannten Zwecke nicht mehr
        erforderlich sind. Rechnungsrelevante Daten bewahren wir gemäß den steuerrechtlichen Vorschriften (in der Regel sieben Jahre) auf.{' '}
        <Todo>[Konkrete Löschfristen festlegen]</Todo>
      </p>

      <p>
        Über den persönlichen Link in deiner Buchungsbestätigung kannst du deine Buchung einsehen und – innerhalb der angegebenen Frist –
        selbst stornieren. Der Link ist nur dir bekannt; bitte gib ihn nicht weiter.
      </p>

      <h2>3. E-Mail-Benachrichtigungen</h2>
      <p>
        Zur Abwicklung deiner Buchung senden wir dir E-Mails (Eingangs- bzw. Buchungsbestätigung, Terminänderung, Terminerinnerung am
        Vortag, Stornobestätigung) über einen E-Mail-Dienst. Diese Nachrichten sind Teil der Vertragsabwicklung (Art. 6 Abs. 1 lit. b
        DSGVO). <Todo>[E-Mail-Anbieter (SMTP) und Sitz ergänzen]</Todo>
      </p>

      <h2>4. Kontaktformular</h2>
      <p>
        Wenn du uns über das Kontaktformular schreibst, verarbeiten wir deinen Namen, deine E-Mail-Adresse, optional deine Telefonnummer,
        das gewählte Anliegen und deine Nachricht, um deine Anfrage zu beantworten (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Die Anfrage wird
        in unserer Datenbank gespeichert und gelöscht, sobald sie abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten
        entgegenstehen. <Todo>[Konkrete Löschfrist für Kontaktanfragen festlegen]</Todo>
      </p>

      <h2>5. Angebote und Neuigkeiten per E-Mail (optional)</h2>
      <p>
        Nur wenn du bei der Buchung ausdrücklich einwilligst, verwenden wir deine E-Mail-Adresse, um dir gelegentlich Angebote und
        Neuigkeiten von GLANZMOBIL zu senden (Art. 6 Abs. 1 lit. a DSGVO, § 174 TKG 2021). Die Einwilligung ist freiwillig, für die Buchung
        nicht erforderlich und kann jederzeit mit Wirkung für die Zukunft widerrufen werden – formlos per E-Mail an{' '}
        <Val value={b.email} label="E-Mail-Adresse" />. Wir speichern den Zeitpunkt deiner Einwilligung als Nachweis.
      </p>

      <h2>6. Fotos in der Galerie</h2>
      <p>
        Fotos von Kundenfahrzeugen veröffentlichen wir nur mit Einverständnis der Kundin bzw. des Kunden und ohne erkennbare Kennzeichen
        oder Personen. Mit „Demo“ gekennzeichnete Bilder sind Visualisierungen und zeigen keine Kundenfahrzeuge.
      </p>

      <h2>7. Hosting und Datenbank</h2>
      <p>
        Diese Website und die Buchungsdatenbank werden bei externen Dienstleistern betrieben, die in unserem Auftrag tätig sind
        (Auftragsverarbeiter gemäß Art. 28 DSGVO). <Todo>[Hosting-Anbieter, Datenbank-Anbieter, Serverstandort und ggf. Grundlage für Datenübermittlung in Drittländer ergänzen]</Todo>
      </p>
      <p>
        Beim Aufruf der Website verarbeitet der Hosting-Anbieter technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite)
        in Server-Logfiles, um den sicheren Betrieb zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Zum Schutz vor Missbrauch (z. B.
        massenhafte Buchungs- oder Anmeldeversuche) speichern wir kurzfristig einen nicht umkehrbaren Hash-Wert der IP-Adresse.
      </p>

      <h2>8. Cookies, Schriftarten und Tracking</h2>
      <p>
        Wir verwenden <strong>keine</strong> Cookies zu Werbe- oder Analysezwecken und setzen keine Tracking-Tools ein. Deshalb ist auf
        dieser Website auch kein Cookie-Banner erforderlich. Schriftarten und Bilder werden direkt von unserem Server geladen – es werden
        dabei keine Daten an Dritte (z. B. Google Fonts) übertragen. Im passwortgeschützten Verwaltungsbereich wird ein technisch
        notwendiges Sitzungs-Cookie verwendet. Sollten künftig Analyse- oder Marketing-Dienste eingesetzt werden, geschieht dies nur nach
        deiner vorherigen Einwilligung.
      </p>

      <h2>9. Kontakt per WhatsApp, Telefon oder E-Mail</h2>
      <p>
        Wenn du uns kontaktierst, verarbeiten wir deine Angaben zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Bei Nutzung
        von WhatsApp gelten zusätzlich die Datenschutzbestimmungen der WhatsApp Ireland Limited. Der WhatsApp-Button ist ein einfacher Link –
        es werden beim Laden unserer Website keine Daten an WhatsApp übertragen.
      </p>

      <h2>10. Deine Rechte</h2>
      <p>
        Dir stehen grundsätzlich die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch zu.
        Wende dich dazu an <Val value={b.email} label="E-Mail-Adresse" />. Wenn du glaubst, dass die Verarbeitung deiner Daten gegen das
        Datenschutzrecht verstößt, kannst du dich bei der Aufsichtsbehörde beschweren – in Österreich ist dies die Datenschutzbehörde
        (www.dsb.gv.at).
      </p>
    </LegalPage>
  )
}
