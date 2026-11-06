import { EMPTY_STATIC_NOMINAL_TNA } from '../../../app/lib/fci-static-nominal-tna'

const FAILURE_MAX_AGE = 60

// Errors propagate out of the cached handler, so a failed computation is never
// stored (SWR keeps serving the previous response when there is one).
const cachedNominalTna = defineCachedEventHandler(() => getFciNominalTna(), {
  name: 'fci-nominal-tna',
  maxAge: FCI_NOMINAL_TNA_MAX_AGE,
  swr: true,
  getKey: () => 'v1',
})

// Nominal TNA/TEA estimates for curated funds and their sibling classes.
// Cache key ignores the query string on purpose. On failure, degrade to the
// empty shape with a short cache instead of a 500.
export default defineEventHandler(async (event) => {
  try {
    return await cachedNominalTna(event)
  } catch (error) {
    console.error('[fci-tna] /api/fci/nominal-tna.json failed:', error)
    setResponseHeader(event, 'cache-control', `public, max-age=${FAILURE_MAX_AGE}`)
    return EMPTY_STATIC_NOMINAL_TNA
  }
})
