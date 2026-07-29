<script setup lang="ts">
import { ref, computed } from 'vue'

import PlazosFijosTnaBarChart from '~/components/charts/PlazosFijosTnaBarChart.vue'
import UvaDolarPoderCompraChart from '~/components/charts/UvaDolarPoderCompraChart.vue'
import {
  buildUvaDolarPoderCompraSeries,
  formatUvaDolarRatio,
} from '~/lib/finance/uva-dolar-poder-compra'
import {
  DEFAULT_DOLAR_CASA,
  DOLAR_CASAS,
  getDolarCasaLabel,
  type DolarCasa,
} from '~/composables/useDolarHistorico'
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
} = useHipotecariosUVA()
const { inflacionHistorica, loading: loadingInflacion, error: errorInflacion } = useInflacion()
const { inflacionREM, loading: loadingInflacionREM, error: errorInflacionREM } = useInflacionREM()
const { ultimoUVA, uvaHistorica, loading: loadingUVA, error: errorUVA } = useUVA()
const { tipoCambioVenta, loading: loadingTipoCambio, error: errorTipoCambio } = useTipoCambio()

const dolarCasa = ref<DolarCasa>(DEFAULT_DOLAR_CASA)
const dolarCasaSelectItems = DOLAR_CASAS.map((casa) => ({
  label: casa.label,
  value: casa.value,
}))
const dolarCasaLabel = computed(() => getDolarCasaLabel(dolarCasa.value))
const {
  dolarHistorico,
  loading: loadingDolarHistorico,
  error: errorDolarHistorico,
} = useDolarHistorico(dolarCasa)

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

const uvaDolarPoderCompra = computed(() => {
  if (!uvaHistorica.value.length || !dolarHistorico.value.length) return null
  return buildUvaDolarPoderCompraSeries(uvaHistorica.value, dolarHistorico.value)
})

const uvaDolarRatioHoy = computed(() => {
  const ultimo = uvaDolarPoderCompra.value?.ultimo
  return ultimo ? formatUvaDolarRatio(ultimo.ratio) : null
})

const uvaDolarSenalCopy = computed(() => {
  const s = uvaDolarPoderCompra.value
  if (!s?.ultimo) return null
  const ratio = formatUvaDolarRatio(s.ultimo.ratio)
  const avg = formatUvaDolarRatio(s.promedioHistorico)
  const casa = dolarCasaLabel.value
  if (s.senal === 'endeudarse') {
    return {
      color: 'info' as const,
      title: `Hoy: ${ratio} UVA por dólar ${casa} (por debajo del promedio ${avg})`,
      description:
        'En términos históricos, con un dólar se compran pocas UVA: la UVA está “cara”. Suele ser un momento relativo más favorable para tomar deuda en UVA (p. ej. comprar una propiedad), porque cada UVA prestada equivale a más dólares que en el promedio.',
    }
  }
  if (s.senal === 'cancelar') {
    return {
      color: 'success' as const,
      title: `Hoy: ${ratio} UVA por dólar ${casa} (por encima del promedio ${avg})`,
      description:
        'En términos históricos, con un dólar se compran muchas UVA: la UVA está “barata”. Suele ser un momento relativo más favorable para precancelar deuda en UVA con dólares ahorrados.',
    }
  }
  return {
    color: 'neutral' as const,
    title: `Hoy: ${ratio} UVA por dólar ${casa} (cerca del promedio ${avg})`,
    description:
      'La relación está cerca del promedio histórico. El indicador no marca un sesgo claro entre cancelar o endeudarse solo por este criterio.',
  }
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

        <UCard>
          <template #header>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-chart-line"
                  class="size-5 text-primary-600 dark:text-primary-400"
                />
                <h3 class="font-semibold text-lg">¿Es momento de cancelar o tomar deuda en UVA?</h3>
              </div>
              <p class="text-sm text-muted">
                Poder de compra del dólar medido en UVA · ¿Cuántas UVA compra un dólar
                {{ dolarCasaLabel }}?
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-end gap-3">
              <UFormField label="Tipo de dólar" class="w-full max-w-xs">
                <USelect
                  v-model="dolarCasa"
                  :items="dolarCasaSelectItems"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>
              <p class="text-xs text-muted pb-1">
                El promedio y la señal se recalculan con el histórico del tipo de dólar elegido.
              </p>
            </div>

            <UAlert
              color="neutral"
              variant="soft"
              title="No es una recomendación"
              :description="`Es un análisis basado en el promedio histórico de la relación dólar ${dolarCasaLabel} / UVA. Hay muchos otros factores de mercado y personales que no se consideran acá.`"
            />

            <UAlert
              v-if="errorDolarHistorico"
              color="error"
              variant="soft"
              :title="`No se pudo cargar el histórico del dólar ${dolarCasaLabel}`"
            />

            <template v-else-if="loadingDolarHistorico && !uvaDolarPoderCompra">
              <div class="py-8">
                <FundsLoading />
              </div>
            </template>

            <template v-else>
              <UAlert
                v-if="uvaDolarSenalCopy"
                :color="uvaDolarSenalCopy.color"
                variant="soft"
                :title="uvaDolarSenalCopy.title"
                :description="uvaDolarSenalCopy.description"
              />

              <div class="text-sm text-neutral-700 dark:text-neutral-300 space-y-2 leading-relaxed">
                <p class="font-medium text-neutral-900 dark:text-white">¿Cómo se lee?</p>
                <ul class="list-disc list-inside space-y-1.5">
                  <li>
                    El número de la serie indica cuántas UVA comprás con un dólar
                    {{ dolarCasaLabel }}. Por ejemplo,
                    <template v-if="uvaDolarRatioHoy">
                      hoy está en
                      <strong>{{ uvaDolarRatioHoy }}.</strong>
                    </template>
                    <template v-else>un valor bajo implica UVA cara en dólares.</template>
                  </li>
                  <li>
                    Por debajo del promedio histórico (zona rosa): el dólar compra pocas UVA → UVA
                    “cara”. Suele ser un momento relativo más favorable para
                    <strong>endeudarse</strong> en UVA.
                  </li>
                  <li>
                    Por encima del promedio (zona verde): el dólar compra muchas UVA → UVA “barata”.
                    Suele ser un momento relativo más favorable para
                    <strong>precancelar</strong> deuda con dólares.
                  </li>
                </ul>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    Poder de compra del dólar en UVA
                  </p>
                  <UBadge color="primary" variant="soft" size="md">
                    Simulando con Dólar {{ dolarCasaLabel }}
                  </UBadge>
                </div>
                <UvaDolarPoderCompraChart
                  :series="uvaDolarPoderCompra"
                  :dolar-label="dolarCasaLabel"
                />
              </div>
            </template>
          </div>
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
