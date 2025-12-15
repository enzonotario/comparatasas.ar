<script setup lang="ts">
import { ref, watch, computed } from 'vue'

import type { InflacionREMData } from '~/composables/useInflacionREM'

useSeoMeta({
  title: 'Créditos Hipotecarios UVA - Compara Tasas Argentina',
  description:
    'Compará las mejores tasas de créditos hipotecarios UVA en Argentina. Proyección de cuotas mensuales con inflación histórica y configurable.',
  ogTitle: 'Créditos Hipotecarios UVA - Compara Tasas Argentina',
  ogDescription:
    'Compará las mejores tasas de créditos hipotecarios UVA en Argentina. Proyección de cuotas mensuales con inflación histórica y configurable.',
})

const {
  hipotecariosUVA,
  loading: loadingHipotecarios,
  error: errorHipotecarios,
  fetch: fetchHipotecarios,
} = useHipotecariosUVA()
const {
  inflacionHistorica,
  loading: loadingInflacion,
  error: errorInflacion,
  fetch: fetchInflacion,
} = useInflacion()
const {
  inflacionREM,
  loading: loadingInflacionREM,
  error: errorInflacionREM,
  fetch: fetchInflacionREM,
} = useInflacionREM()
const { ultimoUVA, uvaHistorica, loading: loadingUVA, error: errorUVA, fetch: fetchUVA } = useUVA()
const {
  tipoCambioVenta,
  loading: loadingTipoCambio,
  error: errorTipoCambio,
  fetch: fetchTipoCambio,
} = useTipoCambio()

const montoPropiedad = ref(100000)
const porcentajeFinanciacion = ref(75)
const plazoAnos = ref(20)
const inflacionFutura = ref(2.0)

const uvaInicial = computed(() => {
  return ultimoUVA.value ?? 1681.13
})

const tipoCambio = computed(() => {
  return tipoCambioVenta.value
})

onMounted(async () => {
  await Promise.all([
    fetchHipotecarios(),
    fetchInflacion(),
    fetchInflacionREM(),
    fetchUVA(),
    fetchTipoCambio(),
  ])
})

const inflacionOrdenada = computed(() => {
  return [...(inflacionHistorica.value ?? [])].sort((a, b) => {
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  })
})
</script>

<template>
  <div>
    <UAlert
      v-if="errorHipotecarios || errorInflacion || errorInflacionREM || errorUVA || errorTipoCambio"
      color="error"
      variant="soft"
      title="Error cargando datos"
    />

    <div
      v-if="
        loadingHipotecarios ||
        loadingInflacion ||
        loadingInflacionREM ||
        loadingUVA ||
        loadingTipoCambio
      "
      class="py-8"
    >
      <FundsLoading />
    </div>

    <div v-else-if="hipotecariosUVA.length > 0" class="flex flex-col space-y-6">
      <div class="w-full max-w-3xl mx-auto space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-col">
            <h2 class="text-xl font-bold">Créditos Hipotecarios UVA</h2>
          </div>
          <div class="flex flex-row">
            <TwitterAttribution
              usuario="SalinasAndres"
              nombre="Andrés Salinas"
              avatar="https://pbs.twimg.com/profile_images/1802830575759224832/vKHC7OK1_400x400.jpg"
              url="https://x.com/SalinasAndres"
            />
          </div>
        </div>

        <HipotecariosUVAList :hipotecarios="hipotecariosUVA" />
      </div>

      <HipotecariosUVATable
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
    </div>

    <div v-else class="text-center py-8">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No se encontraron créditos hipotecarios UVA
      </h3>
      <p class="text-muted">No hay datos disponibles en este momento.</p>
    </div>
  </div>
</template>
