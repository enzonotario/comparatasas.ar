<script setup lang="ts">
import { getSumarseEndpoint, SUMARSE_DEFAULT_ENDPOINT } from '~/lib/sumarse-endpoints'

const spec = getSumarseEndpoint(SUMARSE_DEFAULT_ENDPOINT)!

definePageMeta({
  pageTitle: 'Integrar tu servicio',
  pageDescription:
    'El listado en ComparaTasas.ar es gratuito. Integrá tu app o servicio de tasas proveyendo un endpoint con tus datos.',
})

useSeoMeta({
  title: 'Integrar tu servicio',
  description:
    'Integrá tu servicio de tasas en Compara Tasas. Listado gratuito para proveedores de tasas de interés y entidades financieras.',
  ogTitle: 'Integrar tu servicio - ComparaTasas.ar',
  ogDescription:
    'Integrá tu servicio de tasas en Compara Tasas. Listado gratuito para proveedores de tasas de interés y entidades financieras.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/sumarse' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/sumarse' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/sumarse' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Integrar tu servicio - Compara Tasas',
        description: 'Sumá tu entidad financiera o servicio de tasas a Compara Tasas.',
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
  <SumarsePageShell>
    <SumarseEndpointPanel :spec="spec" />
  </SumarsePageShell>
</template>
