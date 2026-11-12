import 'server-only'
import { getDb, type Queryable } from './db'

/**
 * Hochgeladene Bilder werden verkleinert, als WebP komprimiert und in der Datenbank gespeichert
 * (Tabelle media) – kein zusätzlicher Speicherdienst nötig. Auslieferung über /media/<id>.
 */

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024
const MAX_EDGE = 1800
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

export class MediaError extends Error {}

export async function storeImage(file: { type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> }): Promise<{ src: string; width: number; height: number; bytes: number }> {
  if (!ALLOWED.has(file.type)) throw new MediaError('Bitte ein Bild im Format JPG, PNG oder WebP hochladen.')
  if (file.size > MAX_UPLOAD_BYTES) throw new MediaError('Das Bild ist zu groß (maximal 6 MB).')
  const input = Buffer.from(await file.arrayBuffer())
  const sharp = (await import('sharp')).default
  let out: Buffer
  let width: number
  let height: number
  try {
    const result = await sharp(input, { failOn: 'error', limitInputPixels: 60_000_000 })
      .rotate() // EXIF-Ausrichtung anwenden; Metadaten (z. B. GPS) werden dabei entfernt
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true })
    out = result.data
    width = result.info.width
    height = result.info.height
  } catch {
    throw new MediaError('Die Datei konnte nicht als Bild gelesen werden.')
  }
  const db = await getDb()
  const { rows } = await db.query<{ id: string }>(
    'INSERT INTO media (mime, data, width, height, bytes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    ['image/webp', out, width, height, out.length],
  )
  return { src: `/media/${rows[0].id}`, width, height, bytes: out.length }
}

export async function loadMedia(id: string): Promise<{ mime: string; data: Uint8Array } | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  const db = await getDb()
  const { rows } = await db.query<{ mime: string; data: Uint8Array }>('SELECT mime, data FROM media WHERE id = $1', [id])
  return rows[0] ?? null
}

/** Nur Pfade auf eigene Medien oder mitgelieferte Bilder zulassen (keine externen URLs). */
export function isAllowedImageSrc(src: string): boolean {
  return /^\/media\/[0-9a-f-]{36}$/i.test(src) || /^\/images\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(src)
}

/** Entfernt hochgeladene Bilder, die nirgends mehr verwendet werden (älter als 1 Stunde). */
export async function cleanupOrphanMedia(q?: Queryable): Promise<number> {
  const db = q ?? (await getDb())
  const res = await db.query(
    `DELETE FROM media m
     WHERE m.created_at < now() - interval '1 hour'
       AND NOT EXISTS (SELECT 1 FROM gallery_items g WHERE '/media/' || m.id::text IN (g.before_src, g.after_src, g.image_src))
       AND NOT EXISTS (SELECT 1 FROM services s WHERE s.image_src = '/media/' || m.id::text)`,
  )
  return res.rowCount
}
