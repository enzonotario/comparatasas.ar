<script setup lang="ts">
import { COMISIONES_BROKERS_DEFAULT_PRODUCTO } from '~/lib/comisiones-brokers-nav'

definePageMeta({
  pageTitle: 'Comisiones de brokers',
  pageDescription:
    'Compará comisiones de IOL, Balanz, Bull Market, Cocos, PPI, Fiwind e IEB+ por producto: acciones, CEDEARs, bonos, cauciones, letras y más.',
})
</script>

<template>
  <ComisionesBrokersView :producto="COMISIONES_BROKERS_DEFAULT_PRODUCTO" />
</template>
