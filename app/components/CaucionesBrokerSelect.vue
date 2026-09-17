<script setup lang="ts">
import type { BrokerOption } from '~/composables/useCaucionesBrokerSelection'

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    items: BrokerOption[]
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    size: 'sm',
  },
)

const selectedOption = computed(() => props.items.find((item) => item.value === model.value))
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    value-key="value"
    label-key="label"
    :size="size"
    :ui="{
      content: 'min-w-56',
      base: 'h-auto min-h-7 py-1',
      value: 'w-full min-w-0',
    }"
  >
    <template #default="{ modelValue }">
      <span
        v-if="selectedOption"
        class="flex w-full min-w-0 flex-col items-start gap-0 leading-tight text-left"
      >
        <span class="w-full truncate font-medium">{{ selectedOption.label }}</span>
        <span class="w-full truncate text-[0.65rem] leading-none tabular-nums text-muted">
          {{ selectedOption.description }}
        </span>
      </span>
      <span v-else-if="modelValue" class="truncate">{{ modelValue }}</span>
      <span v-else class="text-muted">&nbsp;</span>
    </template>

    <template #item-trailing="{ item }">
      <span class="text-xs tabular-nums text-muted">{{ item.description }}</span>
    </template>
  </USelect>
</template>
