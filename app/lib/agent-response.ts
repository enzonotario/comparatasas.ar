import { getAgentMarkdown, NOT_FOUND_MARKDOWN, normalizeAgentPath } from './agent-markdown'
import { isPublicRoute } from './agent-routes'
import { preferredType } from './accept-markdown'

export type AgentResponse =
  | { kind: 'passthrough' }
  | { kind: 'response'; status: 200 | 404 | 406; contentType: string; body: string }

export function mergeVary(existing: string | null | undefined, value: string): string {
  const tokens = (existing ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)

  if (!tokens.some((token) => token.toLowerCase() === value.toLowerCase())) {
    tokens.push(value)
  }

  return tokens.join(', ')
}

export function negotiateAgentResponse(
  rawPath: string,
  accept: string | null | undefined,
): AgentResponse {
  const path = normalizeAgentPath(rawPath)
  const chosen = preferredType(accept, ['text/html', 'text/markdown'])

  if (chosen === null) {
    return {
      kind: 'response',
      status: 406,
      contentType: 'text/plain; charset=utf-8',
      body: 'Not Acceptable\n\nAvailable: text/html, text/markdown\n',
    }
  }

  if (chosen === 'text/html') return { kind: 'passthrough' }

  const markdown = getAgentMarkdown(path)
  if (markdown) {
    return {
      kind: 'response',
      status: 200,
      contentType: 'text/markdown; charset=utf-8',
      body: markdown,
    }
  }

  // Las URLs públicas sin cuerpo curado siguen hacia Nuxt. Cualquier otra forma,
  // incluso hijos inventados de una ruta válida, obtiene un 404 recuperable.
  if (isPublicRoute(path)) return { kind: 'passthrough' }

  return {
    kind: 'response',
    status: 404,
    contentType: 'text/markdown; charset=utf-8',
    body: NOT_FOUND_MARKDOWN,
  }
}
