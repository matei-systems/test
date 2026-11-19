/**
 * Zentrale Formulierungen zum Ablauf nach dem Absenden – verwendet im Buchungsformular, auf der Bestätigungsseite,
 * in der Eingangs-E-Mail und in den FAQ, damit überall exakt dasselbe steht.
 */

/** Standard (Admin → Verfügbarkeit → „Buchungen automatisch bestätigen“ ist aus): Reservierung, danach persönliche Bestätigung. */
export const PENDING_CONFIRMATION_TEXT =
  'Nach dem Absenden erhalten Sie eine Buchungsnummer. Wir prüfen anschließend Ihre Angaben und bestätigen Ihren Termin persönlich per E-Mail. Erst danach ist Ihr Termin verbindlich bestätigt.'

/** Nur falls im Admin die automatische Bestätigung eingeschaltet wird. */
export const AUTO_CONFIRM_TEXT = 'Nach dem Absenden erhalten Sie eine Buchungsnummer, und Ihr Termin ist sofort verbindlich bestätigt.'

export function afterSubmitText(autoConfirm: boolean): string {
  return autoConfirm ? AUTO_CONFIRM_TEXT : PENDING_CONFIRMATION_TEXT
}
