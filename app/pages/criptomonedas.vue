<script setup lang="ts">
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'
import { getCryptoLogo, getCryptoName, getCryptoMaxYieldProvider } from '~/lib/crypto-utils'
import { useAnalytics } from '~/composables/useAnalytics'
import { formatApy } from '~/utils/og-data'

definePageMeta({
  pageTitle: 'Rendimientos Criptomonedas',
  pageDescription:
    'Compará las mejores tasas y rendimientos (APY) para Bitcoin, stablecoins y activos digitales en Argentina.',
})

const { trackProviderClick } = useAnalytics()

function handleExchangeClick(entidad: string, crypto?: string) {
  const url = getInstitutionUrl(entidad)
  if (url) {
    trackProviderClick({
      providerName: getInstitutionShortName(entidad),
      providerUrl: url,
      section: 'criptomonedas',
      contentType: crypto ? `crypto-${crypto}` : 'exchange-card',
    })
  }
}

const { data: ogItems } = await useAsyncData('og-crypto', async () => {
  const { data: cryptoData, fetchCriptos, cryptosByMaxYield } = useCrypto()
  await fetchCriptos()
  return cryptosByMaxYield.value.slice(0, 3).map(({ crypto, maxYield }) => {
    const provider = getCryptoMaxYieldProvider(crypto, cryptoData.value)
    const providerName = provider ? getInstitutionShortName(provider) : ''
    const name = providerName ? `${getCryptoName(crypto)} (${providerName})` : getCryptoName(crypto)
    return { name, rate: formatApy(maxYield) }
  })
})

defineOgImage('ComparaTasas.takumi', {
  title: 'Top Rendimientos Crypto',
  items: ogItems.value ?? [],
  updatedAt: new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
})

