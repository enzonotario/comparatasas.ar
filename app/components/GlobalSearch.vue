<script setup lang="ts">
const open = ref(false)
const searchTerm = ref('')

const groups = [
  {
    id: 'pages',
    label: 'Páginas',
    items: [
      {
        id: 'plazos-fijos',
        label: 'Plazos Fijos',
        suffix: 'Comparador',
        icon: 'i-lucide-calendar-clock',
        to: '/plazos-fijos',
      },
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
        id: 'bonos-cer',
        label: 'Bonos CER',
        suffix: 'Comparador',
        icon: 'i-lucide-landmark',
        to: '/bonos-cer',
      },
      {
        id: 'lecaps',
        label: 'Lecaps',
        suffix: 'Comparador',
        icon: 'i-lucide-file-chart-column',
        to: '/lecaps',
      },
    ],
  },
  {
    id: 'charts',
    label: 'Gráficos',
    items: [
      {
        id: 'cuentas-billeteras-graficos',
        label: 'Evolución de Cuentas y Billeteras',
        suffix: 'Gráfico',
        icon: 'i-lucide-chart-line',
        to: '/cuentas-billeteras-graficos',
      },
    ],
  },
  {
    id: 'links',
    label: 'Enlaces',
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
        href: 'https://github.com/enzonotario/comparatasas.ar',
        target: '_blank',
      },
      {
        id: 'comparadolar',
        label: 'ComparaDolar.ar',
        suffix: 'Sitio amigo',
        icon: 'i-lucide-arrow-up-right',
        href: 'https://comparadolar.ar',
        target: '_blank',
      },
    ],
  },
]

const nuxtApp = useNuxtApp()

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
        :fuse="{
          fuseOptions: {
            keys: ['label', 'suffix'],
            threshold: 0.3,
            ignoreLocation: true,
          },
        }"
        placeholder="Buscar página..."
        :autofocus="true"
        close
        @update:model-value="onSelect"
      />
    </template>
  </UModal>
</template>
