<script setup lang="ts">
import TNABarChart from '~/components/charts/TNABarChart.vue'
import TopeTnaScatterChart from '~/components/charts/TopeTnaScatterChart.vue'
import FundsTNABarChart from '~/components/charts/FundsTNABarChart.vue'
import FundsPatrimonioBarChart from '~/components/charts/FundsPatrimonioBarChart.vue'
import FundsTNAPatrimonioScatterChart from '~/components/charts/FundsTNAPatrimonioScatterChart.vue'

useSeoMeta({
  title: 'Análisis Visual de Cuentas Remuneradas, Billeteras y FCI - comparatasas.ar',
  description:
    'Explora gráficos interactivos que comparan las tasas de cuentas remuneradas, billeteras digitales y fondos comunes de inversión en Argentina. Visualiza TNA, topes y patrimonios para tomar decisiones informadas.',
  ogTitle: 'Análisis Visual de Cuentas Remuneradas, Billeteras y FCI - comparatasas.ar',
  ogDescription:
    'Explora gráficos interactivos que comparan las tasas de cuentas remuneradas, billeteras digitales y fondos comunes de inversión en Argentina. Visualiza TNA, topes y patrimonios para tomar decisiones informadas.',
})

const { accounts, loading: loadingAccounts, specialAccounts, error: accountsError } = useAccounts()
const {
  allFundsCache,
  data: fundsData,
  loading: loadingFunds,
  error: fundsError,
  fetch: fetchFunds,
} = useFunds()

const isMounted = ref(false)

const allAccounts = computed(() => {
  return [...accounts.value, ...specialAccounts.value]
})

const hasData = computed(() => {
  return allAccounts.value.length > 0 && !loadingAccounts.value
})

const variableReturnFunds = computed(() => {
  const accountsFunds = allFundsCache.value.filter((i) => i?.meta?.showInAccounts)
  const mercadoDineroFunds = fundsData.value.mercadoDinero.filter((i) => i?.meta?.showInFunds)
  const combined = [...accountsFunds, ...mercadoDineroFunds]

  const seen = new Set<string>()
  const unique = combined.filter((item) => {
    const key = `${item.fondo}-${item.institution}-${item.displayName}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })

  return unique.sort((a, b) => b.tna - a.tna)
})

const hasFundsData = computed(() => {
  return variableReturnFunds.value.length > 0 && !loadingFunds.value
})

const { fetch: fetchAccounts } = useAccounts()

const tabsItems = [
  {
    label: 'Cuentas y Billeteras',
    icon: 'i-lucide-wallet',
    slot: 'accounts',
    value: 'accounts',
  },
  {
    label: 'Fondos Comunes de Inversión',
    icon: 'i-lucide-trending-up',
    slot: 'funds',
    value: 'funds',
  },
]

onMounted(() => {
  isMounted.value = true
  if (accounts.value.length === 0 && !loadingAccounts.value) {
    fetchAccounts()
  }
  if (allFundsCache.value.length === 0 && !loadingFunds.value) {
    fetchFunds()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
        Análisis Visual de Cuentas Remuneradas, Billeteras y Fondos Comunes de Inversión
      </h1>
    </div>

    <UTabs
      :items="tabsItems"
      variant="link"
      default-value="accounts"
      class="w-full"
      :ui="{
        list: 'sticky z-30 top-[var(--ui-header-height)] bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700',
      }"
    >
      <template #accounts>
        <div class="space-y-6 mt-6">
          <UAlert v-if="accountsError" color="red" variant="soft" title="Error cargando datos" />

          <FundsLoading v-if="loadingAccounts && !accounts.length" />

          <div v-if="!hasData && !loadingAccounts" class="text-center py-12">
            <p class="text-neutral-500">No hay datos disponibles para mostrar los gráficos.</p>
          </div>

          <div v-else-if="hasData && isMounted" class="space-y-6">
            <ClientOnly>
              <UCard>
                <template #header>
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-bar-chart-3"
                      class="size-5 text-primary-600 dark:text-primary-400"
                    />
                    <h3 class="font-semibold text-lg">Comparación de TNA</h3>
                  </div>
                </template>
                <TNABarChart :accounts="allAccounts" />
              </UCard>

              <UCard v-if="allAccounts.length > 0">
                <template #header>
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-scatter-chart"
                      class="size-5 text-primary-600 dark:text-primary-400"
                    />
                    <h3 class="font-semibold text-lg">TNA vs Tope</h3>
                  </div>
                </template>
                <TopeTnaScatterChart :accounts="allAccounts" />
              </UCard>
            </ClientOnly>
          </div>
        </div>
      </template>

      <template #funds>
        <div class="space-y-6 mt-6">
          <UAlert
            v-if="fundsError"
            color="red"
            variant="soft"
            title="Error cargando datos de fondos"
          />

          <FundsLoading v-if="loadingFunds && variableReturnFunds.length === 0" />

          <div v-if="!hasFundsData && !loadingFunds" class="text-center py-12">
            <p class="text-neutral-500">
              No hay datos disponibles para mostrar los gráficos de fondos.
            </p>
          </div>

          <div v-else-if="hasFundsData && isMounted" class="space-y-6">
            <ClientOnly>
              <UCard>
                <template #header>
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-bar-chart-3"
                      class="size-5 text-primary-600 dark:text-primary-400"
                    />
                    <h3 class="font-semibold text-lg">Comparación de TNA</h3>
                  </div>
                </template>
                <FundsTNABarChart :funds="variableReturnFunds" />
              </UCard>

              <UCard v-if="variableReturnFunds.some((f) => f.patrimonio && f.patrimonio > 0)">
                <template #header>
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-trending-up"
                      class="size-5 text-primary-600 dark:text-primary-400"
                    />
                    <h3 class="font-semibold text-lg">Comparación de Patrimonio</h3>
                  </div>
                </template>
                <FundsPatrimonioBarChart :funds="variableReturnFunds" />
              </UCard>

              <UCard v-if="variableReturnFunds.some((f) => f.patrimonio && f.patrimonio > 0)">
                <template #header>
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-scatter-chart"
                      class="size-5 text-primary-600 dark:text-primary-400"
                    />
                    <h3 class="font-semibold text-lg">TNA vs Patrimonio</h3>
                  </div>
                </template>
                <FundsTNAPatrimonioScatterChart :funds="variableReturnFunds" />
              </UCard>
            </ClientOnly>
          </div>
        </div>
      </template>
    </UTabs>
  </div>
</template>
