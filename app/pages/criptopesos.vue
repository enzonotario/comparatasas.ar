<script setup lang="ts">
useSeoMeta({
  title: 'Criptopesos Stablecoins 1:1',
  description:
    'Compará mejores tasas de stablecoins con paridad 1:1 con el peso argentino. Encontrá rendimientos competitivos para tu dinero.',
  ogTitle: 'Criptopesos - comparatasas.ar',
  ogDescription:
    'Compará mejores tasas de stablecoins con paridad 1:1 con el peso argentino. Encontrá rendimientos competitivos para tu dinero.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/criptopesos' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/criptopesos' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/criptopesos' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Criptopesos - Compara Tasas',
        description: 'Comparativa de criptopesos y stablecoins 1:1 en Argentina.',
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
  title: 'Tasas de Criptopesos',
  description:
    'Comparativa de rendimientos de stablecoins con paridad 1:1 con el peso argentino y estrategias crypto en moneda local.',
}

const { criptopesos, loading, error } = useCriptopesos()

const { calculateResults, isSimulating } = useInvestmentSimulator()
const criptopesosWithSimulation = calculateResults(criptopesos)
</script>

<template>
  <div class="space-y-6">
    <InvestmentSimulator />

    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 id="criptopesos" class="text-lg font-medium scroll-mt-16">Criptopesos</h2>
      </div>

      <UAlert v-if="error" color="red" variant="soft" title="Error cargando datos" />

      <FundsLoading v-if="loading && !criptopesos.length" />

      <FundsList
        v-else
        :items="criptopesosWithSimulation"
        key-prop="fondo"
        mode="detailed"
        :show-simulation="isSimulating"
      />
    </div>
  </div>
</template>
