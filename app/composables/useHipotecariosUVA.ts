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

const data = ref<HipotecarioUVA[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function useHipotecariosUVA() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<HipotecarioUVAApiResponse[]>(
        'https://api.argentinadatos.com/v1/finanzas/creditos/hipotecariosUva/',
      )
      // Mapear la respuesta de la API al formato interno
      // La API devuelve tna como decimal (0.06), lo convertimos a porcentaje (6)
      data.value = response.map((item) => ({
        entidad: item.entidad,
        nombreComercial: item.nombreComercial,
        tna: item.tna * 100,
        metadata: item.metadata,
      }))
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

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
