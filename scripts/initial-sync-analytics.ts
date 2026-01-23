import 'dotenv/config'
import {
  createAnalyticsClient,
  createTursoClient,
  initializeDatabase,
  fetchAnalyticsData,
  saveEvents,
} from './sync-analytics'

/**
 * Script para sincronización inicial de TODA la data histórica de analytics.
 *
 * Google Analytics 4 permite consultar datos desde la creación de la propiedad.
 * Este script sincroniza en bloques de 30 días para evitar timeouts y límites de la API.
 *
 * Uso:
 *   pnpm tsx scripts/initial-sync-analytics.ts
 *   pnpm tsx scripts/initial-sync-analytics.ts --start-date 2024-01-01
 *   pnpm tsx scripts/initial-sync-analytics.ts --days-back 365
 */

function parseArgs(): { startDate: string; endDate: string } {
  const args = process.argv.slice(2)
  const endDate = new Date()

  // Por defecto, sincronizar desde hace 2 años (máximo razonable para GA4)
  let startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 2)

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start-date' && args[i + 1]) {
      startDate = new Date(args[i + 1])
    }
    if (args[i] === '--days-back' && args[i + 1]) {
      const daysBack = parseInt(args[i + 1], 10)
      startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
    }
    if (args[i] === '--end-date' && args[i + 1]) {
      endDate.setTime(new Date(args[i + 1]).getTime())
    }
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  }
}

function getDateChunks(
  startDate: string,
  endDate: string,
  chunkSizeDays: number = 30,
): Array<{ start: string; end: string }> {
  const chunks: Array<{ start: string; end: string }> = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  let currentStart = new Date(start)

  while (currentStart < end) {
    const currentEnd = new Date(currentStart)
    currentEnd.setDate(currentEnd.getDate() + chunkSizeDays - 1)

    if (currentEnd > end) {
      currentEnd.setTime(end.getTime())
    }

    chunks.push({
      start: currentStart.toISOString().split('T')[0],
      end: currentEnd.toISOString().split('T')[0],
    })

    currentStart = new Date(currentEnd)
    currentStart.setDate(currentStart.getDate() + 1)
  }

  return chunks
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function initialSyncAnalytics() {
  const { startDate, endDate } = parseArgs()

  console.log('='.repeat(60))
  console.log('SINCRONIZACIÓN INICIAL DE ANALYTICS')
  console.log('='.repeat(60))
  console.log(`Rango: ${startDate} a ${endDate}`)

  const analyticsClient = createAnalyticsClient()
  const db = createTursoClient()

  await initializeDatabase(db)
  console.log('Base de datos inicializada')

  // Dividir en chunks de 30 días para evitar límites de la API
  const chunks = getDateChunks(startDate, endDate, 30)
  console.log(`Procesando ${chunks.length} períodos de 30 días...`)
  console.log('')

  let totalEvents = 0
  let successfulChunks = 0
  let failedChunks = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const progress = `[${i + 1}/${chunks.length}]`

    try {
      console.log(`${progress} Obteniendo datos: ${chunk.start} a ${chunk.end}...`)

      const events = await fetchAnalyticsData(analyticsClient, chunk.start, chunk.end)

      if (events.length > 0) {
        await saveEvents(db, events)
        console.log(`${progress} ✓ ${events.length} eventos guardados`)
        totalEvents += events.length
      } else {
        console.log(`${progress} ✓ Sin eventos en este período`)
      }

      successfulChunks++

      // Pequeña pausa entre requests para no sobrecargar la API
      if (i < chunks.length - 1) {
        await sleep(500)
      }
    } catch (error) {
      console.error(`${progress} ✗ Error: ${error instanceof Error ? error.message : error}`)
      failedChunks++

      // Continuar con el siguiente chunk en caso de error
      continue
    }
  }

  db.close()

  console.log('')
  console.log('='.repeat(60))
  console.log('RESUMEN')
  console.log('='.repeat(60))
  console.log(`Total de eventos sincronizados: ${totalEvents}`)
  console.log(`Períodos exitosos: ${successfulChunks}/${chunks.length}`)
  if (failedChunks > 0) {
    console.log(`Períodos con error: ${failedChunks}`)
  }
  console.log('='.repeat(60))
}

initialSyncAnalytics()
  .then(() => {
    console.log('Sincronización inicial completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Sincronización inicial falló:', error)
    process.exit(1)
  })
