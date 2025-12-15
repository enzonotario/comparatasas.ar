export interface TipoCambioOficial {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

const data = ref<TipoCambioOficial | null>(null)
const loading = ref(true)
const error = ref<unknown>(null)

export function useTipoCambio() {
  async function fetch() {
    if (data.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<TipoCambioOficial>('https://dolarapi.com/v1/dolares/oficial')
      data.value = response
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

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
