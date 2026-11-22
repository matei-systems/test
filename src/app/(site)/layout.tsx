import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'
import { MobileCta } from '@/components/site/MobileCta'
import { RevealObserver } from '@/components/site/RevealObserver'
import { getSettings } from '@/lib/catalog'
import { isDatabaseConfigured } from '@/lib/db'

// Inhalte (Preise, Kontaktdaten, Aktionen) kommen aus der Datenbank und werden im Admin gepflegt.
// Die Seiten werden vorab erzeugt und aus dem CDN ausgeliefert (schnell). Admin-Änderungen erneuern sie sofort
// (revalidatePath in app/admin/actions.ts); zeitabhängige Inhalte wie das Ende einer Aktion spätestens nach 60 s.
export const revalidate = 60

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { business, area } = await getSettings()
  return (
    <>
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header phone={business.phone || undefined} whatsapp={business.whatsapp || undefined} />
      <main id="main">{children}</main>
      <Footer business={business} area={area} bookingEnabled={isDatabaseConfigured()} />
      <WhatsAppButton number={business.whatsapp} />
      <MobileCta phone={business.phone} whatsapp={business.whatsapp} />
      <RevealObserver />
    </>
  )
}
