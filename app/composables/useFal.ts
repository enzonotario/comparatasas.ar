import type { AlternativaFal } from '~/lib/finance/fal'

interface AlternativasFalResponse {
  fechaActualizacion: string
  alternativas: AlternativaFal[]
}

const API_URL = 'https://api.argentinadatos.com/v1/finanzas/fal/'

export function useFal() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('fal-alternativas', async () => {
    const response = await $fetch<AlternativasFalResponse>(API_URL)

    return {
      alternativas: response.alternativas ?? [],
      fechaActualizacion: response.fechaActualizacion ?? null,
    }
  })

  const alternativas = computed(() => data.value?.alternativas ?? [])
  const fechaActualizacion = computed(() => data.value?.fechaActualizacion ?? null)

  return {
    alternativas,
    fechaActualizacion,
    loading,
    error,
    fetch,
  }
}
