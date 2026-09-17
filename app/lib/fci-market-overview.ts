import { parseFundClassName } from './fci-fund-class'
import { classifyHolding, HOLDING_KIND_LABELS, type HoldingKind } from './fci-holding-classify'
import { getManagerKind, shortManagerName, type ManagerKind } from './fci-manager-kind'
import { getFundTypeInfo } from './mappings/funds'
import { normalizeCurrencyCode } from './fci-fund-formatters'
import type { FciFundDetail, FciFundsDetailsResponse } from '../composables/useFciFundDetails'

export type MarketCurrencyFilter = 'all' | 'ARS' | 'USD'

export interface MarketNamedShare {
  key: string
  label: string
  value: number
  share: number
  count: number
}

export interface MarketManagerShare extends MarketNamedShare {
  kind: ManagerKind
  fondos: number
}

export interface MarketFundShare extends MarketNamedShare {
  fondo: string
  primaryFondo: string
  tipo: string
}

export interface MarketHoldingShare extends MarketNamedShare {
  kind: HoldingKind
}

export interface MarketTypeReturns {
  key: string
  label: string
  retorno1d: number | null
  retorno30d: number | null
  retornoYtd: number | null
  tna: number | null
  patrimonio: number
}

export interface MarketBankSplit {
  bancos: number
  independientes: number
  bancosShare: number
  independientesShare: number
  byType: Array<{
    key: string
    label: string
    bancos: number
    independientes: number
    bancosShare: number
    industryBancosShare: number
  }>
}

export interface FciMarketUniverse {
  clases: number
  fondos: number
  gestoras: number
  patrimonio: number
  withHoldings: number
  byType: MarketNamedShare[]
  byCurrency: MarketNamedShare[]
  byManager: MarketManagerShare[]
  byFund: MarketFundShare[]
  returnsByType: MarketTypeReturns[]
  bankSplit: MarketBankSplit
  holdingsByKind: MarketNamedShare[]
  topHoldings: MarketHoldingShare[]
}

export interface FciMarketSnapshot {
  fechaActualizacion: string | null
  asOf: string | null
  universes: Record<MarketCurrencyFilter, FciMarketUniverse>
}

function sumFinite(values: Array<number | null | undefined>) {
  let total = 0
  let hasValue = false
  for (const value of values) {
    if (value == null || !Number.isFinite(value)) continue
    total += value
    hasValue = true
  }
  return hasValue ? total : 0
}

function weightedAverage(items: Array<{ value: number | null | undefined; weight: number }>) {
  let weighted = 0
  let weight = 0
  for (const item of items) {
    if (item.value == null || !Number.isFinite(item.value) || !(item.weight > 0)) continue
    weighted += item.value * item.weight
    weight += item.weight
  }
  if (!(weight > 0)) return null
  return weighted / weight
}

function typeInfo(tipoRenta: string | null | undefined) {
  const info = getFundTypeInfo(tipoRenta)
  return {
    key: info?.type ?? (tipoRenta?.trim() || 'otros'),
    label: info?.typeLabel ?? tipoRenta?.trim() ?? 'Otros',
  }
}

function toShares<T extends { value: number }>(
  items: T[],
  total: number,
): Array<T & { share: number }> {
  return items.map((item) => ({
    ...item,
    share: total > 0 ? item.value / total : 0,
  }))
}

function emptyUniverse(): FciMarketUniverse {
  return {
    clases: 0,
    fondos: 0,
    gestoras: 0,
    patrimonio: 0,
    withHoldings: 0,
    byType: [],
    byCurrency: [],
    byManager: [],
    byFund: [],
    returnsByType: [],
    bankSplit: {
      bancos: 0,
      independientes: 0,
      bancosShare: 0,
      independientesShare: 0,
      byType: [],
    },
    holdingsByKind: [],
    topHoldings: [],
  }
}

