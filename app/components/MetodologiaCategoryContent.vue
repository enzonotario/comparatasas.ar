<script setup lang="ts">
import {
  methodologySections,
  type MethodologyBlock,
  type MethodologySection,
} from '~/lib/methodology'

const props = defineProps<{
  categoryId: string
}>()

const sections = computed(() =>
  methodologySections.filter((section) => section.category === props.categoryId),
)

function blockKey(section: MethodologySection, block: MethodologyBlock, index: number) {
  return `${section.id}-${block.type}-${index}`
}
</script>

<template>
  <div class="space-y-4 mt-4">
    <UCard
      v-for="section in sections"
      :id="section.id"
      :key="section.id"
      class="scroll-mt-24"
      :ui="{ body: '!py-4' }"
    >
      <div class="space-y-3">
        <h3 class="text-base font-semibold text-neutral-900 dark:text-white">
          {{ section.title }}
        </h3>

        <p
          v-if="section.source"
          class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 break-all"
        >
          Fuente: {{ section.source }}
        </p>

        <div class="space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          <template v-for="(block, index) in section.blocks" :key="blockKey(section, block, index)">
            <p v-if="block.type === 'p'">{{ block.text }}</p>
            <ul
              v-else-if="block.type === 'ul'"
              class="list-disc list-inside space-y-1 ml-1 marker:text-neutral-400"
            >
              <li v-for="(item, itemIndex) in block.items" :key="itemIndex">{{ item }}</li>
            </ul>
            <p
              v-else-if="block.type === 'formula'"
              class="rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
            >
              {{ block.text }}
            </p>
          </template>
        </div>
      </div>
    </UCard>

    <UCard class="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
      <p class="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
        Los rendimientos pasados no garantizan resultados futuros. Verificá siempre condiciones,
        comisiones, impuestos y vigencia directamente con cada entidad antes de invertir.
      </p>
    </UCard>
  </div>
</template>
