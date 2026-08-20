import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { comparatasasFondos } from '../app/lib/mappings/funds'
import { parseFundClassName } from '../app/lib/fci-fund-class'
import {
  nominalTnaRatesFromEstimate,
  resolveFundNominalTnaEstimate,
} from '../app/lib/finance/fci-nominal-tna'
import type { NominalTnaEstimate } from '../app/lib/finance/fci-comparatasas-returns'

const API_BASE = 'https://api.argentinadatos.com/v1/finanzas/fci'
const OUTPUT_PATH = join(process.cwd(), 'public', 'api', 'fci', 'nominal-tna.json')
const CONCURRENCY = 6
/** Solo hace falta ~40 días de VCP para TNA 30D; recortamos para no procesar 1500+ puntos. */
const HISTORY_LOOKBACK_DAYS = 45

export type StaticNominalTnaEntry = {
  tna: number
  tea: number
  retorno30d: number | null
  estimate: NominalTnaEstimate
}

export type StaticNominalTnaFile = {
  generatedAt: string
  source: 'argentinadatos-history'
  count: number
  bySlug: Record<string, StaticNominalTnaEntry>
}

function normalizeSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0

  async function run() {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await worker(items[index]!, index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()))
  return results
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url)
  if (!response.ok) return null
  return (await response.json()) as T
}

function trimHistory(
  historico: Array<{ fecha: string; valorCuotaparte: number | null }>,
  asOf: string | null,
) {
  if (!asOf || !historico.length) return historico

  const cutoffMs = Date.parse(`${asOf}T00:00:00.000Z`) - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  return historico.filter((item) => {
    const time = Date.parse(`${item.fecha}T00:00:00.000Z`)
    return Number.isFinite(time) && time >= cutoffMs && item.fecha <= asOf
  })
}

export async function generateFciNominalTnaFile(): Promise<StaticNominalTnaFile> {
  const catalog = await fetchJson<{
    fondos: Array<{
      nombre: string
      fecha: string | null
      rendimientos: {
        valorCuotaparte: number | null
        variacionDiariaPct?: number | null
        ultimos7Dias: number | null
        unMes: number | null
        noventaDias: number | null
        cientoOchentaDias: number | null
        enElAnio: number | null
        doceMeses: number | null
      } | null
    }>
  }>(`${API_BASE}/fondos`)

  if (!catalog?.fondos?.length) {
    throw new Error('No se pudo leer el catálogo FCI de ArgentinaDatos')
  }

  const curatedGroupKeys = new Set(
    comparatasasFondos.map((slug) => {
      const match = catalog.fondos.find((fund) => normalizeSlug(fund.nombre) === slug)
      if (!match) return slug
      return parseFundClassName(match.nombre).groupKey || slug
    }),
  )

  const targets = catalog.fondos.filter((fund) => {
    const slug = normalizeSlug(fund.nombre)
    if (comparatasasFondos.includes(slug)) return true
    const groupKey = parseFundClassName(fund.nombre).groupKey
    return Boolean(groupKey && curatedGroupKeys.has(groupKey))
  })

  console.log(`[fci-tna] Curated+siblings a enriquecer: ${targets.length}`)

  const bySlug: Record<string, StaticNominalTnaEntry> = {}

  await mapPool(targets, CONCURRENCY, async (fund) => {
    const slug = normalizeSlug(fund.nombre)
    try {
      const history = await fetchJson<{
        historico: Array<{ fecha: string; valorCuotaparte: number | null }>
      }>(`${API_BASE}/fondos/${slug}/historico`)

      const estimate = resolveFundNominalTnaEstimate(
        { fecha: fund.fecha, rendimientos: fund.rendimientos },
        {
          fondoId: '',
          claseId: '',
          nombre: fund.nombre,
          fechaActualizacion: fund.fecha || '',
          historico: trimHistory(history?.historico ?? [], fund.fecha).map((item) => ({
            slug,
            fondoId: null,
            claseId: null,
            nombre: fund.nombre,
            fecha: item.fecha,
            categoria: null,
            categoriaKey: null,
            horizonte: null,
            valorCuotaparte: item.valorCuotaparte,
            patrimonio: null,
            retornoDiario: null,
            retornoAcumulado: null,
            flujoEstimado: null,
            origen: 'build',
          })),
        },
      )

      if (!estimate) return

      const rates = nominalTnaRatesFromEstimate(estimate)
      if (rates.tna == null || rates.tea == null) return

      bySlug[slug] = {
        tna: rates.tna,
        tea: rates.tea,
        retorno30d: fund.rendimientos?.unMes ?? null,
        estimate,
      }
    } catch (error) {
      console.warn(`[fci-tna] Falló ${slug}:`, error)
    }
  })

  const payload: StaticNominalTnaFile = {
    generatedAt: new Date().toISOString(),
    source: 'argentinadatos-history',
    count: Object.keys(bySlug).length,
    bySlug,
  }

  await mkdir(join(process.cwd(), 'public', 'api', 'fci'), { recursive: true })
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload)}\n`, 'utf8')
  console.log(`[fci-tna] Escrito ${payload.count} estimaciones → ${OUTPUT_PATH}`)
  return payload
}

generateFciNominalTnaFile().catch((error) => {
  console.error(error)
  process.exit(1)
})
