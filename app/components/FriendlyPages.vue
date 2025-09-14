<script setup lang="ts">
const links = [
  { name: 'comparapix.ar', url: 'https://comparapix.ar' },
  { name: 'comparadolar.ar', url: 'https://comparadolar.ar' },
  { name: 'cedears.ar', url: 'https://cedears.ar' },
  { name: 'enqueinvierto.ar', url: 'https://enqueinvierto.ar' },
  { name: 'icons.com.ar', url: 'https://icons.com.ar' },
  { name: 'dolarya.info', url: 'https://dolarya.info' },
  { name: 'argentinadatos.com', url: 'https://argentinadatos.com' },
  { name: 'dolarito.ar', url: 'https://dolarito.ar' },
  { name: 'impuestito.org', url: 'https://www.impuestito.org' },
  { name: 'betece.app', url: 'https://betece.app' },
]
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-sm text-muted font-semibold">Páginas Amigas</p>
    <div class="flex flex-col gap-2">
      <a
        v-for="link in links"
        :key="link.url"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 text-sm text-muted"
      >
        <UIcon name="i-lucide-heart-handshake" class="size-4 text-blue-500" />
        {{ link.name }}
      </a>
    </div>
  </div>
</template>
