export interface InflacionData {
  fecha: string
  valor: number
}

const data = ref<InflacionData[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function useInflacion() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<InflacionData[]>(
        'https://api.argentinadatos.com/v1/finanzas/indices/inflacion/',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const inflacionHistorica = computed(() => {
    return data.value ?? []
  })

  const inflacionPorFecha = computed(() => {
    const map = new Map<string, number>()
    ;(data.value ?? []).forEach((item) => {
      map.set(item.fecha, item.valor)
    })
    return map
  })

  return {
    inflacionHistorica,
    inflacionPorFecha,
    loading,
    error,
    fetch,
  }
}

