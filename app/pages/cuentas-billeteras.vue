<script setup lang="ts">
useSeoMeta({
  title: 'Cuentas Remuneradas y Billeteras - comparatasas.ar',
  description:
    'Compará las mejores tasas de cuentas remuneradas y billeteras digitales en Argentina. Encontrá rendimientos competitivos para tu dinero con condiciones especiales.',
  ogTitle: 'Cuentas Remuneradas y Billeteras - comparatasas.ar',
  ogDescription:
    'Compará las mejores tasas de cuentas remuneradas y billeteras digitales en Argentina. Encontrá rendimientos competitivos para tu dinero con condiciones especiales.',
})

const { allFundsCache, loading, error } = useFunds()
const { accounts, loading: loadingAccounts } = useAccounts()

const resolvedAccounts = computed(() => {
  return accounts.value.filter((i) => i?.fondo !== 'Fiwind')
})

const resolvedFundsAccounts = computed(() => {
  return [
    ...allFundsCache.value.filter((i) => i?.meta?.showInAccounts),
    ...accounts.value
      .filter((i) => i?.fondo === 'Fiwind')
      .map((i) => ({
        ...i,
        type: null,
        typeLabel: null,
      })),
  ].sort((a, b) => b.tna - a.tna)
})
</script>

<template>
  <div>
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 id="cuentas-remuneradas" class="text-lg font-medium scroll-mt-16">
          Cuentas Remuneradas
        </h2>
      </div>

      <UAlert v-if="error" color="red" variant="soft" title="Error cargando datos" />

      <FundsLoading v-if="loadingAccounts && !resolvedAccounts.length" />

      <FundsList v-else :items="resolvedAccounts" key-prop="fondo" mode="detailed"> </FundsList>
    </div>

    <div class="mt-6">
      <div class="flex items-center justify-between mb-2">
        <h2 id="fondos-comunes" class="text-lg font-medium scroll-mt-16">Fondos Comunes</h2>
      </div>

      <UAlert v-if="error" color="red" variant="soft" title="Error cargando fondos" />

      <div class="space-y-3">
        <FundsList
          v-if="resolvedFundsAccounts.length"
          :items="resolvedFundsAccounts"
          key-prop="fondo"
          mode="detailed"
        />

        <FundsLoading v-if="loading || loadingAccounts" />
      </div>
    </div>
  </div>
</template>
