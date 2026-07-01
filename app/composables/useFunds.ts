import {
  getFundMapping,
  getFundMappingBySlug,
  comparatasasFondos,
  getFundTypeInfo,
  type FundInstitution,
  type FundType,
} from '../lib/mappings/funds'
import { getInstitutionLogo, getInstitutionUrl } from '../lib/mappings/institutions'
import { getLogoForEntity } from '../lib/mappings/logos'
import {
  getComparatasasReturnPercent,
  getComparatasasTnaAndTea,
} from '../lib/finance/fci-comparatasas-returns'
import type { ProcessedFund } from '../types/investments'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getProcessedFundTypeInfo(
  fondo: FciComparatasasResponse['fondos'][number],
  inst: FundInstitution,
) {
  if (inst.showInUsdMoneyMarket) {
    return { type: 'mercadoDineroUsd' as const, typeLabel: 'Money Market' }
  }

  if (inst.showInUsdHighRisk) {
    return { type: 'rentaFijaUsdHighRisk' as const, typeLabel: 'Retorno Total' }
  }

  if (inst.showInUsdFunds) {
    return { type: 'rentaFijaUsd' as const, typeLabel: 'Renta Fija' }
  }

  return getFundTypeInfo(fondo.tipoRenta)
}

function getFundTypeInfoFromRaw(l: FundRaw, inst: FundInstitution) {
  if (inst.showInUsdMoneyMarket) {
    return { type: 'mercadoDineroUsd' as const, typeLabel: 'Money Market' }
  }

  if (inst.showInUsdHighRisk) {
    return { type: 'rentaFijaUsdHighRisk' as const, typeLabel: 'Retorno Total' }
  }

  if (inst.showInUsdFunds) {
    return { type: 'rentaFijaUsd' as const, typeLabel: 'Renta Fija' }
  }

  return getFundTypeInfo(l.tipoRenta)
}

interface FundRaw {
  fondo: string
  horizonte: string
  fecha: string
  vcp: number
  ccp: number
  patrimonio: number
  tipoRenta?: string | null
}

export interface FundSeriesLatestRow extends FundRaw {
  tipoFondo: FundType
  type?: FundType
  typeLabel?: string
}

interface FciComparatasasResponse {
  fechaActualizacion: string
  fondos: Array<{
    fondoId: string
    claseId: string
    nombre: string
    fecha: string
    administradora: string
    depositaria: string
    tipoRenta: string
    tipoDD: string
    region: string
    benchmark: string
    horizonte: string
    duracion: string
    moneda: string
    codigoCNV: string
    patrimonio: number
    inversionMinima: number
    monedaInversion: string
    plazoLiquidacionDias: number
    rendimientos: {
      valorCuotaparte: number
      ultimos7Dias: number | null
      unMes: number | null
      noventaDias: number | null
      cientoOchentaDias: number | null
      enElAnio: number | null
      doceMeses: number | null
    }
    composicionCartera: Array<{
      nombre: string
      porcentaje: number
    }>
    calificaciones: Array<{
      calificadora: string
      calificacion: string
      fecha: string
    }>
    honorarios: Record<string, number | null>
    sociedades: Array<{
      tipo: string
      nombre: string
      logo?: string
    }>
  }>
}

interface Funds {
  rentaFija: ProcessedFund[]
  mercadoDinero: ProcessedFund[]
  rentaMixta: ProcessedFund[]
  rentaVariable: ProcessedFund[]
  retornoTotal: ProcessedFund[]
}

const defaultFundsData = (): Funds => ({
  rentaFija: [],
  mercadoDinero: [],
  rentaMixta: [],
  rentaVariable: [],
  retornoTotal: [],
})

function calculateReturns(newerVCP: number, olderVCP: number, daysBetween: number) {
  if (daysBetween <= 0 || olderVCP <= 0) return { tna: 0, tea: 0 }
  const totalReturn = (newerVCP - olderVCP) / olderVCP
  const dailyReturn = totalReturn / daysBetween
  const annualizedReturn = Math.pow(1 + dailyReturn, 365) - 1
  const tna = dailyReturn * 365
  const tea = annualizedReturn
  return { tna, tea }
}

function daysBetween(a: string, b: string) {
  const d1 = new Date(a)
  const d2 = new Date(b)
  return Math.abs(Math.round((+d1 - +d2) / (1000 * 60 * 60 * 24)))
}

