import { getStaticPrerenderRoutes } from './agent-routes'

export async function getPrerenderRoutes(): Promise<string[]> {
  return getStaticPrerenderRoutes()
}
