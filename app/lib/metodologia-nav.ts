import { methodologyCategories, methodologySections } from './methodology'

export interface MetodologiaNavTab {
  id: string
  to: string
  label: string
}

export const METODOLOGIA_DEFAULT_CATEGORY = 'cuentas'

const categoriesWithSections = methodologyCategories
  .map((category) => ({
    ...category,
    sections: methodologySections.filter((section) => section.category === category.id),
  }))
  .filter((group) => group.sections.length > 0)

export const metodologiaNavTabs: MetodologiaNavTab[] = categoriesWithSections.map((group) => ({
  id: group.id,
  to: group.id === METODOLOGIA_DEFAULT_CATEGORY ? '/metodologia' : `/metodologia/${group.id}`,
  label: group.label,
}))

export const metodologiaCategoryIds = metodologiaNavTabs.map((tab) => tab.id)

export function getMetodologiaCategoryLabel(id: string): string | undefined {
  return metodologiaNavTabs.find((tab) => tab.id === id)?.label
}

export function isValidMetodologiaCategory(id: string): boolean {
  return metodologiaCategoryIds.includes(id)
}