function getFundsMap(latest: FundRaw[], previous: FundRaw[]) {
  return latest.flatMap((l) => {
    const p = previous!.find((x) => x.fondo === l.fondo)
    if (!p) return []

    const newerDate = new Date(l.fecha) > new Date(p.fecha) ? l.fecha : p.fecha
    const olderDate = new Date(l.fecha) > new Date(p.fecha) ? p.fecha : l.fecha
    const newerVCP = new Date(l.fecha) > new Date(p.fecha) ? l.vcp : p.vcp
    const olderVCP = new Date(l.fecha) > new Date(p.fecha) ? p.vcp : l.vcp
    const d = daysBetween(l.fecha, p.fecha)
    const { tna, tea } = calculateReturns(newerVCP, olderVCP, d)

    const mapping = getFundMapping(l.fondo)
    if (!mapping) return []

    return (mapping.institutions as FundInstitution[]).map((inst: FundInstitution) => ({
      fondo: l.fondo,
      institution: inst.institution,
      displayName: inst.displayName,
      tna,
      tea,
      fecha: newerDate,
      fechaAnterior: olderDate,
      dias: d,
      patrimonio: l.patrimonio,
      logo: getLogoForEntity(inst.institution) || getInstitutionLogo(inst.institution),
      url: inst.fundUrl || getInstitutionUrl(inst.institution),
      ...(getFundTypeInfoFromRaw(l, inst) ?? {}),
      meta: {
        showInFunds: inst.showInFunds || false,
        showInAccounts: inst.showInAccounts || false,
        showInUsdFunds: inst.showInUsdFunds || false,
        showInStockFunds: inst.showInStockFunds || false,
        showInUsdMoneyMarket: inst.showInUsdMoneyMarket || false,
        showInUsdHighRisk: inst.showInUsdHighRisk || false,
      },
    }))
  })
}

interface FetchFundsOptions {
  forceBySeries?: boolean
}

async function getLatestAndPreviousFundData(options?: FetchFundsOptions) {
  const appConfig = useAppConfig()
  const useBySeriesEndpoints =
    options?.forceBySeries || appConfig.features?.useFundsBySeriesEndpoint

  if (useBySeriesEndpoints) {
    const rentaFijaResponses = await getRentaFija()
    const mercadoDineroResponses = await getMercadoDinero()
    const rentaMixtaResponses = await getRentaMixta()
    const rentaVariableResponses = await getRentaVariable()
    const retornoTotalResponses = await getRetornoTotal()

    return {
      rentaFija: rentaFijaResponses,
      mercadoDinero: mercadoDineroResponses,
      rentaMixta: rentaMixtaResponses,
      rentaVariable: rentaVariableResponses,
      retornoTotal: retornoTotalResponses,
    }
  }

  return getComparatasasFundsData()
}

async function transformComparatasasData(
  fondos: FciComparatasasResponse['fondos'],
): Promise<ProcessedFund[]> {
  return fondos
    .filter((fondo) => {
      const slug = generateSlug(fondo.nombre)
      return comparatasasFondos.includes(slug)
    })
    .map((fondo) => {
      const slug = generateSlug(fondo.nombre)
      const mapping = getFundMapping(fondo.nombre) ?? getFundMappingBySlug(slug)
      const institutions = mapping?.institutions as FundInstitution[] | undefined

      if (!institutions) {
        return []
      }

      return institutions.map((inst: FundInstitution) => {
        const returnPercent = getComparatasasReturnPercent(fondo.rendimientos, fondo.tipoRenta)
        const { tna, tea } = getComparatasasTnaAndTea(returnPercent, fondo.tipoRenta)

        return {
          fondo: fondo.nombre,
          institution: inst.institution,
          displayName: inst.displayName,
          tna,
          tea,
          fecha: fondo.fecha,
          patrimonio: fondo.patrimonio,
          valorCuotaparte: fondo.rendimientos.valorCuotaparte,
          logo: getLogoForEntity(inst.institution) || getInstitutionLogo(inst.institution),
          url: inst.fundUrl || getInstitutionUrl(inst.institution),
          ...(getProcessedFundTypeInfo(fondo, inst) ?? {}),
          meta: {
            showInFunds: inst.showInFunds || false,
            showInAccounts: inst.showInAccounts || false,
            showInUsdFunds: inst.showInUsdFunds || false,
            showInStockFunds: inst.showInStockFunds || false,
            showInUsdMoneyMarket: inst.showInUsdMoneyMarket || false,
            showInUsdHighRisk: inst.showInUsdHighRisk || false,
          },
        }
      })
    })
    .flat()
}

