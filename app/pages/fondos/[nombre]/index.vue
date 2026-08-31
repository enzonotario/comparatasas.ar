<script setup lang="ts">
import FciFundDetailView from '~/components/funds/detail/FciFundDetailView.vue'

definePageMeta({
  layout: 'fondos',
  pageTitle: 'Detalle de FCI',
  pageDescription: 'Información detallada de un fondo común de inversión.',
})
</script>

<template>
  <FciFundDetailView tab="resumen" />
</template>
