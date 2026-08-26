<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useRouteQuery } from '@vueuse/router'
import {
  DEFAULT_DOLAR_CASA,
  isDolarCasa,
  type DolarCasa,
} from '~/composables/useDolarHistorico'
import { ogUpdatedAtDate, top3Hipotecarios } from '~/utils/og-data'

type HipotecariosTab = 'tasas' | 'uva-dolar' | 'simulador'

definePageMeta({
  pageTitle: 'Créditos Hipotecarios UVA',
  pageDescription:
    'Comparativa de tasas hipotecarias UVA en Argentina y proyección de cuotas mensuales.',
})

const { data: ogItems } = await useAsyncData('og-hipotecarios', () =>
  $fetch<Array<{ nombreComercial: string; tna: number }>>(
    'https://api.argentinadatos.com/v1/finanzas/creditos/hipotecariosUva/',
  ).then((r) => top3Hipotecarios(r.map((i) => ({ ...i, tna: i.tna * 100 })))),
)

defineOgImage('ComparaTasas.takumi', {
  title: 'Mejores Hipotecarios UVA',
  items: ogItems.value ?? [],
  updatedAt: ogUpdatedAtDate(),
})

useSeoMeta({
  title: 'Créditos Hipotecarios UVA',
  description:
    'Compará mejores tasas de créditos hipotecarios UVA en Argentina. Proyección de cuotas mensuales con inflación histórica y estimada.',
  ogTitle: 'Créditos Hipotecarios UVA - Compara Tasas Argentina',
  ogDescription:
    'Compará mejores tasas de créditos hipotecarios UVA en Argentina. Proyección de cuotas mensuales con inflación histórica y estimada.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/creditos-hipotecarios-uva' },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Créditos Hipotecarios UVA - Compara Tasas',
        description: 'Comparativa de créditos hipotecarios UVA en Argentina.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})

const tabQuery = useRouteQuery<HipotecariosTab | undefined>('tab', undefined)
const dolarQuery = useRouteQuery<string | undefined>('dolar', undefined)

const selectedTab = computed<HipotecariosTab>({
  get: () => {
    const value = tabQuery.value
    if (value === 'uva-dolar' || value === 'simulador') return value
    return 'tasas'
  },
  set: (value) => {
    tabQuery.value = value === 'tasas' ? undefined : value
  },
})

const dolarCasa = computed<DolarCasa>({
  get: () => {
    const value = dolarQuery.value
    return value && isDolarCasa(value) ? value : DEFAULT_DOLAR_CASA
  },
  set: (value) => {
    dolarQuery.value = value === DEFAULT_DOLAR_CASA ? undefined : value
  },
})

const hipotecariosTabs = computed<TabsItem[]>(() => [
  {
    label: 'Tasas',
    icon: 'i-lucide-percent',
    value: 'tasas',
    slot: 'tasas',
  },
  {
    label: 'UVA vs dólar',
    icon: 'i-lucide-chart-line',
    value: 'uva-dolar',
    slot: 'uva-dolar',
  },
  {
    label: 'Simulador',
    icon: 'i-lucide-calculator',
    value: 'simulador',
    slot: 'simulador',
  },
])
</script>

<template>
  <div class="space-y-6">
    <div
      class="w-full mx-auto"
      :class="selectedTab === 'simulador' ? 'max-w-none' : 'max-w-3xl'"
    >
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div class="flex flex-col">
          <h2 class="text-xl font-bold">Créditos Hipotecarios UVA</h2>
        </div>
        <div class="flex flex-row">
          <TwitterAttribution
            usuario="SalinasAndres"
            nombre="Andrés Salinas"
            avatar="https://pbs.twimg.com/profile_images/1802830575759224832/vKHC7OK1_400x400.jpg"
            url="https://x.com/SalinasAndres"
            medium="creditos-hipotecarios-uva"
          />
        </div>
      </div>

      <UTabs
        v-model="selectedTab"
        :items="hipotecariosTabs"
        variant="link"
        class="w-full"
        :ui="{
          list: 'flex-nowrap overflow-x-auto overflow-y-hidden',
          indicator: 'hidden',
          trigger: 'whitespace-nowrap shrink-0',
        }"
      >
        <template #tasas>
          <HipotecariosUVATasasTab />
        </template>

        <template #uva-dolar>
          <HipotecariosUVAPoderCompraTab v-model:dolar-casa="dolarCasa" />
        </template>

        <template #simulador>
          <HipotecariosUVASimuladorTab />
        </template>
      </UTabs>
    </div>

    <section
      class="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800 space-y-6 text-neutral-700 dark:text-neutral-300"
    >
      <div class="flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            ¿Qué son los Créditos Hipotecarios UVA?
          </h3>
          <p>
            Los <strong>Créditos Hipotecarios UVA</strong> son préstamos para la vivienda cuyas
            cuotas se ajustan según la <strong>Unidad de Valor Adquisitivo (UVA)</strong>, la cual
            varía diariamente en función del índice de inflación (CER).
          </p>
          <p>
            A diferencia de los créditos de tasa fija, los préstamos UVA suelen tener una tasa de
            interés nominal mucho más baja, ya que el capital se indexa por inflación. Esto permite
            que la cuota inicial sea más accesible para muchas familias, aunque el saldo adeudado
            también se ajusta con el tiempo.
          </p>
        </div>
        <div class="space-y-4 text-sm leading-relaxed">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white">
            Ventajas y Consideraciones
          </h3>
          <ul class="list-disc list-inside space-y-2">
            <li>
              <strong>Accesibilidad inicial:</strong> Las cuotas de entrada suelen ser más bajas que
              en un crédito tradicional.
            </li>
            <li>
              <strong>Relación cuota-ingreso:</strong> En general, la cuota se mantiene estable en
              relación con los salarios si estos acompañan a la inflación.
            </li>
            <li>
              <strong>Riesgo inflacionario:</strong> El capital adeudado crece nominalmente si la
              inflación es alta.
            </li>
            <li>
              <strong>Comparación de tasas:</strong> Cada banco ofrece una tasa adicional sobre la
              UVA (ej: UVA + 3.5% o UVA + 5%). Comparar estas tasas es clave para ahorrar a largo
              plazo.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
