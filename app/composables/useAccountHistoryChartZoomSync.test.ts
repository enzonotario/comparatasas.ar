import { describe, expect, it } from 'vitest'
import type { AccountHistoryItem } from '~/composables/useAccountHistory'
import {
  filterHistoryWithTope,
  parseHistoryDate,
  resolveSharedZoomWindow,
} from './useAccountHistoryChartZoomSync'

function item(fecha: string, tope: number | null): AccountHistoryItem {
  return {
    fecha,
    tope,
    tna: 0.4,
    tea: 0.48,
    condiciones: null,
    condicionesCorto: null,
  }
}

const history = [
  item('2024-01-01', null),
  item('2024-02-01', 1_000_000),
  item('2024-03-01', null),
  item('2024-04-01', 2_000_000),
]

describe('resolveSharedZoomWindow', () => {
  it('sin datos no hay ventana', () => {
    expect(resolveSharedZoomWindow([], null)).toBeNull()
  })

  it('sin ventana propuesta muestra todas las fechas del historial', () => {
    expect(resolveSharedZoomWindow(history, null)).toEqual({
      start: parseHistoryDate('2024-01-01'),
      end: parseHistoryDate('2024-04-01'),
    })
  })

  it('clampa la ventana a las fechas disponibles', () => {
    expect(
      resolveSharedZoomWindow(history, {
        start: parseHistoryDate('2023-06-01'),
        end: parseHistoryDate('2025-01-01'),
      }),
    ).toEqual({
      start: parseHistoryDate('2024-01-01'),
      end: parseHistoryDate('2024-04-01'),
    })
  })

  it('clampa solo el extremo que se sale', () => {
    expect(
      resolveSharedZoomWindow(history, {
        start: parseHistoryDate('2023-12-01'),
        end: parseHistoryDate('2024-03-01'),
      }),
    ).toEqual({
      start: parseHistoryDate('2024-01-01'),
      end: parseHistoryDate('2024-03-01'),
    })
  })

  it('una ventana fuera del historial vuelve al rango completo', () => {
    expect(
      resolveSharedZoomWindow(history, {
        start: parseHistoryDate('2020-01-01'),
        end: parseHistoryDate('2020-02-01'),
      }),
    ).toEqual({
      start: parseHistoryDate('2024-01-01'),
      end: parseHistoryDate('2024-04-01'),
    })
  })

  it('el gráfico de tope no cambia el significado de la ventana', () => {
    const proposed = {
      start: parseHistoryDate('2024-01-01'),
      end: parseHistoryDate('2024-03-01'),
    }
    const shared = resolveSharedZoomWindow(history, proposed)
    const topeRows = filterHistoryWithTope(history)

    expect(topeRows.map((row) => row.fecha)).toEqual(['2024-02-01', '2024-04-01'])
    expect(shared).toEqual(proposed)
    expect(resolveSharedZoomWindow(topeRows, proposed)).toEqual({
      start: parseHistoryDate('2024-02-01'),
      end: parseHistoryDate('2024-03-01'),
    })
  })
})
