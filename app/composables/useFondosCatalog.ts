import { getFundTypeInfo, type FundType } from '~/lib/mappings/funds'
import {
  getComparatasasReturnPercent,
  getComparatasasTnaAndTea,
} from '~/lib/finance/fci-comparatasas-returns'
import { sanitizeAnnualizedReturnPercent } from '~/lib/finance/fci-history-returns'
import {
  fetchFciFundsCatalog,
  type FciFundDetail,
  type FciFundsDetailsResponse,
} from '~/composables/useFciFundDetails'

export interface FundCatalogRow {
  fondo: string
  fondoId: string | null
  claseId: string | null
  tipoFondo?: FundType
  typeLabel: string
  tipoFilterKey?: string
  tipoRenta: string | null
  horizonte: string | null
  administradora: string | null
  depositaria: string | null
  tna: number | null
  tea: number | null
  vcp: number | null
  patrimonio: number | null
  inversionMinima: number | null
  monedaInversion: string | null
  plazoLiquidacionDias: number | null
  region: string | null
  fecha: string | null
}

function hasComparatasasReturn(fund: FciFundDetail) {
  const rendimientos = fund.rendimientos
  if (!rendimientos) return false

  if (fund.tipoRenta === 'Mercado de Dinero') {
    return rendimientos.unMes != null || rendimientos.ultimos7Dias != null
  }

  return rendimientos.unMes != null
}

export function mapCatalogToRows(response: FciFundsDetailsResponse): FundCatalogRow[] {
  return (response.fondos ?? [])
    .filter((fund) => Boolean(fund.nombre?.trim()))
    .map((fund) => {
      const typeInfo = getFundTypeInfo(fund.tipoRenta)
      const typeLabel = typeInfo?.typeLabel ?? fund.tipoRenta ?? '—'
      const tipoFilterKey = typeInfo?.type ?? fund.tipoRenta ?? undefined

      let tna: number | null = null
      let tea: number | null = null

      if (hasComparatasasReturn(fund) && fund.rendimientos) {
        const returnPercent = sanitizeAnnualizedReturnPercent(
          getComparatasasReturnPercent(fund.rendimientos, fund.tipoRenta ?? ''),
        )

        if (returnPercent != null) {
          const rates = getComparatasasTnaAndTea(returnPercent)
          tna = rates.tna
          tea = rates.tea
        }
      }

      return {
        fondo: fund.nombre,
        fondoId: fund.fondoId ?? null,
        claseId: fund.claseId ?? null,
        tipoFondo: typeInfo?.type,
        typeLabel,
        tipoFilterKey,
        tipoRenta: fund.tipoRenta,
        horizonte: fund.horizonte,
        administradora: fund.administradora,
        depositaria: fund.depositaria,
        tna,
        tea,
        vcp: fund.rendimientos?.valorCuotaparte ?? null,
        patrimonio: fund.patrimonio,
        inversionMinima: fund.inversionMinima,
        monedaInversion: fund.monedaInversion,
        plazoLiquidacionDias: fund.plazoLiquidacionDias,
        region: fund.region,
        fecha: fund.fecha,
      }
    })
}

export function useFondosCatalog() {
  const {
    data: allFunds,
    pending: loading,
    error,
    refresh,
  } = useAsyncData(
    'fci-funds-catalog',
    async () => mapCatalogToRows(await fetchFciFundsCatalog()),
    {
      default: () => [] as FundCatalogRow[],
    },
  )

  return {
    allFunds,
    loading,
    error,
    refresh,
  }
}
