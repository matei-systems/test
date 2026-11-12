import { isDatabaseConfigured } from '@/lib/db'
import { loadMedia } from '@/lib/media'

export const dynamic = 'force-dynamic'

/** GET /media/<id> – liefert ein hochgeladenes Bild aus (unveränderlich, daher lange cachebar). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const media = isDatabaseConfigured() ? await loadMedia(id) : null
  if (!media) return new Response('Nicht gefunden', { status: 404 })
  return new Response(Buffer.from(media.data), {
    headers: {
      'Content-Type': media.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
