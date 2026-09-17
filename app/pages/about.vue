<script setup lang="ts">
import { jsonLdScript, sitePublisher } from '~/lib/json-ld'

definePageMeta({
  pageTitle: 'Acerca de',
  pageDescription: 'Qué es Compara Tasas y por qué existe comparatasas.ar.',
})

useSeoMeta({
  title: 'Acerca de',
  description:
    'Compara Tasas es un sitio independiente y open source para comparar tasas de interés y rendimientos en Argentina.',
  ogTitle: 'Acerca de - Compara Tasas',
  ogDescription:
    'Compara Tasas es un sitio independiente y open source para comparar tasas de interés y rendimientos en Argentina.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/about' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/about' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/about' },
  ],
  script: [
    jsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'Acerca de - Compara Tasas',
      url: 'https://comparatasas.ar/about',
      description:
        'Compara Tasas es un sitio independiente y open source para comparar tasas de interés y rendimientos en Argentina.',
      publisher: sitePublisher,
    }),
  ],
})
</script>

<template>
  <div class="prose prose-neutral dark:prose-invert max-w-none space-y-6">
    <p>
      <strong>Compara Tasas</strong> (comparatasas.ar) es un comparador independiente de tasas de
      interés y rendimientos en Argentina. El objetivo es juntar en un solo lugar información
      pública sobre cuentas remuneradas, billeteras digitales, plazos fijos, fondos comunes de
      inversión, productos en USD, crypto y otras alternativas, para que puedas mirar números
      actualizados sin tener que recorrer el sitio de cada entidad.
    </p>
    <p>
      No somos un banco, una billetera ni un asesor financiero. No abrimos cuentas, no ejecutamos
      inversiones y no cobramos comisión por “recomendarte” un producto. Los listados orientativos
      se arman a partir de fuentes públicas y de endpoints que las propias entidades pueden
      publicar; cuando hay topes, condiciones o fecha de vigencia, intentamos mostrarlos junto a la
      tasa.
    </p>
    <p>
      El proyecto es de código abierto y se mantiene con aportes de la comunidad. Si querés sumar tu
      app o entidad al ranking, el flujo de integración está documentado en
      <NuxtLink to="/sumarse">Sumarse</NuxtLink>. Para entender cómo se calculan o muestran las
      cifras, visitá la <NuxtLink to="/metodologia">metodología</NuxtLink>. Contacto y privacidad
      están en <NuxtLink to="/contact">Contacto</NuxtLink> y
      <NuxtLink to="/privacy">Privacidad</NuxtLink>.
    </p>
  </div>
</template>
