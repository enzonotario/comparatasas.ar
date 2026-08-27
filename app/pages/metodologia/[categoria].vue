<script setup lang="ts">
import {
  getMetodologiaCategoryLabel,
  isValidMetodologiaCategory,
  METODOLOGIA_DEFAULT_CATEGORY,
} from '~/lib/metodologia-nav'

definePageMeta({
  pageTitle: 'Metodología de cálculos',
  pageDescription:
    'Cómo comparatasas.ar obtiene y calcula las tasas, rendimientos y simulaciones para cada tipo de producto.',
})

const route = useRoute()
const categoria = route.params.categoria as string

if (categoria === METODOLOGIA_DEFAULT_CATEGORY || !isValidMetodologiaCategory(categoria)) {
  await navigateTo('/metodologia', { redirectCode: 301, replace: true })
}

const categoryLabel = getMetodologiaCategoryLabel(categoria) ?? categoria
const seoTitle = `Metodología: ${categoryLabel}`

route.meta.pageTitle = seoTitle

useSeoMeta({
  title: seoTitle,
  description:
    'Explicación de las fuentes de datos y fórmulas usadas en Compara Tasas para cuentas remuneradas, FCI, plazos fijos, LECAPs, crypto y más.',
  ogTitle: `${seoTitle} - Compara Tasas`,
  ogDescription:
    'Explicación de las fuentes de datos y fórmulas usadas en Compara Tasas para cuentas remuneradas, FCI, plazos fijos, LECAPs, crypto y más.',
})

const canonicalUrl = `https://comparatasas.ar/metodologia/${categoria}`

useHead({
  link: [
    { rel: 'canonical', href: canonicalUrl },
    { rel: 'alternate', hreflang: 'es-AR', href: canonicalUrl },
    { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl },
  ],
})
</script>

<template>
  <UContainer class="w-full mx-auto space-y-8 max-w-6xl px-0">
    <MetodologiaNavTabs />
    <MetodologiaCategoryContent :category-id="categoria" />
  </UContainer>
</template>
