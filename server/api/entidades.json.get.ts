import {
  buildEntitiesFromSources,
  ENTITY_SOURCES,
  type EntitiesResponse,
  type EntitySourceKey,
} from '../../app/lib/entities-products'

const SOURCE_TIMEOUT_MS = 15_000

// Products per financial entity, aggregated from every ArgentinaDatos source.
// A failing source only drops its products; the rest are still returned.
// Cache key ignores the query string on purpose.
export default defineCachedEventHandler(
  async (): Promise<EntitiesResponse> => {
    const entries = Object.entries(ENTITY_SOURCES) as Array<[EntitySourceKey, string]>
    const settled = await Promise.allSettled(
      entries.map(([, url]) => $fetch<unknown>(url, { timeout: SOURCE_TIMEOUT_MS })),
    )

    const responses: Partial<Record<EntitySourceKey, unknown>> = {}
    settled.forEach((result, index) => {
      const key = entries[index]![0]
      if (result.status === 'fulfilled') responses[key] = result.value
      else console.warn(`[entidades] source "${key}" failed:`, result.reason)
    })

    // Nothing to show: fail so the cache keeps serving the previous value.
    if (!Object.keys(responses).length) {
      throw createError({ statusCode: 502, statusMessage: 'Upstream sources unavailable' })
    }

    const { entities, unmatched } = buildEntitiesFromSources(responses)
    if (unmatched.length) console.warn('[entidades] unmatched names:', unmatched)

    return { updatedAt: new Date().toISOString(), entities }
  },
  {
    name: 'entidades',
    maxAge: 5 * 60,
    swr: true,
    getKey: () => 'v1',
  },
)
