import { describe, expect, it, vi } from 'vitest'
import {
  buildFciNominalTnaFile,
  FCI_API_BASE,
  HISTORY_LOOKBACK_DAYS,
  trimHistory,
  type FetchJson,
} from './build-fci-nominal-tna'

const AS_OF = '2026-11-04'
const DAY_MS = 24 * 60 * 60 * 1000

function isoDaysBefore(days: number) {
  return new Date(Date.parse(`${AS_OF}T00:00:00.000Z`) - days * DAY_MS).toISOString().slice(0, 10)
}

// Daily VCP growing ~0.1% per day for `days` days ending at AS_OF.
function dailyHistory(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const offset = days - 1 - index
    return { fecha: isoDaysBefore(offset), valorCuotaparte: 1000 * 1.001 ** index, extra: 'x' }
  })
}

function fund(nombre: string) {
  return {
    nombre,
    fecha: AS_OF,
    rendimientos: {
      valorCuotaparte: 1000 * 1.001 ** 399,
      variacionDiariaPct: 0.1,
      ultimos7Dias: 0.7,
      unMes: 3,
      noventaDias: null,
      cientoOchentaDias: null,
      enElAnio: null,
      doceMeses: null,
    },
  }
}

const CURATED = 'Alpha Pesos - Clase A'
const SIBLING = 'Alpha Pesos - Clase B'
const UNRELATED = 'Fondo Desconocido - Clase A'

function mockFetch(overrides: Record<string, unknown> = {}) {
  const histories = new Map<string, unknown>()
  const fetchJson = vi.fn(async (url: string) => {
    if (url in overrides) return overrides[url]
    if (url === `${FCI_API_BASE}/fondos`) {
      return { fondos: [fund(CURATED), fund(SIBLING), fund(UNRELATED)] }
    }
    const payload = { historico: dailyHistory(400) }
    histories.set(url, payload)
    return payload
  })
  return { fetchJson: fetchJson as unknown as FetchJson & typeof fetchJson, histories }
}

describe('trimHistory', () => {
  it('keeps only the lookback window and drops extra fields', () => {
    const trimmed = trimHistory(dailyHistory(400), AS_OF)

    expect(trimmed).toHaveLength(HISTORY_LOOKBACK_DAYS + 1)
    expect(trimmed[0]!.fecha).toBe(isoDaysBefore(HISTORY_LOOKBACK_DAYS))
    expect(trimmed.at(-1)!.fecha).toBe(AS_OF)
    expect(Object.keys(trimmed[0]!).sort()).toEqual(['fecha', 'valorCuotaparte'])
  })

  it('ignores points after the as-of date and returns nothing without one', () => {
    const history = [...dailyHistory(5), { fecha: '2026-11-10', valorCuotaparte: 1 }]
    expect(trimHistory(history, AS_OF).map((item) => item.fecha)).not.toContain('2026-11-10')
    expect(trimHistory(history, null)).toEqual([])
  })
})

describe('buildFciNominalTnaFile', () => {
  it('estimates curated funds and their sibling classes only', async () => {
    const { fetchJson } = mockFetch()
    const file = await buildFciNominalTnaFile({
      fetchJson,
      now: () => new Date('2026-11-05T12:00:00.000Z'),
    })

    expect(file.source).toBe('argentinadatos-history')
    expect(file.generatedAt).toBe('2026-11-05T12:00:00.000Z')
    expect(Object.keys(file.bySlug).sort()).toEqual(['alpha-pesos-clase-a', 'alpha-pesos-clase-b'])
    expect(file.count).toBe(2)

    const entry = file.bySlug['alpha-pesos-clase-a']!
    expect(entry.tna).toBeGreaterThan(0)
    expect(entry.tea).toBeGreaterThan(entry.tna)
    expect(entry.retorno30d).toBe(3)
    expect(entry.estimate.period).toBe('7D')

    // Only targets get a history request.
    const historyUrls = fetchJson.mock.calls
      .map(([url]) => url)
      .filter((url) => url.endsWith('/historico'))
    expect(historyUrls).toHaveLength(2)
  })

  it('uses the injected catalog loader instead of fetching the catalog', async () => {
    const { fetchJson } = mockFetch()
    const loadCatalog = vi.fn(async () => ({ fondos: [fund(CURATED)] }))
    const file = await buildFciNominalTnaFile({ fetchJson, loadCatalog })

    expect(loadCatalog).toHaveBeenCalledOnce()
    expect(fetchJson).not.toHaveBeenCalledWith(`${FCI_API_BASE}/fondos`)
    expect(file.count).toBe(1)
  })

  it('throws when the catalog is unavailable', async () => {
    const { fetchJson } = mockFetch({ [`${FCI_API_BASE}/fondos`]: null })
    await expect(buildFciNominalTnaFile({ fetchJson })).rejects.toThrow(/catalog/)
  })

  it('throws when most history fetches fail so a stale value is kept', async () => {
    const fetchJson = vi.fn(async (url: string) => {
      if (url === `${FCI_API_BASE}/fondos`) return { fondos: [fund(CURATED), fund(SIBLING)] }
      throw new Error('ECONNRESET')
    }) as unknown as FetchJson
    const logger = { warn: vi.fn() }

    await expect(buildFciNominalTnaFile({ fetchJson, logger })).rejects.toThrow(
      /history fetches failed/,
    )
    expect(logger.warn).toHaveBeenCalledTimes(2)
  })
})
