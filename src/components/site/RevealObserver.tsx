'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Dezente Einblend-Animation für Elemente mit der Klasse .reveal (respektiert prefers-reduced-motion). */
export function RevealObserver() {
  const pathname = usePathname()
  useEffect(() => {
    document.documentElement.classList.add('js')
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])
  return null
}
