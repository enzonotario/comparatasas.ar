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
  <nav aria-labelledby="footer-friendly-pages" class="border-t border-default pt-8">
    <h2
      id="footer-friendly-pages"
      class="text-xs font-semibold uppercase tracking-wider text-highlighted"
    >
      Páginas amigas
    </h2>
    <ul class="mt-4 flex flex-wrap gap-2">
      <li v-for="page in friendlyPages" :key="page.label">
        <a
          :href="page.to"
          class="inline-flex items-center gap-1 rounded-full border border-default px-3 py-1 text-xs text-muted transition-colors hover:border-primary hover:text-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ page.label }}
          <UIcon name="i-lucide-arrow-up-right" class="size-3" aria-hidden="true" />
        </a>
      </li>
    </ul>
  </nav>
</template>
