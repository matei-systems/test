import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'
import { RevealObserver } from '@/components/site/RevealObserver'
import { getSettings } from '@/lib/catalog'
import { isDatabaseConfigured } from '@/lib/db'

// Inhalte (Preise, Kontaktdaten, Verfügbarkeiten) kommen aus der Datenbank und werden im Admin gepflegt.
export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { business, area } = await getSettings()
  return (
    <>
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header phone={business.phone || undefined} />
      <main id="main">{children}</main>
      <Footer business={business} area={area} bookingEnabled={isDatabaseConfigured()} />
      <WhatsAppButton number={business.whatsapp} />
      <RevealObserver />
    </>
  )
}
