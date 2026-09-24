import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ICON_FILE = /\.(?:png|webp|svg|jpe?g|gif|avif)$/i

/**
 * Hash de contenido de cada icono. El mismo archivo conserva la misma URL
 * entre builds. Un archivo distinto obtiene un query nuevo y la caché del
 * navegador no reutiliza la versión anterior.
 */
export function readCategoryIconVersions(
  iconsDir: string,
  enabled: boolean,
): Record<string, string> {
  if (!enabled || !existsSync(iconsDir)) return {}

  const versions: Record<string, string> = {}
  for (const name of readdirSync(iconsDir)) {
    if (!ICON_FILE.test(name)) continue
    const bytes = readFileSync(join(iconsDir, name))
    versions[name] = createHash('sha256').update(bytes).digest('hex').slice(0, 10)
  }
  return versions
}
