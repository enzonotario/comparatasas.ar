<script setup lang="ts">
useSeoMeta({
  title: 'Cuentas Remuneradas y Billeteras - comparatasas.ar',
  description:
    'Compará las mejores tasas de cuentas remuneradas y billeteras digitales en Argentina. Encontrá rendimientos competitivos para tu dinero con condiciones especiales.',
  ogTitle: 'Cuentas Remuneradas y Billeteras - comparatasas.ar',
  ogDescription:
    'Compará las mejores tasas de cuentas remuneradas y billeteras digitales en Argentina. Encontrá rendimientos competitivos para tu dinero con condiciones especiales.',
})

const { allFundsCache, data, loading, error } = useFunds()
const { accounts, loading: loadingAccounts, specialAccounts } = useAccounts()

const resolvedFundsAccounts = computed(() => {
  const accountsFunds = allFundsCache.value.filter((i) => i?.meta?.showInAccounts)
  const mercadoDineroFunds = data.value.mercadoDinero.filter((i) => i?.meta?.showInFunds)
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

const fundsByRisk = computed(() => {
  const grouped: Record<string, typeof resolvedFundsAccounts.value> = {
    'Riesgo muy bajo': [],
    'Riesgo moderado': [],
  }

  resolvedFundsAccounts.value.forEach((fund) => {
    if (
      fund.type === 'mercadoDinero' ||
      ['Money Market', 'Renta Mixta'].includes(fund.typeLabel || '')
    ) {
      grouped['Riesgo muy bajo'].push(fund)
    } else if (fund.type === 'rentaFija' || ['Renta Fija'].includes(fund.typeLabel || '')) {
      grouped['Riesgo moderado'].push(fund)
    } else {
      grouped['Riesgo muy bajo'].push(fund)
    }
  })

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => b.tna - a.tna)
  })

  return grouped
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <div class="mb-2">
        <div class="group relative">
          <NuxtLink
            to="#rendimiento-garantizado"
            class="-ml-4.5 flex items-center gap-2 no-underline"
          >
            <span
              class="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              #
            </span>
            <h2 id="rendimiento-garantizado" class="text-lg font-medium scroll-mt-22">
              Rendimiento garantizado
            </h2>
          </NuxtLink>
        </div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Cuentas remuneradas y billeteras con tasa fija garantizada
        </p>
      </div>

      <UAlert v-if="error" color="red" variant="soft" title="Error cargando datos" />

      <FundsLoading v-if="loadingAccounts && !accounts.length" />

      <FundsList v-else :items="accounts" key-prop="fondo" mode="detailed"> </FundsList>
    </div>

    <div>
      <div class="mb-2">
        <div class="group relative">
          <NuxtLink
            to="#condiciones-especiales"
            class="-ml-4.5 flex items-center gap-2 no-underline"
          >
            <span
              class="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              #
            </span>
            <h2 id="condiciones-especiales" class="text-lg font-medium scroll-mt-22">
              Con condiciones especiales
            </h2>
          </NuxtLink>
        </div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Productos con requisitos o condiciones particulares para acceder
        </p>
      </div>

      <UAlert v-if="error" color="red" variant="soft" title="Error cargando datos" />

      <FundsLoading v-if="loadingAccounts && !accounts.length" />

      <FundsList v-else :items="specialAccounts" key-prop="fondo" mode="detailed"> </FundsList>
    </div>

    <div>
      <div class="mb-2">
        <div class="group relative">
          <NuxtLink to="#rendimiento-variable" class="-ml-4.5 flex items-center gap-2 no-underline">
            <span
              class="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              #
            </span>
            <h2 id="rendimiento-variable" class="text-lg font-medium scroll-mt-22">
              Rendimiento variable
            </h2>
          </NuxtLink>
        </div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Fondos comunes de inversión con rendimiento que puede variar según el mercado
        </p>
      </div>

      <UAlert v-if="error" color="red" variant="soft" title="Error cargando fondos" />

      <div class="space-y-6">
        <div v-for="(funds, riskKey) in fundsByRisk" :key="riskKey">
          <div v-if="funds.length > 0" class="space-y-3">
            <h3 class="text-base font-medium text-neutral-700 dark:text-neutral-300">
              {{ riskKey }}
            </h3>
            <FundsList :items="funds" key-prop="fondo" mode="detailed" />
          </div>
        </div>

        <FundsLoading v-if="loading || loadingAccounts" />
      </div>
    </div>
  </div>
</template>
