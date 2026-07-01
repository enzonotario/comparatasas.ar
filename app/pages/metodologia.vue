<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import {
  methodologyCategories,
  methodologySections,
  type MethodologyBlock,
  type MethodologySection,
} from '~/lib/methodology'

type MethodologyTab = (typeof methodologyCategories)[number]['id']

definePageMeta({
  pageTitle: 'Metodología de cálculos',
  pageDescription:
    'Cómo comparatasas.ar obtiene y calcula las tasas, rendimientos y simulaciones para cada tipo de producto.',
})

useSeoMeta({
  title: 'Metodología de cálculos',
  description:
    'Explicación de las fuentes de datos y fórmulas usadas en Compara Tasas para cuentas remuneradas, FCI, plazos fijos, LECAPs, crypto y más.',
  ogTitle: 'Metodología de cálculos - Compara Tasas',
  ogDescription:
    'Explicación de las fuentes de datos y fórmulas usadas en Compara Tasas para cuentas remuneradas, FCI, plazos fijos, LECAPs, crypto y más.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/metodologia' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/metodologia' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/metodologia' },
  ],
})

const sectionsByCategory = computed(() => {
  return methodologyCategories
    .map((category) => ({
      ...category,
      sections: methodologySections.filter((section) => section.category === category.id),
    }))
    .filter((group) => group.sections.length > 0)
})

const validMethodologyTabs = new Set<MethodologyTab>(
  sectionsByCategory.value.map((group) => group.id as MethodologyTab),
)

const defaultMethodologyTab = sectionsByCategory.value[0]!.id as MethodologyTab

const methodologyTabQuery = useRouteQuery<MethodologyTab>('tab', defaultMethodologyTab)

const selectedMethodologyTab = computed<MethodologyTab>({
  get: () =>
    validMethodologyTabs.has(methodologyTabQuery.value as MethodologyTab)
      ? (methodologyTabQuery.value as MethodologyTab)
      : defaultMethodologyTab,
  set: (value) => {
    methodologyTabQuery.value = value
  },
})

const methodologyTabs = computed<TabsItem[]>(() =>
  sectionsByCategory.value.map((group) => ({
    label: group.label,
    value: group.id,
    slot: group.id,
  })),
)

function blockKey(section: MethodologySection, block: MethodologyBlock, index: number) {
  return `${section.id}-${block.type}-${index}`
}
</script>

<template>
  <UContainer class="w-full mx-auto space-y-8 max-w-6xl px-0">
    <UTabs
      v-model="selectedMethodologyTab"
      :items="methodologyTabs"
      variant="link"
      class="w-full"
      :ui="{
        list: 'flex-nowrap overflow-x-auto overflow-y-hidden',
        indicator: 'hidden',
        trigger: 'whitespace-nowrap shrink-0',
      }"
    >
      <template v-for="group in sectionsByCategory" :key="group.id" #[group.id]>
        <div class="space-y-4 mt-4">
          <UCard
            v-for="section in group.sections"
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
                <template
                  v-for="(block, index) in section.blocks"
                  :key="blockKey(section, block, index)"
                >
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
        </div>
      </template>
    </UTabs>

    <UCard class="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
      <p class="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
        Los rendimientos pasados no garantizan resultados futuros. Verificá siempre condiciones,
        comisiones, impuestos y vigencia directamente con cada entidad antes de invertir.
      </p>
    </UCard>
  </UContainer>
</template>
