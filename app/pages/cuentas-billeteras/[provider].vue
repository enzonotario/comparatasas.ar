<script setup lang="ts">
import AccountHistoryTNAChart from '~/components/charts/AccountHistoryTNAChart.vue'
import AccountHistoryTopeChart from '~/components/charts/AccountHistoryTopeChart.vue'
import { useAccountHistory } from '~/composables/useAccountHistory'
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const providerParam = route.params.provider as string

const slugToApiName: Record<string, string> = {
  uala: 'UALA',
  'uala-plus-1': 'UALA PLUS 1',
  'uala-plus-2': 'UALA PLUS 2',
  fiwind: 'FIWIND',
  belo: 'BELO',
  'carrefour-banco': 'CARREFOUR BANCO',
  'naranja-x': 'NARANJA X',
  cresium: 'CRESIUM',
  supervielle: 'SUPERVIELLE',
  bna: 'BNA',
}

const providerApiName = computed(() => {
  return slugToApiName[providerParam.toLowerCase()] || providerParam.toUpperCase()
})

const displayName = computed(() => getInstitutionShortName(providerApiName.value))
const logo = computed(() => getInstitutionLogo(providerApiName.value))
const providerUrl = computed(() => getInstitutionUrl(providerApiName.value))
const providerSlug = computed(() => providerParam.toLowerCase())

const { data: history, loading, error, fetch } = useAccountHistory()

onMounted(() => {
  fetch(providerSlug.value)
})

useSeoMeta({
  title: `${displayName.value} - Historial de TNA y Tope - comparatasas.ar`,
  description: `Evolución histórica de TNA y Tope de ${displayName.value}. Analizá cómo han cambiado las tasas y condiciones a lo largo del tiempo.`,
  ogTitle: `${displayName.value} - Historial de TNA y Tope - comparatasas.ar`,
  ogDescription: `Evolución histórica de TNA y Tope de ${displayName.value}.`,
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4 mb-4">
      <NuxtLink
        to="/cuentas-billeteras"
        class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>Volver a Cuentas y Billeteras</span>
      </NuxtLink>

      <UButton
        v-if="providerUrl"
        :to="providerUrl"
        external
        target="_blank"
        rel="noopener noreferrer"
        color="primary"
        class="flex items-center gap-2"
      >
        <UIcon name="i-lucide-external-link" class="size-4" />
        <span>Ir a {{ displayName }}</span>
      </UButton>
    </div>

    <div class="flex items-center gap-4">
      <img
        v-if="logo"
        :src="logo"
        :alt="displayName"
        referrerpolicy="no-referrer"
        class="size-16 rounded-full object-cover"
      />
      <div v-else class="size-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
          {{ displayName }}
        </h1>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Evolución histórica de TNA y Tope
        </p>
      </div>
    </div>

    <UAlert v-if="error" color="red" variant="soft" title="Error cargando historial" />

    <FundsLoading v-if="loading" />

    <div v-else-if="history && history.length > 0" class="space-y-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-line-chart"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
            <h3 class="font-semibold text-lg">Evolución de TNA</h3>
          </div>
        </template>
        <AccountHistoryTNAChart :history="history" :provider-name="displayName" />
      </UCard>

      <UCard v-if="history.some((item) => item.tope !== null && item.tope !== undefined)">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-trending-up"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
            <h3 class="font-semibold text-lg">Evolución de Tope</h3>
          </div>
        </template>
        <AccountHistoryTopeChart :history="history" :provider-name="displayName" />
      </UCard>
    </div>

    <div v-else-if="!loading" class="text-center py-12">
      <p class="text-neutral-500">No hay datos históricos disponibles para este proveedor.</p>
    </div>
  </div>
</template>
