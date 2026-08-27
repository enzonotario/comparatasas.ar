import { endpointSpecs, SUMARSE_DEFAULT_ENDPOINT } from './sumarse-endpoints'

export interface SumarseNavTab {
  to: string
  label: string
}

export const sumarseNavTabs: SumarseNavTab[] = endpointSpecs.map((spec) => ({
  to: spec.id === SUMARSE_DEFAULT_ENDPOINT ? '/sumarse' : `/sumarse/${spec.id}`,
  label: spec.label,
}))
