<script setup lang="ts">
import { computed } from 'vue'

import PlazosFijosTnaBarChart from '~/components/charts/PlazosFijosTnaBarChart.vue'
import { getInstitutionLogo, getInstitutionShortName } from '~/lib/mappings/institutions'

const {
  hipotecariosUVA,
  loading: loadingHipotecarios,
  error: errorHipotecarios,
} = useHipotecariosUVA()

const hipotecariosChartItems = computed(() => {
  return hipotecariosUVA.value.map((h) => ({
    institution: getInstitutionShortName(h.entidad) || h.nombreComercial,
    tna: h.tna,
    logo: getInstitutionLogo(h.entidad) || getInstitutionLogo(h.nombreComercial),
  }))
})
</script>

<template>
  <div class="mt-4 flex flex-col space-y-4 w-full">
    <UAlert
      v-if="errorHipotecarios"
      color="error"
      variant="soft"
      title="No se pudieron cargar los créditos hipotecarios UVA"
      description="Probá de nuevo en unos minutos."
    />

    <div v-if="loadingHipotecarios && !hipotecariosUVA.length" class="py-8">
      <FundsLoading />
    </div>

    <template v-else-if="hipotecariosUVA.length > 0">
      <HipotecariosUVAList :hipotecarios="hipotecariosUVA" />

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-bar-chart-3"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
            <h3 class="font-semibold text-lg">TNA por entidad</h3>
          </div>
        </template>
        <PlazosFijosTnaBarChart
          parent-group-name="Créditos hipotecarios UVA · TNA"
          preserve-tna-precision
          sort-tna-ascending
          :items="hipotecariosChartItems"
        />
      </UCard>
    </template>

    <div v-else-if="!loadingHipotecarios" class="text-center py-8">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-muted mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No se encontraron créditos hipotecarios UVA
      </h3>
      <p class="text-muted">No hay datos disponibles en este momento.</p>
    </div>
  </div>
</template>
