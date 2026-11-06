import { normalizeFundSlug } from './funds-detail'

// Pure module (no Vue/Nuxt auto-imports) so Nitro server routes can use it.

export type StaticNominalTnaEntry = {
  tna: number
  tea: number
  retorno30d: number | null
  estimate: {
    value: number
    period: '30D' | '7D' | '1D'
    days: number
    formula: string
  }
}

export type StaticNominalTnaFile = {
  generatedAt: string
  source: string
  count: number
  bySlug: Record<string, StaticNominalTnaEntry>
}

/** Shape served when the estimates are unavailable. */
export const EMPTY_STATIC_NOMINAL_TNA: StaticNominalTnaFile = Object.freeze({
  generatedAt: '',
  source: 'missing',
  count: 0,
  bySlug: Object.freeze({}),
}) as StaticNominalTnaFile

export function lookupStaticNominalTna(
  map: StaticNominalTnaFile | null | undefined,
  fondoNameOrSlug: string,
) {
  if (!map?.bySlug) return null
  return map.bySlug[normalizeFundSlug(fondoNameOrSlug)] ?? null
}
