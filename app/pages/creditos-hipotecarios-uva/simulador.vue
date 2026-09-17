<script setup lang="ts">
definePageMeta({
  pageTitle: 'Simulador — Créditos Hipotecarios UVA',
  pageDescription:
    'Simulador de cuotas para créditos hipotecarios UVA con inflación histórica y proyecciones.',
})

useSeoMeta({
  title: 'Simulador - Créditos Hipotecarios UVA',
  description:
    'Simulá cuotas mensuales de créditos hipotecarios UVA en Argentina con inflación histórica, REM y proyecciones personalizadas.',
  ogTitle: 'Simulador - Créditos Hipotecarios UVA',
  ogDescription:
    'Calculá cuotas proyectadas de créditos hipotecarios UVA con distintos escenarios de inflación.',
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva/simulador',
    },
    {
      rel: 'alternate',
      hreflang: 'es-AR',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva/simulador',
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: 'https://comparatasas.ar/creditos-hipotecarios-uva/simulador',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Simulador - Créditos Hipotecarios UVA',
        description: 'Simulador de cuotas para créditos hipotecarios UVA en Argentina.',
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
  <HipotecariosUVAPageShell wide>
    <HipotecariosUVASimuladorTab />
  </HipotecariosUVAPageShell>
</template>
