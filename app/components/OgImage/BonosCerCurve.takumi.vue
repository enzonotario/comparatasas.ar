<script setup lang="ts">
import type { CerBondRow } from '~/composables/useBonosCer'
import { diasAlVencimientoCer } from '~/composables/useBonosCer'

const props = defineProps<{
  title: string
  updatedAt?: string
  bonds: CerBondRow[]
}>()

function fitPolyCurve(
  points: [number, number][],
  degree: number,
  n: number,
  minX: number,
  maxX: number,
): [number, number][] {
  if (points.length < degree + 1) return []

  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const m = degree + 1

  const A: number[][] = []
  const B: number[] = []
  for (let i = 0; i < m; i++) {
    A[i] = []
    for (let j = 0; j < m; j++) {
      A[i]![j] = xs.reduce((s, x) => s + Math.pow(x, i + j), 0)
    }
    B[i] = xs.reduce((s, x, k) => s + ys[k]! * Math.pow(x, i), 0)
  }

  for (let i = 0; i < m; i++) {
    let maxRow = i
    for (let k = i + 1; k < m; k++) if (Math.abs(A[k]![i]!) > Math.abs(A[maxRow]![i]!)) maxRow = k
    ;[A[i], A[maxRow]] = [A[maxRow]!, A[i]!]
    ;[B[i], B[maxRow]] = [B[maxRow]!, B[i]!]
    for (let k = i + 1; k < m; k++) {
      const f = A[k]![i]! / A[i]![i]!
      for (let j = i; j < m; j++) A[k]![j]! -= f * A[i]![j]!
      B[k]! -= f * B[i]!
    }
  }
  const coeffs = new Array(m)
  for (let i = m - 1; i >= 0; i--) {
    coeffs[i] = B[i]!
    for (let j = i + 1; j < m; j++) coeffs[i]! -= A[i]![j]! * coeffs[j]!
    coeffs[i]! /= A[i]![i]!
  }

  const result: [number, number][] = []
  const range = maxX - minX || 1
  for (let i = 0; i <= n; i++) {
    const x = minX + range * (i / n)
    let y = 0
    for (let j = 0; j < m; j++) y += coeffs[j]! * Math.pow(x, j)
    result.push([x, y])
  }
  return result
}

