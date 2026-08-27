<script setup lang="ts">
import { METODOLOGIA_DEFAULT_CATEGORY } from '~/lib/metodologia-nav'

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
</script>

<template>
  <UContainer class="w-full mx-auto space-y-8 max-w-6xl px-0">
    <MetodologiaNavTabs />
    <MetodologiaCategoryContent :category-id="METODOLOGIA_DEFAULT_CATEGORY" />
  </UContainer>
</template>