export function buildFciMarketUniverse(
  funds: FciFundDetail[],
  currency: MarketCurrencyFilter = 'all',
): FciMarketUniverse {
  const filtered = funds.filter((row) => {
    if (!row.nombre?.trim()) return false
    if (currency === 'all') return true
    return normalizeCurrencyCode(row.monedaInversion || row.moneda) === currency
  })

  if (!filtered.length) return emptyUniverse()

  const patrimonio = sumFinite(filtered.map((row) => row.patrimonio))
  const fondoKeys = new Set<string>()
  const gestoras = new Set<string>()

  const typeMap = new Map<string, { label: string; value: number; count: number }>()
  const currencyMap = new Map<string, { label: string; value: number; count: number }>()
  const managerMap = new Map<
    string,
    { label: string; value: number; count: number; fondos: Set<string>; kind: ManagerKind }
  >()
  const fundMap = new Map<
    string,
    {
      fondo: string
      primaryFondo: string
      primaryAum: number
      tipo: string
      value: number
      count: number
    }
  >()
  const typeReturns = new Map<
    string,
    {
      label: string
      patrimonio: number
      items1d: Array<{ value: number | null; weight: number }>
      items30d: Array<{ value: number | null; weight: number }>
      itemsYtd: Array<{ value: number | null; weight: number }>
      itemsTna: Array<{ value: number | null; weight: number }>
    }
  >()
  const bankByType = new Map<string, { label: string; bancos: number; independientes: number }>()
  const holdingKindMap = new Map<string, { label: string; value: number; count: number }>()
  const holdingMap = new Map<
    string,
    { label: string; kind: HoldingKind; value: number; count: number }
  >()

  let bancos = 0
  let independientes = 0
  let withHoldings = 0

  for (const fondo of filtered) {
    const aum = fondo.patrimonio != null && Number.isFinite(fondo.patrimonio) ? fondo.patrimonio : 0
    const parsed = parseFundClassName(fondo.nombre)
    const fundKey = fondo.fondoId?.trim() || parsed.groupKey || fondo.nombre
    const type = typeInfo(fondo.tipoRenta)
    const currencyCode = normalizeCurrencyCode(fondo.monedaInversion || fondo.moneda)
    const manager = fondo.administradora?.trim() || 'Sin administradora'
    const managerKind = getManagerKind(manager)

    fondoKeys.add(fundKey)
    if (fondo.administradora?.trim()) gestoras.add(fondo.administradora.trim())

    const typeBucket = typeMap.get(type.key) ?? { label: type.label, value: 0, count: 0 }
    typeBucket.value += aum
    typeBucket.count += 1
    typeMap.set(type.key, typeBucket)

    const currencyBucket = currencyMap.get(currencyCode) ?? {
      label: currencyCode,
      value: 0,
      count: 0,
    }
    currencyBucket.value += aum
    currencyBucket.count += 1
    currencyMap.set(currencyCode, currencyBucket)

    const managerBucket = managerMap.get(manager) ?? {
      label: shortManagerName(manager),
      value: 0,
      count: 0,
      fondos: new Set<string>(),
      kind: managerKind,
    }
    managerBucket.value += aum
    managerBucket.count += 1
    managerBucket.fondos.add(fundKey)
    managerMap.set(manager, managerBucket)

    const fundBucket = fundMap.get(fundKey)
    if (!fundBucket) {
      fundMap.set(fundKey, {
        fondo: parsed.baseName || fondo.nombre,
        primaryFondo: fondo.nombre,
        primaryAum: aum,
        tipo: type.label,
        value: aum,
        count: 1,
      })
    } else {
      fundBucket.value += aum
      fundBucket.count += 1
      if (aum > fundBucket.primaryAum) {
        fundBucket.primaryFondo = fondo.nombre
        fundBucket.primaryAum = aum
        fundBucket.tipo = type.label
      }
    }

    const returnsBucket = typeReturns.get(type.key) ?? {
      label: type.label,
      patrimonio: 0,
      items1d: [],
      items30d: [],
      itemsYtd: [],
      itemsTna: [],
    }
    returnsBucket.patrimonio += aum
    returnsBucket.items1d.push({
      value: fondo.rendimientos?.variacionDiariaPct ?? null,
      weight: aum,
    })
    returnsBucket.items30d.push({ value: fondo.rendimientos?.unMes ?? null, weight: aum })
    returnsBucket.itemsYtd.push({ value: fondo.rendimientos?.enElAnio ?? null, weight: aum })
    const tnaSource =
      type.key === 'mercadoDinero' && fondo.rendimientos?.variacionDiariaPct != null
        ? (fondo.rendimientos.variacionDiariaPct * 365) / 100
        : null
    returnsBucket.itemsTna.push({ value: tnaSource, weight: aum })
    typeReturns.set(type.key, returnsBucket)

    if (managerKind === 'banco') bancos += aum
    else independientes += aum

    const bankTypeBucket = bankByType.get(type.key) ?? {
      label: type.label,
      bancos: 0,
      independientes: 0,
    }
    if (managerKind === 'banco') bankTypeBucket.bancos += aum
    else bankTypeBucket.independientes += aum
    bankByType.set(type.key, bankTypeBucket)

    if (aum > 0 && fondo.composicionCartera?.length) {
      withHoldings += 1
      for (const item of fondo.composicionCartera) {
        if (!item.nombre?.trim() || item.porcentaje == null || !Number.isFinite(item.porcentaje)) {
          continue
        }
        const weight = aum * (item.porcentaje / 100)
        if (!(weight > 0)) continue
        const kind = classifyHolding(item.nombre)
        const kindBucket = holdingKindMap.get(kind) ?? {
          label: HOLDING_KIND_LABELS[kind],
          value: 0,
          count: 0,
        }
        kindBucket.value += weight
        kindBucket.count += 1
        holdingKindMap.set(kind, kindBucket)

        const holdingKey = item.nombre.trim()
        const holdingBucket = holdingMap.get(holdingKey) ?? {
          label: holdingKey,
          kind,
          value: 0,
          count: 0,
        }
        holdingBucket.value += weight
        holdingBucket.count += 1
        holdingMap.set(holdingKey, holdingBucket)
      }
    }
  }

  const bankTotal = bancos + independientes

  const byType = toShares(
    [...typeMap.entries()]
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => b.value - a.value),
    patrimonio,
  )

  return {
    clases: filtered.length,
    fondos: fondoKeys.size,
    gestoras: gestoras.size,
    patrimonio,
    withHoldings,
    byType,
    byCurrency: toShares(
      [...currencyMap.entries()]
        .map(([key, item]) => ({ key, ...item }))
        .sort((a, b) => b.value - a.value),
      patrimonio,
    ),
    byManager: toShares(
      [...managerMap.entries()]
        .map(([key, item]) => ({
          key,
          label: item.label,
          value: item.value,
          count: item.count,
          fondos: item.fondos.size,
          kind: item.kind,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20),
      patrimonio,
    ),
    byFund: toShares(
      [...fundMap.entries()]
        .map(([key, item]) => ({
          key,
          label: item.fondo,
          fondo: item.fondo,
          primaryFondo: item.primaryFondo,
          tipo: item.tipo,
          value: item.value,
          count: item.count,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15),
      patrimonio,
    ),
    returnsByType: [...typeReturns.entries()]
      .map(([key, item]) => ({
        key,
        label: item.label,
        patrimonio: item.patrimonio,
        retorno1d: weightedAverage(item.items1d),
        retorno30d: weightedAverage(item.items30d),
        retornoYtd: weightedAverage(item.itemsYtd),
        tna: weightedAverage(item.itemsTna),
      }))
      .sort((a, b) => b.patrimonio - a.patrimonio),
    bankSplit: {
      bancos,
      independientes,
      bancosShare: bankTotal > 0 ? bancos / bankTotal : 0,
      independientesShare: bankTotal > 0 ? independientes / bankTotal : 0,
      byType: [...bankByType.entries()]
        .map(([key, item]) => {
          const total = item.bancos + item.independientes
          return {
            key,
            label: item.label,
            bancos: item.bancos,
            independientes: item.independientes,
            bancosShare: total > 0 ? item.bancos / total : 0,
            industryBancosShare: bankTotal > 0 ? bancos / bankTotal : 0,
          }
        })
        .sort((a, b) => b.bancos + b.independientes - (a.bancos + a.independientes)),
    },
    holdingsByKind: toShares(
      [...holdingKindMap.entries()]
        .map(([key, item]) => ({ key, ...item }))
        .sort((a, b) => b.value - a.value),
      sumFinite([...holdingKindMap.values()].map((item) => item.value)),
    ),
    topHoldings: toShares(
      [...holdingMap.values()]
        .filter((item) => item.kind !== 'otros')
        .sort((a, b) => b.value - a.value)
        .slice(0, 12)
        .map((item) => ({
          key: item.label,
          label: item.label,
          kind: item.kind,
          value: item.value,
          count: item.count,
        })),
      patrimonio,
    ),
  }
}

export function buildFciMarketSnapshot(response: FciFundsDetailsResponse): FciMarketSnapshot {
  const funds = response.fondos ?? []
  const dates = funds.map((fondo) => fondo.fecha).filter((fecha): fecha is string => Boolean(fecha))
  dates.sort()

  return {
    fechaActualizacion: response.fechaActualizacion ?? null,
    asOf: dates.at(-1) ?? null,
    universes: {
      all: buildFciMarketUniverse(funds, 'all'),
      ARS: buildFciMarketUniverse(funds, 'ARS'),
      USD: buildFciMarketUniverse(funds, 'USD'),
    },
  }
}
