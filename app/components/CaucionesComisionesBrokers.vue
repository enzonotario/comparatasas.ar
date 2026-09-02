<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useComisionesCaucionesBrokers } from '~/composables/useComisionesCaucionesBrokers'
import type { CaucionMoneda } from '~/composables/useCauciones'
import {
  filterComisionesCauciones,
  formatMembresiaMensual,
  formatPlanLabel,
  formatTasaAnualComparable,
  formatTasaPublicada,
  tasaComparableAnual,
  type ComisionCaucionBrokerApi,
} from '~/lib/finance/comision-caucion-broker'
import { formatPercentAuto } from '~/lib/fci-fund-formatters'
import {
  getInstitutionLogo,
  getInstitutionShortName,
  getInstitutionUrl,
} from '~/lib/mappings/institutions'
import { withOutboundUtm } from '~/lib/outbound-url'

const props = defineProps<{
  moneda: CaucionMoneda
}>()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

/** Las tasas de mercado informadas son solo colocadora. */
const OPERACION_CAUCION = 'colocadora' as const

const { comisiones, fechaActualizacion, loading, error, fetch } = useComisionesCaucionesBrokers()
await fetch().catch(() => undefined)

const currencyCode = computed(() => (props.moneda === 'usd' ? 'USD' : 'ARS'))

interface ComisionRow extends ComisionCaucionBrokerApi {
  displayName: string
  initials: string
  logo?: string
  providerUrl?: string
  tasaPublicada: string
  tasaAnualLabel: string
  tasaAnualSort: number
  membresiaLabel: string | null
  planLabel: string | null
  operacionLabel: string
}

function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase()
}

const operacionLabels: Record<string, string> = {
  colocadora: 'Colocadora',
  tomadora: 'Tomadora',
  ambas: 'Colocadora y tomadora',
}

const rows = computed<ComisionRow[]>(() => {
  const filtered = filterComisionesCauciones(comisiones.value, {
    moneda: currencyCode.value,
    operacion: OPERACION_CAUCION,
  })

  return filtered.map((item) => {
    const displayName =
      getInstitutionShortName(item.entidad) ||
      getInstitutionShortName(item.nombreComercial) ||
      item.nombreComercial ||
      item.entidad
    const logo =
      getInstitutionLogo(item.entidad) || getInstitutionLogo(item.nombreComercial) || undefined
    const providerUrl = withOutboundUtm(
      getInstitutionUrl(item.entidad, 'cauciones') ||
        getInstitutionUrl(item.nombreComercial, 'cauciones') ||
        item.enlace ||
        '#',
      'cauciones',
    )

    return {
      ...item,
      displayName,
      initials: getInitials(displayName),
      logo,
      providerUrl: providerUrl !== '#' ? providerUrl : undefined,
      enlace: item.enlace ? withOutboundUtm(item.enlace, 'cauciones') : item.enlace,
      tasaPublicada: formatTasaPublicada(item),
      tasaAnualLabel: formatTasaAnualComparable(item),
      tasaAnualSort: tasaComparableAnual(item) ?? Number.POSITIVE_INFINITY,
      membresiaLabel: formatMembresiaMensual(item),
      planLabel: formatPlanLabel(item.plan),
      operacionLabel: operacionLabels[item.operacion] ?? item.operacion,
    }
  })
})

const sorting = ref([{ id: 'tasaAnualSort', desc: false }])

function createSortableHeader(label: string) {
  return ({ column }: { column: any }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      label,
      icon: isSorted
        ? isSorted === 'asc'
          ? 'i-lucide-arrow-up-narrow-wide'
          : 'i-lucide-arrow-down-wide-narrow'
        : 'i-lucide-arrow-up-down',
      class: '-mx-2.5 font-bold',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })
  }
}

const columns: TableColumn<ComisionRow>[] = [
  {
    accessorKey: 'displayName',
    header: 'Broker',
    cell: ({ row }) => {
      const item = row.original
      const avatar = item.logo
        ? h('img', {
            src: item.logo,
            alt: `${item.displayName} logo`,
            class: 'size-9 rounded-full object-contain',
            loading: 'lazy',
          })
        : h(
            'div',
            {
              class:
                'flex size-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
            },
            item.initials,
          )

      const title = h(
        'p',
        {
          class: item.providerUrl
            ? 'font-medium text-primary-600 group-hover:underline dark:text-primary-400'
            : 'font-medium text-neutral-900 dark:text-white',
        },
        item.displayName,
      )

      const subtitle = h('p', { class: 'text-xs text-muted' }, [
        item.operacionLabel,
        item.planLabel ? ` · ${item.planLabel}` : '',
      ])

      const inner = item.providerUrl
        ? h(
            'a',
            {
              href: item.providerUrl,
              target: '_blank',
              rel: 'noopener noreferrer',
              class: 'group flex items-center gap-3',
            },
            [avatar, h('div', { class: 'min-w-0' }, [title, subtitle])],
          )
        : h('div', { class: 'flex items-center gap-3' }, [
            avatar,
            h('div', { class: 'min-w-0' }, [title, subtitle]),
          ])

      return inner
    },
  },
  {
    accessorKey: 'tasaPublicada',
    header: createSortableHeader('Comisión publicada'),
    cell: ({ row }) => {
      const item = row.original
      const badges = []
      if (item.tasaEsTope) {
        badges.push(h(UBadge, { color: 'warning', variant: 'subtle', size: 'sm' }, () => 'Tope'))
      }
      if (item.ivaAdicional) {
        badges.push(h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => '+ IVA'))
      }
      if (item.prorrateoDias) {
        badges.push(
          h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () =>
            String(`${item.prorrateoDias}d`),
          ),
        )
      }
      return h('div', { class: 'space-y-1' }, [
        h('p', { class: 'font-semibold tabular-nums' }, item.tasaPublicada),
        item.membresiaLabel
          ? h(
              'p',
              { class: 'text-xs text-muted tabular-nums' },
              `Membresía ${item.membresiaLabel} (si operás)`,
            )
          : null,
        badges.length ? h('div', { class: 'flex flex-wrap gap-1' }, badges) : null,
      ])
    },
  },
  {
    accessorKey: 'tasaAnualSort',
    header: createSortableHeader('Anual equiv.'),
    cell: ({ row }) =>
      h(
        'p',
        { class: 'tabular-nums font-medium text-neutral-800 dark:text-neutral-200' },
        row.original.tasaAnualLabel,
      ),
  },
  {
    accessorKey: 'derechoMercado',
    header: 'Derecho mercado',
    cell: ({ row }) => {
      const value = row.original.derechoMercado
      if (value == null) return h('span', { class: 'text-muted' }, '—')
      return h('p', { class: 'tabular-nums text-sm' }, formatPercentAuto(value * 100))
    },
  },
]

