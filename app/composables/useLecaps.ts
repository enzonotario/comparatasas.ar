/** Respuesta de `/v1/finanzas/letras` (ArgentinaDatos / Docta). */

function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Días calendario hasta el vencimiento (ISO `yyyy-MM-dd`), desde hoy local. */
export function diasAlVencimientoLetra(fechaVencimiento: string): number {
  const [y, m, d] = fechaVencimiento.split('-').map(Number)
  const vto = startOfLocalDay(new Date(y!, m! - 1, d!))
  const hoy = startOfLocalDay(new Date())
  return Math.max(0, Math.round((vto.getTime() - hoy.getTime()) / 86_400_000))
}

export interface LetraRow {
  ticker: string
  precioArs: number
  tnaPorcentaje: number
  teaPorcentaje: number
  temPorcentaje: number
  fechaVencimiento: string
  diasAlVencimiento?: number
  variacionPorcentaje?: number
  paridadPorcentaje?: number
  volumen?: number
}

export interface LetrasPayload {
  /** ISO 8601 en UTC (sufijo `Z`). */
  fechaActualizacion: string
  letras: LetraRow[]
  errorExtraccion?: string
}

export type LecapTipo = 'LECAP' | 'BONCAP'

export interface LecapItem {
  institution: string
  symbol: string
  /** Precio por 100 VN (fuente). */
  price: number
  days: number
  maturity: string
  /** TNA mercado decimal. */
  tna: number
  /** TEA mercado decimal (alias histórico `tir`). */
  tir: number
  tea: number
  /** TEM mercado decimal. */
  tem: number
  type: LecapTipo
  typeLabel: string
  variacionPorcentaje?: number
  paridadPorcentaje?: number
  volumen?: number
  url: string
}

function tipoDesdeTicker(ticker: string): LecapTipo {
  return ticker.startsWith('T') ? 'BONCAP' : 'LECAP'
}

export function useLecaps() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('lecaps', () =>
    $fetch<LetrasPayload>('https://api.argentinadatos.com/v1/finanzas/letras'),
  )

  const lecaps = computed(() => data.value?.letras ?? [])

  const lecapsItems = computed<LecapItem[]>(() =>
    lecaps.value.map((letra) => {
      const days =
        letra.diasAlVencimiento ?? diasAlVencimientoLetra(letra.fechaVencimiento)
      const type = tipoDesdeTicker(letra.ticker)
      const tna = letra.tnaPorcentaje / 100
      const tir = letra.teaPorcentaje / 100
      const tem = letra.temPorcentaje / 100

      return {
        institution: letra.ticker,
        symbol: letra.ticker,
        price: letra.precioArs,
        days,
        maturity: letra.fechaVencimiento,
        tna,
        tir,
        tea: tir,
        tem,
        type,
        typeLabel: type,
        variacionPorcentaje: letra.variacionPorcentaje,
        paridadPorcentaje: letra.paridadPorcentaje,
        volumen: letra.volumen,
        url: `https://www.google.com/search?q=${letra.ticker}+cotizacion+argentina`,
      }
    }),
  )

  return {
    data,
    lecaps,
    lecapsItems,
    loading,
    error,
    fetch,
  }
}
