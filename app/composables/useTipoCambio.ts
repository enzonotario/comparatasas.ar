export interface TipoCambioOficial {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

export function useTipoCambio() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('tipo-cambio-oficial', () =>
    $fetch<TipoCambioOficial>('https://dolarapi.com/v1/dolares/oficial'),
  )

  const tipoCambioVenta = computed(() => {
    return data.value?.venta ?? 1460.45
  })

  return {
    tipoCambio: data,
    tipoCambioVenta,
    loading,
    error,
    fetch,
  }
}
