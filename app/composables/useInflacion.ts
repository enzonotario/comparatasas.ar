export interface InflacionData {
  fecha: string
  valor: number
}

export function useInflacion() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('inflacion', () =>
    $fetch<InflacionData[]>('https://api.argentinadatos.com/v1/finanzas/indices/inflacion/'),
  )

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