const chartConfig = computed(() => {
  if (!props.bonds?.length) return null

  const withDays = props.bonds
    .map((b) => ({
      ...b,
      days: diasAlVencimientoCer(b.fechaVencimiento),
    }))
    .filter((b) => b.days >= 0 && Number.isFinite(b.tirPorcentaje))
    .sort((a, b) => a.days - b.days)

  if (withDays.length === 0) return null

  const minDays = Math.min(...withDays.map((b) => b.days))
  const maxDays = Math.max(...withDays.map((b) => b.days))
  let minTir = Math.min(...withDays.map((b) => b.tirPorcentaje))
  let maxTir = Math.max(...withDays.map((b) => b.tirPorcentaje))
  const pad = Math.max(0.5, (maxTir - minTir) * 0.08)
  minTir -= pad
  maxTir += pad
  if (minTir === maxTir) {
    minTir -= 1
    maxTir += 1
  }

  const rangeDays = maxDays - minDays || 1
  const rangeTir = maxTir - minTir || 1

  const width = 800
  const height = 300
  const padding = 40

  const scaleX = (x: number) => padding + ((x - minDays) / rangeDays) * (width - 2 * padding)
  const scaleY = (y: number) =>
    height - padding - ((y - minTir) / rangeTir) * (height - 2 * padding)

  const topTickers = new Set(
    [...withDays]
      .sort((a, b) => b.tirPorcentaje - a.tirPorcentaje)
      .slice(0, 3)
      .map((b) => b.ticker),
  )

  const points = withDays.map((b) => ({
    ticker: b.ticker,
    x: scaleX(b.days),
    y: scaleY(b.tirPorcentaje),
    tir: b.tirPorcentaje,
    isTop: topTickers.has(b.ticker),
  }))

  const raw: [number, number][] = withDays.map((b) => [b.days, b.tirPorcentaje])
  const degree = withDays.length >= 3 ? 2 : withDays.length === 2 ? 1 : 0
  const curveRaw =
    degree > 0 && raw.length >= degree + 1
      ? fitPolyCurve(raw, degree, 50, minDays, maxDays)
      : []

  const curvePath = curveRaw.reduce((path, p, i) => {
    const x = scaleX(p[0])
    const y = scaleY(p[1])
    return path + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`)
  }, '')

  return { points, curvePath: curvePath || null }
})
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      width: '1200px',
      height: '630px',
      backgroundColor: '#f8fafc',
      backgroundImage: 'url(/assets/logo-grande.png)',
      backgroundSize: '40% auto',
      backgroundPosition: 'right bottom',
      backgroundRepeat: 'no-repeat',
      color: '#0f172a',
      fontFamily: '\'Inter\', system-ui, sans-serif',
      padding: '50px 60px',
      boxSizing: 'border-box',
      position: 'relative',
    }"
  >
    <div
      :style="{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0.9) 50%, rgba(241, 245, 249, 0.7) 100%)',
      }"
    />

    <div
      :style="{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        flex: 1,
      }"
    >
      <div :style="{ display: 'flex', alignItems: 'center', marginBottom: '20px' }">
        <span :style="{ fontSize: '20px', color: '#64748b', fontWeight: '600' }"
          >ComparaTasas.ar</span
        >
      </div>

      <h1 :style="{ fontSize: '44px', fontWeight: '800', margin: '0 0 10px 0', color: '#0f172a' }">
        {{ title }}
      </h1>

      <p v-if="updatedAt" :style="{ fontSize: '18px', color: '#64748b', margin: '0 0 10px 0' }">
        Datos al {{ updatedAt }}
      </p>

      <div :style="{ display: 'flex', flex: 1 }">
        <div :style="{ display: 'flex', flexDirection: 'column', width: '860px' }">
          <div :style="{ display: 'flex', gap: '20px', marginTop: '15px' }">
            <div :style="{ display: 'flex', alignItems: 'center', gap: '8px' }">
              <div
                :style="{
                  width: '12px',
                  height: '12px',
                  transform: 'rotate(45deg)',
                  backgroundColor: '#d97706',
                }"
              />
              <span :style="{ fontSize: '14px', color: '#475569', fontWeight: '600' }"
                >Soberanos CER</span
              >
            </div>
          </div>

          <div
            :style="{
              position: 'relative',
              background: 'transparent',
              height: '340px',
              display: 'flex',
              flexDirection: 'column',
            }"
          >
            <template v-if="chartConfig">
              <svg width="100%" height="100%" viewBox="0 0 800 300" style="overflow: visible">
                <line x1="40" y1="40" x2="760" y2="40" stroke="#f1f5f9" stroke-width="1" />
                <line x1="40" y1="130" x2="760" y2="130" stroke="#f1f5f9" stroke-width="1" />
                <line x1="40" y1="220" x2="760" y2="220" stroke="#f1f5f9" stroke-width="1" />
                <line x1="40" y1="260" x2="760" y2="260" stroke="#cbd5e1" stroke-width="2" />
                <line x1="40" y1="40" x2="40" y2="260" stroke="#cbd5e1" stroke-width="2" />

                <path
                  v-if="chartConfig.curvePath"
                  :d="chartConfig.curvePath"
                  fill="none"
                  stroke="rgba(217, 119, 6, 0.35)"
                  stroke-width="3"
                  stroke-dasharray="8 4"
                />

                <g v-for="(p, i) in chartConfig.points" :key="i">
                  <polygon
                    :points="`${p.x},${p.y - 8} ${p.x + 8},${p.y} ${p.x},${p.y + 8} ${p.x - 8},${p.y}`"
                    fill="#d97706"
                    stroke="white"
                    stroke-width="2"
                  />
                </g>
              </svg>

              <div
                :style="{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                }"
              >
                <div
                  v-for="(p, i) in chartConfig.points.filter((pt) => pt.isTop)"
                  :key="`label-${i}`"
                  :style="{
                    position: 'absolute',
                    left: `${(p.x / 800) * 100}%`,
                    top: `${Math.max(8, (p.y / 300) * 100 - 7)}%`,
                    transform: 'translate(-50%, -100%)',
                    background: 'rgba(248, 250, 252, 0.95)',
                    color: '#0f172a',
                    border: '1px solid #d97706',
                    borderRadius: '999px',
                    padding: '3px 8px',
                    fontSize: '20px',
                    fontWeight: '800',
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.15)',
                  }"
                >
                  {{ p.ticker }} · {{ p.tir.toFixed(2) }}%
                </div>
              </div>

              <div
                :style="{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  padding: '0 20px',
                }"
              >
                <span :style="{ fontSize: '12px', color: '#64748b', fontWeight: '600' }"
                  >← Menor plazo</span
                >
                <span :style="{ fontSize: '12px', color: '#64748b', fontWeight: '600' }"
                  >Mayor plazo →</span
                >
              </div>
            </template>
            <div
              v-else
              :style="{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '260px',
                fontSize: '22px',
                color: '#64748b',
                fontWeight: '600',
              }"
            >
              Sin datos de bonos CER
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
