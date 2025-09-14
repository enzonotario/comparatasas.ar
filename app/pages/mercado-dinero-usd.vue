<script setup lang="ts">
const { data, fetch, loading, error } = useFunds()

const allItems = computed(() => {
  return [
    ...data.value.rentaFija.filter((i) => i?.meta?.showInUsdMoneyMarket),
    ...data.value.mercadoDinero.filter((i) => i?.meta?.showInUsdMoneyMarket),
  ]
})

onMounted(() => {
  fetch()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h2 id="mercado-dinero-usd" class="text-lg font-medium scroll-mt-16">Mercado Dinero USD</h2>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Error cargando datos" />

    <FundsLoading v-if="loading && !allItems.length" />

    <FundsList v-else :items="allItems" key-prop="fondo" mode="detailed"> </FundsList>

    <div v-if="!loading && !allItems.length" class="text-center py-8">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No se encontraron productos
      </h3>
      <p class="text-muted">
        No hay productos de mercado de dinero en USD disponibles en este momento.
      </p>
    </div>
  </div>
</template>
