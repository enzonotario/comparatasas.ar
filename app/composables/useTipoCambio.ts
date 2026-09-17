export interface TipoCambioDolar {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

/** @deprecated Prefer TipoCambioDolar; se mantiene por compat. */
export type TipoCambioOficial = TipoCambioDolar

export function useTipoCambio() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('tipo-cambio-oficial', () =>
    $fetch<TipoCambioDolar>('https://dolarapi.com/v1/dolares/oficial'),
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

/** Dólar MEP / bolsa (para convertir patrimonio FCI en USD a ARS). */
export function useDolarBolsa() {
  const {
    data,
    pending: loading,
    error,
    refresh: fetch,
  } = useAsyncData('tipo-cambio-dolar-bolsa', () =>
    $fetch<TipoCambioDolar>('https://dolarapi.com/v1/dolares/bolsa'),
  )

  /** ARS por 1 USD (venta MEP). */
  const usdArsRate = computed(() => {
    const venta = data.value?.venta
    return venta != null && Number.isFinite(venta) && venta > 0 ? venta : null
  })

  const midRate = computed(() => {
    const compra = data.value?.compra
    const venta = data.value?.venta
    if (compra != null && venta != null && Number.isFinite(compra) && Number.isFinite(venta)) {
      return (compra + venta) / 2
    }
    return usdArsRate.value
  })

  return {
    dolarBolsa: data,
    usdArsRate,
    midRate,
    loading,
    error,
    fetch,
  }
}
