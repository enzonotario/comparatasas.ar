export interface ParsedFundClassName {
  /** Full original name */
  fullName: string
  /** Name without the class suffix */
  baseName: string
  /** Class label including "Clase …", or null if not a classed fund */
  classLabel: string | null
  /** Stable key for grouping (normalized base name) */
  groupKey: string
}

function normalizeGroupKey(baseName: string): string {
  return baseName
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parses FCI names shaped as `{nombre} - Clase {x}`.
 * Only splits when the suffix starts with "Clase" to avoid false positives.
 */
export function parseFundClassName(nombre: string | null | undefined): ParsedFundClassName {
  const fullName = (nombre ?? '').trim()

  if (!fullName) {
    return {
      fullName: '',
      baseName: '',
      classLabel: null,
      groupKey: '',
    }
  }

  const match = fullName.match(/^(.*?)\s+-\s+(Clase\s+.+)$/i)
  if (!match) {
    return {
      fullName,
      baseName: fullName,
      classLabel: null,
      groupKey: normalizeGroupKey(fullName),
    }
  }

  const baseName = match[1]!.trim()
  const classLabel = match[2]!.trim()

  return {
    fullName,
    baseName,
    classLabel,
    groupKey: normalizeGroupKey(baseName),
  }
}

export function compareClassLabels(a: string | null | undefined, b: string | null | undefined) {
  const left = a ?? ''
  const right = b ?? ''
  return left.localeCompare(right, 'es', { numeric: true, sensitivity: 'base' })
}