function formatBrokerUpdatedAt(value: string | null): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value))
}
</script>

<template>
  <section
    class="border border-default rounded-lg p-4 sm:p-6 bg-white dark:bg-neutral-900 space-y-4"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 space-y-1">
        <h3 class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Comisiones de brokers (cauciones {{ currencyCode }})
        </h3>
        <p class="text-xs text-muted max-w-2xl">
          Aranceles retail (canal web/app) publicados por cada ALyC para caución
          <strong>colocadora</strong>. Ordenamos por tasa anual equivalente: a menor comisión, mejor
          para quien coloca. Una fila por broker (mejor tarifa disponible).
        </p>
        <p v-if="fechaActualizacion" class="text-xs text-muted">
          Tarifarios actualizados al {{ formatBrokerUpdatedAt(fechaActualizacion) }} ·
          <a
            href="https://argentinadatos.com/?utm_source=comparatasas&utm_medium=cauciones&ref=comparatasas"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-800 dark:text-primary-200 font-medium"
          >
            ArgentinaDatos
          </a>
        </p>
      </div>
      <UButton
        :to="currencyCode === 'USD' ? '/comisiones-brokers?moneda=USD' : '/comisiones-brokers'"
        color="neutral"
        variant="outline"
        size="sm"
        label="Ver todas las comisiones de brokers"
        trailing-icon="i-lucide-arrow-right"
      />
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="No se pudieron cargar las comisiones de brokers"
      :actions="[{ label: 'Reintentar', onClick: () => fetch() }]"
    />

    <div v-else-if="loading && !rows.length" class="py-8 text-center text-muted text-sm">
      Cargando comisiones de brokers…
    </div>

    <div v-else-if="rows.length" class="space-y-4">
      <div class="sm:hidden flex flex-col gap-3">
        <div
          v-for="row in rows"
          :key="`${row.entidad}-${row.operacion}-${row.plan}-${row.moneda}`"
          class="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-3 space-y-2"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="row.logo"
              :src="row.logo"
              :alt="`${row.displayName} logo`"
              class="size-9 rounded-full object-contain"
              loading="lazy"
            />
            <div
              v-else
              class="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {{ row.initials }}
            </div>
            <div class="min-w-0">
              <a
                v-if="row.providerUrl"
                :href="row.providerUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-primary-600 dark:text-primary-400"
              >
                {{ row.displayName }}
              </a>
              <p v-else class="font-medium text-neutral-900 dark:text-white">
                {{ row.displayName }}
              </p>
              <p class="text-xs text-muted">
                {{ row.operacionLabel
                }}<template v-if="row.planLabel"> · {{ row.planLabel }}</template>
              </p>
            </div>
          </div>
          <div class="flex items-end justify-between gap-3">
            <div>
              <p class="font-semibold tabular-nums">{{ row.tasaPublicada }}</p>
              <p class="text-xs text-muted tabular-nums">{{ row.tasaAnualLabel }}</p>
              <p v-if="row.membresiaLabel" class="text-xs text-muted tabular-nums">
                Membresía {{ row.membresiaLabel }} (si operás)
              </p>
            </div>
            <div
              v-if="row.derechoMercado != null"
              class="text-right text-xs text-muted tabular-nums"
            >
              BYMA {{ formatPercentAuto(row.derechoMercado * 100) }}
            </div>
          </div>
        </div>
      </div>

      <div class="hidden sm:block border border-default rounded-lg overflow-hidden">
        <UTable v-model:sorting="sorting" :data="rows" :columns="columns" :loading="loading">
          <template #empty>
            <div class="py-8 text-center text-muted">Sin comisiones para este filtro.</div>
          </template>
        </UTable>
      </div>
    </div>

    <p v-else class="text-sm text-muted py-4">
      No hay comisiones publicadas para cauciones en {{ currencyCode }} como colocadora.
    </p>
  </section>
</template>
