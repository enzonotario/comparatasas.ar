<script setup lang="ts">
import type { FciFundDetail } from '~/composables/useFciFundDetails'
import FciFundMetaBadge from '~/components/funds/detail/FciFundMetaBadge.vue'
import {
  formatCompactNumber,
  formatDecimal,
  normalizeCurrencyCode,
} from '~/lib/fci-fund-formatters'
import { getFundTypeInfo } from '~/lib/mappings/funds'

const props = defineProps<{
  fundDetail: FciFundDetail
  historyUpdatedAt?: string | null
}>()

function normalizeText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function findSocietyLogo(typeMatch: RegExp, companyName: string | null | undefined) {
  const normalizedCompanyName = normalizeText(companyName)

  const exactNameMatch = props.fundDetail.sociedades.find((sociedad) => {
    return sociedad.logo && normalizeText(sociedad.nombre) === normalizedCompanyName
  })

  if (exactNameMatch?.logo) return exactNameMatch.logo

  const typeMatchSociety = props.fundDetail.sociedades.find((sociedad) => {
    return sociedad.logo && typeMatch.test(normalizeText(sociedad.tipo))
  })

  return typeMatchSociety?.logo || null
}

const administradoraLogo = computed(() => {
  return findSocietyLogo(/admin|gerent/, props.fundDetail.administradora)
})

const depositariaLogo = computed(() => {
  return findSocietyLogo(/deposit/, props.fundDetail.depositaria)
})

function companyInitials(value: string | null | undefined) {
  const words = (value || '—').split(/\s+/).filter(Boolean).slice(0, 2)
  return words.map((word) => word[0]?.toUpperCase() || '').join('') || '—'
}

const updatedAtLabel = computed(() => {
  if (!props.fundDetail.fecha) return '—'

  const date = new Date(`${props.fundDetail.fecha}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('es-AR')
})

const patrimonioLabel = computed(() => {
  return formatCompactNumber(props.fundDetail.patrimonio)
})

const valorCuotaparteLabel = computed(() => {
  return formatDecimal(props.fundDetail.rendimientos?.valorCuotaparte)
})

const tipoRentaLabel = computed(() => {
  return getFundTypeInfo(props.fundDetail.tipoRenta)?.typeLabel || props.fundDetail.tipoRenta || '—'
})
</script>

<template>
  <div class="space-y-4">
    <div class="md:sticky md:top-(--ui-header-height) md:z-20">
      <div
        class="rounded-[24px] bg-white/92 p-0.5 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-neutral-950/92 supports-[backdrop-filter]:dark:bg-neutral-950/80"
      >
        <div
          class="space-y-2.5 rounded-[20px] border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div class="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
            <div class="flex flex-wrap items-center gap-1.5">
              <FciFundMetaBadge
                v-if="props.fundDetail.tipoRenta"
                label="Tipo"
                :value="tipoRentaLabel"
              />
              <FciFundMetaBadge
                v-if="props.fundDetail.horizonte"
                label="Horizonte"
                :value="props.fundDetail.horizonte"
              />
              <FciFundMetaBadge
                v-if="props.fundDetail.moneda"
                label="Moneda"
                :value="normalizeCurrencyCode(props.fundDetail.moneda)"
              />
              <FciFundMetaBadge label="Benchmark" :value="props.fundDetail.benchmark || '—'" />
              <FciFundMetaBadge
                v-if="props.fundDetail.tipoDD"
                label="Tipo DD"
                :value="props.fundDetail.tipoDD"
              />
              <FciFundMetaBadge
                v-if="props.fundDetail.region"
                label="Región"
                :value="props.fundDetail.region"
              />
            </div>

            <FciFundMetaBadge label="Actualizado" :value="updatedAtLabel" />
          </div>

          <div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <h1 class="text-lg font-bold text-neutral-900 dark:text-white md:text-xl">
              {{ props.fundDetail.nombre }}
            </h1>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <FciFundMetaBadge
              label="Administradora"
              :value="props.fundDetail.administradora || '—'"
              :avatar-src="administradoraLogo"
              :avatar-alt="props.fundDetail.administradora || 'Administradora'"
              :avatar-text="companyInitials(props.fundDetail.administradora)"
            />

            <FciFundMetaBadge
              label="Depositaria"
              :value="props.fundDetail.depositaria || '—'"
              :avatar-src="depositariaLogo"
              :avatar-alt="props.fundDetail.depositaria || 'Depositaria'"
              :avatar-text="companyInitials(props.fundDetail.depositaria)"
            />

            <FciFundMetaBadge label="Patrimonio" :value="patrimonioLabel" />

            <FciFundMetaBadge label="Valor cuotaparte" :value="valorCuotaparteLabel" />
          </div>
        </div>
      </div>
    </div>

    <slot />
  </div>
</template>
