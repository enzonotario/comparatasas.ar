<script setup lang="ts">
import { jsonLdScript, sitePublisher } from '~/lib/json-ld'

definePageMeta({
  pageTitle: 'Privacy',
  pageDescription: 'Política de privacidad de comparatasas.ar.',
})

useSeoMeta({
  title: 'Privacy',
  description:
    'Cómo Compara Tasas trata datos de navegación, analytics y enlaces a terceros. No pedimos claves bancarias para comparar tasas.',
  ogTitle: 'Privacy - Compara Tasas',
  ogDescription:
    'Cómo Compara Tasas trata datos de navegación, analytics y enlaces a terceros. No pedimos claves bancarias para comparar tasas.',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://comparatasas.ar/privacy' },
    { rel: 'alternate', hreflang: 'es-AR', href: 'https://comparatasas.ar/privacy' },
    { rel: 'alternate', hreflang: 'x-default', href: 'https://comparatasas.ar/privacy' },
  ],
  script: [
    jsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy - Compara Tasas',
      url: 'https://comparatasas.ar/privacy',
      description: 'Política de privacidad de comparatasas.ar.',
      publisher: sitePublisher,
    }),
  ],
})
</script>

<template>
  <div class="prose prose-neutral dark:prose-invert max-w-none space-y-6">
    <p>
      Esta página describe cómo <strong>comparatasas.ar</strong> trata información cuando visitás el
      sitio. Compara Tasas es un comparador público de tasas: no exige crear una cuenta para ver los
      rankings y no custodia dinero ni productos financieros de usuarios.
    </p>

    <h2>Datos que pueden procesarse</h2>
    <p>
      Al navegar, nuestro proveedor de hosting y CDN (Cloudflare) puede registrar datos técnicos
      habituales de seguridad y entrega (por ejemplo dirección IP, user-agent, URL y marcas de
      tiempo). También podemos usar herramientas de analytics agregadas para entender qué secciones
      se consultan y mejorar el sitio. Si están activos scripts de terceros (analytics o feedback),
      esos proveedores procesan datos según sus propias políticas.
    </p>

    <h2>Lo que no pedimos</h2>
    <p>
      No solicitamos contraseñas bancarias, tokens de sesión de billeteras, números de tarjeta ni
      documentación para “invertir” dentro de este sitio. Cualquier contratación ocurre en el sitio
      o la app de la entidad a la que enlazamos; esas experiencias tienen políticas propias.
    </p>

    <h2>Enlaces externos</h2>
    <p>
      Los rankings incluyen enlaces a bancos, billeteras, brokers y fuentes de datos. Al salir de
      comparatasas.ar, el tratamiento de tus datos pasa a regirse por esos terceros. También
      publicamos un mapa del sitio y un índice para agentes en
      <a href="/llms.txt">/llms.txt</a>.
    </p>

    <h2>Contacto</h2>
    <p>
      Preguntas de privacidad:
      <a href="mailto:hi@enzonotario.me">hi@enzonotario.me</a>
      o la página <NuxtLink to="/contact">/contact</NuxtLink>.
    </p>
  </div>
</template>
