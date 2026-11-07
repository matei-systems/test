import type { Metadata } from 'next'
import { LegalPage, Todo, Val } from '@/components/site/Legal'
import { getSettings } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Stornobedingungen',
  description: 'Stornobedingungen für Termine der mobilen Fahrzeugpflege von GLANZMOBIL.',
  alternates: { canonical: '/stornobedingungen' },
}

export default async function CancellationPage() {
  const { business: b } = await getSettings()
  return (
    <LegalPage title="Stornobedingungen" updated="November 2026">
      <p>
        Wir planen jeden Termin inklusive Anfahrt fest für dich ein. Bitte gib uns deshalb so früh wie möglich Bescheid, wenn du einen Termin
        verschieben oder absagen möchtest.
      </p>

      <h2>So erreichst du uns</h2>
      <p>
        Telefon: <Val value={b.phone} label="Telefonnummer" /> · E-Mail: <Val value={b.email} label="E-Mail-Adresse" />
        <br />
        Bitte gib dabei immer deine Buchungsnummer (z. B. GM-XXXX-XXXX) an.
      </p>

      <h2>Stornierung und Verschiebung durch den Kunden</h2>
      <p>
        <strong>Vorschlag – bitte festlegen:</strong>
      </p>
      <ul>
        <li>
          Bis <Todo>[48 Stunden]</Todo> vor dem Termin: kostenlose Stornierung oder Verschiebung.
        </li>
        <li>
          Später als <Todo>[48 Stunden]</Todo> vor dem Termin: Stornogebühr von <Todo>[x % des Auftragswerts / Pauschale]</Todo>.
        </li>
        <li>
          Nichterscheinen bzw. Fahrzeug nicht zugänglich: <Todo>[Gebühr / Anfahrtspauschale festlegen]</Todo>.
        </li>
      </ul>

      <h2>Absage durch uns</h2>
      <p>
        Müssen wir einen Termin aus wichtigen Gründen (z. B. Krankheit, Unwetter, technische Probleme) absagen, informieren wir dich so
        schnell wie möglich und vereinbaren einen Ersatztermin. Für dich entstehen dadurch keine Kosten.
      </p>

      <h2>Verbraucherrechte</h2>
      <p>
        Gesetzliche Rechte von Verbraucher:innen, insbesondere ein allfälliges Rücktrittsrecht nach dem FAGG, bleiben unberührt.{' '}
        <Todo>[Abstimmung mit AGB Punkt 7 prüfen]</Todo>
      </p>
    </LegalPage>
  )
}
