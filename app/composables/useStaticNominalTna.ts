import type { StaticNominalTnaFile } from '~/lib/fci-static-nominal-tna'

export {
  lookupStaticNominalTna,
  type StaticNominalTnaEntry,
  type StaticNominalTnaFile,
} from '~/lib/fci-static-nominal-tna'

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
