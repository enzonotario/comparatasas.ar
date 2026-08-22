<script setup lang="ts">
import { withOutboundUtm } from '~/lib/outbound-url'

const friendlyPages = [
  {
    label: 'comparadolar.ar',
    to: withOutboundUtm('https://comparadolar.ar', 'friendly'),
  },
  {
    label: 'comparapix.ar',
    to: withOutboundUtm('https://comparapix.ar', 'friendly'),
  },
  {
    label: 'comparatiendas.com.ar',
    to: withOutboundUtm('https://www.comparatiendas.com.ar/', 'friendly'),
  },
  {
    label: 'icons.com.ar',
    to: withOutboundUtm('https://icons.com.ar', 'friendly'),
  },
  {
    label: 'dolarya.info',
    to: withOutboundUtm('https://www.dolarya.info/', 'friendly'),
  },
  {
    label: 'argentinadatos.com',
    to: withOutboundUtm('https://argentinadatos.com/', 'friendly'),
  },
  {
    label: 'dolarito.ar',
    to: withOutboundUtm('https://www.dolarito.ar/', 'friendly'),
  },
  {
    label: 'impuestito.org',
    to: withOutboundUtm('https://www.impuestito.org/', 'friendly'),
  },
  {
    label: 'enqueinvierto.ar',
    to: withOutboundUtm('https://enqueinvierto.ar', 'friendly'),
  },
  {
    label: 'betece.app',
    to: withOutboundUtm('https://betece.app', 'friendly'),
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
