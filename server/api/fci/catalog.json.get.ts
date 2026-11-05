// Full slim catalog (~2.8 MB) for the /fondos table and /fondos/comparar.
// Cache key ignores the query string on purpose.
export default defineCachedEventHandler(() => getFciCatalog(), {
  name: 'fci-catalog',
  maxAge: 60 * 60,
  swr: true,
  getKey: () => 'v1',
})
