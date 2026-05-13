<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  updatedAt?: string
  verdict: string
  explanation: string
  cashPrice: string
  installmentCount: string
  installmentAmount: string
  financedTotal: string
  nominalLabel: string
  nominalValue: string
  implicitTea: string
  remAnnual: string
  presentValue: string
}>()
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      width: '1200px',
      height: '630px',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 42%, #ecfeff 100%)',
      color: '#0f172a',
      fontFamily: '\'Inter\', system-ui, sans-serif',
      padding: '40px 44px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }"
  >
    <div
      :style="{
        position: 'absolute',
        right: '-30px',
        bottom: '-42px',
        width: '250px',
        height: '250px',
        backgroundImage: 'url(/assets/logo-grande.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: '0.06',
      }"
    />

    <div
      :style="{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }"
    >
      <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
        <div :style="{ fontSize: '18px', fontWeight: '700', color: '#334155' }">
          ComparaTasas.ar
        </div>
        <div
          v-if="updatedAt"
          :style="{
            fontSize: '13px',
            color: '#64748b',
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            borderRadius: '999px',
            padding: '8px 12px',
            fontWeight: '600',
          }"
        >
          REM al {{ updatedAt }}
        </div>
      </div>

      <div :style="{ display: 'flex', gap: '28px', marginTop: '20px', alignItems: 'flex-start' }">
        <h1
          :style="{
            margin: '0',
            width: '320px',
            fontSize: '58px',
            lineHeight: '0.9',
            letterSpacing: '-0.055em',
            fontWeight: '900',
            color: '#020617',
          }"
        >
          {{ title }}
        </h1>

        <div :style="{ maxWidth: '520px', paddingTop: '6px' }">
          <p
            :style="{
              margin: '0',
              fontSize: '22px',
              lineHeight: '1.28',
              color: '#334155',
            }"
          >
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div :style="{ display: 'flex', gap: '18px', marginTop: '24px', flex: 1 }">
        <div :style="{ width: '700px', display: 'flex', flexDirection: 'column', gap: '14px' }">
          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }">
            <div
              :style="{
                minHeight: '138px',
                padding: '18px 20px',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                boxShadow: '0 12px 26px rgba(15, 23, 42, 0.06)',
              }"
            >
              <div
                :style="{
                  fontSize: '12px',
                  color: '#475569',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }"
              >
                Contado
              </div>
              <div :style="{ marginTop: '12px', fontSize: '40px', fontWeight: '900' }">
                {{ cashPrice }}
              </div>
              <div :style="{ marginTop: '10px', fontSize: '16px', color: '#64748b' }">
                Pago único hoy
              </div>
            </div>

            <div
              :style="{
                minHeight: '138px',
                padding: '18px 20px',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                boxShadow: '0 12px 26px rgba(15, 23, 42, 0.06)',
              }"
            >
              <div
                :style="{
                  fontSize: '12px',
                  color: '#475569',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }"
              >
                Cuotas
              </div>
              <div :style="{ marginTop: '12px', fontSize: '34px', fontWeight: '900' }">
                {{ installmentCount }} × {{ installmentAmount }}
              </div>
              <div :style="{ marginTop: '10px', fontSize: '16px', color: '#64748b' }">
                Total {{ financedTotal }}
              </div>
            </div>
          </div>

          <div :style="{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }">
            <div
              :style="{
                padding: '16px 18px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(148, 163, 184, 0.16)',
              }"
            >
              <div :style="{ fontSize: '11px', color: '#64748b', fontWeight: '800' }">
                {{ nominalLabel }}
              </div>
              <div :style="{ marginTop: '8px', fontSize: '28px', fontWeight: '900' }">
                {{ nominalValue }}
              </div>
            </div>

            <div
              :style="{
                padding: '16px 18px',
                borderRadius: '20px',
                background: 'rgba(239, 246, 255, 0.95)',
                border: '1px solid rgba(96, 165, 250, 0.16)',
              }"
            >
              <div :style="{ fontSize: '11px', color: '#64748b', fontWeight: '800' }">
                TEA implícita
              </div>
              <div :style="{ marginTop: '8px', fontSize: '28px', fontWeight: '900' }">
                {{ implicitTea }}
              </div>
            </div>

            <div
              :style="{
                padding: '16px 18px',
                borderRadius: '20px',
                background: 'rgba(236, 253, 245, 0.95)',
                border: '1px solid rgba(16, 185, 129, 0.14)',
              }"
            >
              <div :style="{ fontSize: '11px', color: '#64748b', fontWeight: '800' }">
                REM 12 meses
              </div>
              <div :style="{ marginTop: '8px', fontSize: '28px', fontWeight: '900' }">
                {{ remAnnual }}
              </div>
            </div>
          </div>

          <div
            :style="{
              padding: '18px 20px',
              borderRadius: '22px',
              background: 'rgba(255,255,255,0.88)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
            }"
          >
            <div :style="{ fontSize: '11px', color: '#64748b', fontWeight: '800' }">
              Valor presente de las cuotas
            </div>
            <div :style="{ marginTop: '8px', fontSize: '34px', fontWeight: '900' }">
              {{ presentValue }}
            </div>
          </div>
        </div>

        <div
          :style="{
            width: '332px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '22px',
            borderRadius: '28px',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            boxShadow: '0 22px 48px rgba(15, 23, 42, 0.22)',
            boxSizing: 'border-box',
          }"
        >
          <div
            :style="{
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#94a3b8',
            }"
          >
            Comparación real
          </div>

          <div
            :style="{
              maxWidth: '250px',
              fontSize: '34px',
              lineHeight: '1.02',
              fontWeight: '900',
              color: '#fff',
            }"
          >
            {{ verdict }}
          </div>

          <div
            :style="{
              maxWidth: '252px',
              fontSize: '18px',
              lineHeight: '1.28',
              color: '#cbd5e1',
            }"
          >
            {{ explanation }}
          </div>

          <div
            :style="{
              marginTop: 'auto',
              fontSize: '15px',
              lineHeight: '1.32',
              color: '#e2e8f0',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: '14px',
            }"
          >
            Precio contado vs costo real de financiar con REM esperada.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
