import { getFundTypeInfo, type FundType } from './mappings/funds'
import {
  getComparatasasReturnPercent,
  getComparatasasTnaAndTea,
  hasComparatasasRendimientos,
} from './finance/fci-comparatasas-returns'
import { sanitizeAnnualizedReturnPercent } from './finance/fci-history-returns'
import { lookupStaticNominalTna, type StaticNominalTnaFile } from './fci-static-nominal-tna'
import type { FciFundDetail, FciFundsDetailsResponse } from '../composables/useFciFundDetails'

// Pure module (no Vue/Nuxt auto-imports) so Nitro server routes can use it.

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
  /** Variación diaria CNV (%). */
  retorno1d: number | null
  /** Retorno ~30d rolling (%). API `unMes` (CNV mes solo si falta histórico). */
  retorno30d: number | null
  /** Retorno en el año / YTD CNV (%). */
  retornoYtd: number | null
  vcp: number | null
  patrimonio: number | null
  inversionMinima: number | null
  moneda: string | null
  monedaInversion: string | null
  plazoLiquidacionDias: number | null
  region: string | null
  fecha: string | null
}

function hasComparatasasReturn(fund: FciFundDetail) {
  return hasComparatasasRendimientos(fund.rendimientos)
}

export function mapCatalogToRows(
  response: FciFundsDetailsResponse,
  staticTna?: StaticNominalTnaFile | null,
): FundCatalogRow[] {
  return (response.fondos ?? [])
    .filter((fund) => Boolean(fund.nombre?.trim()))
    .map((fund) => {
      const typeInfo = getFundTypeInfo(fund.tipoRenta)
      const typeLabel = typeInfo?.typeLabel ?? fund.tipoRenta ?? '—'
      const tipoFilterKey = typeInfo?.type ?? fund.tipoRenta ?? undefined

      let tna: number | null = null
      let tea: number | null = null

      const staticEntry = lookupStaticNominalTna(staticTna, fund.nombre)
      if (staticEntry) {
        tna = staticEntry.tna
        tea = staticEntry.tea
      } else if (hasComparatasasReturn(fund) && fund.rendimientos) {
        const returnPercent = sanitizeAnnualizedReturnPercent(
          getComparatasasReturnPercent(fund.rendimientos, fund.tipoRenta ?? ''),
        )

        if (returnPercent != null) {
          const rates = getComparatasasTnaAndTea(returnPercent, fund.tipoRenta ?? '')
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
        retorno1d: fund.rendimientos?.variacionDiariaPct ?? null,
        retorno30d: fund.rendimientos?.unMes ?? null,
        retornoYtd: fund.rendimientos?.enElAnio ?? null,
        vcp: fund.rendimientos?.valorCuotaparte ?? null,
        patrimonio: fund.patrimonio,
        inversionMinima: fund.inversionMinima,
        moneda: fund.moneda,
        monedaInversion: fund.monedaInversion,
        plazoLiquidacionDias: fund.plazoLiquidacionDias,
        region: fund.region,
        fecha: fund.fecha,
      }
    })
}

export interface FundTipoOption {
  value: string
  label: string
}

/** Distinct fund types present in the catalog (for the /fondos sidebar filter). */
export function listFundTipoOptions(rows: FundCatalogRow[]): FundTipoOption[] {
  const map = new Map<string, string>()
  for (const row of rows) {
    if (!row.tipoFilterKey) continue
    map.set(row.tipoFilterKey, row.typeLabel)
  }

  return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.label.localeCompare(b.label, 'es'),
  )
}
