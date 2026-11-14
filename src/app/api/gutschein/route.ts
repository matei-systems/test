import { NextResponse, type NextRequest } from 'next/server'
import { getDb, DatabaseNotConfiguredError } from '@/lib/db'
import { getCatalog } from '@/lib/catalog'
import { checkCoupon } from '@/lib/coupons'
import { isSameOrigin } from '@/lib/http'
import { calculateQuote } from '@/lib/pricing'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { couponCheckSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * POST /api/gutschein – prüft einen Gutscheincode für die aktuelle Auswahl.
 * Die Prüfung ist eine Vorschau: Verbindlich wird der Gutschein erst beim Speichern der Buchung geprüft.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Ungültige Herkunft der Anfrage.' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }
  const parsed = couponCheckSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Bitte geben Sie einen gültigen Gutscheincode ein.' }, { status: 422 })

  try {
    // Begrenzung gegen das Durchprobieren von Codes
    const limit = await rateLimit('coupon', clientIp(request.headers), 20, 60 * 60)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      )
    }
    const { code, email, phone, ...selection } = parsed.data
    const q = calculateQuote(await getCatalog(), selection)
    if (!q.ok) return NextResponse.json({ error: q.error }, { status: 422 })

    const check = await checkCoupon(await getDb(), { code, quote: q.quote, email: email || undefined, phone: phone || undefined })
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 422 })
    return NextResponse.json({ coupon: check.coupon })
  } catch (err) {
    console.error('[api/gutschein]', err)
    const status = err instanceof DatabaseNotConfiguredError ? 503 : 500
    return NextResponse.json({ error: 'Der Gutschein konnte gerade nicht geprüft werden. Bitte versuchen Sie es erneut.' }, { status })
  }
}
