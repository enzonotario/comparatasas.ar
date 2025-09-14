<script setup lang="ts">
useSeoMeta({
  title: 'Fondos Renta Fija USD - Mejores Tasas Argentina',
  description:
    'Compará los mejores fondos de renta fija en dólares estadounidenses. Encontrá rendimientos estables en USD con fondos de bonos dolarizados de Argentina.',
  ogTitle: 'Fondos Renta Fija USD - Mejores Tasas Argentina',
  ogDescription:
    'Compará los mejores fondos de renta fija en dólares estadounidenses. Encontrá rendimientos estables en USD con fondos de bonos dolarizados de Argentina.',
})

const { data, loading, error } = useFunds()

const funds = computed(() => {
  return data.value.rentaFija.filter((i) => i?.meta?.showInUsdFunds)
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h2 id="renta-fija-usd" class="text-lg font-medium scroll-mt-16">Renta Fija USD</h2>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Error cargando fondos" />

    <FundsLoading v-if="loading && !funds.length" />

    <div v-else class="space-y-2">
      <FundsList :items="funds" key-prop="fondo" mode="detailed"> </FundsList>
    </div>

    <div v-if="!loading && !funds.length" class="text-center py-8">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No se encontraron fondos
      </h3>
      <p class="text-muted">No hay fondos de renta fija en USD disponibles en este momento.</p>
    </div>
  </div>
</template>
