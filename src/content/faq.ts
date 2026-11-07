/** Häufige Fragen – Antworten bitte vor dem Livegang inhaltlich prüfen. */
export interface FaqItem {
  q: string
  a: string
}

export const FAQ: FaqItem[] = [
  {
    q: 'Wie funktioniert die mobile Fahrzeugpflege?',
    a: 'Du buchst online deinen Wunschtermin und gibst den Standort an – zum Beispiel bei dir zu Hause oder am Arbeitsplatz. Wir kommen zur vereinbarten Zeit mit unserem Equipment zu deinem Fahrzeug. Du musst nirgendwo hinfahren und nicht warten.',
  },
  {
    q: 'Welche Regionen fahrt ihr an?',
    a: 'Wir sind in Graz und Graz-Umgebung für dich unterwegs. Liegt dein Standort etwas außerhalb, kontaktiere uns gerne – oft finden wir eine Lösung.',
  },
  {
    q: 'Muss ich während der Reinigung anwesend sein?',
    a: 'Nicht die ganze Zeit. Wichtig ist, dass wir zu Beginn kurz Zugang zum Fahrzeug haben und es am vereinbarten Ort frei zugänglich steht. Alles Weitere stimmen wir gerne individuell mit dir ab.',
  },
  {
    q: 'Was benötigt ihr vor Ort?',
    a: 'Ausreichend Platz rund um das Fahrzeug und die Erlaubnis, am Standort zu arbeiten (z. B. eigene Einfahrt, Firmenparkplatz). Ob ein Wasser- oder Stromanschluss benötigt wird, klären wir bei der Terminbestätigung.',
  },
  {
    q: 'Wie lange dauert eine Reinigung?',
    a: 'Das hängt von Leistung und Fahrzeuggröße ab: Eine Außenreinigung dauert ca. 1,5–2,5 Stunden, eine Innenraumreinigung ca. 2,5–3,5 Stunden, eine Komplettreinigung ca. 4–5,5 Stunden. Die voraussichtliche Dauer siehst du bei der Buchung.',
  },
  {
    q: 'Wann sind die Preise verbindlich?',
    a: 'Die angezeigten Preise sind Endpreise und gelten für Fahrzeuge in normalem Pflegezustand. Bei starker Verschmutzung, Tierhaaren oder besonderen Wünschen fallen die ausgewiesenen Zusatzleistungen an – darüber sprechen wir immer vorab mit dir.',
  },
  {
    q: 'Kann ich meinen Termin verschieben oder stornieren?',
    a: 'Ja. Melde dich bitte so früh wie möglich bei uns. Die Details findest du in unseren Stornobedingungen.',
  },
  {
    q: 'Bietet ihr auch Leistungen für Firmen und Autohäuser an?',
    a: 'Ja, wir pflegen auch Firmenfahrzeuge und kleine Flotten sowie Fahrzeuge für Autohäuser. Für regelmäßige Termine oder mehrere Fahrzeuge erstellen wir dir gerne ein individuelles Angebot.',
  },
]
