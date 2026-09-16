import { describe, expect, it } from 'vitest'
import { mergeVary, negotiateAgentResponse } from './agent-response'
import { AGENT_NEGOTIATED_ROUTES, isPublicRoute } from './agent-routes'
import { preferredType, prefersMarkdown, parseAccept } from './accept-markdown'
import { getAgentMarkdown, NOT_FOUND_MARKDOWN } from './agent-markdown'

describe('accept-markdown', () => {
  it('prefers markdown when it outranks html', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true)
    expect(prefersMarkdown('text/markdown, text/html;q=0.9')).toBe(true)
    expect(prefersMarkdown('text/html,application/xhtml+xml')).toBe(false)
    expect(prefersMarkdown(null)).toBe(false)
  })

  it('honors q-values and returns null when nothing matches', () => {
    expect(preferredType('text/html;q=0', ['text/html', 'text/markdown'])).toBe(null)
    expect(preferredType('application/pdf', ['text/html', 'text/markdown'])).toBe(null)
    expect(parseAccept('text/markdown;q=0.8, text/html').map((e) => e.type)).toEqual([
      'text/markdown',
      'text/html',
    ])
  })
})

describe('agent-markdown', () => {
  it('exposes curated markdown for trust and home paths', () => {
    for (const path of AGENT_NEGOTIATED_ROUTES) {
      const body = getAgentMarkdown(path)
      expect(body).toBeTruthy()
      expect(body!.length).toBeGreaterThan(500)
    }
  })

  it('includes recovery links in the markdown 404 body', () => {
    expect(NOT_FOUND_MARKDOWN).toContain('/llms.txt')
    expect(NOT_FOUND_MARKDOWN).toContain('/sitemap.xml')
    expect(NOT_FOUND_MARKDOWN.length).toBeGreaterThan(200)
  })
})

describe('agent route negotiation', () => {
  it('combines Vary without losing existing values or duplicating Accept', () => {
    expect(mergeVary(null, 'Accept')).toBe('Accept')
    expect(mergeVary('Accept-Encoding', 'Accept')).toBe('Accept-Encoding, Accept')
    expect(mergeVary('Accept-Encoding, accept', 'Accept')).toBe('Accept-Encoding, accept')
  })

  it('distinguishes exact public routes from invented children', () => {
    expect(isPublicRoute('/about')).toBe(true)
    expect(isPublicRoute('/about/inexistente')).toBe(false)
    expect(negotiateAgentResponse('/fondos', 'text/markdown')).toEqual({
      kind: 'passthrough',
    })
  })

  it('returns recoverable markdown for curated, 404 and 406 responses', () => {
    const curated = negotiateAgentResponse('/about', 'text/markdown')
    expect(curated).toMatchObject({
      kind: 'response',
      status: 200,
      contentType: 'text/markdown; charset=utf-8',
    })

    const notFound = negotiateAgentResponse('/about/inexistente', 'text/markdown')
    expect(notFound).toMatchObject({
      kind: 'response',
      status: 404,
      contentType: 'text/markdown; charset=utf-8',
    })
    expect(notFound.kind === 'response' && notFound.body).toContain('/sitemap.xml')

    const unacceptable = negotiateAgentResponse('/about', 'application/pdf')
    expect(unacceptable).toMatchObject({
      kind: 'response',
      status: 406,
      contentType: 'text/plain; charset=utf-8',
    })
  })
})
