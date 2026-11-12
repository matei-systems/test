import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { isSameOrigin } from '@/lib/http'
import { MediaError, storeImage } from '@/lib/media'

export const dynamic = 'force-dynamic'

/** POST /api/admin/media – Bild-Upload (nur für angemeldete Administratoren). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Ungültige Herkunft der Anfrage.' }, { status: 403 })
  if (!(await getAdminSession())) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  let file: unknown
  try {
    file = (await request.formData()).get('file')
  } catch {
    return NextResponse.json({ error: 'Ungültiger Upload.' }, { status: 400 })
  }
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'Keine Datei übermittelt.' }, { status: 400 })
  try {
    return NextResponse.json(await storeImage(file as File), { status: 201 })
  } catch (err) {
    if (err instanceof MediaError) return NextResponse.json({ error: err.message }, { status: 422 })
    console.error('[api/admin/media]', err)
    return NextResponse.json({ error: 'Das Bild konnte nicht gespeichert werden.' }, { status: 500 })
  }
}
