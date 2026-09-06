<script setup lang="ts">
import { UBadge, UButton } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { LecapItem } from '~/composables/useLecaps'
import {
  costoCompraLetrasPct,
  type ComisionBrokerApi,
} from '~/lib/finance/comision-caucion-broker'
import {
  calcularFilaLecap,
  type LecapCalculoResultado,
} from '~/lib/finance/lecap-calculos'

export type LecapComparadorRow = {
  item: LecapItem
  calc: LecapCalculoResultado
  symbol: string
  days: number
  maturity: string
  precio1Vn: number
  gananciaDirecta: number
  tna: number
  tem: number
  comisionPorcentaje: number
}

const props = defineProps<{
  items: LecapItem[]
  comision: ComisionBrokerApi | null
  /** Monto global a invertir. */
  montoInvertir: number
  tnaPlazoFijoPorcentaje: number
}>()

const rows = computed<LecapComparadorRow[]>(() =>
  props.items.map((item) => {
    const comisionPorcentaje = costoCompraLetrasPct(props.comision, item.days)
    const calc = calcularFilaLecap(
      {
        precioArs: item.price,
        tnaMercado: item.tna,
        dias: item.days,
        variacionPorcentaje: item.variacionPorcentaje,
      },
      {
        comisionPorcentaje,
        tnaPlazoFijoPorcentaje: props.tnaPlazoFijoPorcentaje,
        montoInvertir: props.montoInvertir,
        cantidadVn: null,
      },
    )

    return {
      item,
      calc,
      symbol: item.symbol,
      days: item.days,
      maturity: item.maturity,
      precio1Vn: calc.precio1Vn,
      gananciaDirecta: calc.gananciaDirecta,
      tna: calc.tna,
      tem: calc.tem,
      comisionPorcentaje,
    }
  }),
)

const sorting = ref([{ id: 'days', desc: false }])

function formatPrecio1Vn(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}

function formatMoney(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `$${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}`
}

function formatMoneyDiff(value: number): string {
  const abs = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
  if (value > 0) return `+$${abs}`
  if (value < 0) return `-$${abs}`
  return `$${abs}`
}

