<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const statusCode = computed(() => props.error?.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)

useSeoMeta({
  title: isNotFound.value ? 'Página no encontrada' : 'Error',
  description: isNotFound.value
    ? 'La ruta no existe en comparatasas.ar. Probá el inicio, llms.txt o el sitemap.'
    : 'Ocurrió un error al cargar esta página.',
})
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-6">
    <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
      HTTP {{ statusCode }}
    </p>
    <h1 class="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
      {{ isNotFound ? 'Página no encontrada' : 'Algo salió mal' }}
    </h1>
    <p class="max-w-xl text-neutral-600 dark:text-neutral-300">
      {{
        isNotFound
          ? 'Esa URL no existe en comparatasas.ar. Si llegaste desde un agente o un enlace viejo, usá una de estas salidas:'
          : 'Probá volver al inicio o recargar en unos segundos.'
      }}
    </p>

    <ul
      v-if="isNotFound"
      class="text-left max-w-md w-full space-y-2 text-sm text-neutral-700 dark:text-neutral-200"
    >
      <li>
        <NuxtLink class="underline" to="/">Inicio (cuentas remuneradas)</NuxtLink>
      </li>
      <li>
        <a class="underline" href="/llms.txt">llms.txt</a> — índice para agentes
      </li>
      <li>
        <a class="underline" href="/sitemap.xml">sitemap.xml</a>
      </li>
      <li>
        <NuxtLink class="underline" to="/about">Acerca de</NuxtLink>
        ·
        <NuxtLink class="underline" to="/contact">Contacto</NuxtLink>
        ·
        <NuxtLink class="underline" to="/privacy">Privacidad</NuxtLink>
      </li>
      <li>
        <NuxtLink class="underline" to="/metodologia">Metodología</NuxtLink>
      </li>
    </ul>

    <UButton to="/" color="primary" variant="solid">
      Volver al inicio
    </UButton>
  </div>
</template>
