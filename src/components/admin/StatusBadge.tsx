import { STATUS_LABELS } from '@/lib/format'

export function StatusBadge({ status }: { status: string }) {
  return <span className={`adm-status adm-status--${status}`}>{STATUS_LABELS[status] ?? status}</span>
}
