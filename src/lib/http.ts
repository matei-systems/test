import 'server-only'
import type { NextRequest } from 'next/server'

/** Schutz vor Cross-Site-Requests: Nur Anfragen von der eigenen Website annehmen. */
export function isSameOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}
