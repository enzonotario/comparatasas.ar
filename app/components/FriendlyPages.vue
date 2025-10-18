<script setup lang="ts">
const friendlyPages = [
  {
    label: 'comparadolar.ar',
    to: 'https://comparadolar.ar',
  },
  {
    label: 'comparapix.ar',
    to: 'https://comparapix.ar',
  },
  {
    label: 'icons.com.ar',
    to: 'https://icons.com.ar',
  },
  {
    label: 'dolarya.info',
    to: 'https://dub.link/asxwg8M',
  },
  {
    label: 'argentinadatos.com',
    to: 'https://dub.link/l58DNjJ',
  },
  {
    label: 'dolarito.ar',
    to: 'https://dub.link/cCOI35S',
  },
  {
    label: 'impuestito.org',
    to: 'https://dub.link/dh8pB0R',
  },
  {
    label: 'enqueinvierto.ar',
    to: 'https://enqueinvierto.ar',
  },
  {
    label: 'betece.app',
    to: 'https://betece.app',
  },
]
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-xl font-bold">Páginas amigas</h3>
    <div class="flex flex-wrap gap-4">
      <a
        v-for="page in friendlyPages"
        :key="page.label"
        :href="page.to"
        class="block text-sm text-zinc-600 dark:text-white/60 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ page.label }}
      </a>
    </div>
  </div>
</template>
