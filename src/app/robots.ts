import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  const url = getSiteUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/buchen/bestaetigung/'] }],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  }
}
