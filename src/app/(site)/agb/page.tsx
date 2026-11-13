import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, Todo, Val } from '@/components/site/Legal'
import { getSettings } from '@/lib/catalog'
import { SITE } from '@/config/site'

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen (AGB)',
  description: 'Allgemeine Geschäftsbedingungen für die mobile Fahrzeugpflege von RM Mobile Autoaufbereitung.',
  alternates: { canonical: '/agb' },
}

export default async function AgbPage() {
  const { business: b } = await getSettings()
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen" updated="November 2026">
      <h2>1. Geltungsbereich</h2>
      <p>
        Diese AGB gelten für alle Leistungen der mobilen Fahrzeugpflege von <Val value={b.companyName} label="Firmenname" /> (im Folgenden
        „wir“) gegenüber Verbraucher:innen und Unternehmer:innen (im Folgenden „Kunde“), insbesondere für Buchungen über diese Website.
      </p>

      <h2>2. Vertragsabschluss</h2>
      <p>
        Mit dem Absenden der Online-Buchung („{SITE.bookingButtonLabel}“) gibt der Kunde ein verbindliches Angebot zum in der
        Buchungsübersicht angezeigten Gesamtpreis ab. Der Kunde erhält unmittelbar eine Buchungsnummer; der gewählte Termin ist damit
        reserviert. Der Vertrag kommt mit unserer Bestätigung des Termins (per E-Mail oder telefonisch) zustande. Wir behalten uns vor,
        Buchungen in begründeten Fällen (z. B. außerhalb des Einsatzgebiets, ungeeigneter Standort) abzulehnen.
      </p>
      <p>
        Ist für die gewählte Leistung kein fester Preis angegeben („Preis auf Anfrage“), stellt der Kunde eine{' '}
        <strong>unverbindliche Terminanfrage</strong>. In diesem Fall übermitteln wir ein Angebot; der Vertrag kommt erst mit der Annahme
        dieses Angebots durch den Kunden zustande. <Todo>[Formulierung zum Vertragsabschluss und zur Button-Beschriftung (§ 8 FAGG) rechtlich prüfen]</Todo>
      </p>

      <h2>3. Leistungen</h2>
      <p>
        Der Leistungsumfang ergibt sich aus der Leistungsbeschreibung auf der Website zum Zeitpunkt der Buchung. Die angegebenen Dauern sind
        Richtwerte. Die Leistungen werden am vom Kunden angegebenen Standort erbracht.
      </p>

      <h2>4. Mitwirkung des Kunden</h2>
      <ul>
        <li>Das Fahrzeug muss zum vereinbarten Termin am angegebenen Ort zugänglich sein; zu Beginn ist eine kurze Übergabe erforderlich.</li>
        <li>Der Kunde stellt sicher, dass am Standort gearbeitet werden darf (z. B. eigene Einfahrt, Erlaubnis des Grundeigentümers).</li>
        <li>Wertgegenstände und persönliche Gegenstände sind vorab aus dem Fahrzeug zu entfernen.</li>
        <li>
          Bekannte Schäden (z. B. Lackschäden, lose Teile, Defekte an Polstern oder Elektronik) sind vor Beginn mitzuteilen.{' '}
          <Todo>[Regelung zu Wasser-/Stromanschluss ergänzen]</Todo>
        </li>
      </ul>

      <h2>5. Preise und Zahlung</h2>
      <p>
        Es gelten die zum Zeitpunkt der Buchung auf der Website angegebenen Preise für die gewählte Fahrzeugkategorie; maßgeblich ist der in
        der Buchungsübersicht ausgewiesene Gesamtpreis. Zeitlich befristete Aktionen (z. B. Einführungspreise) gelten für Buchungen, die
        innerhalb des angegebenen Aktionszeitraums abgesendet werden, und nur für die jeweils genannten Leistungen; Zusatzleistungen sind
        davon ausgenommen. Die Anfahrt innerhalb des Einsatzgebiets ist im Preis enthalten. Weicht der tatsächliche
        Zustand des Fahrzeugs wesentlich ab (z. B. starke Verschmutzung, Tierhaare) oder entspricht die Fahrzeugkategorie nicht der Angabe,
        informieren wir den Kunden vor Beginn der Arbeiten über anfallende Mehrkosten. Leistungen „auf Anfrage“ werden erst nach Annahme
        unseres Angebots erbracht. <Todo>[Zahlungsarten und Fälligkeit ergänzen, z. B. Barzahlung/Karte nach Durchführung]</Todo>{' '}
        <Todo>[Angabe zur Umsatzsteuer bzw. Kleinunternehmerregelung ergänzen]</Todo>
      </p>

      <h2>6. Terminänderung und Stornierung</h2>
      <p>
        Es gelten unsere <Link href="/stornobedingungen">Stornobedingungen</Link>. Innerhalb der dort genannten Frist kann der Kunde seinen
        Termin über den persönlichen Link in der Buchungsbestätigung selbst online stornieren. Ist die Durchführung aus Gründen, die wir nicht zu vertreten
        haben (z. B. Unwetter, Unzugänglichkeit des Fahrzeugs), nicht möglich, vereinbaren wir einen Ersatztermin.
      </p>

      <h2>7. Rücktrittsrecht für Verbraucher</h2>
      <p>
        <Todo>
          [Belehrung über das Rücktrittsrecht nach dem Fern- und Auswärtsgeschäfte-Gesetz (FAGG) samt Muster-Widerrufsformular ergänzen –
          insbesondere zum Beginn der Leistung vor Ablauf der Rücktrittsfrist auf ausdrücklichen Wunsch des Kunden.]
        </Todo>
      </p>

      <h2>8. Gewährleistung und Haftung</h2>
      <p>
        Es gelten die gesetzlichen Gewährleistungsbestimmungen. Mängel sind uns möglichst unmittelbar nach der Leistungserbringung
        mitzuteilen, damit wir sie prüfen und gegebenenfalls nachbessern können. Für Schäden haften wir – außer bei Personenschäden – nur bei
        Vorsatz und grober Fahrlässigkeit, soweit gesetzlich zulässig. Keine Haftung übernehmen wir für Vorschäden sowie für Schäden, die auf
        mangelhafte Teile, Lackierungen oder Materialien des Fahrzeugs zurückzuführen sind.{' '}
        <Todo>[Haftungsregelung prüfen, insbesondere gegenüber Verbrauchern (KSchG)]</Todo>
      </p>

      <h2>9. Schlussbestimmungen</h2>
      <p>
        Es gilt österreichisches Recht unter Ausschluss der Verweisungsnormen des internationalen Privatrechts. Für Unternehmer ist
        Gerichtsstand <Todo>[Graz – prüfen]</Todo>. Für Verbraucher gelten die gesetzlichen Gerichtsstände.
      </p>
    </LegalPage>
  )
}
