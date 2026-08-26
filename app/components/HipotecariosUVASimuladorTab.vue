<script setup lang="ts">
import { ref, computed } from 'vue'

const {
  hipotecariosUVA,
  loading: loadingHipotecarios,
  error: errorHipotecarios,
} = useHipotecariosUVA()
const { inflacionHistorica, loading: loadingInflacion, error: errorInflacion } = useInflacion()
const { inflacionREM, loading: loadingInflacionREM, error: errorInflacionREM } = useInflacionREM()
const { ultimoUVA, uvaHistorica, loading: loadingUVA, error: errorUVA } = useUVA()
const { tipoCambioVenta, loading: loadingTipoCambio, error: errorTipoCambio } = useTipoCambio()

const montoPropiedad = ref(100000)
const porcentajeFinanciacion = ref(75)
const plazoAnos = ref(20)
const inflacionFutura = ref(2.0)

const uvaInicial = computed(() => ultimoUVA.value ?? 1681.13)
const tipoCambio = computed(() => tipoCambioVenta.value)

const inflacionOrdenada = computed(() => {
  return [...(inflacionHistorica.value ?? [])].sort((a, b) => {
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  })
})

const hasError = computed(
  () =>
    errorHipotecarios.value ||
    errorInflacion.value ||
    errorInflacionREM.value ||
    errorUVA.value ||
    errorTipoCambio.value,
)

const loading = computed(
  () =>
    loadingHipotecarios.value ||
    loadingInflacion.value ||
    loadingInflacionREM.value ||
    loadingUVA.value ||
    loadingTipoCambio.value,
)
</script>

<template>
  <div class="mt-4 flex flex-col space-y-4 w-full">
    <UAlert
      v-if="hasError"
      color="error"
      variant="soft"
      title="Error cargando datos del simulador"
      description="Algunas fuentes no respondieron. Probá de nuevo en unos minutos."
    />

    <div v-if="loading && !hipotecariosUVA.length" class="py-8">
      <FundsLoading />
    </div>

    <HipotecariosUVATable
      v-else-if="hipotecariosUVA.length > 0"
      :hipotecarios="hipotecariosUVA"
      :inflacion-historica="inflacionOrdenada"
      :inflacion-r-e-m="inflacionREM"
      :inflacion-futura="inflacionFutura"
      :monto-propiedad="montoPropiedad"
      :porcentaje-financiacion="porcentajeFinanciacion"
      :plazo-anos="plazoAnos"
      :uva-inicial="uvaInicial"
      :tipo-cambio="tipoCambio"
      :uva-historica="uvaHistorica"
    />

    <div v-else-if="!loading" class="text-center py-8">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No se encontraron créditos hipotecarios UVA
      </h3>
      <p class="text-muted">No hay datos disponibles en este momento.</p>
    </div>
  </div>
</template>
