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
        a: 'Online in wenigen Schritten: Leistung und Fahrzeugkategorie wählen, optional Zusatzleistungen ergänzen, Standort und Wunschtermin angeben, Kontaktdaten eintragen und absenden. Du siehst ausschließlich Termine, die tatsächlich frei sind.',
        top: true,
      },
      {
        q: 'Ist mein Termin nach dem Absenden fix?',
        a: 'Der gewählte Termin ist nach dem Absenden für dich reserviert und du erhältst sofort eine Buchungsnummer. Je nach Einstellung bestätigen wir den Termin automatisch oder persönlich – den aktuellen Status siehst du jederzeit auf deiner Bestätigungsseite.',
      },
      {
        q: 'Was ist der Unterschied zwischen Buchung und Terminanfrage?',
        a: 'Leistungen mit festem Preis buchst du verbindlich zum angezeigten Preis. Ist für deine Auswahl kein fester Preis hinterlegt („Preis auf Anfrage“), stellst du eine unverbindliche Terminanfrage: Wir melden uns mit einem Angebot, und erst mit deiner Zustimmung kommt der Auftrag zustande.',
      },
      {
        q: 'Wie und wann bezahle ich?',
        a: 'Online ist keine Zahlung erforderlich. Bezahlt wird nach der Durchführung vor Ort. Die möglichen Zahlungsarten teilen wir dir mit der Terminbestätigung mit.',
      },
    ],
  },
  {
    id: 'dauer',
    title: 'Dauer',
    items: [
      {
        q: 'Wie lange dauert die Fahrzeugpflege?',
        a: 'Das hängt von Leistung, Fahrzeuggröße und Zusatzleistungen ab. Die voraussichtliche Dauer siehst du bei jedem Paket in der Preisliste und noch einmal vor dem Absenden deiner Buchung.',
        top: true,
      },
      {
        q: 'Kann es länger dauern als angegeben?',
        a: 'Die Zeitangaben sind Richtwerte für Fahrzeuge in normalem Pflegezustand. Bei starker Verschmutzung kann es länger dauern – das besprechen wir vor Arbeitsbeginn mit dir.',
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
        a: 'Zum Start bieten wir unsere Pakete zu einem vergünstigten Einführungspreis an. Der reguläre Preis steht jeweils daneben. Du zahlst immer den Preis, der dir in der Buchungsübersicht als Gesamtpreis angezeigt wird.',
      },
      {
        q: 'Wann fallen Zusatzkosten an?',
        a: 'Nur für Zusatzleistungen, die du selbst auswählst oder die wir vor Arbeitsbeginn mit dir vereinbaren – zum Beispiel bei Tierhaaren oder starker Verschmutzung. Ohne deine Zustimmung entstehen keine zusätzlichen Kosten.',
      },
    ],
  },
  {
    id: 'anfahrt',
    title: 'Anfahrt & Einsatzgebiet',
    items: [
      {
        q: 'Welche Regionen fahrt ihr an?',
        a: 'Wir sind in Graz und Graz-Umgebung für dich unterwegs. Bei der Buchung prüfen wir deine Postleitzahl automatisch. Liegt dein Standort etwas außerhalb, schreib uns gerne – oft finden wir eine Lösung.',
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
        a: 'Bitte räume persönliche Gegenstände und Wertsachen aus dem Fahrzeug – auch aus Kofferraum und Ablagen. Kindersitze baust du bitte selbst aus, wenn darunter gereinigt werden soll.',
        top: true,
      },
      {
        q: 'Was benötigt ihr vor Ort?',
        a: 'Ausreichend Platz rund um das Fahrzeug und die Erlaubnis, am Standort zu arbeiten (z. B. eigene Einfahrt, Firmenparkplatz). Ob ein Wasser- oder Stromanschluss benötigt wird, klären wir bei der Terminbestätigung.',
      },
    ],
  },
  {
    id: 'storno',
    title: 'Stornierung & Terminänderung',
    items: [
      {
        q: 'Kann ich meinen Termin verschieben oder stornieren?',
        a: 'Ja. Über den Link in deiner Buchungsbestätigung kannst du deinen Termin innerhalb der dort angegebenen Frist selbst online stornieren. Für eine Terminverschiebung oder kurzfristige Änderungen melde dich bitte direkt bei uns. Die Details findest du in unseren Stornobedingungen.',
        top: true,
      },
      {
        q: 'Was passiert bei schlechtem Wetter?',
        a: 'Innenraumleistungen sind meist wetterunabhängig möglich. Lässt das Wetter eine Außenpflege in guter Qualität nicht zu, verschieben wir den Termin in Absprache mit dir – selbstverständlich kostenlos.',
      },
    ],
  },
  {
    id: 'mobil',
    title: 'Mobile Durchführung',
    items: [
      {
        q: 'Wie funktioniert die mobile Fahrzeugpflege?',
        a: 'Du gibst bei der Buchung den Standort an – zum Beispiel zu Hause oder am Arbeitsplatz. Wir kommen zur vereinbarten Zeit mit unserem Equipment zu deinem Fahrzeug. Du musst nirgendwo hinfahren und nicht warten.',
      },
      {
        q: 'Muss ich während der Reinigung anwesend sein?',
        a: 'Nicht die ganze Zeit. Wichtig ist, dass wir zu Beginn Zugang zum Fahrzeug haben und es am vereinbarten Ort frei zugänglich steht. Alles Weitere stimmen wir individuell mit dir ab.',
      },
      {
        q: 'Bietet ihr auch Leistungen für Firmen und Autohäuser an?',
        a: 'Ja, wir pflegen auch Firmenfahrzeuge, kleine Flotten und Fahrzeuge für Autohäuser und Händler. Für regelmäßige Termine oder mehrere Fahrzeuge erstellen wir dir gerne ein individuelles Angebot – nutze dafür einfach das Kontaktformular.',
      },
    ],
  },
]

/** Alle Fragen (für strukturierte Daten) */
export const FAQ: FaqItem[] = FAQ_CATEGORIES.flatMap((c) => c.items)

/** Auswahl für die Startseite */
export const FAQ_TOP: FaqItem[] = FAQ.filter((f) => f.top)
