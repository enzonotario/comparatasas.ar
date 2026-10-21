<script setup lang="ts">
import { filterBySearchTokens, sortByPriorityMap } from '~/lib/global-search'
import { plazosFijosNavTabs } from '~/lib/plazos-fijos-nav'

const open = ref(false)
const searchTerm = ref('')

function plazosFijosSearchId(to: string) {
  return `plazos-fijos-${to.replace(/^\/plazos-fijos\/?/, '') || 'tradicional'}`
}

const subpages = plazosFijosNavTabs.map((tab) => ({
  id: plazosFijosSearchId(tab.to),
  label: `Plazo Fijo / ${tab.label}`,
  suffix: 'Plazos Fijos',
  icon: tab.icon,
  to: tab.to,
}))

/** Prioridad de aparición al buscar (mismo orden que las tabs). */
const plazosFijosSearchPriority = Object.fromEntries(
  plazosFijosNavTabs.map((tab, index) => [plazosFijosSearchId(tab.to), index]),
) as Record<string, number>

function postFilterSearchItems<T extends { id?: string; label?: string; suffix?: string; keywords?: string[] }>(
  term: string,
  items: T[],
) {
  return sortByPriorityMap(filterBySearchTokens(term, items), plazosFijosSearchPriority)
}

const groups = [
  {
    id: 'pages',
    label: 'Páginas',
    ignoreFilter: true,
    postFilter: postFilterSearchItems,
    items: [
      ...subpages,
      {
        id: 'cuentas-billeteras',
        label: 'Cuentas y Billeteras',
        suffix: 'Comparador',
        icon: 'i-lucide-wallet',
        to: '/cuentas-billeteras',
      },
      {
        id: 'fondos',
        label: 'Fondos de Inversión',
        suffix: 'Comparador',
        icon: 'i-lucide-chart-no-axes-combined',
        to: '/fondos',
      },
      {
        id: 'criptomonedas',
        label: 'Criptomonedas',
        suffix: 'Comparador',
        icon: 'i-lucide-bitcoin',
        to: '/criptomonedas',
      },
      {
        id: 'remesas',
        label: 'Remesas',
        suffix: 'Comparador',
        icon: 'i-lucide-globe',
        to: '/remesas',
      },
      {
        id: 'contado-cuotas',
        label: 'Contado vs Cuotas',
        suffix: 'Simulador',
        icon: 'i-lucide-credit-card',
        to: '/contado-cuotas',
      },
      {
        id: 'creditos-hipotecarios-uva',
        label: 'Créditos Hipotecarios UVA',
        suffix: 'Comparador',
        icon: 'i-lucide-home',
        to: '/creditos-hipotecarios-uva',
      },
      {
        id: 'prestamos-personales',
        label: 'Préstamos Personales',
        suffix: 'Comparador',
        icon: 'i-lucide-banknote',
        to: '/prestamos-personales',
      },
      {
        id: 'comisiones-cobro',
        label: 'Comisiones de cobro',
        suffix: 'Comparador',
        icon: 'i-lucide-receipt',
        to: '/comisiones-cobro',
      },
      {
        id: 'comisiones-brokers',
        label: 'Comisiones de brokers',
        suffix: 'Comparador',
        icon: 'i-lucide-briefcase-business',
        to: '/comisiones-brokers',
      },
      {
        id: 'bonos-cer',
        label: 'Bonos CER',
        suffix: 'Comparador',
        icon: 'i-lucide-landmark',
        to: '/bonos-cer',
      },
      {
        id: 'lecaps',
        label: 'LECAPs y BONCAPs',
        suffix: 'Comparador',
        icon: 'i-lucide-file-chart-column',
        to: '/lecaps',
        keywords: ['letras', 'letra', 'letras del tesoro', 'boncaps', 'boncap', 'lecap', 'lecaps'],
      },
      {
        id: 'cauciones',
        label: 'Cauciones',
        suffix: 'Comparador',
        icon: 'i-lucide-handshake',
        to: '/cauciones',
      },
    ],
  },
  {
    id: 'charts',
    label: 'Gráficos',
    ignoreFilter: true,
    postFilter: postFilterSearchItems,
    items: [
      {
        id: 'cuentas-billeteras-graficos',
        label: 'Evolución de Cuentas y Billeteras',
        suffix: 'Gráfico',
        icon: 'i-lucide-chart-line',
        to: '/cuentas-billeteras/graficos',
      },
    ],
  },
  {
    id: 'links',
    label: 'Enlaces',
    ignoreFilter: true,
    postFilter: postFilterSearchItems,
    items: [
      {
        id: 'sumarse',
        label: 'Sumarse',
        suffix: 'Información',
        icon: 'i-lucide-user-plus',
        to: '/sumarse',
      },
      {
        id: 'github',
        label: 'GitHub',
        suffix: 'Código abierto',
        icon: 'i-lucide-github',
        href: 'https://github.com/enzonotario/comparatasas.ar?utm_source=comparatasas&utm_medium=search&ref=comparatasas',
        target: '_blank',
      },
      {
        id: 'comparadolar',
        label: 'ComparaDolar.ar',
        suffix: 'Sitio amigo',
        icon: 'i-lucide-arrow-up-right',
        href: 'https://comparadolar.ar/?utm_source=comparatasas&utm_medium=search&ref=comparatasas',
        target: '_blank',
      },
    ],
  },
]

useRuntimeHook('dashboard:search:toggle', () => {
  open.value = !open.value
})

defineShortcuts({
  meta_k: {
    usingInput: true,
    handler: () => {
      open.value = !open.value
    },
  },
})

function onSelect(val: any) {
  if (!val) return
  if (val.to) {
    navigateTo(val.to)
  } else if (val.href) {
    window.open(val.href, val.target || '_blank')
  }
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-lg' }">
    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :groups="groups"
        placeholder="Buscar página..."
        :autofocus="true"
        close
        @update:model-value="onSelect"
      />
    </template>
  </UModal>
</template>
