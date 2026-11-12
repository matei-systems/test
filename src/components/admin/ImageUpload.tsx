'use client'

import { useRef, useState } from 'react'
import { Icon } from '../icons'

const MAX_EDGE = 2000

/** Bild im Browser verkleinern (spart Upload-Zeit und bleibt unter dem Upload-Limit des Hostings). */
async function downscale(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1_500_000) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
    return blob ?? file
  } catch {
    return file
  }
}

/**
 * Bild-Upload für Admin-Formulare. Lädt das Bild sofort hoch (verkleinert, als WebP gespeichert) und
 * schreibt den Pfad in ein verstecktes Formularfeld – gespeichert wird erst mit dem Formular.
 */
export function ImageUpload({
  name,
  label,
  defaultValue = '',
  hint,
  allowRemove = false,
}: {
  name: string
  label: string
  defaultValue?: string
  hint?: string
  allowRemove?: boolean
}) {
  const [src, setSrc] = useState(defaultValue)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const id = `upload-${name}`

  async function onFile(file: File | undefined) {
    if (!file) return
    setError('')
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      setError('Bitte ein Bild im Format JPG, PNG oder WebP wählen.')
      return
    }
    setBusy(true)
    try {
      const blob = await downscale(file)
      if (blob.size > 4_000_000) throw new Error('Das Bild ist zu groß. Bitte ein kleineres Bild wählen (max. ca. 4 MB).')
      const fd = new FormData()
      fd.append('file', blob, file.name)
      const res = await fetch('/api/admin/media', { method: 'POST', body: fd })
      const data = (await res.json().catch(() => ({}))) as { src?: string; error?: string }
      if (!res.ok || !data.src) throw new Error(data.error ?? 'Upload fehlgeschlagen.')
      setSrc(data.src)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload fehlgeschlagen.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="adm-upload">
      <input type="hidden" name={name} value={src} />
      <span className="adm-upload-label" id={`${id}-label`}>
        {label}
      </span>
      <div className="adm-upload-box" aria-busy={busy}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading="lazy" />
        ) : (
          <span className="adm-upload-empty">
            <Icon name="image" size={22} />
            Noch kein Bild
          </span>
        )}
      </div>
      <div className="adm-actions">
        <label className="adm-btn" htmlFor={id} aria-describedby={`${id}-label`}>
          <Icon name="upload" size={15} /> {busy ? 'Lädt hoch …' : src ? 'Bild ersetzen' : 'Bild hochladen'}
        </label>
        <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        {allowRemove && src && (
          <button type="button" className="adm-btn" onClick={() => setSrc('')}>
            <Icon name="close" size={15} /> Entfernen
          </button>
        )}
      </div>
      {hint && !error && <p className="adm-upload-hint">{hint}</p>}
      {error && (
        <p className="adm-upload-hint" role="alert" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
