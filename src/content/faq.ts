/**
 * Häufige Fragen – nach Themen gegliedert. Antworten bitte vor dem Livegang inhaltlich prüfen.
 * Preise, Dauer und Fristen werden bewusst NICHT fest in die Texte geschrieben, sondern verweisen
 * auf die Preisliste bzw. die Buchung – so bleiben die Antworten richtig, wenn im Admin etwas geändert wird.
 */
export interface FaqItem {
  q: string
  a: string
  /** Auf der Startseite anzeigen */
  top?: boolean
}

export interface FaqCategory {
  id: string
  title: string
  items: FaqItem[]
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'buchung',
    title: 'Buchung',
    items: [
      {
        q: 'Wie buche ich einen Termin?',
        a: 'Online in wenigen Schritten: Leistung und Fahrzeugkategorie wählen, optional Zusatzleistungen ergänzen, Standort und Wunschtermin angeben, Kontaktdaten eintragen und absenden. Sie sehen ausschließlich Termine, die tatsächlich frei sind.',
        top: true,
      },
      {
        q: 'Ist mein Termin nach dem Absenden fix?',
        a: 'Der gewählte Termin ist nach dem Absenden für Sie reserviert und Sie erhalten sofort eine Buchungsnummer. Anschließend prüfen wir Standort und Details und bestätigen den Termin per E-Mail – erst mit dieser Bestätigung ist er fix. Den aktuellen Status sehen Sie jederzeit auf Ihrer Bestätigungsseite.',
      },
      {
        q: 'Was ist der Unterschied zwischen Buchung und Terminanfrage?',
        a: 'Leistungen mit festem Preis buchen Sie verbindlich zum angezeigten Preis. Ist für Ihre Auswahl kein fester Preis hinterlegt („Preis auf Anfrage“), stellen Sie eine unverbindliche Terminanfrage: Wir melden uns mit einem Angebot, und erst mit Ihrer Zustimmung kommt der Auftrag zustande.',
      },
      {
        q: 'Wie und wann bezahle ich?',
        a: 'Online ist keine Zahlung erforderlich. Bezahlt wird nach der Durchführung vor Ort. Die möglichen Zahlungsarten teilen wir Ihnen mit der Terminbestätigung mit.',
      },
    ],
  },
  {
    id: 'dauer',
    title: 'Dauer',
    items: [
      {
        q: 'Wie lange dauert die Fahrzeugpflege?',
        a: 'Das hängt von Leistung, Fahrzeuggröße und Zusatzleistungen ab. Die voraussichtliche Dauer sehen Sie bei jedem Paket in der Preisliste und noch einmal vor dem Absenden Ihrer Buchung.',
        top: true,
      },
      {
        q: 'Kann es länger dauern als angegeben?',
        a: 'Die Zeitangaben sind Richtwerte für Fahrzeuge in normalem Pflegezustand. Bei starker Verschmutzung kann es länger dauern – das besprechen wir vor Arbeitsbeginn mit Ihnen.',
      },
    ],
  },
  {
    id: 'preise',
    title: 'Preise',
    items: [
      {
        q: 'Sind die angezeigten Preise Endpreise?',
        a: 'Ja. Die angezeigten Preise sind Endpreise für Fahrzeuge in normalem Pflegezustand und richten sich nach der Fahrzeugkategorie. Die Anfahrt im Einsatzgebiet ist inklusive.',
        top: true,
      },
      {
        q: 'Was bedeutet „Einführungspreis“?',
        a: 'Zum Start bieten wir unsere Pakete zu einem vergünstigten Einführungspreis an. Der reguläre Preis steht jeweils daneben. Sie zahlen immer den Preis, der Ihnen in der Buchungsübersicht als Gesamtpreis angezeigt wird.',
      },
      {
        q: 'Wie löse ich einen Gutschein ein?',
        a: 'Geben Sie den Code im letzten Schritt der Online-Buchung („Übersicht“) ein und wählen Sie „Einlösen“. Der Nachlass wird sofort vom Gesamtpreis abgezogen und vor dem Absenden angezeigt. Es gelten die Bedingungen des jeweiligen Gutscheins – etwa der Mindestauftragswert und die Einlösung einmal je Kunde. Je Buchung kann ein Gutschein eingelöst werden.',
      },
      {
        q: 'Wann fallen Zusatzkosten an?',
        a: 'Nur für Zusatzleistungen, die Sie selbst auswählen oder die wir vor Arbeitsbeginn mit Ihnen vereinbaren – zum Beispiel bei Tierhaaren oder starker Verschmutzung. Ohne Ihre Zustimmung entstehen keine zusätzlichen Kosten.',
      },
    ],
  },
  {
    id: 'anfahrt',
    title: 'Anfahrt & Einsatzgebiet',
    items: [
      {
        q: 'Welche Regionen fahren Sie an?',
        a: 'Wir sind in Graz und Graz-Umgebung für Sie unterwegs. Bei der Buchung prüfen wir Ihre Postleitzahl automatisch. Liegt Ihr Standort etwas außerhalb, schreiben Sie uns gerne – oft finden wir eine Lösung.',
        top: true,
      },
      {
        q: 'Kostet die Anfahrt extra?',
        a: 'Innerhalb unseres Einsatzgebiets ist die Anfahrt im Preis enthalten.',
      },
    ],
  },
  {
    id: 'vorbereitung',
    title: 'Fahrzeugvorbereitung',
    items: [
      {
        q: 'Wie bereite ich mein Fahrzeug vor?',
        a: 'Bitte räumen Sie persönliche Gegenstände und Wertsachen aus dem Fahrzeug – auch aus Kofferraum und Ablagen. Kindersitze bauen Sie bitte selbst aus, wenn darunter gereinigt werden soll.',
        top: true,
      },
      {
        q: 'Was wird vor Ort benötigt?',
        a: 'Ausreichend Platz rund um das Fahrzeug und die Erlaubnis, am Standort zu arbeiten (z. B. eigene Einfahrt, Firmenparkplatz). Ob ein Wasser- oder Stromanschluss benötigt wird, klären wir bei der Terminbestätigung.',
      },
      {
        q: 'Ist eine Außenwäsche an jedem Standort möglich?',
        a: 'Nein. Eine Außenwäsche führen wir nur an geeigneten und zulässigen Standorten durch – auf befestigter Fläche mit ordnungsgemäßer Abwasserableitung nach den örtlichen Vorschriften, nicht auf öffentlichen Straßen oder unbefestigtem Untergrund. Wir klären den Standort vor der Terminbestätigung. Passt er nicht, finden wir gemeinsam einen anderen Standort oder Termin; Innenraumleistungen sind davon nicht betroffen.',
        top: true,
      },
    ],
  },
  {
    id: 'storno',
    title: 'Stornierung & Terminänderung',
    items: [
      {
        q: 'Kann ich meinen Termin verschieben oder stornieren?',
        a: 'Ja. Über den Link in Ihrer Buchungsbestätigung können Sie Ihren Termin innerhalb der dort angegebenen Frist selbst online stornieren. Für eine Terminverschiebung oder kurzfristige Änderungen melden Sie sich bitte direkt bei uns. Die Details finden Sie in unseren Stornobedingungen.',
        top: true,
      },
      {
        q: 'Was passiert bei schlechtem Wetter?',
        a: 'Innenraumleistungen sind meist wetterunabhängig möglich. Lässt das Wetter eine Außenpflege in guter Qualität nicht zu, verschieben wir den Termin in Absprache mit Ihnen – selbstverständlich kostenlos.',
      },
    ],
  },
  {
    id: 'mobil',
    title: 'Mobile Durchführung',
    items: [
      {
        q: 'Wie funktioniert die mobile Fahrzeugpflege?',
        a: 'Sie geben bei der Buchung den Standort an – zum Beispiel zu Hause oder am Arbeitsplatz. Wir kommen zur vereinbarten Zeit mit unserer Ausrüstung zu Ihrem Fahrzeug. Sie müssen nirgendwo hinfahren und nicht warten.',
      },
      {
        q: 'Muss ich während der Reinigung anwesend sein?',
        a: 'Nicht die ganze Zeit. Wichtig ist, dass wir zu Beginn Zugang zum Fahrzeug haben und es am vereinbarten Ort frei zugänglich steht. Alles Weitere stimmen wir individuell mit Ihnen ab.',
      },
      {
        q: 'Bieten Sie auch Leistungen für Firmen und Autohäuser an?',
        a: 'Ja, wir pflegen auch Firmenfahrzeuge, kleine Flotten und Fahrzeuge für Autohäuser und Händler. Für regelmäßige Termine oder mehrere Fahrzeuge erstellen wir Ihnen gerne ein individuelles Angebot – nutzen Sie dafür einfach das Kontaktformular.',
      },
    ],
  },
]

/** Alle Fragen (für strukturierte Daten) */
export const FAQ: FaqItem[] = FAQ_CATEGORIES.flatMap((c) => c.items)

/** Auswahl für die Startseite */
export const FAQ_TOP: FaqItem[] = FAQ.filter((f) => f.top)