function categorizeFunds(funds: ProcessedFund[]) {
  const categorized = {
    rentaFija: [] as ProcessedFund[],
    mercadoDinero: [] as ProcessedFund[],
    rentaMixta: [] as ProcessedFund[],
    rentaVariable: [] as ProcessedFund[],
    retornoTotal: [] as ProcessedFund[],
  }

  funds.forEach((fund) => {
    const fundType = fund.type

    if (fundType?.includes('rentaFija')) {
      categorized.rentaFija.push({
        ...fund,
        type: fund.type ?? 'rentaFija',
        typeLabel: fund.typeLabel ?? 'Renta Fija',
      })
    } else if (fundType?.includes('mercadoDinero')) {
      categorized.mercadoDinero.push({
        ...fund,
        type: fund.type ?? 'mercadoDinero',
        typeLabel: fund.typeLabel ?? 'Money Market',
      })
    } else if (fundType?.includes('rentaMixta')) {
      categorized.rentaMixta.push({
        ...fund,
        type: fund.type ?? 'rentaMixta',
        typeLabel: fund.typeLabel ?? 'Renta Mixta',
      })
    } else if (fundType?.includes('rentaVariable')) {
      categorized.rentaVariable.push({
        ...fund,
        type: fund.type ?? 'rentaVariable',
        typeLabel: fund.typeLabel ?? 'Renta Variable',
      })
    } else if (fundType?.includes('retornoTotal')) {
      categorized.retornoTotal.push({
        ...fund,
        type: fund.type ?? 'retornoTotal',
        typeLabel: fund.typeLabel ?? 'Retorno Total',
      })
    }
  })

  Object.keys(categorized).forEach((key) => {
    categorized[key as keyof typeof categorized].sort((a, b) => b.tna - a.tna)
  })

  return categorized
}

async function getComparatasasFundsData() {
  try {
    const response = await $fetch<FciComparatasasResponse>(
      'https://api.argentinadatos.com/v1/finanzas/fci/comparatasas',
    )

    if (!response?.fondos) {
      throw new Error('Invalid response from comparatasas endpoint')
    }

    if (process.env.NODE_ENV !== 'production') {
      const apiSlugs = new Set(response.fondos.map((f) => generateSlug(f.nombre)))
      const notFoundInApi = comparatasasFondos.filter((slug) => !apiSlugs.has(slug))

      if (notFoundInApi.length > 0) {
        console.log('[FCI Fondos] Slugs en mappings pero no encontrados en API:', notFoundInApi)
      }
    }

    const funds = await transformComparatasasData(response.fondos)

    return categorizeFunds(funds)
  } catch (error) {
    console.error('Error fetching comparatasas data:', error)
    throw error
  }
}

async function getRetornoTotal() {
  const { latest, previous } = await getLatestAndPreviousRetornoTotal()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'retornoTotal',
      typeLabel: fund.typeLabel ?? 'Retorno total',
    }))
}

type FundSeriesEndpoint = FundType
type FundSeriesType = FundType

const SERIES_LOOKBACK_DAYS = 30

async function getSeriesDataForDate(
  series: FundSeriesEndpoint,
  targetDate: Date,
  retriesLeft = 7,
): Promise<FundRaw[]> {
  if (retriesLeft <= 0) return []

  const targetDateString = targetDate.toISOString().split('T')[0].replace(/-/g, '/')

  try {
    const response = await $fetch<FundRaw[]>(
      `https://api.argentinadatos.com/v1/finanzas/fci/${series}/${targetDateString}`,
    )

    if (!response || response.length === 0) {
      throw new Error(`No data for date ${targetDateString}`)
    }

    return response
  } catch {
    const fallbackDate = new Date(targetDate)
    fallbackDate.setDate(fallbackDate.getDate() - 1)
    return await getSeriesDataForDate(series, fallbackDate, retriesLeft - 1)
  }
}

async function getLatestAndPreviousBySeries(series: FundSeriesEndpoint) {
  const latest = await $fetch<FundRaw[]>(
    `https://api.argentinadatos.com/v1/finanzas/fci/${series}/ultimo`,
  )

  const responses: Record<string, FundRaw[]> = {}
  const previous: FundRaw[] = []

  for (const fund of latest) {
    if (!fund.fecha) continue

    const today = new Date()
    const daysDiff = daysBetween(fund.fecha, today.toISOString().split('T')[0])
    if (daysDiff > SERIES_LOOKBACK_DAYS) continue

    const fundName = fund.fondo
    const targetDate = new Date(fund.fecha)
    targetDate.setDate(targetDate.getDate() - SERIES_LOOKBACK_DAYS)
    const targetDateString = targetDate.toISOString().split('T')[0].replace(/-/g, '/')

    let fundPrevious = responses[targetDateString]
    if (!fundPrevious) {
      try {
        fundPrevious = await getSeriesDataForDate(series, targetDate)
        responses[targetDateString] = fundPrevious
      } catch (e) {
        console.warn(`No data for date ${targetDateString}`, fund.fondo, e)
        fundPrevious = []
        responses[targetDateString] = fundPrevious
      }
    }

    if (fundPrevious && fundPrevious.length > 0) {
      // find the closest date before or equal to target date
      const sortedPrevious = fundPrevious
        .filter((f) => f.fondo === fundName && f.fecha && new Date(f.fecha) <= targetDate)
        .sort((a, b) => new Date(b.fecha!).getTime() - new Date(a.fecha!).getTime())

      if (sortedPrevious.length > 0) {
        previous.push(sortedPrevious[0])
      }
    }
  }

  return { latest, previous }
}

