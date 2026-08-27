<script setup lang="ts">
import {
  endpointSpecs,
  getSumarseEndpoint,
  SUMARSE_DEFAULT_ENDPOINT,
} from '~/lib/sumarse-endpoints'

definePageMeta({
  pageTitle: 'Integrar tu servicio',
  pageDescription:
    'El listado en ComparaTasas.ar es gratuito. Integrá tu app o servicio de tasas proveyendo un endpoint con tus datos.',
})

const route = useRoute()
const endpoint = route.params.endpoint as string
const resolved = getSumarseEndpoint(endpoint)

if (endpoint === SUMARSE_DEFAULT_ENDPOINT || !resolved) {
  await navigateTo('/sumarse', { redirectCode: 301, replace: true })
}

const spec = resolved ?? endpointSpecs[0]!

const seoTitle = `Integrar: ${spec.label}`

route.meta.pageTitle = seoTitle

useSeoMeta({
  title: seoTitle,
  description:
    'Integrá tu servicio de tasas en Compara Tasas. Listado gratuito para proveedores de tasas de interés y entidades financieras.',
  ogTitle: `${seoTitle} - ComparaTasas.ar`,
  ogDescription:
    'Integrá tu servicio de tasas en Compara Tasas. Listado gratuito para proveedores de tasas de interés y entidades financieras.',
})

const canonicalUrl = `https://comparatasas.ar/sumarse/${endpoint}`

useHead({
  link: [
    { rel: 'canonical', href: canonicalUrl },
    { rel: 'alternate', hreflang: 'es-AR', href: canonicalUrl },
    { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl },
  ],
})
</script>

<template>
  <SumarsePageShell>
    <SumarseEndpointPanel :spec="spec" />
  </SumarsePageShell>
</template>
