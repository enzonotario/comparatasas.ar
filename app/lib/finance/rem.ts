/** Fila relevante del endpoint /v1/finanzas/rem/ultimo (Argentina Datos). */
export interface RemUltimoRowLike {
  muestra: string
  indicador: string
  periodo: string
  periodoTipo: string
  periodoDesde: string | null
  promedio: number
  mediana?: number
  informe?: string
  publicacionUrl?: string
}

/** Expectativa anual a 12 meses del último REM (IPC nivel general). */
export interface RemInflacionAnualEsperada {
  /** Mediana % i.a. (referencia BCRA / simuladores de riesgo). */
  medianaPercent: number
  promedioPercent: number
  informe: string | null
  publicacionUrl: string | null
}

const IPC_NIVEL_GENERAL = 'IPC nivel general'

function isIpcNivelGeneralTodos(row: RemUltimoRowLike): boolean {
  return (
    row.muestra === 'todos' &&
    typeof row.indicador === 'string' &&
    row.indicador.includes(IPC_NIVEL_GENERAL)
  )
}

export function extractRemProximos12Meses(
  rows: RemUltimoRowLike[],
): RemInflacionAnualEsperada | null {
  const row = rows.find((r) => isIpcNivelGeneralTodos(r) && r.periodoTipo === 'proximos_12_meses')
  if (!row) return null

  const mediana = row.mediana != null && Number.isFinite(row.mediana) ? row.mediana : row.promedio
  if (!Number.isFinite(mediana) || !Number.isFinite(row.promedio)) return null

  return {
    medianaPercent: mediana,
    promedioPercent: row.promedio,
    informe: row.informe ?? null,
    publicacionUrl: row.publicacionUrl ?? null,
  }
}
