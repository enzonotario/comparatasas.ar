<script setup lang="ts">
import type { FciFundDetail } from '~/composables/useFciFundDetails'
import FciFundMetaBadge from '~/components/funds/detail/FciFundMetaBadge.vue'
import {
  formatArsEquivalentHint,
  formatCompactNumber,
  formatCompactPatrimonio,
  formatDecimal,
  normalizeCurrencyCode,
} from '~/lib/fci-fund-formatters'
import { getFundTypeInfo } from '~/lib/mappings/funds'

const props = withDefaults(
  defineProps<{
    fundDetail: FciFundDetail
    historyUpdatedAt?: string | null
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

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

const { usdArsRate } = useDolarBolsa()

const fundCurrency = computed(
  () => props.fundDetail.monedaInversion || props.fundDetail.moneda || null,
)

const patrimonioLabel = computed(() => {
  const primary = formatCompactPatrimonio(props.fundDetail.patrimonio, fundCurrency.value)
  const hint = formatArsEquivalentHint(
    props.fundDetail.patrimonio,
    fundCurrency.value,
    usdArsRate.value,
  )
  return hint ? `${primary} · ${hint}` : primary
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
    <div>
      <div class="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap items-center gap-1.5">
          <FciFundMetaBadge
            v-if="props.fundDetail.tipoRenta && !compact"
            label="Tipo"
            :value="tipoRentaLabel"
          />
          <FciFundMetaBadge
            v-if="props.fundDetail.horizonte"
            label="Horizonte"
            :value="props.fundDetail.horizonte"
          />
          <FciFundMetaBadge
            v-if="props.fundDetail.moneda && !compact"
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

        <FciFundMetaBadge
          label="Actualizado"
          :value="updatedAtLabel"
          class="w-fit max-w-full shrink-0 self-start"
        />
      </div>

      <div
        v-if="!compact"
        class="mt-2 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between"
      >
        <h1 class="text-lg font-bold text-neutral-900 dark:text-white md:text-xl">
          {{ props.fundDetail.nombre }}
        </h1>
      </div>

      <div class="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
        <FciFundMetaBadge
          label="Administradora"
          :value="props.fundDetail.administradora || '—'"
          :avatar-src="administradoraLogo"
          :avatar-alt="props.fundDetail.administradora || 'Administradora'"
          :avatar-text="companyInitials(props.fundDetail.administradora)"
          class="min-w-0 max-w-full"
        />

        <FciFundMetaBadge
          label="Depositaria"
          :value="props.fundDetail.depositaria || '—'"
          :avatar-src="depositariaLogo"
          :avatar-alt="props.fundDetail.depositaria || 'Depositaria'"
          :avatar-text="companyInitials(props.fundDetail.depositaria)"
          class="min-w-0 max-w-full"
        />

        <template v-if="!compact">
          <FciFundMetaBadge label="Patrimonio" :value="patrimonioLabel" />
          <FciFundMetaBadge label="Valor cuotaparte" :value="valorCuotaparteLabel" />
        </template>
      </div>
    </div>

    <slot />
  </div>
</template>
