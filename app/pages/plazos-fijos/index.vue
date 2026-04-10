<script setup lang="ts">
import PlazosFijosTnaBarChart from '~/components/charts/PlazosFijosTnaBarChart.vue'
import { ogUpdatedAtDate, top3PlazosFijos } from '~/utils/og-data'

definePageMeta({
  pageTitle: 'Tasas de Plazos Fijos',
  pageDescription:
    'Comparativa actualizada de las tasas de plazos fijos tradicionales y UVA ofrecidas por los principales bancos y billeteras de Argentina.',
})

const { data: ogItems } = await useAsyncData('og-plazos', () =>
  $fetch<Array<{ entidad: string; tnaClientes: number }>>(
    'https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo',
  ).then((r) => top3PlazosFijos(r)),
)

defineOgImage('ComparaTasas.takumi', {
  title: 'Top Plazos Fijos',
  items: ogItems.value ?? [],
  updatedAt: ogUpdatedAtDate(),
})

useSeoMeta({
  title: 'Plazos Fijos',
  description:
    'Compará las mejores tasas de plazos fijos en Argentina. Encontrá bancos con mayor rendimiento para plazos fijos tradicionales y UVA actualizados diariamente.',
  ogTitle: 'Plazos Fijos - Mejores Tasas Argentina',
  ogDescription:
    'Compará las mejores tasas de plazos fijos en Argentina. Encontrá bancos con mayor rendimiento para plazos fijos tradicionales y UVA actualizados diariamente.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/plazos-fijos' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/plazos-fijos' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/plazos-fijos' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Plazos Fijos - Compara Tasas',
        description: 'Comparativa de tasas de plazos fijos tradicionales y UVA en Argentina.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})

const { plazosFijosItems, loading, error } = usePlazosFijos()
const { calculateResults, isSimulating } = useInvestmentSimulator()
const plazosFijosWithSimulation = calculateResults(plazosFijosItems)
</script>

<template>
  <div class="space-y-6">
    <InvestmentSimulator :fixed-days="30" />

    <div class="flex items-center justify-between mb-2">
      <h2 id="plazos-fijos" class="text-lg font-medium scroll-mt-16">Plazos Fijos</h2>
    </div>

    <PlazosFijosNavTabs />

    <div class="space-y-4 mt-6">
      <UAlert v-if="error" color="error" variant="soft" title="Error cargando plazos fijos" />

      <FundsLoading v-if="loading && !plazosFijosItems.length" />

      <FundsList
        v-else
        :items="plazosFijosWithSimulation"
        mode="simple"
        :show-simulation="isSimulating"
      />

      <div v-if="!loading && !plazosFijosItems.length" class="text-center py-8">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No se encontraron plazos fijos
        </h3>
        <p class="text-muted">No hay plazos fijos disponibles en este momento.</p>
      </div>

      <UCard v-if="!loading && plazosFijosItems.length > 0">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-bar-chart-3"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
            <h3 class="font-semibold text-lg">TNA por entidad (30 días, clientes)</h3>
          </div>
        </template>
        <PlazosFijosTnaBarChart :items="plazosFijosItems" />
      </UCard>
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
