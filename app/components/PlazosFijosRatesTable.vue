<script setup lang="ts">
import { UAvatar, UBadge, UButton } from '#components'
import type { TableColumn } from '@nuxt/ui'
import { resolvePlazoFijoRateAtDays } from '~/composables/usePlazosFijos'
import { useAnalytics } from '~/composables/useAnalytics'
import { getPlazoColumnSortId, type PlazoFijoPlazoColumn } from '~/lib/plazo-fijo-rates'
import type { PlazoFijoTableRow } from '~/types/investments'

interface PlazoFijoTableRowWithSimulation extends PlazoFijoTableRow {
  activePlazoKey?: string
  activeTna?: number
  simulationDisabled: boolean
  simulation?: {
    earned: number
    finalAmount: number
    days: number
    tna: number
  }
}

const props = defineProps<{
  rows: PlazoFijoTableRow[]
  columns: PlazoFijoPlazoColumn[]
  showSimulation?: boolean
  simulatorDays?: number
  amount?: number
}>()

const isDesktop = useMediaQuery('(min-width: 768px)')
const { trackProviderClick } = useAnalytics()

const sorting = ref([
  {
    id: getPlazoColumnSortId('30'),
    desc: true,
  },
])

function formatTna(value: number): string {
  return `${value.toFixed(2)}%`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function calculateSimpleInterest(principal: number, annualRatePct: number, daysInvested: number) {
  const earned = principal * (annualRatePct / 100) * (daysInvested / 365)
  return {
    finalAmount: principal + earned,
    earned,
  }
}

function getCellsForColumn(row: PlazoFijoTableRow, columnKey: string) {
  return row.ratesByPlazo[columnKey] ?? []
}

function isActivePlazoColumn(column: PlazoFijoPlazoColumn): boolean {
  if (!props.showSimulation || props.simulatorDays == null) return false
  const days = props.simulatorDays
  return (
    days >= column.plazoMinDias &&
    (column.plazoMaxDias == null || days <= column.plazoMaxDias)
  )
}

function cellTitle(cells: Array<{ tna: number; label?: string }>): string | undefined {
  if (cells.length <= 1) return cells[0]?.label
  return cells.map((cell) => `${cell.label ? `${cell.label}: ` : ''}${formatTna(cell.tna)}`).join(' · ')
}

function isActiveRateCell(cell: { tna: number }, activeTna?: number): boolean {
  return activeTna != null && Math.abs(cell.tna - activeTna) < 0.001
}

function renderRateCells(
  cells: Array<{ tna: number; label?: string }>,
  options: {
    isHighlighted?: boolean
    activeTna?: number
    disabled?: boolean
    underlineActive?: boolean
  } = {},
) {
  const toneClass = options.isHighlighted
    ? 'text-primary-600 dark:text-primary-400'
    : 'text-neutral-900 dark:text-white'

  if (cells.length <= 1) {
    const cell = cells[0]!
    return h(
      'div',
      {
        class: [
          'text-center leading-tight',
          options.disabled ? 'opacity-50' : '',
        ],
        title: cell.label,
      },
      [
        h(
          'span',
          {
            class: [
              'font-semibold tabular-nums',
              toneClass,
              options.underlineActive && isActiveRateCell(cell, options.activeTna)
                ? 'underline decoration-2 underline-offset-4'
                : '',
            ],
          },
          formatTna(cell.tna),
        ),
        cell.label
          ? h(
              'span',
              { class: 'block text-[10px] text-neutral-500 dark:text-neutral-400' },
              cell.label,
            )
          : null,
      ],
    )
  }

  return h(
    'div',
    {
      class: ['flex flex-col items-center gap-1 py-0.5', options.disabled ? 'opacity-50' : ''],
      title: cellTitle(cells),
    },
    cells.map((cell) =>
      h('div', { class: 'text-center leading-tight' }, [
        h(
          'span',
          {
            class: [
              'font-semibold tabular-nums text-sm',
              toneClass,
              options.underlineActive && isActiveRateCell(cell, options.activeTna)
                ? 'underline decoration-2 underline-offset-2'
                : '',
            ],
          },
          formatTna(cell.tna),
        ),
        cell.label
          ? h(
              'span',
              { class: 'block text-[10px] text-neutral-500 dark:text-neutral-400' },
              cell.label,
            )
          : null,
      ]),
    ),
  )
}

const rowsWithSimulation = computed((): PlazoFijoTableRowWithSimulation[] => {
  return props.rows.map((row) => {
    const match =
      props.showSimulation && props.simulatorDays != null
        ? resolvePlazoFijoRateAtDays(row, props.simulatorDays, props.amount)
        : null

    if (!match || props.amount == null || props.simulatorDays == null) {
      return {
        ...row,
        activePlazoKey: match?.plazoKey,
        activeTna: match?.tna,
        simulationDisabled: props.showSimulation && !match,
      }
    }

    const result = calculateSimpleInterest(props.amount, match.tna, props.simulatorDays)

    return {
      ...row,
      activePlazoKey: match.plazoKey,
      activeTna: match.tna,
      simulationDisabled: false,
      simulation: {
        earned: result.earned,
        finalAmount: result.finalAmount,
        days: props.simulatorDays,
        tna: match.tna,
      },
    }
  })
})

function createSortableHeader(label: string) {
  return ({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (asc?: boolean) => void } }) => {
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
      class: '-mx-2.5 font-bold whitespace-nowrap',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })
  }
}

