/** Un año. Seguro sólo porque la URL de producción incluye el hash del archivo. */
export const CATEGORY_ICON_MAX_AGE = 60 * 60 * 24 * 365

export function categoryIconUrl(file: string, version?: string): string {
  const path = `/assets/icons/${file}`
  return version ? `${path}?v=${version}` : path
}
