import {
  getFundMapping,
  getFundMappingBySlug,
  comparatasasFondos,
  getFundTypeInfo,
  type FundInstitution,
} from '../lib/mappings/funds'
import { getInstitutionLogo, getInstitutionUrl } from '../lib/mappings/institutions'
import { getLogoForEntity } from '../lib/mappings/logos'
import {
  getComparatasasReturnPercent,
  getComparatasasTnaAndTea,
} from '../lib/finance/fci-comparatasas-returns'
import type { ProcessedFund } from '../types/investments'
import type { StaticNominalTnaFile } from './useStaticNominalTna'
import { lookupStaticNominalTna } from './useStaticNominalTna'

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
      variacionDiariaPct?: number | null
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

async function transformComparatasasData(
  fondos: FciComparatasasResponse['fondos'],
  staticTna?: StaticNominalTnaFile | null,
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
        const staticEntry = lookupStaticNominalTna(staticTna, slug)
        const returnPercent =
          staticEntry?.estimate.value ??
          getComparatasasReturnPercent(fondo.rendimientos, fondo.tipoRenta)
        const { tna, tea } = staticEntry
          ? { tna: staticEntry.tna, tea: staticEntry.tea }
          : getComparatasasTnaAndTea(returnPercent, fondo.tipoRenta)

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
    const [response, staticTna] = await Promise.all([
      $fetch<FciComparatasasResponse>('https://api.argentinadatos.com/v1/finanzas/fci/comparatasas'),
      $fetch<StaticNominalTnaFile>('/api/fci/nominal-tna.json').catch(() => null),
    ])

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

    const funds = await transformComparatasasData(response.fondos, staticTna)

    return categorizeFunds(funds)
  } catch (error) {
    console.error('Error fetching comparatasas data:', error)
    throw error
  }
}

export function useFunds() {
  const {
    data,
    pending: loading,
    error,
    execute,
    status,
  } = useAsyncData('funds', () => getComparatasasFundsData(), {
    default: defaultFundsData,
  })

  const allFundsCache = computed(() => [
    ...(data.value?.rentaFija ?? []),
    ...(data.value?.mercadoDinero ?? []),
    ...(data.value?.rentaMixta ?? []),
    ...(data.value?.rentaVariable ?? []),
    ...(data.value?.retornoTotal ?? []),
  ])

  async function fetch() {
    if (status.value !== 'success') {
      await execute()
    }

    return data.value ?? defaultFundsData()
  }

  return { data, allFundsCache, loading, error, fetch }
}
