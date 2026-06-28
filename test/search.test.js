import { describe, it, expect } from 'vitest'
import { buildSearchIndex, search, highlightText } from '../src/core/search.js'

const threads = [
  {
    id: 'alice',
    messages: [
      { text: 'Hello world', date: 1 },
      { text: 'Goodbye',     date: 2 },
    ],
  },
  {
    id: 'bob',
    messages: [
      { text: 'Hello there', date: 1 },
    ],
  },
]

describe('search', () => {
  const idx = buildSearchIndex(threads)

  it('finds matches across threads', () => {
    const results = search(idx, 'hello')
    expect(results.length).toBe(2)
  })

  it('groups hits by thread', () => {
    const results = search(idx, 'hello')
    const alice = results.find(r => r.threadId === 'alice')
    expect(alice.hits.length).toBe(1)
  })

  it('returns empty for no match', () => {
    expect(search(idx, 'xyz')).toEqual([])
  })

  it('returns empty for blank query', () => {
    expect(search(idx, '')).toEqual([])
    expect(search(idx, '   ')).toEqual([])
  })

  it('is case-insensitive', () => {
    const results = search(idx, 'HELLO')
    expect(results.length).toBe(2)
  })
})

describe('highlightText', () => {
  it('wraps matches in <mark>', () => {
    const out = highlightText('Hello world', 'world')
    expect(out).toContain('<mark>world</mark>')
  })

  it('escapes HTML in the source text', () => {
    const out = highlightText('<script>alert(1)</script>', 'script')
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;')
  })

  it('returns escaped text when no query', () => {
    const out = highlightText('a & b', '')
    expect(out).toBe('a &amp; b')
  })
})
