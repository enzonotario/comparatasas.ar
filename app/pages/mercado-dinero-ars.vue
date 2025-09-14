<script setup lang="ts">
const { data, loading, error } = useFunds()

const funds = computed(() => {
  return data.value.mercadoDinero.filter((i) => i?.meta?.showInFunds)
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h2 id="mercado-dinero-ars" class="text-lg font-medium scroll-mt-16">Mercado Dinero ARS</h2>
    </div>

    <UAlert v-if="error" color="red" variant="soft" title="Error cargando fondos" />

    <FundsLoading v-if="loading && !funds.length" />

    <FundsList v-else :items="funds" key-prop="fondo" mode="detailed"> </FundsList>
  </div>
</template>
