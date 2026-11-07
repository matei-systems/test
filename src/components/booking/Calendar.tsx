'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../icons'
import { addDays, isoWeekday, todayInZone } from '@/lib/time'
import styles from './Calendar.module.css'

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`
}
function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

interface Props {
  serviceId: string
  vehicleId: string
  addonIds: string[]
  selected: string
  onSelect: (date: string) => void
}

/** Monatskalender, der nur Tage mit tatsächlich freien Terminen auswählbar macht. */
export function Calendar({ serviceId, vehicleId, addonIds, selected, onSelect }: Props) {
  const today = todayInZone()
  const [month, setMonth] = useState(monthStart(selected || today))
  const [available, setAvailable] = useState<Set<string>>(new Set())
  const [range, setRange] = useState<{ first: string; last: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [focusDate, setFocusDate] = useState<string>(selected || '')
  const gridRef = useRef<HTMLDivElement>(null)
  const autoAdvanced = useRef(false)

  useEffect(() => {
    let cancelled = false
    const from = month
    const to = addDays(month, daysInMonth(month) - 1)
    setLoading(true)
    setError('')
    const qs = new URLSearchParams({ service: serviceId, vehicle: vehicleId, addons: addonIds.join(','), from, to })
    fetch(`/api/availability?${qs}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        if (cancelled) return
        setAvailable(new Set<string>(data.days))
        setRange({ first: data.firstDate, last: data.lastDate })
        // Erster Aufruf: Ist im aktuellen Monat nichts frei, automatisch zum nächsten Monat springen
        if (!autoAdvanced.current && data.days.length === 0 && !selected && to < data.lastDate) {
          autoAdvanced.current = true
          setMonth(shiftMonth(month, 1))
        } else {
          autoAdvanced.current = true
        }
      })
      .catch(() => !cancelled && setError('Verfügbarkeiten konnten nicht geladen werden.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, serviceId, vehicleId, addonIds.join(',')])

  const cells = useMemo(() => {
    const n = daysInMonth(month)
    const lead = isoWeekday(month) - 1
    const out: Array<string | null> = Array.from({ length: lead }, () => null)
    for (let i = 0; i < n; i++) out.push(addDays(month, i))
    while (out.length % 7) out.push(null)
    return out
  }, [month])

  const [y, m] = month.split('-').map(Number)
  // Genau ein Tag ist per Tab erreichbar (Roving Tabindex), Pfeiltasten wechseln den Tag
  const tabbable =
    selected && monthStart(selected) === month
      ? selected
      : focusDate && monthStart(focusDate) === month
        ? focusDate
        : [...available].sort()[0]
  const canPrev = month > monthStart(today)
  const canNext = range ? shiftMonth(month, 1) <= range.last : true

  function onKeyDown(e: React.KeyboardEvent) {
    const current = focusDate || selected
    if (!current) return
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (!delta) return
    e.preventDefault()
    const nextDate = addDays(current, delta)
    if (monthStart(nextDate) !== month) setMonth(monthStart(nextDate))
    setFocusDate(nextDate)
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${nextDate}"]`)?.focus())
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.head}>
        <button type="button" className={styles.navBtn} onClick={() => setMonth(shiftMonth(month, -1))} disabled={!canPrev} aria-label="Vorheriger Monat">
          <Icon name="chevron-left" size={18} />
        </button>
        <p className={styles.month} aria-live="polite">
          {MONTHS[m - 1]} {y}
        </p>
        <button type="button" className={styles.navBtn} onClick={() => setMonth(shiftMonth(month, 1))} disabled={!canNext} aria-label="Nächster Monat">
          <Icon name="chevron-right" size={18} />
        </button>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div ref={gridRef} className={`${styles.grid} ${loading ? styles.loading : ''}`} role="group" aria-label="Datum wählen" onKeyDown={onKeyDown}>
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} className={styles.empty} />
          const isAvailable = available.has(d)
          const isSelected = d === selected
          const isToday = d === today
          const label = `${Number(d.slice(8))}. ${MONTHS[Number(d.slice(5, 7)) - 1]}${isAvailable ? ', freie Termine' : ', nicht verfügbar'}`
          return (
            <button
              key={d}
              type="button"
              data-date={d}
              className={`${styles.day} ${isAvailable ? styles.available : ''} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
              disabled={!isAvailable || loading}
              aria-pressed={isSelected}
              aria-label={label}
              tabIndex={d === tabbable ? 0 : -1}
              onClick={() => {
                setFocusDate(d)
                onSelect(d)
              }}
            >
              {Number(d.slice(8))}
            </button>
          )
        })}
      </div>
      <div className={styles.legend}>
        <span>
          <i className={styles.legendAvailable} /> frei
        </span>
        <span>
          <i className={styles.legendSelected} /> gewählt
        </span>
        {loading && <span className={styles.loadingText}>lädt …</span>}
      </div>
      {error && <p className="field-error">{error}</p>}
      {!loading && !error && available.size === 0 && <p className={styles.none}>In diesem Monat sind keine Termine frei.</p>}
    </div>
  )
}
