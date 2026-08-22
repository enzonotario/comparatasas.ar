<script setup lang="ts">
import { jsonLdScript, sitePublisher } from '~/lib/json-ld'

definePageMeta({
  pageTitle: 'Contacto',
  pageDescription: 'Cómo contactar al equipo de Compara Tasas.',
})

useSeoMeta({
  title: 'Contacto',
  description:
    'Contacto de Compara Tasas: email para integraciones, correcciones de tasas y consultas sobre el sitio.',
  ogTitle: 'Contacto - Compara Tasas',
  ogDescription:
    'Contacto de Compara Tasas: email para integraciones, correcciones de tasas y consultas sobre el sitio.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/contact' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/contact' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/contact' },
  ],
  script: [
    jsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contacto - Compara Tasas',
      url: 'https://comparatasas.ar/contact',
      description: 'Contacto de Compara Tasas para integraciones y correcciones.',
      publisher: sitePublisher,
    }),
  ],
})
</script>

<template>
  <div class="prose prose-neutral dark:prose-invert max-w-none space-y-6">
    <p>
      Si encontraste una tasa desactualizada, querés integrar el feed de tu entidad, o tenés una
      consulta sobre el funcionamiento de <strong>comparatasas.ar</strong>, escribinos. Atendemos
      pedidos de corrección, altas de productos vía endpoint y reportes de errores en el sitio. No
      damos soporte de cuentas de bancos o billeteras de terceros: para eso tenés que hablar con la
      entidad emisora del producto.
    </p>

    <h2>Email</h2>
    <p>
      <a href="mailto:hi@enzonotario.me">hi@enzonotario.me</a>
      — preferimos un asunto claro (“Corrección TNA …”, “Integración Sumarse …”) y, si aplica, el
      link a la fuente oficial de la tasa o al endpoint que quieras publicar.
    </p>

    <h2>Integraciones</h2>
    <p>
      El listado es gratuito. La guía de campos y ejemplos está en
      <NuxtLink to="/sumarse">/sumarse</NuxtLink>. También podés abrir un issue en
      <a
        href="https://github.com/enzonotario/comparatasas.ar/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
      o seguir novedades en
      <a href="https://x.com/comparatasas" target="_blank" rel="noopener noreferrer">
        @comparatasas
      </a>.
    </p>

    <h2>Qué no cubrimos por este canal</h2>
    <p>
      No podemos resetear claves de apps bancarias, autorizar transferencias ni brindar
      asesoramiento de inversión personalizado. Si tu consulta es sobre privacidad de datos del
      sitio, mirá <NuxtLink to="/privacy">Privacidad</NuxtLink> o usá el mismo email con asunto
      “Privacidad”.
    </p>
  </div>
</template>
