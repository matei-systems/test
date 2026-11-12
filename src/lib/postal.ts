/** Prüft eine Postleitzahl gegen Bereiche wie "8010-8077, 8501". Leer = alles erlaubt. (Auch im Browser nutzbar.) */
export function postalCodeInRanges(postalCode: string, ranges: string): boolean {
  const spec = ranges.trim()
  if (!spec) return true
  const code = Number(postalCode.trim())
  if (!Number.isInteger(code)) return false
  return spec
    .split(/[,;\s]+/)
    .filter(Boolean)
    .some((part) => {
      const [a, b] = part.split('-').map((x) => Number(x.trim()))
      if (!Number.isFinite(a)) return false
      if (b === undefined || Number.isNaN(b)) return code === a
      return code >= a && code <= b
    })
}
