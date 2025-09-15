<script setup lang="ts">
useSeoMeta({
  title: 'Plazos Fijos - Mejores Tasas Argentina',
  description:
    'Compará las mejores tasas de plazos fijos en Argentina. Encontrá los bancos con mayor rendimiento para tus plazos fijos tradicionales y UVA actualizados diariamente.',
  ogTitle: 'Plazos Fijos - Mejores Tasas Argentina',
  ogDescription:
    'Compará las mejores tasas de plazos fijos en Argentina. Encontrá los bancos con mayor rendimiento para tus plazos fijos tradicionales y UVA actualizados diariamente.',
})

const { plazosFijosItems, loading, error } = usePlazosFijos()
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h2 id="plazos-fijos" class="text-lg font-medium scroll-mt-16">Plazos Fijos</h2>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Error cargando plazos fijos" />

    <FundsLoading v-if="loading && !plazosFijosItems.length" />

    <FundsList v-else :items="plazosFijosItems" mode="simple" />

    <div v-if="!loading && !plazosFijosItems.length" class="text-center py-8">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No se encontraron plazos fijos
      </h3>
      <p class="text-muted">No hay plazos fijos disponibles en este momento.</p>
    </div>
  </div>
</template>
