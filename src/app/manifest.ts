import type { MetadataRoute } from 'next'
import { SITE } from '@/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} – ${SITE.claim}`,
    short_name: 'RM Mobile',
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#09090a',
    theme_color: '#09090a',
    lang: 'de-AT',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
