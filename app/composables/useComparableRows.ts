import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'

type ComparableTableRow = {
  original: unknown
  getIsSelected: () => boolean
  toggleSelected: (value?: boolean) => void
  getCanSelect?: () => boolean
}

type ComparableSelectOptions = {
  /** If true, only toggle selection when meta/ctrl is held (click otherwise left to consumer). */
  modifierOnly?: boolean
  /** Return false to block selecting a row (already-selected rows can still be deselected). */
  canSelectRow?: (row: ComparableTableRow) => boolean
}

function rowCanBeSelected(
  row: ComparableTableRow,
  canSelectRow?: (row: ComparableTableRow) => boolean,
) {
  if (row.getIsSelected()) return true
  if (!canSelectRow) return true
  return canSelectRow(row)
}

/**
 * Columna de checkbox para selección multi-fila en UTable.
 */
export function createComparableSelectColumn<T>(
  options?: Pick<ComparableSelectOptions, 'canSelectRow'>,
): TableColumn<T> {
  return {
    id: 'select',
    header: ({ table }) => {
      const pageRows = table.getRowModel().rows as ComparableTableRow[]
      const selectableRows = pageRows.filter((row) =>
        rowCanBeSelected(row, options?.canSelectRow),
      )
      const allSelectableSelected =
        selectableRows.length > 0 && selectableRows.every((row) => row.getIsSelected())
      const someSelectableSelected = selectableRows.some((row) => row.getIsSelected())

      return h(
        'div',
        {
          class: 'flex items-center justify-center',
          onClick: (e: Event) => e.stopPropagation(),
        },
        [
          h(UCheckbox, {
            modelValue: someSelectableSelected
              ? allSelectableSelected
                ? true
                : 'indeterminate'
              : false,
            'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
              const wantSelected = !!value
              for (const row of pageRows) {
                if (wantSelected) {
                  if (!row.getIsSelected() && rowCanBeSelected(row, options?.canSelectRow)) {
                    row.toggleSelected(true)
                  }
                } else if (row.getIsSelected()) {
                  row.toggleSelected(false)
                }
              }
            },
            'aria-label': 'Seleccionar todas',
            size: 'sm',
            disabled: selectableRows.length === 0,
          }),
        ],
      )
    },
    cell: ({ row }) => {
      const tableRow = row as unknown as ComparableTableRow
      const canSelect = rowCanBeSelected(tableRow, options?.canSelectRow)

      return h(
        'div',
        {
          class: 'flex items-center justify-center',
          onClick: (e: Event) => e.stopPropagation(),
        },
        [
          h(UCheckbox, {
            modelValue: tableRow.getIsSelected(),
            'onUpdate:modelValue': (value: boolean | 'indeterminate') => {
              if (value && !canSelect) return
              tableRow.toggleSelected(!!value)
            },
            'aria-label': 'Seleccionar fila',
            size: 'sm',
            disabled: !canSelect,
          }),
        ],
      )
    },
    enableSorting: false,
    enableHiding: false,
    meta: {
      class: {
        th: 'w-10 px-1.5 text-center',
        td: 'w-10 px-1.5 text-center',
      },
    },
  }
}

/**
 * Selección multi-fila para comparar visualmente en UTable.
 * Click alterna selección; con `modifierOnly` solo Ctrl/Cmd+click.
 * Incluye columna checkbox al inicio vía `withSelection`.
 */
export function useComparableTableRows(options?: ComparableSelectOptions) {
  const rowSelection = ref<Record<string, boolean>>({})
  const selectColumn = createComparableSelectColumn({
    canSelectRow: options?.canSelectRow,
  })

  function onSelect(row: ComparableTableRow, e?: Event): boolean {
    const mouse = e instanceof MouseEvent ? e : undefined
    if (options?.modifierOnly) {
      if (!(mouse?.metaKey || mouse?.ctrlKey)) return false
      mouse.preventDefault()
    }

    if (row.getIsSelected()) {
      row.toggleSelected(false)
      return true
    }

    if (!rowCanBeSelected(row, options?.canSelectRow)) return true

    row.toggleSelected(true)
    return true
  }

  function withSelection<T>(columns: TableColumn<T>[]): TableColumn<T>[] {
    return [selectColumn as TableColumn<T>, ...columns]
  }

  function clearSelection() {
    rowSelection.value = {}
  }

  return { rowSelection, onSelect, clearSelection, withSelection }
}

/**
 * Selección multi-fila para tablas HTML nativas.
 */
export function useComparableHtmlRows() {
  const selectedIds = ref<Set<string>>(new Set())

  function isSelected(id: string) {
    return selectedIds.value.has(id)
  }

  function toggle(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  function setSelected(id: string, value: boolean) {
    const next = new Set(selectedIds.value)
    if (value) next.add(id)
    else next.delete(id)
    selectedIds.value = next
  }

  function rowClass(id: string, extra?: string | string[] | Record<string, boolean>) {
    return [
      'cursor-pointer transition-colors hover:bg-elevated',
      isSelected(id)
        ? 'bg-primary-100 dark:bg-primary-900/55 ring-1 ring-inset ring-primary/45'
        : '',
      extra,
    ]
  }

  function clearSelection() {
    selectedIds.value = new Set()
  }

  function areAllSelected(ids: string[]) {
    return ids.length > 0 && ids.every((id) => selectedIds.value.has(id))
  }

  function areSomeSelected(ids: string[]) {
    return ids.some((id) => selectedIds.value.has(id)) && !areAllSelected(ids)
  }

  function toggleAll(ids: string[]) {
    if (areAllSelected(ids)) {
      selectedIds.value = new Set()
      return
    }
    selectedIds.value = new Set(ids)
  }

  return {
    selectedIds,
    isSelected,
    toggle,
    setSelected,
    rowClass,
    clearSelection,
    areAllSelected,
    areSomeSelected,
    toggleAll,
  }
}
