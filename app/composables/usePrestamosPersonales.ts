import { bestRatesFromTasasPorPlazo } from '~/lib/finance/prestamo-personal'

export interface PrestamoPersonalRangoTasa {
  min: number | null
  max: number | null
}

export interface PrestamoPersonalRango {
  tna?: PrestamoPersonalRangoTasa
  tea?: PrestamoPersonalRangoTasa
  cftTea?: PrestamoPersonalRangoTasa
}

export interface PrestamoPersonalTasaPorPlazo {
  plazoMinMeses?: number
  plazoMaxMeses?: number
  tna?: number | null
  tea?: number | null
  cftTea?: number | null
}

export interface PrestamoPersonalMetadata {
  afectacionIngresos?: string
  cftTeaSinIva?: number
  plazoMesesEjemplo?: number
  plazoMinMeses?: number
  plazoMinDias?: number
  plazoMaxMeses?: number
  /** Intervalo de tasas cuando la entidad no fija una sola (p. ej. Mercado Pago, Ualá). */
  rango?: PrestamoPersonalRango
  /** Tasas por tramo de plazo (p. ej. Macro). Valores en % tras el mapeo desde la API. */
  tasasPorPlazo?: PrestamoPersonalTasaPorPlazo[]
  [key: string]: unknown
}

export interface PrestamoPersonal {
  entidad: string
  nombreComercial: string
  producto: string
  tna: number | null
  tea: number | null
  cftTna: number | null
  cftTea: number | null
  tipoTasa: string
  moneda: string
  requiereCliente: boolean | null
  condiciones: string | null
  enlace: string
  vigenciaDesde: string | null
  vigenciaHasta: string | null
  metadata?: PrestamoPersonalMetadata
}

interface PrestamoPersonalApiResponse {
  entidad: string
  nombreComercial: string
  producto: string
  tna: number | null
  tea: number | null
  cftTna: number | null
  cftTea: number | null
  tipoTasa: string
  moneda: string
  requiereCliente: boolean | null
  condiciones: string | null
  enlace: string
  vigenciaDesde: string | null
  vigenciaHasta: string | null
  metadata?: PrestamoPersonalMetadata
}

function toPct(value: number | null | undefined): number | null {
  return value == null ? null : value * 100
}

function rangoAPct(rango?: PrestamoPersonalRangoTasa): PrestamoPersonalRangoTasa | undefined {
  if (!rango) return undefined
  return {
    min: toPct(rango.min),
    max: toPct(rango.max),
  }
}

function sortKey(item: PrestamoPersonal): number {
  if (item.cftTea != null) return item.cftTea
  if (item.tna != null) return item.tna
  return Number.POSITIVE_INFINITY
}

export function usePrestamosPersonales() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('prestamos-personales', async () => {
    const response = await $fetch<PrestamoPersonalApiResponse[]>(
      'https://api.argentinadatos.com/v1/finanzas/creditos/prestamosPersonales/',
    )

    return response.map((item) => {
      const tasasPorPlazo = item.metadata?.tasasPorPlazo?.map((tramo) => ({
        ...tramo,
        tna: toPct(tramo.tna ?? null),
        tea: toPct(tramo.tea ?? null),
        cftTea: toPct(tramo.cftTea ?? null),
      }))

      const bestFromTramos = bestRatesFromTasasPorPlazo(tasasPorPlazo)

      return {
        ...item,
        tna: bestFromTramos?.tna ?? toPct(item.tna),
        tea: bestFromTramos?.tea ?? toPct(item.tea),
        cftTna: toPct(item.cftTna),
        cftTea: bestFromTramos?.cftTea ?? toPct(item.cftTea),
        metadata: item.metadata
          ? {
              ...item.metadata,
              cftTeaSinIva:
                item.metadata.cftTeaSinIva != null ? item.metadata.cftTeaSinIva * 100 : undefined,
              rango: item.metadata.rango
                ? {
                    tna: rangoAPct(item.metadata.rango.tna),
                    tea: rangoAPct(item.metadata.rango.tea),
                    cftTea: rangoAPct(item.metadata.rango.cftTea),
                  }
                : undefined,
              tasasPorPlazo,
            }
          : undefined,
      }
    })
  })

  const prestamosPersonales = computed(() => {
    return [...(data.value ?? [])].sort((a, b) => sortKey(a) - sortKey(b))
  })

  return {
    prestamosPersonales,
    loading,
    error,
    fetch,
  }
}
