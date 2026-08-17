export const FCI_SERIES_KEYS = [
  'mercadoDinero',
  'rentaFija',
  'rentaMixta',
  'rentaVariable',
  'retornoTotal',
] as const

export type FciSerieKey = (typeof FCI_SERIES_KEYS)[number]

export const FCI_SERIES_LABELS: Record<FciSerieKey, string> = {
  mercadoDinero: 'Money Market',
  rentaFija: 'Renta Fija',
  rentaMixta: 'Renta Mixta',
  rentaVariable: 'Renta Variable',
  retornoTotal: 'Retorno Total',
}

export interface FciSerieItem {
  name: string
  horizonte: string | null
  fecha: string | null
  vcp: number | null
  ccp: number | null
  patrimonio: number | null
}

export interface MarketFlowTypeRow {
  key: FciSerieKey
  label: string
  patrimonio: number
  deltaPatrimonio: number | null
  flujoEstimado: number | null
  matched: number
}

export interface MarketFlowFundRow {
  name: string
  serie: FciSerieKey
  fecha: string | null
  flujoEstimado: number
  patrimonio: number | null
}

export interface MarketFlowSnapshot {
  from: string | null
  to: string | null
  patrimonio: number
  deltaPatrimonio: number | null
  flujoEstimado: number | null
  matched: number
  byType: MarketFlowTypeRow[]
  inflows: MarketFlowFundRow[]
  outflows: MarketFlowFundRow[]
}

export interface MarketHistoryTypePoint {
  clases: number
  conPatrimonio: number
  patrimonio: number
  conFlujo: number
  flujoEstimado: number
}

export interface MarketHistoryPoint extends MarketHistoryTypePoint {
  fecha: string
  byType: Partial<Record<FciSerieKey, MarketHistoryTypePoint>>
}

export interface MarketHistorySnapshot {
  fechaActualizacion: string | null
  puntos: MarketHistoryPoint[]
}

type RawSerieItem = {
  fondo?: string
  horizonte?: string | null
  fecha?: string | null
  vcp?: number | null
  ccp?: number | null
  patrimonio?: number | null
}

function finitePositive(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0
}

export function parseFciSerieItem(raw: RawSerieItem | null | undefined): FciSerieItem | null {
  const name = raw?.fondo?.trim()
  if (!name) return null
  return {
    name,
    horizonte: raw.horizonte ?? null,
    fecha: raw.fecha ?? null,
    vcp: typeof raw.vcp === 'number' && Number.isFinite(raw.vcp) ? raw.vcp : null,
    ccp: typeof raw.ccp === 'number' && Number.isFinite(raw.ccp) ? raw.ccp : null,
    patrimonio:
      typeof raw.patrimonio === 'number' && Number.isFinite(raw.patrimonio) ? raw.patrimonio : null,
  }
}

/** Flujo neto ≈ ΔAUM − rendimiento sobre el AUM previo (vía VCP). */
export function estimateFundFlow(
  current: { patrimonio: number | null; vcp: number | null },
  previous: { patrimonio: number | null; vcp: number | null },
): number | null {
  if (
    !finitePositive(current.patrimonio) ||
    !finitePositive(previous.patrimonio) ||
    !finitePositive(current.vcp) ||
    !finitePositive(previous.vcp)
  ) {
    return null
  }
  return current.patrimonio - previous.patrimonio * (current.vcp / previous.vcp)
}

function indexByName(items: FciSerieItem[]) {
  const map = new Map<string, FciSerieItem>()
  for (const item of items) {
    map.set(item.name, item)
  }
  return map
}

function modeDate(items: FciSerieItem[]) {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.fecha) continue
    counts.set(item.fecha, (counts.get(item.fecha) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [fecha, count] of counts) {
    if (count > bestCount) {
      best = fecha
      bestCount = count
    }
  }
  return best
}

