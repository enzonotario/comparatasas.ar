export interface FciFundReturns {
  valorCuotaparte: number | null
  ultimos7Dias: number | null
  unMes: number | null
  noventaDias: number | null
  cientoOchentaDias: number | null
  enElAnio: number | null
  doceMeses: number | null
}

export interface FciFundCompositionItem {
  nombre: string | null
  porcentaje: number | null
}

export interface FciFundRating {
  calificadora: string | null
  calificacion: string | null
  fecha: string | null
}

export interface FciFundFees {
  honorarioGerente: number | null
  honorarioDepositaria: number | null
  comisionIngreso: number | null
  comisionEgreso: number | null
  comisionTransferencia: number | null
  gastosOrdinariosGestion: number | null
  comisionExito: number | null
  otros: number | null
}

export interface FciFundSociety {
  tipo: string | null
  nombre: string | null
  logo: string | null
}

export interface FciFundDetail {
  fondoId: string
  claseId: string
  nombre: string
  fecha: string | null
  tipoRenta: string | null
  tipoDD: string | null
  region: string | null
  benchmark: string | null
  horizonte: string | null
  duracion: string | null
  moneda: string | null
  codigoCNV: string | null
  administradora: string | null
  depositaria: string | null
  patrimonio: number | null
  inversionMinima: number | null
  monedaInversion: string | null
  plazoLiquidacionDias: number | null
  rendimientos: FciFundReturns | null
  composicionCartera: FciFundCompositionItem[]
  calificaciones: FciFundRating[]
  honorarios: FciFundFees | null
  sociedades: FciFundSociety[]
}

export interface FciFundHistoryItem {
  slug: string
  fondoId: string | null
  claseId: string | null
  nombre: string
  fecha: string
  categoria: string | null
  categoriaKey: string | null
  horizonte: string | null
  valorCuotaparte: number | null
  patrimonio: number | null
  retornoDiario: number | null
  retornoAcumulado: number | null
  flujoEstimado: number | null
  origen: string
}

export interface FciFundHistory {
  fondoId: string
  claseId: string
  nombre: string
  fechaActualizacion: string
  historico: FciFundHistoryItem[]
}

export interface FciFundsDetailsResponse {
  fechaActualizacion: string
  fondos: FciFundDetail[]
}

export async function fetchFciFundDetail(slug: string) {
  return await $fetch<FciFundDetail>(
    `https://api.argentinadatos.com/v1/finanzas/fci/fondos/${slug}`,
  )
}

export async function fetchFciFundHistory(slug: string) {
  return await $fetch<FciFundHistory>(
    `https://api.argentinadatos.com/v1/finanzas/fci/fondos/${slug}/historico`,
  )
}
