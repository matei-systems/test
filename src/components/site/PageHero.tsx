import Image from 'next/image'
import styles from './PageHero.module.css'

export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  imagePosition,
}: {
  eyebrow: string
  title: React.ReactNode
  lead?: React.ReactNode
  image?: string
  imagePosition?: string
}) {
  return (
    <section className={`${styles.hero} ${image ? styles.withImage : ''}`}>
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" quality={70} className={styles.img} style={{ objectPosition: imagePosition ?? '70% 50%' }} />
          <div className={styles.shade} />
        </>
      )}
      <div className={`container ${styles.inner}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className={`h2 ${styles.title}`}>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
    </section>
  )
}
