import type { AlternativaFal } from '~/lib/finance/fal'

interface AlternativasFalResponse {
  fechaActualizacion: string
  alternativas: AlternativaFal[]
  erroresExtraccion?: Array<{ fuente: string; error: string }>
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
      erroresExtraccion: response.erroresExtraccion ?? [],
    }
  })

  const alternativas = computed(() => data.value?.alternativas ?? [])
  const fechaActualizacion = computed(() => data.value?.fechaActualizacion ?? null)
  const erroresExtraccion = computed(() => data.value?.erroresExtraccion ?? [])

  return {
    alternativas,
    fechaActualizacion,
    erroresExtraccion,
    loading,
    error,
    fetch,
  }
}
