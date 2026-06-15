<script setup lang="ts">
import AccountHistoryTNAChart from '~/components/charts/AccountHistoryTNAChart.vue'
import AccountHistoryTopeChart from '~/components/charts/AccountHistoryTopeChart.vue'
import type { AccountItem } from '~/composables/useAccounts'
import { useAccountHistory } from '~/composables/useAccountHistory'
import { useAccountHistoryChartZoomSync } from '~/composables/useAccountHistoryChartZoomSync'
import { useAccounts } from '~/composables/useAccounts'
import { useAnalytics } from '~/composables/useAnalytics'
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'

interface AccountSummary {
  tna: number
  tope: number | null
  fecha?: string
  condiciones?: string | null
  condicionesCorto?: string | null
  typeLabel?: string
}

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const providerParam = route.params.provider as string
const { trackProviderClick } = useAnalytics()

const slugToApiName: Record<string, string> = {
  uala: 'UALA',
  'uala-plus-1': 'UALA PLUS 1',
  'uala-plus-2': 'UALA PLUS 2',
  'bica-cuenta-positiva-1': 'BICA CUENTA POSITIVA 1',
  'bica-cuenta-positiva-2': 'BICA CUENTA POSITIVA 2',
  'bica-cuenta-positiva-3': 'BICA CUENTA POSITIVA 3',
  'bica-cuenta-positiva-4': 'BICA CUENTA POSITIVA 4',
  fiwind: 'FIWIND',
  belo: 'BELO',
  'carrefour-banco': 'CARREFOUR BANCO',
  'naranja-x': 'NARANJA X',
  cresium: 'CRESIUM',
  supervielle: 'SUPERVIELLE',
  bna: 'BNA',
  capyfi: 'CAPYFI',
}

const providerApiName = computed(() => {
  return slugToApiName[providerParam.toLowerCase()] || providerParam.toUpperCase()
})

const displayName = computed(() => getInstitutionShortName(providerApiName.value))
const logo = computed(() => getInstitutionLogo(providerApiName.value))
const providerUrl = computed(() => getInstitutionUrl(providerApiName.value))
const providerSlug = computed(() => providerParam.toLowerCase())

const { data: history, loading, error, fetch } = useAccountHistory()
const { accounts, specialAccounts, fetch: fetchAccounts } = useAccounts()

const currentAccount = computed<AccountItem | null>(() => {
  const name = displayName.value
  return (
    [...accounts.value, ...specialAccounts.value].find((account) => account.fondo === name) ?? null
  )
})

const latestHistoryPoint = computed(() => {
  if (!history.value?.length) return null
  return history.value[history.value.length - 1]
})

const accountSummary = computed<AccountSummary | null>(() => {
  if (currentAccount.value) {
    return {
      tna: currentAccount.value.tna,
      tope: currentAccount.value.tope,
      fecha: currentAccount.value.fecha,
      condiciones: currentAccount.value.condiciones,
      condicionesCorto: currentAccount.value.condicionesCorto,
      typeLabel: currentAccount.value.typeLabel,
    }
  }

  if (latestHistoryPoint.value) {
    return {
      tna: latestHistoryPoint.value.tna,
      tope: latestHistoryPoint.value.tope,
      fecha: latestHistoryPoint.value.fecha,
      condiciones: latestHistoryPoint.value.condiciones,
      condicionesCorto: latestHistoryPoint.value.condicionesCorto,
    }
  }

  return null
})

function formatDate(dateString: string): string {
  const parts = dateString.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
}

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
  }).format(value)
}

const {
  tnaZoom,
  topeZoom,
  onTnaZoomStart,
  onTnaZoomEnd,
  onTopeZoomStart,
  onTopeZoomEnd,
  onZoomReset,
} = useAccountHistoryChartZoomSync(history)

function handleProviderClick() {
  if (providerUrl.value) {
    trackProviderClick({
      providerName: displayName.value,
      providerUrl: providerUrl.value,
      section: 'cuentas-billeteras-detalle',
      contentType: 'button',
    })
  }
}

onMounted(() => {
  fetch(providerSlug.value)
  fetchAccounts()
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
    <div class="flex items-center justify-between gap-4">
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
        @click="handleProviderClick"
      >
        <UIcon name="i-lucide-external-link" class="size-4" />
        <span>Ir a {{ displayName }}</span>
      </UButton>
    </div>

    <div class="flex flex-col items-center text-center space-y-4">
      <div class="flex items-center gap-3">
        <UAvatar
          v-if="logo"
          :src="logo"
          :alt="displayName"
          referrerpolicy="no-referrer"
          size="lg"
          :ui="{ image: 'object-contain' }"
        />
        <h1 class="font-bold text-4xl sm:text-5xl text-neutral-900 dark:text-white">
          {{ displayName }}
        </h1>
      </div>

      <UCard v-if="accountSummary" class="w-full text-left" :ui="{ body: '!py-4' }">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-2 min-w-0">
            <div
              v-if="accountSummary.condicionesCorto && accountSummary.condicionesCorto !== 'null'"
              class="text-sm text-neutral-600 dark:text-neutral-400"
            >
              {{ accountSummary.condicionesCorto }}
            </div>
            <div
              v-if="
                accountSummary.condiciones &&
                accountSummary.condiciones !== 'null' &&
                accountSummary.condiciones !== accountSummary.condicionesCorto
              "
              class="text-sm text-neutral-500 dark:text-neutral-500"
            >
              {{ accountSummary.condiciones }}
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge
                v-if="accountSummary.typeLabel"
                color="info"
                variant="outline"
                class="text-blue-800 dark:text-blue-100 bg-blue-50 dark:bg-blue-950/30"
              >
                {{ accountSummary.typeLabel }}
              </UBadge>
              <UBadge
                v-if="accountSummary.tope"
                color="error"
                variant="outline"
                class="text-red-800 dark:text-red-100 bg-red-50 dark:bg-red-950/30"
              >
                Límite: {{ formatCompactCurrency(accountSummary.tope) }}
              </UBadge>
              <UBadge
                v-else-if="accountSummary.tope === null"
                color="neutral"
                variant="outline"
                class="text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-950/30"
              >
                Sin Límites
              </UBadge>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-primary-600 dark:text-primary-400 font-semibold text-2xl">
              {{ (accountSummary.tna * 100).toFixed(2) }}%
            </div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400">
              TNA
              <div v-if="accountSummary.fecha">
                vigente desde el {{ formatDate(accountSummary.fecha) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <UAlert v-if="error" color="red" variant="soft" title="Error cargando historial" />

    <FundsLoading v-if="loading" />

    <div v-else-if="history && history.length > 0" class="space-y-6">
      <h2 class="font-semibold text-2xl text-neutral-900 dark:text-white">Historial</h2>
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
        <AccountHistoryTNAChart
          :history="history"
          :provider-name="displayName"
          :zoom-range="tnaZoom"
          @zoom-start="onTnaZoomStart"
          @zoom-end="onTnaZoomEnd"
          @zoom-reset="onZoomReset"
        />
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
        <AccountHistoryTopeChart
          :history="history"
          :provider-name="displayName"
          :zoom-range="topeZoom"
          @zoom-start="onTopeZoomStart"
          @zoom-end="onTopeZoomEnd"
          @zoom-reset="onZoomReset"
        />
      </UCard>
    </div>

    <div v-else-if="!loading" class="text-center py-12">
      <p class="text-neutral-500">No hay datos históricos disponibles para este proveedor.</p>
    </div>
  </div>
</template>
