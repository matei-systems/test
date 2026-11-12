import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/config/site'
import { getCatalog } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = getSiteUrl()
  const now = new Date()
  let serviceIds: string[] = []
  try {
    serviceIds = (await getCatalog()).services.map((s) => s.id)
  } catch {
    // Datenbank nicht erreichbar → Sitemap ohne Einzelleistungen
  }
  return [
    { url: `${url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${url}/leistungen`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    ...serviceIds.map((id) => ({ url: `${url}/leistungen/${id}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${url}/preise`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${url}/buchen`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${url}/einsatzgebiet`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${url}/galerie`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${url}/ueber-uns`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${url}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${url}/kontakt`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${url}/impressum`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${url}/datenschutz`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${url}/agb`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${url}/stornobedingungen`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
