'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { Icon } from '../icons'
import type { GalleryImage } from '@/content/gallery'
import styles from './ImageSlider.module.css'

/** Horizontaler Bild-Slider mit Scroll-Snap (Touch, Trackpad, Tastatur und Pfeil-Buttons). */
export function ImageSlider({ images }: { images: GalleryImage[] }) {
  const track = useRef<HTMLUListElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.querySelector('li')
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 400) + 16), behavior: 'smooth' })
  }
  return (
    <div className={styles.slider}>
      <ul ref={track} className={styles.track} tabIndex={0} aria-label="Bildergalerie – mit Pfeiltasten scrollen">
        {images.map((img) => (
          <li key={img.src} className={styles.slide}>
            <figure>
              <div className={styles.media}>
                <Image src={img.src} alt={img.alt} fill sizes="(max-width: 700px) 85vw, 45vw" quality={80} style={{ objectFit: 'cover' }} />
                {img.isDemo && <span className={styles.demo}>Beispielbild</span>}
              </div>
              <figcaption>{img.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className={styles.controls}>
        <button type="button" onClick={() => scroll(-1)} aria-label="Vorheriges Bild">
          <Icon name="arrow-left" size={18} />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="Nächstes Bild">
          <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  )
}
