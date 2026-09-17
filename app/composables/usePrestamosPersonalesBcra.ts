import {
  curarPrestamosPersonalesBcra,
  mapPrestamoPersonalBcraApi,
  type PrestamoPersonalBcra,
  type PrestamoPersonalBcraApiItem,
} from '~/lib/finance/prestamos-personales-bcra'

export type { PrestamoPersonalBcra }

const API_URL = 'https://api.argentinadatos.com/v1/finanzas/creditos/prestamosPersonalesBcra/'

export function usePrestamosPersonalesBcra() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('prestamos-personales-bcra', async () => {
    const response = await $fetch<PrestamoPersonalBcraApiItem[]>(API_URL)
    return curarPrestamosPersonalesBcra(response).map(mapPrestamoPersonalBcraApi)
  })

  const prestamosPersonalesBcra = computed<PrestamoPersonalBcra[]>(() => data.value ?? [])

  return {
    prestamosPersonalesBcra,
    loading,
    error,
    fetch,
  }
}
