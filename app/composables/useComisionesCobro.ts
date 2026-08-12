export type CanalCobro = 'pos' | 'qr' | 'link' | 'checkout' | 'online' | 'otro'
export type MedioPagoCobro =
  | 'debito'
  | 'credito'
  | 'credito_cuotas'
  | 'qr_cuenta'
  | 'prepaga'
  | 'amex'
  | 'otro'
export type AcreditacionTipo = 'inmediata' | 'anticipada' | 'estandar' | 'desconocida'

export interface ComisionCobroOption {
  entidad: string
  nombreComercial: string
  producto: string
  canal: CanalCobro | string
  medioPago: MedioPagoCobro | string
  arancel: number | null
  arancelEsTope: boolean
  incluyeIva: boolean
  ivaAdicional: boolean
  acreditacionTipo: AcreditacionTipo | string
  acreditacionPlazoHabiles: number | null
  acreditacionLabel: string | null
  moneda: string
  condiciones: string | null
  enlace: string | null
  vigenciaDesde: string | null
  vigenciaHasta: string | null
  metadata?: Record<string, unknown> | null
  /** Porcentaje para UI (arancel * 100). */
  arancelPorcentaje: number | null
}

interface ComisionesCobroResponse {
  fechaActualizacion: string
  comisiones: Array<Omit<ComisionCobroOption, 'arancelPorcentaje'>>
}

function mapComision(
  item: Omit<ComisionCobroOption, 'arancelPorcentaje'>,
): ComisionCobroOption {
  return {
    ...item,
    arancelPorcentaje:
      typeof item.arancel === 'number' ? Number((item.arancel * 100).toFixed(4)) : null,
  }
}

export function useComisionesCobro() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('comisiones-cobro', async () => {
    const response = await $fetch<ComisionesCobroResponse>(
      'https://api.argentinadatos.com/v1/finanzas/cobros/comisiones/',
    )

    return {
      comisiones: (response.comisiones ?? []).map(mapComision),
      fechaActualizacion: response.fechaActualizacion ?? null,
    }
  })

  const comisiones = computed(() => data.value?.comisiones ?? [])
  const fechaActualizacion = computed(() => data.value?.fechaActualizacion ?? null)

  return {
    comisiones,
    fechaActualizacion,
    loading,
    error,
    fetch,
  }
}