const tableColumns = computed<TableColumn<any>[]>(() => {
  const institutionColumn: TableColumn<any> = {
    id: 'institution',
    accessorKey: 'institution',
    header: createSortableHeader('Entidad'),
  }

  const plazoColumns: TableColumn<any>[] = props.columns.map((column) => ({
    id: getPlazoColumnSortId(column.key),
    accessorFn: (row: PlazoFijoTableRow) => row.sortTnaByPlazo[column.key] ?? 0,
    header: ({ column: tableColumn }) =>
      h(
        'div',
        {
          class: [
            'flex justify-center',
            isActivePlazoColumn(column) ? 'text-primary-600 dark:text-primary-400' : '',
          ],
        },
        createSortableHeader(column.label)({ column: tableColumn }),
      ),
    cell: ({ row }) => {
      const item = row.original as PlazoFijoTableRow & {
        simulationDisabled?: boolean
        activePlazoKey?: string
        activeTna?: number
      }
      const cells = getCellsForColumn(item, column.key)
      const isHighlighted = isActivePlazoColumn(column)

      if (!cells.length) {
        return h(
          'div',
          { class: `text-center text-neutral-400 ${item.simulationDisabled ? 'opacity-50' : ''}` },
          '—',
        )
      }

      return renderRateCells(cells, {
        isHighlighted,
        activeTna: item.activeTna,
        disabled: item.simulationDisabled,
        underlineActive: props.showSimulation && item.activePlazoKey === column.key,
      })
    },
  }))

  const simulationColumns: TableColumn<any>[] = props.showSimulation
    ? [
        {
          accessorKey: 'simulation.earned',
          header: createSortableHeader('Ganancia'),
          cell: ({ row }) => {
            const item = row.original as PlazoFijoTableRow & {
              simulationDisabled?: boolean
              simulation?: { earned: number }
            }
            if (item.simulationDisabled || !item.simulation) {
              return h(
                'div',
                { class: 'text-right text-xs text-neutral-500 dark:text-neutral-400' },
                'Fuera de rango',
              )
            }
            return h(
              'div',
              { class: 'text-right font-bold text-primary-600 dark:text-primary-400 tabular-nums' },
              formatCurrency(item.simulation.earned),
            )
          },
        },
      ]
    : []

  return [institutionColumn, ...plazoColumns, ...simulationColumns]
})

function handleProviderClick(row: PlazoFijoTableRow) {
  if (!row.url || row.url === '#') return
  trackProviderClick({
    providerName: row.institution,
    providerUrl: row.url,
    section: 'plazos-fijos-rates-table',
    contentType: 'plazo fijo tradicional',
  })
}
</script>

