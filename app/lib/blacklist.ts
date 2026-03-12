/**
 * Providers temporarily excluded from all listings.
 * Names are matched case-insensitively against API values.
 */
export const PROVIDER_BLACKLIST = ['belo']

export function isBlacklisted(name: string): boolean {
  return PROVIDER_BLACKLIST.some((b) => b.toLowerCase() === name.toLowerCase())
}
