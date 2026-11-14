import type { Metadata } from 'next'
import { LegalPage, Todo, Val } from '@/components/site/Legal'
import { getSettings } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Stornobedingungen',
  description: 'Stornobedingungen für Termine der mobilen Fahrzeugpflege von RM Mobile Auto Aufbereitung.',
  alternates: { canonical: '/stornobedingungen' },
}

export default async function CancellationPage() {
  const { business: b, rules } = await getSettings()
  const hours = rules.cancelHours
  return (
    <LegalPage title="Stornobedingungen" updated="November 2026">
      <p>
        Wir planen jeden Termin inklusive Anfahrt fest für Sie ein. Bitte geben Sie uns deshalb so früh wie möglich Bescheid, wenn Sie einen Termin
        verschieben oder absagen möchten.
      </p>

      <h2>So erreichen Sie uns</h2>
      <p>
        Telefon: <Val value={b.phone} label="Telefonnummer" /> · E-Mail: <Val value={b.email} label="E-Mail-Adresse" />
        <br />
        Bitte geben Sie dabei immer Ihre Buchungsnummer (z. B. RM-XXXX-XXXX) an.
      </p>

      <h2>Stornierung und Verschiebung durch den Kunden</h2>
      <ul>
        {hours > 0 ? (
          <li>
            <strong>Bis {hours} Stunden vor dem Termin:</strong> kostenlose Stornierung – am einfachsten online über den persönlichen Link in
            Ihrer Buchungsbestätigung („Termin stornieren“). Für eine Verschiebung melden Sie sich bitte direkt bei uns.
          </li>
        ) : (
          <li>
            Bis <Todo>[Frist festlegen]</Todo> vor dem Termin: kostenlose Stornierung oder Verschiebung nach Rücksprache mit uns.
          </li>
        )}
        <li>
          Später als {hours > 0 ? `${hours} Stunden` : <Todo>[Frist]</Todo>} vor dem Termin: Bitte kontaktieren Sie uns direkt. Stornogebühr:{' '}
          <Todo>[x % des Auftragswerts / Pauschale festlegen – oder ausdrücklich „keine“]</Todo>.
        </li>
        <li>
          Nichterscheinen bzw. Fahrzeug nicht zugänglich: <Todo>[Gebühr / Anfahrtspauschale festlegen]</Todo>.
        </li>
      </ul>
      <p>
        Die Frist für die kostenlose Online-Stornierung wird im Verwaltungsbereich festgelegt und gilt in der zum Zeitpunkt der Buchung
        angezeigten Form.
      </p>

      <h2>Absage durch uns</h2>
      <p>
        Müssen wir einen Termin aus wichtigen Gründen (z. B. Krankheit, Unwetter, technische Probleme) absagen, informieren wir Sie so
        schnell wie möglich und vereinbaren einen Ersatztermin. Für Sie entstehen dadurch keine Kosten. Das gilt auch, wenn sich der
        angegebene Standort für eine Außenwäsche als ungeeignet oder unzulässig herausstellt. Ein eingelöster Gutschein bleibt bei einer
        Stornierung erhalten und kann für eine neue Buchung verwendet werden.
      </p>

      <h2>Verbraucherrechte</h2>
      <p>
        Gesetzliche Rechte von Verbraucher:innen, insbesondere ein allfälliges Rücktrittsrecht nach dem FAGG, bleiben unberührt.{' '}
        <Todo>[Abstimmung mit AGB Punkt 8 prüfen]</Todo>
      </p>
    </LegalPage>
  )
}