function formatCantidadVn(value: number): string {
  if (!(value > 0)) return '—'
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(digits)}%`
}

function formatPercentPts(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

function formatDate(value: string): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year!, month! - 1, day)
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date)
}

function createSortableHeader(label: string) {
  return ({ column }: { column: any }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      size: 'sm',
      label,
      icon: isSorted
        ? isSorted === 'asc'
          ? 'i-lucide-arrow-up-narrow-wide'
          : 'i-lucide-arrow-down-wide-narrow'
        : 'i-lucide-arrow-up-down',
      class: '-mx-1.5 px-1 font-semibold',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    })
  }
}

const hasMonto = computed(() => props.montoInvertir > 0)

const columns = computed<TableColumn<LecapComparadorRow>[]>(() => [
  {
    accessorKey: 'symbol',
    header: createSortableHeader('Ticker'),
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1' }, [
        h(
          'span',
          { class: 'font-semibold text-neutral-900 dark:text-white' },
          row.original.symbol,
        ),
        h(
          UBadge,
          {
            variant: 'soft',
            size: 'xs',
            color: row.original.item.type === 'BONCAP' ? 'primary' : 'success',
            class: 'font-semibold px-1',
          },
          () => (row.original.item.type === 'BONCAP' ? 'B' : 'L'),
        ),
      ]),
  },
  {
    accessorKey: 'maturity',
    header: createSortableHeader('Vto.'),
    cell: ({ row }) =>
      h('div', { class: 'tabular-nums text-muted' }, formatDate(row.original.maturity)),
  },
  {
    accessorKey: 'days',
    header: createSortableHeader('Días'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'tabular-nums' }, String(row.original.days)),
  },
  {
    accessorKey: 'precio1Vn',
    header: createSortableHeader('Precio'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) =>
      h(
        'div',
        {
          class: 'tabular-nums font-semibold text-primary-800 dark:text-primary-200',
        },
        formatPrecio1Vn(row.original.precio1Vn),
      ),
  },
  {
    id: 'variacion',
    accessorFn: (row) => row.item.variacionPorcentaje ?? Number.NEGATIVE_INFINITY,
    header: createSortableHeader('Var.'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) => {
      const v = row.original.item.variacionPorcentaje
      if (v == null) return h('div', { class: 'text-muted' }, '—')
      const cls =
        v >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
      return h('div', { class: `tabular-nums ${cls}` }, formatPercentPts(v))
    },
  },
  {
    id: 'precioConComision',
    accessorFn: (row) => row.calc.precioConComision,
    header: createSortableHeader('P. c/com.'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) =>
      h('div', { class: 'tabular-nums' }, formatPrecio1Vn(row.original.calc.precioConComision)),
  },
  {
    id: 'aRecibir1Vn',
    accessorFn: (row) => row.calc.aRecibir1Vn,
    header: createSortableHeader('A recibir'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) =>
      h('div', { class: 'tabular-nums' }, formatPrecio1Vn(row.original.calc.aRecibir1Vn)),
  },
  {
    id: 'vnARecibir',
    accessorFn: (row) => row.calc.vnARecibir,
    header: createSortableHeader('VN'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) =>
      h('div', { class: 'tabular-nums' }, formatCantidadVn(row.original.calc.vnARecibir)),
  },
  {
    id: 'totalARecibir',
    accessorFn: (row) => row.calc.totalARecibir,
    header: createSortableHeader('Total'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) =>
      h(
        'div',
        { class: 'tabular-nums font-medium' },
        row.original.calc.totalARecibir > 0 ? formatMoney(row.original.calc.totalARecibir) : '—',
      ),
  },
  {
    accessorKey: 'gananciaDirecta',
    header: createSortableHeader('Gan.'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) => {
      const v = row.original.gananciaDirecta
      const cls =
        v >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
      return h('div', { class: `tabular-nums font-semibold ${cls}` }, formatPercent(v))
    },
  },
  {
    accessorKey: 'tna',
    header: createSortableHeader('TNA'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) =>
      h('div', { class: 'tabular-nums font-semibold' }, formatPercent(row.original.tna)),
  },
  {
    accessorKey: 'tem',
    header: createSortableHeader('TEM'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) =>
      h(
        'div',
        { class: 'tabular-nums font-semibold text-sky-600 dark:text-sky-400' },
        formatPercent(row.original.tem),
      ),
  },
  {
    id: 'plazoFijo',
    accessorFn: (row) => row.calc.plazoFijoMonto ?? Number.NEGATIVE_INFINITY,
    header: createSortableHeader('PF'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) =>
      h(
        'div',
        { class: 'tabular-nums' },
        row.original.calc.plazoFijoMonto != null
          ? formatMoney(row.original.calc.plazoFijoMonto)
          : '—',
      ),
  },
  {
    id: 'vsPlazoFijo',
    accessorFn: (row) => row.calc.vsPlazoFijo ?? Number.NEGATIVE_INFINITY,
    header: createSortableHeader('vs PF'),
    meta: { class: { th: 'text-right', td: 'text-right' } },
    cell: ({ row }) => {
      const v = row.original.calc.vsPlazoFijo
      const pct = row.original.calc.vsPlazoFijoPorcentaje
      if (v == null) return h('div', { class: 'text-muted' }, '—')
      const cls =
        v >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
      const label =
        pct != null ? `${formatMoneyDiff(v)} (${formatPercent(pct)})` : formatMoneyDiff(v)
      return h('div', { class: `tabular-nums font-medium whitespace-nowrap ${cls}` }, label)
    },
  },
])
</script>

<template>
  <div class="space-y-3">
    <!-- Mobile: lista -->
    <div class="sm:hidden flex flex-col gap-3">
      <div
        v-for="{ item, calc } in rows"
        :key="item.symbol"
        class="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-3 space-y-2"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-neutral-900 dark:text-white">{{ item.symbol }}</span>
              <UBadge
                variant="soft"
                size="xs"
                :color="item.type === 'BONCAP' ? 'primary' : 'success'"
                class="font-bold"
              >
                {{ item.type === 'BONCAP' ? 'B' : 'L' }}
              </UBadge>
            </div>
            <p class="text-xs text-muted">
              {{ formatDate(item.maturity) }} · {{ item.days }} días
            </p>
            <p class="text-xs text-muted tabular-nums">
              Precio {{ formatPrecio1Vn(calc.precio1Vn) }}
              <span
                v-if="item.variacionPorcentaje != null"
                :class="
                  item.variacionPorcentaje >= 0
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                "
              >
                · {{ formatPercentPts(item.variacionPorcentaje) }}
              </span>
            </p>
          </div>
          <div class="text-right shrink-0 space-y-0.5">
            <div
              class="font-bold tabular-nums"
              :class="
                calc.gananciaDirecta >= 0
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              "
            >
              {{ formatPercent(calc.gananciaDirecta) }}
            </div>
            <div class="text-xs text-muted">Ganancia</div>
            <div class="text-xs tabular-nums">TNA {{ formatPercent(calc.tna) }}</div>
            <div class="text-xs tabular-nums text-sky-600 dark:text-sky-400">
              TEM {{ formatPercent(calc.tem) }}
            </div>
          </div>
        </div>

        <div
          v-if="hasMonto"
          class="text-xs text-muted flex flex-wrap justify-between gap-2 tabular-nums border-t border-neutral-200 dark:border-neutral-800 pt-2"
        >
          <span>VN {{ formatCantidadVn(calc.vnARecibir) }}</span>
          <span>Total {{ formatMoney(calc.totalARecibir) }}</span>
          <span
            v-if="calc.vsPlazoFijo != null"
            class="text-right"
            :class="
              calc.vsPlazoFijo >= 0
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            "
          >
            vs PF {{ formatMoneyDiff(calc.vsPlazoFijo)
            }}<template v-if="calc.vsPlazoFijoPorcentaje != null">
              ({{ formatPercent(calc.vsPlazoFijoPorcentaje) }})</template
            >
          </span>
        </div>
      </div>
    </div>

    <!-- sm+: tabla -->
    <div class="hidden sm:block border border-default rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <UTable
          v-model:sorting="sorting"
          :data="rows"
          :columns="columns"
          :get-row-id="(row) => row.symbol"
          class="w-full"
        >
          <template #empty>
            <div class="py-12 text-center text-muted">
              No hay LECAPs o BONCAPs disponibles.
            </div>
          </template>
        </UTable>
      </div>
    </div>

    <p class="text-xs text-muted leading-relaxed max-w-4xl">
      Precio por 1 VN (cotización ÷ 100). L = LECAP, B = BONCAP. P. c/com. incluye comisión de letras
      del broker (+ IVA si corresponde). VN = monto ÷ precio con comisión. Total = VN × residual al
      vencimiento. Gan. = (a recibir − precio c/com.) / precio c/com. PF = monto equivalente a plazo
      fijo; vs PF = diferencial vs ese monto.
    </p>
  </div>
</template>