async function getLatestAndPreviousRetornoTotal() {
  return await getLatestAndPreviousBySeries('retornoTotal')
}

async function getMercadoDinero() {
  const { latest, previous } = await getLatestAndPreviousMercadoDinero()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'mercadoDinero',
      typeLabel: fund.typeLabel ?? 'Money Market',
    }))
}

async function getLatestAndPreviousMercadoDinero() {
  return await getLatestAndPreviousBySeries('mercadoDinero')
}

async function getRentaMixta() {
  const { latest, previous } = await getLatestAndPreviousRentaMixta()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'rentaMixta',
      typeLabel: fund.typeLabel ?? 'Renta Mixta',
    }))
}

async function getLatestAndPreviousRentaMixta() {
  return await getLatestAndPreviousBySeries('rentaMixta')
}

async function getRentaVariable() {
  const { latest, previous } = await getLatestAndPreviousRentaVariable()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'rentaVariable',
      typeLabel: fund.typeLabel ?? 'Renta Variable',
    }))
}

async function getLatestAndPreviousRentaVariable() {
  return await getLatestAndPreviousBySeries('rentaVariable')
}

async function getRentaFija() {
  const { latest, previous } = await getLatestAndPreviousRentaFija()

  const funds = getFundsMap(latest, previous)

  return funds
    .sort((a, b) => b.tna - a.tna)
    .map((fund) => ({
      ...fund,
      type: fund.type ?? 'rentaFija',
      typeLabel: fund.typeLabel ?? 'Renta Fija',
    }))
}

async function getLatestAndPreviousRentaFija() {
  return await getLatestAndPreviousBySeries('rentaFija')
}

export async function fetchFundsSeriesLatest(): Promise<FundSeriesLatestRow[]> {
  const [rentaFija, mercadoDinero, rentaMixta, rentaVariable, retornoTotal] = await Promise.all([
    $fetch<FundRaw[]>('https://api.argentinadatos.com/v1/finanzas/fci/rentaFija/ultimo').catch(
      () => [],
    ),
    $fetch<FundRaw[]>('https://api.argentinadatos.com/v1/finanzas/fci/mercadoDinero/ultimo').catch(
      () => [],
    ),
    $fetch<FundRaw[]>('https://api.argentinadatos.com/v1/finanzas/fci/rentaMixta/ultimo').catch(
      () => [],
    ),
    $fetch<FundRaw[]>('https://api.argentinadatos.com/v1/finanzas/fci/rentaVariable/ultimo').catch(
      () => [],
    ),
    $fetch<FundRaw[]>('https://api.argentinadatos.com/v1/finanzas/fci/retornoTotal/ultimo').catch(
      () => [],
    ),
  ])

  const mapSeries = (funds: FundRaw[], tipoFondo: FundSeriesType): FundSeriesLatestRow[] =>
    funds.map((fund) => {
      const typeInfo = getFundTypeInfo(fund.tipoRenta, tipoFondo)

      return {
        ...fund,
        tipoFondo,
        type: typeInfo?.type,
        typeLabel: typeInfo?.typeLabel,
      }
    })

  return [
    ...mapSeries(rentaFija, 'rentaFija'),
    ...mapSeries(mercadoDinero, 'mercadoDinero'),
    ...mapSeries(rentaMixta, 'rentaMixta'),
    ...mapSeries(rentaVariable, 'rentaVariable'),
    ...mapSeries(retornoTotal, 'retornoTotal'),
  ]
}

export function useFunds() {
  const {
    data,
    pending: loading,
    error,
  } = useAsyncData('funds', () => getLatestAndPreviousFundData(), {
    default: defaultFundsData,
  })

  const allFundsCache = computed(() => [
    ...(data.value?.rentaFija ?? []),
    ...(data.value?.mercadoDinero ?? []),
    ...(data.value?.rentaMixta ?? []),
    ...(data.value?.rentaVariable ?? []),
    ...(data.value?.retornoTotal ?? []),
  ])

  async function fetch(options?: FetchFundsOptions) {
    if (options?.forceBySeries) {
      data.value = await getLatestAndPreviousFundData(options)
    }

    return data.value ?? defaultFundsData()
  }

  return { data, allFundsCache, loading, error, fetch, fetchFundsSeriesLatest }
}
