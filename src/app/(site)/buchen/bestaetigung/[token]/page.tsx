import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon } from '@/components/icons'
import { getBookingByToken } from '@/lib/bookings'
import { formatDateLong, formatDateTime, formatDuration, formatEuro, formatPrice, formatTime } from '@/lib/format'
import { CancelBooking } from '@/components/booking/CancelBooking'
import { DiscountBadge } from '@/components/site/PriceTag'
import { getSettings } from '@/lib/catalog'
import { telHref } from '@/lib/format'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Buchungsbestätigung',
  robots: { index: false, follow: false },
}

/** Terminanfrage (Preis auf Anfrage): andere Formulierung, solange sie noch nicht bestätigt wurde */
const REQUEST_NEW = {
  label: 'Anfrage',
  title: 'Vielen Dank – deine Terminanfrage ist eingegangen.',
  text: 'Der Termin ist für dich vorgemerkt. Wir melden uns mit einem Angebot – erst mit deiner Zustimmung kommt der Auftrag zustande.',
  tone: 'pending' as const,
}

const STATUS: Record<string, { label: string; title: string; text: string; tone: 'ok' | 'pending' | 'cancel' }> = {
  neu: {
    label: 'Reserviert',
    title: 'Vielen Dank – deine Buchung ist eingegangen.',
    text: 'Dein Termin ist fest für dich reserviert. Wir prüfen die Details und bestätigen ihn dir in Kürze persönlich.',
    tone: 'pending',
  },
  bestaetigt: {
    label: 'Bestätigt',
    title: 'Dein Termin ist bestätigt.',
    text: 'Wir kommen zur vereinbarten Zeit an deinen Standort. Wir freuen uns auf dein Fahrzeug!',
    tone: 'ok',
  },
  in_bearbeitung: { label: 'In Bearbeitung', title: 'Dein Fahrzeug ist in besten Händen.', text: 'Wir arbeiten gerade an deinem Fahrzeug.', tone: 'ok' },
  abgeschlossen: { label: 'Abgeschlossen', title: 'Danke für dein Vertrauen!', text: 'Dieser Auftrag ist abgeschlossen.', tone: 'ok' },
  storniert: { label: 'Storniert', title: 'Dieser Termin wurde storniert.', text: 'Gerne kannst du jederzeit einen neuen Termin buchen.', tone: 'cancel' },
}

export default async function ConfirmationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [booking, settings] = await Promise.all([getBookingByToken(token), getSettings()])
  if (!booking) notFound()
  const st = booking.kind === 'anfrage' && booking.status === 'neu' ? REQUEST_NEW : (STATUS[booking.status] ?? STATUS.neu)
  const { business } = settings
  const noun = booking.kind === 'anfrage' ? 'Vorgangsnummer' : 'Buchungsnummer'
  const hasDiscount = booking.discountCents > 0 && booking.regularPriceCents !== null && booking.totalPriceCents !== null

  return (
    <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.hero}>
          <span className={`${styles.icon} ${st.tone === 'cancel' ? styles.iconCancel : ''}`} aria-hidden="true">
            <Icon name={st.tone === 'cancel' ? 'close' : 'check'} size={34} />
          </span>
          <p className="eyebrow">
            {noun} {booking.reference}
          </p>
          <h1 className="h2">{st.title}</h1>
          <p className="lead">{st.text}</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <p className={styles.small}>{noun}</p>
              <p className={styles.ref}>{booking.reference}</p>
            </div>
            <span className={`badge ${st.tone === 'cancel' ? 'badge--neutral' : ''}`}>{st.label}</span>
          </div>
          <dl className={styles.list}>
            <div>
              <dt>
                <Icon name="calendar" size={16} /> Termin
              </dt>
              <dd>
                {formatDateLong(booking.startsAt)}, {formatTime(booking.startsAt)} Uhr
                <small>Dauer ca. {formatDuration(booking.durationMinutes)}</small>
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="sparkle" size={16} /> Leistung
              </dt>
              <dd>
                {booking.serviceName}
                {booking.addons.length > 0 && <small>+ {booking.addons.map((a) => a.name).join(', ')}</small>}
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="car" size={16} /> Fahrzeug
              </dt>
              <dd>
                {booking.vehicleCategoryName} – {booking.vehicleModel}
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="pin" size={16} /> Standort
              </dt>
              <dd>
                {booking.street} {booking.houseNumber}, {booking.postalCode} {booking.city}
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="tag" size={16} /> Preis
              </dt>
              <dd>
                {booking.totalPriceCents === null
                  ? 'auf Anfrage – verbindliches Angebot vor Beginn'
                  : formatPrice(booking.totalPriceCents, { from: booking.priceIsFrom })}
                {booking.totalPriceCents !== null && <small>Endpreis · Zahlung nach der Durchführung vor Ort</small>}
                {hasDiscount && (
                  <small style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {booking.promotionName ?? 'Aktion'}
                    {booking.promotionPercent ? <DiscountBadge percent={booking.promotionPercent} /> : null}
                    <span>
                      regulär {formatEuro(booking.regularPriceCents as number)} · du sparst {formatEuro(booking.discountCents)}
                    </span>
                  </small>
                )}
              </dd>
            </div>
          </dl>

          <div className={styles.mail}>
            {booking.customerEmailStatus === 'gesendet' ? (
              <p>
                <Icon name="mail" size={16} /> Eine Bestätigung wurde an <strong>{booking.email}</strong> gesendet.
              </p>
            ) : (
              <p>
                <Icon name="info" size={16} /> Bitte notiere dir deine {noun} und speichere diese Seite als Lesezeichen. Wir melden uns zur Bestätigung persönlich bei dir
                {business.phone ? ' – telefonisch oder per E-Mail' : ' per E-Mail oder Telefon'}.
              </p>
            )}
          </div>

          <div className={styles.actions}>
            {booking.status !== 'storniert' && (
              <a href={`/buchen/bestaetigung/${token}/kalender.ics`} className="btn btn--ghost btn--sm">
                <Icon name="calendar" /> Zum Kalender hinzufügen
              </a>
            )}
            <Link href="/" className="btn btn--light btn--sm">
              Zur Startseite
            </Link>
          </div>

          {booking.cancellableUntil && (
            <div className={styles.mail}>
              <CancelBooking token={token} until={`${formatDateTime(booking.cancellableUntil)} Uhr`} kind={booking.kind} />
            </div>
          )}
        </div>

        <p className={styles.help}>
          {booking.cancellableUntil ? 'Terminverschiebung oder Fragen?' : 'Änderung oder Stornierung?'} Melde dich bitte so früh wie möglich
          {business.phone ? (
            <>
              {' '}
              unter <a href={telHref(business.phone)}>{business.phone}</a>
            </>
          ) : null}
          {business.email ? (
            <>
              {' '}
              {business.phone ? 'oder' : 'unter'} <a href={`mailto:${business.email}`}>{business.email}</a>
            </>
          ) : null}
          . Details findest du in unseren <Link href="/stornobedingungen">Stornobedingungen</Link>.
        </p>
      </div>
    </div>
  )
}
