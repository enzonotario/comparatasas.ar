import type { ComisionBrokerApi } from '~/lib/finance/comision-caucion-broker'

interface ComisionesBrokersResponse {
  fechaActualizacion: string
  comisiones: ComisionBrokerApi[]
}

const API_URL = 'https://api.argentinadatos.com/v1/finanzas/brokers/comisiones/'

export function useComisionesBrokers() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('comisiones-brokers', async () => {
    const response = await $fetch<ComisionesBrokersResponse>(API_URL)
    return {
      comisiones: response.comisiones ?? [],
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
