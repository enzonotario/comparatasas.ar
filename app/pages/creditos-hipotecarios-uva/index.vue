<script setup lang="ts">
import { ogUpdatedAtDate, top3Hipotecarios } from '~/utils/og-data'

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
</script>

<template>
  <HipotecariosUVAPageShell>
    <HipotecariosUVATasasTab />
  </HipotecariosUVAPageShell>
</template>
