import productScenariosData from '~/data/contado-cuotas-products.json'
import type { ProductScenario } from '~/types/product-scenarios'

export function useProductScenarios() {
  const productScenarios = [...(productScenariosData as ProductScenario[])]
    .map((product, index) => ({
      ...product,
      __sourceIndex: index,
    }))
    .sort((a, b) => {
      const aOrder = a.order ?? a.__sourceIndex
      const bOrder = b.order ?? b.__sourceIndex
      return aOrder - bOrder
    })
    .map(({ __sourceIndex: _sourceIndex, ...product }) => product)

  function isSamePriceInstallmentLabel(value: string | undefined): boolean {
    return /^mismo precio/i.test(value?.trim() ?? '')
  }

  return {
    productScenarios,
    isSamePriceInstallmentLabel,
  }
}
