'use client'

import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'
import { isUploadedImage, type CompareItem } from '@/lib/gallery'
import styles from './BeforeAfter.module.css'

/** Vorher/Nachher-Vergleichsregler – per Maus, Touch und Tastatur (Pfeiltasten) bedienbar. */
export function CompareSlider({ item, priority = false }: { item: CompareItem; priority?: boolean }) {
  const [pos, setPos] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const p = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(100, Math.max(0, p)))
  }, [])

  return (
    <div
      ref={ref}
      className={styles.compare}
      style={{ ['--pos' as string]: `${pos}%` }}
      onPointerDown={(e) => {
        dragging.current = true
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        setFromClientX(e.clientX)
      }}
      onPointerMove={(e) => dragging.current && setFromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <Image
        src={item.afterSrc}
        alt={`${item.alt} – nachher`}
        fill
        sizes="(max-width: 900px) 100vw, 60vw"
        quality={80}
        priority={priority}
        unoptimized={isUploadedImage(item.afterSrc)}
        className={styles.img}
        draggable={false}
      />
      <div className={styles.beforeLayer} aria-hidden="true">
        <Image
          src={item.beforeSrc}
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          quality={80}
          unoptimized={isUploadedImage(item.beforeSrc)}
          className={styles.img}
          draggable={false}
        />
      </div>
      <span className={`${styles.tag} ${styles.tagBefore}`}>Vorher</span>
      <span className={`${styles.tag} ${styles.tagAfter}`}>Nachher</span>
      {item.isDemo && <span className={styles.demo}>Demo-Visualisierung · keine Kundenarbeit</span>}
      <div className={styles.handle} aria-hidden="true">
        <span className={styles.knob}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
          </svg>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        className={styles.range}
        aria-label={`Vorher-Nachher-Vergleich: ${item.title}`}
        aria-valuetext={`${Math.round(pos)} % Vorher sichtbar`}
      />
    </div>
  )
}

export function BeforeAfterShowcase({ items }: { items: CompareItem[] }) {
  const [active, setActive] = useState(0)
  const item = items[active]
  if (!item) return null
  return (
    <div className={styles.showcase}>
      <div className={styles.stage}>
        <CompareSlider key={item.id} item={item} />
      </div>
      <div className={styles.side}>
        <div className={styles.tabs} role="group" aria-label="Beispiel auswählen">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              aria-pressed={i === active}
              className={`${styles.tab} ${i === active ? styles.tabActive : ''}`}
              onClick={() => setActive(i)}
            >
              <span className={styles.tabIndex}>{String(i + 1).padStart(2, '0')}</span>
              <span>
                <strong>{it.title}</strong>
                <span>{it.description}</span>
              </span>
            </button>
          ))}
        </div>
        <p className={styles.hint}>Regler ziehen oder mit den Pfeiltasten bedienen.</p>
      </div>
    </div>
  )
}
