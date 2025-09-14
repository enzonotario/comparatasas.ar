<script setup lang="ts">
const { allFundsCache, loading, error, fetch } = useFunds()
const { accounts, loading: loadingAccounts, fetch: fetchAccounts } = useAccounts()

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

onMounted(() => {
  fetchAccounts()
  fetch()
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

      <FundsLoading v-if="loading && !resolvedFundsAccounts.length" />

      <FundsList v-else :items="resolvedFundsAccounts" key-prop="fondo" mode="detailed" />
    </div>
  </div>
</template>
