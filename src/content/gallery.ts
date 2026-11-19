import type { IconName } from '@/components/icons'

/**
 * Fotoplan für die Galerie: Themen, für die echte Fotos aus Aufträgen gezeigt werden sollen.
 * Im Admin (Galerie) stehen diese Kategorien als Vorschläge zur Auswahl; auf der Website erscheinen
 * Bilder automatisch, sobald sie mit einer dieser Kategorien hochgeladen sind.
 */
export const GALLERY_TOPICS: Array<{ category: string; icon: IconName; hint: string }> = [
  { category: 'Sitze & Polster', icon: 'seat', hint: 'Verschmutzte und gereinigte Sitze – vorher und nachher aus demselben Blickwinkel' },
  { category: 'Innenraum', icon: 'car', hint: 'Cockpit, Mittelkonsole, Fußräume und Kofferraum' },
  { category: 'Fußmatten & Teppiche', icon: 'layers', hint: 'Fußmatten und Teppichboden vor und nach der Reinigung' },
  { category: 'Felgen & Lack', icon: 'gem', hint: 'Felgen, Reifen und Lackoberflächen nach der Außenpflege' },
  { category: 'Bei der Arbeit', icon: 'polish', hint: 'Echte Arbeitsaufnahmen vor Ort – ohne Kennzeichen, Personen nur mit Einverständnis' },
  { category: 'Ausrüstung', icon: 'sparkle', hint: 'Die tatsächlich verwendeten Geräte und Pflegemittel' },
]
