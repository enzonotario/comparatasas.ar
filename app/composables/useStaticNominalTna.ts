import { normalizeFundSlug } from '~/lib/funds-detail'

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

const EMPTY: StaticNominalTnaFile = {
  generatedAt: '',
  source: 'missing',
  count: 0,
  bySlug: {},
}

/** Payload estático generado en build (`public/api/fci/nominal-tna.json`). */
export function useStaticNominalTnaMap() {
  return useAsyncData(
    'fci-static-nominal-tna',
    async () => {
      try {
        return await $fetch<StaticNominalTnaFile>('/api/fci/nominal-tna.json')
      } catch {
        return EMPTY
      }
    },
    {
      default: () => EMPTY,
    },
  )
}

export function lookupStaticNominalTna(
  map: StaticNominalTnaFile | null | undefined,
  fondoNameOrSlug: string,
) {
  if (!map?.bySlug) return null
  return map.bySlug[normalizeFundSlug(fondoNameOrSlug)] ?? null
}