useSeoMeta({
  title: 'Rendimientos Criptomonedas',
  description:
    'Compará mejores rendimientos de criptomonedas en Argentina. Encontrá tasas para Bitcoin, Ethereum, USDT y cryptos en exchanges.',
  ogTitle: 'Rendimientos Criptomonedas - Mejores Tasas Crypto',
  ogDescription:
    'Compará mejores rendimientos de criptomonedas en Argentina. Encontrá tasas para Bitcoin, Ethereum, USDT y cryptos en exchanges.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/criptomonedas' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/criptomonedas' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/criptomonedas' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Rendimientos Criptomonedas - Compara Tasas',
        description: 'Comparativa de rendimientos de criptomonedas en Argentina.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})

const { dataProcessed: cryptoYields, loading, error, cryptosByMaxYield } = useCrypto()
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-2">
      <h2 id="rendimientos-crypto" class="text-lg font-medium scroll-mt-16">Rendimientos Crypto</h2>
    </div>

    <UAlert v-if="error" color="red" variant="soft" title="Error cargando rendimientos crypto" />

    <FundsLoading v-if="loading && !cryptoYields.length" />

    <div v-else>
      <!-- Desktop table view -->
      <div class="hidden sm:block">
        <UCard>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left p-4 font-medium">Criptomoneda</th>
                  <th
                    v-for="entity in cryptoYields"
                    :key="entity.entidad"
                    class="text-center p-4 font-medium"
                  >
                    <div class="flex flex-col items-center gap-2">
                      <UAvatar
                        :src="getInstitutionLogo(entity.entidad)"
                        :alt="entity.entidad"
                        size="sm"
                      />
                      <span class="text-sm">{{ getInstitutionShortName(entity.entidad) }}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="{ crypto, maxYield } in cryptosByMaxYield"
                  :key="crypto"
                  class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td class="p-2">
                    <div class="flex items-center gap-3">
                      <UAvatar :src="getCryptoLogo(crypto)" :alt="crypto" size="xs" />
                      <span class="font-medium">{{ getCryptoName(crypto) }}</span>
                    </div>
                  </td>
                  <td v-for="entity in cryptoYields" :key="entity.entidad" class="p-4 text-center">
                    <template v-if="entity.rendimientos.find((r) => r.moneda === crypto)">
                      <UButton
                        :color="
                          entity.rendimientos.find((r) => r.moneda === crypto)?.apy === maxYield &&
                          maxYield > 0
                            ? 'primary'
                            : 'neutral'
                        "
                        :variant="
                          entity.rendimientos.find((r) => r.moneda === crypto)?.apy === maxYield &&
                          maxYield > 0
                            ? 'soft'
                            : 'outline'
                        "
                        :href="getInstitutionUrl(entity.entidad)"
                        target="_blank"
                        rel="noopener noreferrer"
                        @click="handleExchangeClick(entity.entidad, crypto)"
                      >
                        {{ entity.rendimientos.find((r) => r.moneda === crypto)?.apy.toFixed(2) }}%
                      </UButton>
                    </template>
                    <template v-else>
                      <span class="text-muted">-</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <!-- Mobile and tablet card view -->
      <div class="sm:hidden flex flex-col space-y-3">
        <UCard
          v-for="entity in cryptoYields"
          :key="entity.entidad"
          :ui="{
            body: '!p-0',
          }"
        >
          <template #header>
            <NuxtLink
              :to="getInstitutionUrl(entity.entidad)"
              target="_blank"
              rel="noopener noreferrer"
              @click="handleExchangeClick(entity.entidad)"
            >
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="getInstitutionLogo(entity.entidad)"
                  :alt="entity.entidad"
                  size="md"
                />
                <div>
                  <h3 class="font-semibold">{{ getInstitutionShortName(entity.entidad) }}</h3>
                  <p class="text-sm text-muted">Exchange</p>
                </div>
              </div>
            </NuxtLink>
          </template>

          <div class="space-y-3">
            <div class="space-y-2">
              <div
                v-for="(cryptoYield, yieldIndex) in entity.rendimientos"
                :key="yieldIndex"
                class="p-4 flex items-center justify-between py-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded"
              >
                <div class="flex items-center gap-2">
                  <UAvatar
                    :src="getCryptoLogo(cryptoYield.moneda)"
                    :alt="cryptoYield.moneda"
                    size="xs"
                  />
                  <span class="text-sm font-medium">{{ getCryptoName(cryptoYield.moneda) }}</span>
                </div>

                <UButton
                  color="primary"
                  variant="soft"
                  :href="getInstitutionUrl(entity.entidad)"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click="handleExchangeClick(entity.entidad, cryptoYield.moneda)"
                >
                  {{ cryptoYield.apy.toFixed(2) }}% APY
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            Invertir en Criptomonedas en Argentina
          </h3>
          <p>
            Las <strong>criptomonedas</strong> se han convertido en una de las formas preferidas de
            inversión y ahorro para los argentinos. Además de Bitcoin (BTC) y Ethereum (ETH), las
            <strong>stablecoins</strong> (como USDT, USDC o DAI) son fundamentales para protegerse
            de la devaluación, ya que su valor suele estar atado al dólar estadounidense.
          </p>
          <p>
            En comparatasas.ar te mostramos los rendimientos que ofrecen los principales exchanges
            locales y globales por mantener tus activos en sus plataformas, lo que se conoce como
            <strong>Staking</strong> o <strong>Cuentas de Inversión Crypto</strong>.
          </p>
        </div>
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">¿Qué es el APY?</h3>
          <p>
            El <strong>APY (Annual Percentage Yield)</strong> es el rendimiento porcentual anual que
            incluye el efecto del interés compuesto. En el mundo crypto, muchas plataformas pagan
            intereses diarios o semanales, y el APY te permite ver cuánto ganarías en un año si
            reinvirtieras esos beneficios.
          </p>
          <ul class="list-disc list-inside space-y-1">
            <li>
              <strong>Liquidez:</strong> La mayoría de los rendimientos crypto tienen liquidez
              inmediata.
            </li>
            <li>
              <strong>Variabilidad:</strong> Las tasas pueden cambiar frecuentemente según el
              mercado.
            </li>
            <li>
              <strong>Riesgo:</strong> Siempre recordá que las inversiones crypto tienen riesgos
              asociados.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
