<script setup lang="ts">
definePageMeta({
  pageTitle: 'Tasas de Criptopesos',
  pageDescription:
    'Comparativa de rendimientos de stablecoins con paridad 1:1 con el peso argentino y estrategias crypto en moneda local.',
})

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

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué son los Criptopesos?
          </h3>
          <p>
            Los <strong>criptopesos</strong> son stablecoins (monedas estables) que mantienen una
            paridad 1:1 con el peso argentino. Ejemplos comunes en el mercado son ARGt (de Belo) y
            wARS (de Ripio).
          </p>
          <p>
            Estas monedas permiten operar en el ecosistema crypto utilizando una unidad de cuenta
            conocida, facilitando la transición para usuarios que recién comienzan. Muchas
            plataformas ofrecen rendimientos por mantener estos activos, superando a veces a las
            cuentas remuneradas tradicionales.
          </p>
        </div>
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">Uso de Criptopesos</h3>
          <p>
            El principal uso de los criptopesos es la
            <strong>generación de rendimientos pasivos</strong> y la facilidad para intercambiarlos
            por otras criptomonedas como Bitcoin o USDT sin tener que pasar por el sistema bancario
            tradicional en cada operación.
          </p>
          <ul class="list-disc list-inside space-y-1">
            <li>
              <strong>Paridad:</strong> Mantienen el valor del peso argentino en la blockchain.
            </li>
            <li>
              <strong>Interoperabilidad:</strong> Se pueden usar en protocolos DeFi o dentro de
              exchanges.
            </li>
            <li>
              <strong>Accesibilidad:</strong> Permiten entrar al mundo crypto con montos bajos.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
