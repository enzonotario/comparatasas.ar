<script setup lang="ts">
import { computed } from 'vue'

import UvaDolarPoderCompraChart from '~/components/charts/UvaDolarPoderCompraChart.vue'
import {
  buildUvaDolarPoderCompraSeries,
  formatUvaDolarRatio,
} from '~/lib/finance/uva-dolar-poder-compra'
import {
  DOLAR_CASAS,
  getDolarCasaLabel,
  type DolarCasa,
} from '~/composables/useDolarHistorico'

const dolarCasa = defineModel<DolarCasa>('dolarCasa', { required: true })

const dolarCasaSelectItems = DOLAR_CASAS.map((casa) => ({
  label: casa.label,
  value: casa.value,
}))
const dolarCasaLabel = computed(() => getDolarCasaLabel(dolarCasa.value))

const { uvaHistorica, loading: loadingUVA, error: errorUVA } = useUVA()
const {
  dolarHistorico,
  loading: loadingDolarHistorico,
  error: errorDolarHistorico,
} = useDolarHistorico(dolarCasa)

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

const loading = computed(() => loadingUVA.value || loadingDolarHistorico.value)
</script>

<template>
  <div class="mt-4 flex flex-col space-y-4 w-full">
    <div class="space-y-1">
      <h2 class="text-xl font-bold">¿Es momento de cancelar o tomar deuda en UVA?</h2>
      <p class="text-sm text-muted">
        Poder de compra del dólar medido en UVA · ¿Cuántas UVA compra un dólar
        {{ dolarCasaLabel }}?
      </p>
    </div>

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
      v-if="errorUVA"
      color="error"
      variant="soft"
      title="No se pudo cargar el histórico de UVA"
    />

    <UAlert
      v-if="errorDolarHistorico"
      color="error"
      variant="soft"
      :title="`No se pudo cargar el histórico del dólar ${dolarCasaLabel}`"
    />

    <div v-if="loading && !uvaDolarPoderCompra" class="py-8">
      <FundsLoading />
    </div>

    <template v-else-if="uvaDolarPoderCompra">
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
            Por debajo del promedio histórico (zona rosa): el dólar compra pocas UVA → UVA “cara”.
            Suele ser un momento relativo más favorable para
            <strong>endeudarse</strong> en UVA.
          </li>
          <li>
            Por encima del promedio (zona verde): el dólar compra muchas UVA → UVA “barata”. Suele
            ser un momento relativo más favorable para
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
        <UvaDolarPoderCompraChart :series="uvaDolarPoderCompra" :dolar-label="dolarCasaLabel" />
      </div>
    </template>

    <div v-else-if="!loading" class="py-12 text-center text-muted text-sm">
      No hay datos suficientes para armar la serie UVA / dólar.
    </div>
  </div>
</template>
