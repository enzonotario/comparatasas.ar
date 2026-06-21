export interface RemesaDetalles {
  cuentaPropia?: string
  inversiones?: string
  tarjetaUsa?: string
  costoRecibirPagos?: string
  costoMantenimientoTarjeta?: string
  costoTarjeta?: string
  retiroArs?: string
}

export interface RemesaOption {
  compania: string
  cuentaPropia: boolean
  moneda: 'FIAT' | 'CRIPTO' | string
  inversiones: boolean
  tarjetaUsa: boolean
  costoRecibirPagos: string | null
  costoMantenimientoTarjeta: string | null
  costoTarjeta: string | null
  retiroArs: string | null
  detalles?: RemesaDetalles | null
  calificacionAndroid: number | null
  calificacionIos: number | null
}

interface RemesasResponse {
  fechaActualizacion: string
  remesas: RemesaOption[]
}

export function useRemesas() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('remesas', async () => {
    const response = await $fetch<RemesasResponse>(
      'https://api.argentinadatos.com/v1/finanzas/remesas',
    )
    return {
      remesas: response.remesas ?? [],
      fechaActualizacion: response.fechaActualizacion ?? null,
    }
  })

  const remesas = computed(() => data.value?.remesas ?? [])
  const fechaActualizacion = computed(() => data.value?.fechaActualizacion ?? null)

  return {
    remesas,
    fechaActualizacion,
    loading,
    error,
    fetch,
  }
}
