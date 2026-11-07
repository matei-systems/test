export { formatCalendarDate, formatDuration, formatPrice } from '@/lib/format'
import { minutesToTime, timeToMinutes } from '@/lib/time'

/** "09:30" + 150 Minuten → "12:00" */
export function minutesToTimeLabel(start: string, durationMinutes: number): string {
  return minutesToTime((timeToMinutes(start) + durationMinutes) % (24 * 60))
}
