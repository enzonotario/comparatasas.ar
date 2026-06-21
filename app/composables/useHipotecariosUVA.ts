export interface HipotecarioUVAMetadata {
  plazo_max_anios?: number
  relacion_cuota_ingreso?: string
  financiamiento?: string
}

export interface HipotecarioUVA {
  entidad: string
  nombreComercial: string
  tna: number
  metadata?: HipotecarioUVAMetadata
}

interface HipotecarioUVAApiResponse {
  entidad: string
  nombreComercial: string
  tna: number
  metadata?: HipotecarioUVAMetadata
}

export function useHipotecariosUVA() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('hipotecarios-uva', async () => {
    const response = await $fetch<HipotecarioUVAApiResponse[]>(
      'https://api.argentinadatos.com/v1/finanzas/creditos/hipotecariosUva/',
    )
    return response.map((item) => ({
      entidad: item.entidad,
      nombreComercial: item.nombreComercial,
      tna: item.tna * 100,
      metadata: item.metadata,
    }))
  })

  const hipotecariosUVA = computed(() => {
    return (data.value ?? []).sort((a, b) => a.tna - b.tna)
  })

  return {
    hipotecariosUVA,
    loading,
    error,
    fetch,
  }
}
