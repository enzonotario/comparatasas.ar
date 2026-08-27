<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router'
import {
  DEFAULT_DOLAR_CASA,
  isDolarCasa,
  type DolarCasa,
} from '~/composables/useDolarHistorico'

definePageMeta({
  pageTitle: 'UVA vs dólar — Créditos Hipotecarios UVA',
  pageDescription:
    'Comparativa de tasas hipotecarias UVA en Argentina y proyección de cuotas mensuales.',
})

const dolarQuery = useRouteQuery<string | undefined>('dolar', undefined)

const dolarCasa = computed<DolarCasa>({
  get: () => {
    const value = dolarQuery.value
    return value && isDolarCasa(value) ? value : DEFAULT_DOLAR_CASA
  },
  set: (value) => {
    dolarQuery.value = value === DEFAULT_DOLAR_CASA ? undefined : value
  },
})

useSeoMeta({
  title: 'UVA vs dólar - Créditos Hipotecarios UVA',
  description:
    'Compará la evolución del poder de compra UVA frente al dólar para evaluar créditos hipotecarios indexados en Argentina.',
  ogTitle: 'UVA vs dólar - Créditos Hipotecarios UVA',
  ogDescription:
    'Gráfico histórico del ratio UVA/dólar para analizar créditos hipotecarios UVA en Argentina.',
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva/uva-dolar',
    },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva/uva-dolar',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva/uva-dolar',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'UVA vs dólar - Créditos Hipotecarios UVA',
        description:
          'Evolución del poder de compra UVA frente al dólar para créditos hipotecarios en Argentina.',
        publisher: {
          '@type': 'Organization',
          name: 'Compara Tasas',
          url: 'https://comparatasas.ar',
        },
      }),
    },
  ],
})
</script>

<template>
  <HipotecariosUVAPageShell>
    <HipotecariosUVAPoderCompraTab v-model:dolar-casa="dolarCasa" />
  </HipotecariosUVAPageShell>
</template>
