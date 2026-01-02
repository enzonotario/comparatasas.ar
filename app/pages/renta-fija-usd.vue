<script setup lang="ts">
import { isCrypto } from '~/lib/crypto-utils'
import { getInstitutionLogo, getInstitutionShortName, getInstitutionUrl } from '~/lib/mappings/institutions'

useSeoMeta({
  title: 'Fondos Renta Fija USD - Mejores Tasas Argentina',
  description:
    'Compará los mejores fondos de renta fija en dólares estadounidenses. Encontrá rendimientos estables en USD con fondos de bonos dolarizados de Argentina.',
  ogTitle: 'Fondos Renta Fija USD - Mejores Tasas Argentina',
  ogDescription:
    'Compará los mejores fondos de renta fija en dólares estadounidenses. Encontrá rendimientos estables en USD con fondos de bonos dolarizados de Argentina.',
})

const { data, loading: fundsLoading, error: fundsError } = useFunds()

const { fetchAll, loading: cryptoLoading, error: cryptoError } = useCrypto()

const loading = computed(() => fundsLoading.value || cryptoLoading.value)
const error = computed(() => fundsError.value || cryptoError.value)

// Rendimientos en USD que no son criptos
const usdYields = ref<Array<{ entidad: string; rendimientos: Array<{ moneda: string; apy: number }> }>>([])

const funds = computed(() => {
  return data.value.rentaFija.filter((i) => i?.meta?.showInUsdFunds)
})

// Cargar rendimientos en USD al montar
onMounted(async () => {
  const allYields = await fetchAll()
  
  // Filtrar solo rendimientos en USD que NO sean criptos
  usdYields.value = allYields
    .map((entity) => {
      const usdRendimientos = entity.rendimientos.filter(
        (rendimiento) => 
          rendimiento.moneda.toUpperCase() === 'USD' && 
          !isCrypto(rendimiento.moneda)
      )
      
      return {
        entidad: entity.entidad,
        rendimientos: usdRendimientos,
      }
    })
    .filter((entity) => entity.rendimientos.length > 0)
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h2 id="renta-fija-usd" class="text-lg font-medium scroll-mt-16">Renta Fija USD</h2>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Error cargando fondos" />

    <FundsLoading v-if="loading && !funds.length && !usdYields.length" />

    <div v-else class="space-y-4">
      <!-- Fondos tradicionales -->
      <div v-if="funds.length > 0" class="space-y-2">
        <FundsList :items="funds" key-prop="fondo" mode="detailed"> </FundsList>
      </div>

      <!-- Rendimientos en USD (no criptos) -->
      <div v-if="usdYields.length > 0" class="space-y-3">
        <h3 class="text-md font-medium">Rendimientos en USD</h3>
        <div class="space-y-3">
          <UCard
            v-for="entity in usdYields"
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
                    <p class="text-sm text-muted">Rendimientos en USD</p>
                  </div>
                </div>
              </NuxtLink>
            </template>

            <div class="space-y-3">
              <div class="space-y-2">
                <div
                  v-for="(yieldItem, yieldIndex) in entity.rendimientos"
                  :key="yieldIndex"
                  class="p-4 flex items-center justify-between py-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">USD</span>
                  </div>

                  <UButton
                    color="primary"
                    variant="soft"
                    :href="getInstitutionUrl(entity.entidad)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ yieldItem.apy.toFixed(2) }}% APY
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <div v-if="!loading && !funds.length && !usdYields.length" class="text-center py-8">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No se encontraron fondos
      </h3>
      <p class="text-muted">No hay fondos de renta fija en USD disponibles en este momento.</p>
    </div>
  </div>
</template>
