import { useMediaQuery, useMounted } from '@vueuse/core'

/**
 * Hydration-safe `useMediaQuery`.
 *
 * The server cannot know the viewport, so `useMediaQuery` is `false` during SSR.
 * On the client it reads the real value before hydration, so a `v-if`/`v-else`
 * branch switch mismatches the server HTML and both layouts stay in the DOM.
 * This keeps `false` until the component is mounted, then follows the query.
 */
export function useClientMediaQuery(query: string) {
  const matches = useMediaQuery(query)
  const mounted = useMounted()
  return computed(() => mounted.value && matches.value)
}
