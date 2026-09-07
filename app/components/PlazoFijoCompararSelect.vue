<script setup lang="ts">
import { STANDARD_PLAZO_COLUMNS } from '~/lib/plazo-fijo-rates'

export type PlazoFijoCompararOption = {
  value: string
  label: string
  /** TNA % por clave de columna estándar; null si el proveedor no publica ese plazo. */
  ratesByPlazo: Record<string, number | null>
  /** Resumen corto para el trigger cerrado. */
  description: string
}

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    items: PlazoFijoCompararOption[]
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    size: 'sm',
  },
)

const plazoColumns = STANDARD_PLAZO_COLUMNS

const selectedOption = computed(() => props.items.find((item) => item.value === model.value))

function formatTna(tna: number | null | undefined): string {
  if (tna == null || !(tna > 0)) return '—'
  return `${tna.toFixed(2)}%`
}
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    value-key="value"
    label-key="label"
    :size="size"
    :ui="{
      content: 'min-w-[20rem] sm:min-w-[24rem]',
      base: 'h-auto min-h-7 py-1',
      value: 'w-full min-w-0',
      item: 'py-1.5',
    }"
  >
    <template #default="{ modelValue }">
      <span
        v-if="selectedOption"
        class="flex w-full min-w-0 flex-col items-start gap-0.5 leading-tight text-left"
      >
        <span class="w-full truncate font-medium">{{ selectedOption.label }}</span>
        <span
          class="grid w-full grid-cols-4 gap-x-1 text-[0.65rem] leading-none tabular-nums text-muted"
        >
          <span
            v-for="column in plazoColumns"
            :key="column.key"
            class="truncate text-center"
            :title="`${column.label}: ${formatTna(selectedOption.ratesByPlazo[column.key])}`"
          >
            <span class="text-muted/80">{{ column.label }}</span>
            {{ formatTna(selectedOption.ratesByPlazo[column.key]) }}
          </span>
        </span>
      </span>
      <span v-else-if="modelValue" class="truncate">{{ modelValue }}</span>
      <span v-else class="text-muted">&nbsp;</span>
    </template>

    <template #content-top>
      <div
        class="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-default bg-default px-2 py-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted"
      >
        <span>Banco</span>
        <div class="grid w-[11.5rem] grid-cols-4 gap-1 text-center sm:w-[13rem]">
          <span v-for="column in plazoColumns" :key="column.key">{{ column.label }}</span>
        </div>
      </div>
    </template>

    <template #item="{ item }">
      <div class="flex w-full min-w-0 items-center justify-between gap-2">
        <span class="min-w-0 flex-1 truncate font-medium">{{ item.label }}</span>
        <div
          class="grid w-[11.5rem] shrink-0 grid-cols-4 gap-1 text-center text-[0.7rem] tabular-nums sm:w-[13rem]"
        >
          <span
            v-for="column in plazoColumns"
            :key="column.key"
            :class="
              (item.ratesByPlazo?.[column.key] ?? 0) > 0
                ? 'font-medium text-default'
                : 'text-muted'
            "
          >
            {{ formatTna(item.ratesByPlazo?.[column.key]) }}
          </span>
        </div>
      </div>
    </template>
  </USelect>
</template>