export function buildMarketFlowSnapshot(
  series: Partial<Record<FciSerieKey, { ultimo: FciSerieItem[]; penultimo: FciSerieItem[] }>>,
  topN = 8,
): MarketFlowSnapshot {
  const byType: MarketFlowTypeRow[] = []
  const fundRows: MarketFlowFundRow[] = []
  let patrimonio = 0
  let deltaPatrimonio = 0
  let hasDelta = false
  let flujoEstimado = 0
  let hasFlujo = false
  let matched = 0

  for (const key of FCI_SERIES_KEYS) {
    const pair = series[key]
    const ultimo = pair?.ultimo ?? []
    const previousByName = indexByName(pair?.penultimo ?? [])
    const typeAum = ultimo.reduce((sum, item) => sum + (item.patrimonio ?? 0), 0)
    patrimonio += typeAum

    let typeDelta = 0
    let typeHasDelta = false
    let typeFlujo = 0
    let typeHasFlujo = false
    let typeMatched = 0

    for (const current of ultimo) {
      const previous = previousByName.get(current.name)
      if (!previous) continue
      typeMatched += 1
      if (current.patrimonio != null && previous.patrimonio != null) {
        typeDelta += current.patrimonio - previous.patrimonio
        typeHasDelta = true
      }
      const flow = estimateFundFlow(current, previous)
      if (flow == null) continue
      typeFlujo += flow
      typeHasFlujo = true
      fundRows.push({
        name: current.name,
        serie: key,
        fecha: current.fecha,
        flujoEstimado: flow,
        patrimonio: current.patrimonio,
      })
    }

    matched += typeMatched
    if (typeHasDelta) {
      deltaPatrimonio += typeDelta
      hasDelta = true
    }
    if (typeHasFlujo) {
      flujoEstimado += typeFlujo
      hasFlujo = true
    }

    byType.push({
      key,
      label: FCI_SERIES_LABELS[key],
      patrimonio: typeAum,
      deltaPatrimonio: typeHasDelta ? typeDelta : null,
      flujoEstimado: typeHasFlujo ? typeFlujo : null,
      matched: typeMatched,
    })
  }

  const ranked = [...fundRows].sort((a, b) => b.flujoEstimado - a.flujoEstimado)
  const lastUltimo = FCI_SERIES_KEYS.flatMap((key) => series[key]?.ultimo ?? [])
  const lastPenultimo = FCI_SERIES_KEYS.flatMap((key) => series[key]?.penultimo ?? [])

  return {
    from: modeDate(lastPenultimo),
    to: modeDate(lastUltimo),
    patrimonio,
    deltaPatrimonio: hasDelta ? deltaPatrimonio : null,
    flujoEstimado: hasFlujo ? flujoEstimado : null,
    matched,
    byType,
    inflows: ranked.filter((row) => row.flujoEstimado > 0).slice(0, topN),
    outflows: ranked
      .filter((row) => row.flujoEstimado < 0)
      .sort((a, b) => a.flujoEstimado - b.flujoEstimado)
      .slice(0, topN),
  }
}

type HistorySnapshotInput = {
  fecha?: string | null
  categoriaKey?: string | null
  categoria?: string | null
  patrimonio?: number | null
  flujoEstimado?: number | null
}

function emptyHistoryTypePoint(): MarketHistoryTypePoint {
  return {
    clases: 0,
    conPatrimonio: 0,
    patrimonio: 0,
    conFlujo: 0,
    flujoEstimado: 0,
  }
}

function inferSerieKey(categoria: string | null | undefined): FciSerieKey | null {
  if (!categoria) return null
  const normalized = categoria
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
  if (normalized.includes('mercado')) return 'mercadoDinero'
  if (normalized.includes('renta fija')) return 'rentaFija'
  if (normalized.includes('renta mixta')) return 'rentaMixta'
  if (normalized.includes('renta variable')) return 'rentaVariable'
  if (normalized.includes('retorno total')) return 'retornoTotal'
  return null
}

export function buildMarketHistorySnapshot(
  historicosPorSlug: Record<string, HistorySnapshotInput[] | undefined>,
  fechaActualizacion: string | null = null,
): MarketHistorySnapshot {
  const byDate = new Map<
    string,
    MarketHistoryTypePoint & { byType: Record<FciSerieKey, MarketHistoryTypePoint> }
  >()

  for (const snapshots of Object.values(historicosPorSlug)) {
    if (!snapshots?.length) continue
    for (const snapshot of snapshots) {
      const fecha = snapshot.fecha?.trim()
      if (!fecha) continue
      let day = byDate.get(fecha)
      if (!day) {
        day = {
          ...emptyHistoryTypePoint(),
          byType: Object.fromEntries(
            FCI_SERIES_KEYS.map((key) => [key, emptyHistoryTypePoint()]),
          ) as Record<FciSerieKey, MarketHistoryTypePoint>,
        }
        byDate.set(fecha, day)
      }
      day.clases += 1
      const serie =
        (FCI_SERIES_KEYS.includes(snapshot.categoriaKey as FciSerieKey)
          ? (snapshot.categoriaKey as FciSerieKey)
          : inferSerieKey(snapshot.categoria)) ?? null
      const bucket = serie ? day.byType[serie] : null
      if (bucket) bucket.clases += 1

      if (typeof snapshot.patrimonio === 'number' && snapshot.patrimonio > 0) {
        day.patrimonio += snapshot.patrimonio
        day.conPatrimonio += 1
        if (bucket) {
          bucket.patrimonio += snapshot.patrimonio
          bucket.conPatrimonio += 1
        }
      }
      if (typeof snapshot.flujoEstimado === 'number' && Number.isFinite(snapshot.flujoEstimado)) {
        day.flujoEstimado += snapshot.flujoEstimado
        day.conFlujo += 1
        if (bucket) {
          bucket.flujoEstimado += snapshot.flujoEstimado
          bucket.conFlujo += 1
        }
      }
    }
  }

  const puntos = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, day]) => ({
      fecha,
      clases: day.clases,
      conPatrimonio: day.conPatrimonio,
      patrimonio: day.patrimonio,
      conFlujo: day.conFlujo,
      flujoEstimado: day.flujoEstimado,
      byType: day.byType,
    }))

  return { fechaActualizacion, puntos }
}
