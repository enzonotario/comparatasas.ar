export interface UVAData {
  fecha: string
  valor: number
}

const data = ref<UVAData[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function useUVA() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<UVAData[]>(
        'https://api.argentinadatos.com/v1/finanzas/indices/uva/',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const uvaHistorica = computed(() => {
    return data.value ?? []
  })

  const ultimoUVA = computed(() => {
    if (!data.value || data.value.length === 0) return null
    const ordenado = [...data.value].sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    })
    return ordenado[0]?.valor ?? null
  })

  const uvaPorFecha = computed(() => {
    const map = new Map<string, number>()
    ;(data.value ?? []).forEach((item) => {
      map.set(item.fecha, item.valor)
    })
    return map
  })

  const obtenerUVAPorFecha = (fecha: string): number | null => {
    const fechaKey = fecha.substring(0, 10)
    return uvaPorFecha.value.get(fechaKey) ?? null
  }

  return {
    uvaHistorica,
    ultimoUVA,
    uvaPorFecha,
    obtenerUVAPorFecha,
    loading,
    error,
    fetch,
  }
}
