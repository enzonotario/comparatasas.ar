<script setup lang="ts">
import { ref, computed } from 'vue'

import PlazosFijosTnaBarChart from '~/components/charts/PlazosFijosTnaBarChart.vue'
import { getInstitutionLogo, getInstitutionShortName } from '~/lib/mappings/institutions'
import { ogUpdatedAtDate, top3Hipotecarios } from '~/utils/og-data'

definePageMeta({
  pageTitle: 'Créditos Hipotecarios UVA',
  pageDescription:
    'Comparativa de tasas hipotecarias UVA en Argentina y proyección de cuotas mensuales.',
})

const { data: ogItems } = await useAsyncData('og-hipotecarios', () =>
  $fetch<Array<{ nombreComercial: string; tna: number }>>(
    'https://api.argentinadatos.com/v1/finanzas/creditos/hipotecariosUva/',
  ).then((r) => top3Hipotecarios(r.map((i) => ({ ...i, tna: i.tna * 100 })))),
)

defineOgImage('ComparaTasas.takumi', {
  title: 'Mejores Hipotecarios UVA',
  items: ogItems.value ?? [],
  updatedAt: ogUpdatedAtDate(),
})

useSeoMeta({
  title: 'Créditos Hipotecarios UVA',
  description:
    'Compará mejores tasas de créditos hipotecarios UVA en Argentina. Proyección de cuotas mensuales con inflación histórica y estimada.',
  ogTitle: 'Créditos Hipotecarios UVA - Compara Tasas Argentina',
  ogDescription:
    'Compará mejores tasas de créditos hipotecarios UVA en Argentina. Proyección de cuotas mensuales con inflación histórica y estimada.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/creditos-hipotecarios-uva' },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Créditos Hipotecarios UVA - Compara Tasas',
        description: 'Comparativa de créditos hipotecarios UVA en Argentina.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
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

const hipotecariosChartItems = computed(() => {
  return hipotecariosUVA.value.map((h) => ({
    institution: getInstitutionShortName(h.entidad) || h.nombreComercial,
    tna: h.tna,
    logo: getInstitutionLogo(h.entidad) || getInstitutionLogo(h.nombreComercial),
  }))
})
</script>

<template>
  <div class="space-y-6">
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

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-bar-chart-3"
                class="size-5 text-primary-600 dark:text-primary-400"
              />
              <h3 class="font-semibold text-lg">TNA por entidad</h3>
            </div>
          </template>
          <PlazosFijosTnaBarChart
            parent-group-name="Créditos hipotecarios UVA · TNA"
            preserve-tna-precision
            sort-tna-ascending
            :items="hipotecariosChartItems"
          />
        </UCard>
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

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué son los Créditos Hipotecarios UVA?
          </h3>
          <p>
            Los <strong>Créditos Hipotecarios UVA</strong> son préstamos para la vivienda cuyas
            cuotas se ajustan según la <strong>Unidad de Valor Adquisitivo (UVA)</strong>, la cual
            varía diariamente en función del índice de inflación (CER).
          </p>
          <p>
            A diferencia de los créditos de tasa fija, los préstamos UVA suelen tener una tasa de
            interés nominal mucho más baja, ya que el capital se indexa por inflación. Esto permite
            que la cuota inicial sea más accesible para muchas familias, aunque el saldo adeudado
            también se ajusta con el tiempo.
          </p>
        </div>
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            Ventajas y Consideraciones
          </h3>
          <ul class="list-disc list-inside space-y-2">
            <li>
              <strong>Accesibilidad inicial:</strong> Las cuotas de entrada suelen ser más bajas que
              en un crédito tradicional.
            </li>
            <li>
              <strong>Relación cuota-ingreso:</strong> En general, la cuota se mantiene estable en
              relación con los salarios si estos acompañan a la inflación.
            </li>
            <li>
              <strong>Riesgo inflacionario:</strong> El capital adeudado crece nominalmente si la
              inflación es alta.
            </li>
            <li>
              <strong>Comparación de tasas:</strong> Cada banco ofrece una tasa adicional sobre la
              UVA (ej: UVA + 3.5% o UVA + 5%). Comparar estas tasas es clave para ahorrar a largo
              plazo.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
