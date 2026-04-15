<script setup lang="ts">
import type { HipotecarioUVA } from '../composables/useHipotecariosUVA'
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '../lib/mappings/institutions'

const props = defineProps<{
  hipotecarios: HipotecarioUVA[]
}>()

const items = computed(() => {
  return props.hipotecarios.map((hipotecario) => {
    const logo =
      getInstitutionLogo(hipotecario.entidad) || getInstitutionLogo(hipotecario.nombreComercial)
    const institution = getInstitutionShortName(hipotecario.entidad) || hipotecario.nombreComercial
    const url =
      getInstitutionUrl(hipotecario.entidad) ||
      getInstitutionUrl(hipotecario.nombreComercial) ||
      '#'

    return {
      ...hipotecario,
      logo,
      institution,
      url,
      tna: hipotecario.tna,
    }
  })
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <a
      v-for="(item, index) in items"
      :key="`${item.nombreComercial}-${index}`"
      :href="item.url !== '#' ? item.url : undefined"
      :target="item.url !== '#' ? '_blank' : undefined"
      :rel="item.url !== '#' ? 'noopener noreferrer' : undefined"
    >
      <UCard :ui="{ body: '!py-3', root: 'hover:ring-indigo-500 dark:hover:ring-indigo-400' }">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div>
                <img
                  v-if="item.logo"
                  :src="item.logo"
                  :alt="item.institution"
                  referrerpolicy="no-referrer"
                  class="size-12 rounded-full object-cover"
                />
                <div v-else class="size-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>

              <div class="flex flex-col gap-1 flex-1">
                <div class="font-medium">
                  {{ item.institution }}
                </div>

                <div class="flex items-center gap-1 flex-wrap">
                  <UBadge
                    v-if="item.metadata?.plazo_max_anios != null"
                    color="error"
                    variant="outline"
                    class="text-red-800 dark:text-red-100 bg-red-50 dark:bg-red-950/30"
                  >
                    {{ item.metadata.plazo_max_anios }} años
                  </UBadge>
                  <UBadge
                    v-if="item.metadata?.relacion_cuota_ingreso"
                    color="neutral"
                    variant="outline"
                    class="text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-950/30"
                  >
                    Cuota/ingreso {{ item.metadata.relacion_cuota_ingreso }}
                  </UBadge>
                  <UBadge
                    v-if="item.metadata?.financiamiento"
                    color="neutral"
                    variant="outline"
                    class="text-neutral-800 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-950/30"
                  >
                    Financiamiento {{ item.metadata.financiamiento }}
                  </UBadge>
                </div>
              </div>
            </div>

            <div class="text-right space-y-1">
              <div class="text-primary-600 dark:text-primary-400 font-semibold">
                {{ item.tna.toFixed(1) }}%
              </div>
              <div class="text-xs text-neutral">TNA</div>
            </div>
          </div>
        </div>
      </UCard>
    </a>
  </div>
</template>
