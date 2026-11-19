/**
 * Ausführliche Beschreibung der Zusatzleistungen (Umfang, Grenzen, Beispiele).
 *
 * Name, Preis und Dauer kommen aus der Datenbank (Admin → Leistungen); dieser Text ergänzt sie anhand der ID.
 * Wird eine Zusatzleistung im Admin neu angelegt, erscheint dafür nur die Kurzbeschreibung aus der Datenbank.
 *
 * ⚠ Freigabe: Die genaue Abgrenzung ist ein Entwurf – siehe docs/freigaben-offen.md, Abschnitt „Zusatzleistungen“.
 */
export interface AddonDetails {
  /** Was gemacht wird bzw. welche Bereiche bearbeitet werden */
  scope: { title: string; items: string[] }
  /** Typische Beispiele (z. B. für den Verschmutzungszuschlag) */
  examples?: { title: string; items: string[] }
  /** Grenzen und was nicht dazugehört */
  limits: string[]
  /** So läuft es ab bzw. so wird abgerechnet */
  process?: string
}

export const ADDON_DETAILS: Record<string, AddonDetails> = {
  tierhaarentfernung: {
    scope: {
      title: 'Bearbeitete Bereiche',
      items: ['Sitzpolster (Sitzflächen und Rückenlehnen)', 'Teppichboden in den Fußräumen', 'Textil-Fußmatten', 'Kofferraum bzw. Laderaum'],
    },
    limits: [
      'Bei sehr starkem oder tief in den Stoff eingearbeitetem Tierhaarbesatz lässt sich nicht jedes einzelne Haar entfernen.',
      'Ist der Aufwand deutlich höher als üblich, nennen wir Ihnen vor Beginn einen konkreten Zuschlag (siehe „Starke Verschmutzung“) – zusätzliche Arbeit nur mit Ihrer Zustimmung.',
      'Nicht enthalten: Geruchsbehandlung sowie die Tiefenreinigung der Polster (dafür: Intensive Polsterreinigung).',
    ],
  },
  polsterreinigung: {
    scope: {
      title: 'Enthaltene Polsterbereiche',
      items: ['Sitzflächen, Rückenlehnen und Seitenwangen der Sitze', 'Vorder- und Rücksitze', 'Behandlung von Flecken und hartnäckigen Verschmutzungen im Sitzpolster'],
    },
    limits: [
      'Nur die Sitzpolster – keine Tiefenreinigung des gesamten Innenraums (Dachhimmel, Teppichboden und Verkleidungen sind nicht enthalten).',
      'Ob sich ein Fleck vollständig entfernen lässt, hängt von Ursache, Alter und Material ab. Eine vollständige Fleckentfernung können wir nicht zusagen.',
      'Bei Ledersitzen klären wir vorab, welche Reinigung für das Material geeignet ist.',
      'Die Polster brauchen nach der Reinigung einige Zeit zum Trocknen.',
    ],
  },
  'starke-verschmutzung': {
    scope: {
      title: 'Wann der Zuschlag anfällt',
      items: ['Wenn ein Fahrzeug deutlich stärker verschmutzt ist als bei normaler Nutzung und die Reinigung dadurch spürbar länger dauert.'],
    },
    examples: {
      title: 'Typische Beispiele',
      items: [
        'Viel Sand, Erde, Schlamm oder Streusplitt in Fußräumen und Kofferraum',
        'Größere Mengen Krümel, Essensreste oder Verpackungen',
        'Verschüttete Getränke oder klebrige Rückstände',
        'Außen: starker Insekten-, Teer- oder Baumharzbefall',
      ],
    },
    limits: [
      'Der Betrag „ab 29 €“ ist der Mindestzuschlag; der Endbetrag richtet sich nach dem tatsächlichen Mehraufwand.',
      'Ohne Ihre Zustimmung entstehen keine zusätzlichen Kosten.',
    ],
    process:
      'Sie können den Zuschlag bei der Buchung vorab wählen, wenn Sie wissen, dass Ihr Fahrzeug stark verschmutzt ist. Stellen wir vor Ort einen höheren Aufwand fest, nennen wir Ihnen vor Beginn der zusätzlichen Arbeit einen konkreten Preis – erst nach Ihrer Zustimmung wird sie durchgeführt.',
  },
  detailreinigung: {
    scope: {
      title: 'So können Sie die 30 Minuten nutzen',
      items: [
        'Fugen, Lüftungsdüsen und Schalter noch gründlicher – z. B. als Ergänzung zu Innenraum Basic',
        'Einstiege, Türfalze und Türverkleidungen',
        'Kofferraum oder Laderaum im Detail',
        'Bei gebuchter Außenpflege: Felgen, Tankdeckel- und Einstiegsbereich im Detail',
      ],
    },
    limits: [
      'Sie legen zu Beginn fest, wofür die Zeit eingesetzt wird; wir sagen Ihnen vorab, was in 30 Minuten realistisch ist.',
      'Nicht enthalten: Politur, Lackkorrektur und Reparaturen sowie die Tiefenreinigung von Polstern (dafür: Intensive Polsterreinigung).',
    ],
  },
}
