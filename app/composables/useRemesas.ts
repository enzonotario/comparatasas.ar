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
  costoRecibirPagos: string
  costoMantenimientoTarjeta: string
  costoTarjeta: string
  retiroArs: string
  detalles?: RemesaDetalles | null
  calificacionAndroid: number
  calificacionIos: number
}

interface RemesasResponse {
  fechaActualizacion: string
  remesas: RemesaOption[]
}

const remesas = ref<RemesaOption[]>([])
const fechaActualizacion = ref<string | null>(null)
const loading = ref(false)
const error = ref<unknown>(null)

export function useRemesas() {
  async function fetch(force = false): Promise<RemesaOption[]> {
    if (loading.value) return remesas.value
    if (!force && remesas.value.length > 0) return remesas.value

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<RemesasResponse>(
        'https://api.argentinadatos.com/v1/finanzas/remesas',
      )
      remesas.value = response.remesas ?? []
      fechaActualizacion.value = response.fechaActualizacion ?? null
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }

    return remesas.value
  }

  return {
    remesas,
    fechaActualizacion,
    loading,
    error,
    fetch,
  }
}
