<script setup lang="ts">
import { ogUpdatedAtDate } from '~/utils/og-data'

definePageMeta({
  pageTitle: 'Plazo fijo UVA pago periódico',
  pageDescription:
    'Tasas TNA y TEA de plazos fijos en UVA con cobro periódico de intereses, por rango de días.',
})

const PF_UVA_DIAS_MIN = 90
const PF_UVA_DIAS_MAX = 1095
const uvaSimulatorPresets = [
  { value: 90, label: '90d' },
  { value: 180, label: '180d' },
  { value: 720, label: '720d' },
  { value: 1080, label: '1080d' },
]

const { data: ogItems } = await useAsyncData('og-plazos-uva', async () => {
  type Row = { entidad: string; tasas: Array<{ tna: number }> }
  const provs = await $fetch<Row[]>(
    'https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijoUvaPagoPeriodico',
  )
  const flat = provs.flatMap((p) =>
    p.tasas.map((t) => ({ entidad: p.entidad, tnaClientes: t.tna })),
  )
  return flat
    .filter((x) => x.tnaClientes > 0)
    .sort((a, b) => b.tnaClientes - a.tnaClientes)
    .slice(0, 3)
    .map((x) => ({
      name: x.entidad,
      rate: `${(x.tnaClientes * 100).toFixed(2)}% TNA`,
    }))
})

defineOgImage('ComparaTasas.takumi', {
  title: 'PF UVA pago periódico',
  items: ogItems.value ?? [],
  updatedAt: ogUpdatedAtDate(),
})

useSeoMeta({
  title: 'Plazo fijo UVA pago periódico',
  description:
    'Compará tasas nominales y efectivas de plazos fijos UVA con pago periódico de intereses por tramo de días en Argentina.',
  ogTitle: 'Plazo fijo UVA pago periódico - Compara Tasas',
  ogDescription:
    'Tasas TNA/TEA de PF UVA con cobro periódico, alineadas a rangos de plazo informados por las entidades.',
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://comparatasas.ar/plazos-fijos/uva-pago-periodico',
    },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/plazos-fijos/uva-pago-periodico',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/plazos-fijos/uva-pago-periodico',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Plazo fijo UVA pago periódico - Compara Tasas',
        description: 'Comparativa de tasas de plazos fijos UVA con pago periódico en Argentina.',
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
  plazosFijosUvaPagoPeriodicoItems,
  loading: loadingUva,
  error: errorUva,
} = usePlazosFijosUvaPagoPeriodico()

const { calculateResults, isSimulating, days } = useInvestmentSimulator()
const plazosFijosUvaWithSimulation = calculateResults(plazosFijosUvaPagoPeriodicoItems)

onMounted(() => {
  if (days.value < PF_UVA_DIAS_MIN) days.value = 180
  if (days.value > PF_UVA_DIAS_MAX) days.value = PF_UVA_DIAS_MAX
})
</script>

<template>
  <div class="space-y-6">
    <InvestmentSimulator
      :preset-days="uvaSimulatorPresets"
      :days-min="PF_UVA_DIAS_MIN"
      :days-max="PF_UVA_DIAS_MAX"
      interest-info-mode="uvaPagoPeriodico"
      days-field-description="Presets alineados a tramos habituales (90–1080 días). Ajustá el valor para que coincida con el rango de cada fila."
    />

    <div class="flex items-center justify-between mb-2">
      <h2 id="plazos-fijos-uva" class="text-lg font-medium scroll-mt-16">Plazos Fijos</h2>
    </div>

    <PlazosFijosNavTabs />

    <div class="space-y-4 mt-6">
      <p class="text-sm text-neutral-600 dark:text-neutral-400 max-w-3xl">
        Tasas nominales y efectivas anuales (TNA / TEA) informadas para plazos fijos en UVA con
        cobro periódico de intereses (subperíodos de 30 días). La simulación usa solo la TNA
        adicional sobre UVA (no incluye la actualización por índice UVA).
      </p>

      <UAlert v-if="errorUva" color="error" variant="soft" title="Error cargando plazos fijos UVA" />

      <FundsLoading v-if="loadingUva && !plazosFijosUvaPagoPeriodicoItems.length" />

      <FundsList
        v-else
        :items="plazosFijosUvaWithSimulation"
        mode="simple"
        :show-simulation="isSimulating"
        :simulator-days="days"
        key-prop="rowKey"
      />

      <div v-if="!loadingUva && !plazosFijosUvaPagoPeriodicoItems.length" class="text-center py-8">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay cotizaciones UVA con pago periódico
        </h3>
        <p class="text-muted">No hay datos disponibles en este momento.</p>
      </div>
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué es un Plazo Fijo?
          </h3>
          <p>
            El <strong>plazo fijo</strong> es un instrumento de ahorro e inversión en el cual una
            persona deposita una suma de dinero en un banco por un tiempo determinado (normalmente
            30, 60 o 90 días). A cambio, el banco se compromete a devolver el dinero original más un
            interés previamente acordado.
          </p>
          <p>
            En Argentina, existen dos modalidades principales: el
            <strong>plazo fijo tradicional</strong>, que tiene una tasa nominal anual (TNA) fija, y
            el <strong>plazo fijo UVA</strong>, cuyo rendimiento se ajusta según la inflación
            oficial más un pequeño porcentaje de interés adicional.
          </p>
        </div>
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            Ventajas del Plazo Fijo Tradicional
          </h3>
          <ul class="list-disc list-inside space-y-2">
            <li>
              <strong>Seguridad:</strong> Tus ahorros están respaldados por el Banco Central de la
              República Argentina (BCRA).
            </li>
            <li>
              <strong>Previsibilidad:</strong> Sabés exactamente cuánto dinero vas a cobrar al
              finalizar el plazo.
            </li>
            <li>
              <strong>Sencillez:</strong> Se puede constituir fácilmente desde el Home Banking de
              cualquier entidad.
            </li>
            <li>
              <strong>Tasas competitivas:</strong> Comparar las tasas de distintos bancos te permite
              obtener el mejor rendimiento posible para tus ahorros.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
