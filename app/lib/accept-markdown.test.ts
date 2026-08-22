import { describe, expect, it } from 'vitest'
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
    for (const path of ['/', '/about', '/contact', '/privacy']) {
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
