/** Galerie-Typen für die Darstellung (ohne Datenbankzugriff – auch im Browser verwendbar). */

export interface CompareItem {
  id: string
  title: string
  description: string
  category: string
  beforeSrc: string
  afterSrc: string
  alt: string
  isDemo: boolean
}

export interface GalleryImage {
  id: string
  src: string
  alt: string
  caption: string
  category: string
  isDemo: boolean
}

interface Source {
  id: string
  kind: 'vergleich' | 'bild'
  title: string
  description: string
  category: string
  beforeSrc: string | null
  afterSrc: string | null
  imageSrc: string | null
  alt: string
  isDemo: boolean
}

export function toCompareItems(items: Source[]): CompareItem[] {
  return items
    .filter((i) => i.kind === 'vergleich' && i.beforeSrc && i.afterSrc)
    .map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      category: i.category,
      beforeSrc: i.beforeSrc as string,
      afterSrc: i.afterSrc as string,
      alt: i.alt || i.title,
      isDemo: i.isDemo,
    }))
}

export function toGalleryImages(items: Source[]): GalleryImage[] {
  return items
    .filter((i) => i.kind === 'bild' && i.imageSrc)
    .map((i) => ({ id: i.id, src: i.imageSrc as string, alt: i.alt || i.title, caption: i.title, category: i.category, isDemo: i.isDemo }))
}

/** Hochgeladene Bilder (/media/…) sind bereits verkleinert und als WebP gespeichert. */
export function isUploadedImage(src: string): boolean {
  return src.startsWith('/media/')
}
