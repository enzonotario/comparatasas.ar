<script setup lang="ts">
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

const pageHeader = useState<{ title?: string; description?: string }>('page-header')
pageHeader.value = {
  title: 'Tasas de Plazos Fijos',
  description:
    'Comparativa actualizada de las tasas de plazos fijos tradicionales y UVA ofrecidas por los principales bancos y billeteras de Argentina.',
}

const { plazosFijosItems, loading, error } = usePlazosFijos()

const { calculateResults, isSimulating } = useInvestmentSimulator()
const plazosFijosWithSimulation = calculateResults(plazosFijosItems)
</script>

<template>
  <div>
    <InvestmentSimulator :fixed-days="30" />

    <div class="flex items-center justify-between mb-2">
      <h2 id="plazos-fijos" class="text-lg font-medium scroll-mt-16">Plazos Fijos</h2>
    </div>

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
  </div>
</template>
