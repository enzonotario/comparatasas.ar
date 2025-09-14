<script setup lang="ts">
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'
import { getCryptoLogo, getCryptoName } from '~/lib/crypto-utils'

useSeoMeta({
  title: 'Rendimientos Criptomonedas - Mejores Tasas Crypto Argentina',
  description:
    'Compará los mejores rendimientos de criptomonedas en Argentina. Encontrá las tasas más altas para Bitcoin, Ethereum, USDT y otras cryptos en exchanges locales.',
  ogTitle: 'Rendimientos Criptomonedas - Mejores Tasas Crypto Argentina',
  ogDescription:
    'Compará los mejores rendimientos de criptomonedas en Argentina. Encontrá las tasas más altas para Bitcoin, Ethereum, USDT y otras cryptos en exchanges locales.',
})

const { dataProcessed: cryptoYields, loading, error, cryptosByMaxYield } = useCrypto()
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h2 id="rendimientos-crypto" class="text-lg font-medium scroll-mt-16">Rendimientos Crypto</h2>
    </div>

    <UAlert v-if="error" color="red" variant="soft" title="Error cargando rendimientos crypto" />

    <FundsLoading v-if="loading && !cryptoYields.length" />

    <div v-else>
      <!-- Desktop table view -->
      <div class="hidden lg:block">
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
      <div class="lg:hidden flex flex-col space-y-3">
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
                >
                  {{ cryptoYield.apy.toFixed(2) }}% APY
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
