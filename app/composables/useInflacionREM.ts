export interface InflacionREMData {
  tipo: string
  fecha: string
  valor: number
}

const data = ref<InflacionREMData[] | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function useInflacionREM() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<InflacionREMData[]>(
        'https://api.argentinadatos.com/v1/finanzas/inflacion/rem/',
      )
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const inflacionREM = computed(() => {
    return data.value ?? []
  })

  const inflacionREMPorFecha = computed(() => {
    const map = new Map<string, number>()
    ;(data.value ?? []).forEach((item) => {
      // Usar solo el año-mes como clave
      const fechaKey = item.fecha.substring(0, 7)
      map.set(fechaKey, item.valor)
    })
    return map
  })

  return {
    inflacionREM,
    inflacionREMPorFecha,
    loading,
    error,
    fetch,
  }
}