<template>
  <div>
    <div v-if="isDesktop" class="border border-default rounded-lg overflow-x-auto">
      <UTable
        v-model:sorting="sorting"
        :data="rowsWithSimulation"
        :columns="tableColumns"
        :get-row-id="(row) => row.rowKey"
      >
        <template #institution-cell="{ row }">
          <NuxtLink
            v-if="row.original.url && row.original.url !== '#'"
            :to="row.original.url"
            external
            target="_blank"
            class="flex items-center gap-3 min-w-[12rem] hover:underline text-neutral-900 dark:text-white"
            :class="row.original.simulationDisabled ? 'opacity-50' : ''"
            @click="handleProviderClick(row.original)"
          >
            <UAvatar
              v-if="row.original.logo"
              :src="row.original.logo"
              :alt="row.original.institution"
              referrerpolicy="no-referrer"
              :ui="{ image: 'object-contain' }"
            />
            <div class="min-w-0">
              <div class="font-medium">
                {{ row.original.institution }}
              </div>
              <p
                v-if="row.original.condicionesCorto"
                class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 no-underline"
              >
                {{ row.original.condicionesCorto }}
              </p>
            </div>
          </NuxtLink>
          <div
            v-else
            class="flex items-center gap-3 min-w-[12rem]"
            :class="row.original.simulationDisabled ? 'opacity-50' : ''"
          >
            <UAvatar
              v-if="row.original.logo"
              :src="row.original.logo"
              :alt="row.original.institution"
              referrerpolicy="no-referrer"
              :ui="{ image: 'object-contain' }"
            />
            <div class="min-w-0">
              <div class="font-medium text-neutral-900 dark:text-white">
                {{ row.original.institution }}
              </div>
              <p
                v-if="row.original.condicionesCorto"
                class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2"
              >
                {{ row.original.condicionesCorto }}
              </p>
            </div>
          </div>
        </template>
      </UTable>
    </div>

    <div v-else class="flex flex-col gap-3">
      <UCard
        v-for="row in rowsWithSimulation"
        :key="row.rowKey"
        :ui="{ body: '!p-4' }"
        :class="row.simulationDisabled && showSimulation ? 'opacity-60' : ''"
      >
        <div class="flex items-start gap-3">
          <UAvatar
            v-if="row.logo"
            :src="row.logo"
            :alt="row.institution"
            referrerpolicy="no-referrer"
            :ui="{ image: 'object-contain' }"
          />
          <div class="min-w-0 flex-1 space-y-3">
            <div class="min-w-0">
              <NuxtLink
                v-if="row.url && row.url !== '#'"
                :to="row.url"
                external
                target="_blank"
                class="font-medium text-neutral-900 dark:text-white hover:underline"
                @click="handleProviderClick(row)"
              >
                {{ row.institution }}
              </NuxtLink>
              <div v-else class="font-medium text-neutral-900 dark:text-white">
                {{ row.institution }}
              </div>
              <p
                v-if="row.condicionesCorto"
                class="text-xs text-neutral-500 dark:text-neutral-400 mt-1"
              >
                {{ row.condicionesCorto }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="column in columns"
                :key="`${row.rowKey}-${column.key}`"
                class="rounded-lg border px-3 py-2"
                :class="
                  isActivePlazoColumn(column)
                    ? 'border-primary-300 bg-primary-50/70 dark:border-primary-700 dark:bg-primary-950/30'
                    : 'border-neutral-200 dark:border-neutral-800'
                "
              >
                <div class="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {{ column.label }}
                </div>
                <div
                  v-if="getCellsForColumn(row, column.key).length"
                  class="space-y-1"
                  :title="cellTitle(getCellsForColumn(row, column.key))"
                >
                  <div
                    v-for="(cell, cellIndex) in getCellsForColumn(row, column.key)"
                    :key="`${row.rowKey}-${column.key}-${cellIndex}`"
                    class="leading-tight"
                  >
                    <div
                      class="font-semibold tabular-nums"
                      :class="[
                        row.activePlazoKey === column.key &&
                        showSimulation &&
                        isActiveRateCell(cell, row.activeTna)
                          ? 'text-primary-600 dark:text-primary-400 underline decoration-2 underline-offset-2'
                          : isActivePlazoColumn(column)
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-900 dark:text-white',
                      ]"
                    >
                      {{ formatTna(cell.tna) }}
                    </div>
                    <div
                      v-if="cell.label"
                      class="text-[10px] text-neutral-500 dark:text-neutral-400"
                    >
                      {{ cell.label }}
                    </div>
                  </div>
                </div>
                <div v-else class="text-neutral-400">—</div>
              </div>
            </div>

            <div
              v-if="showSimulation && row.simulation"
              class="rounded-lg bg-primary-50 dark:bg-primary-950/20 px-3 py-2"
            >
              <div class="text-xs text-neutral-500 dark:text-neutral-400">
                Ganancia estimada · {{ row.simulation.days }} días ·
                {{ formatTna(row.simulation.tna) }} TNA
              </div>
              <div class="font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                {{ formatCurrency(row.simulation.earned) }}
              </div>
            </div>

            <UBadge
              v-else-if="showSimulation && row.simulationDisabled"
              color="neutral"
              variant="subtle"
            >
              Fuera de rango para {{ simulatorDays }} días
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
