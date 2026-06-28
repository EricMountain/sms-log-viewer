import { describe, it, expect } from 'vitest'
import { parseVcard } from '../src/core/vcard.js'

describe('parseVcard', () => {
  it('extracts FN, TEL, EMAIL', () => {
    const text = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL;TYPE=CELL:+15551234567
EMAIL:john@example.com
END:VCARD`
    const result = parseVcard(text)
    expect(result.name).toBe('John Doe')
    expect(result.phones).toContain('+15551234567')
    expect(result.emails).toContain('john@example.com')
  })

  it('handles multiple phone numbers', () => {
    const text = `BEGIN:VCARD\nFN:Jane\nTEL:111\nTEL:222\nEND:VCARD`
    const { phones } = parseVcard(text)
    expect(phones.length).toBe(2)
  })

  it('returns empty fields when not present', () => {
    const result = parseVcard('BEGIN:VCARD\nEND:VCARD')
    expect(result.name).toBe('')
    expect(result.phones).toEqual([])
    expect(result.emails).toEqual([])
  })

  it('decodes backslash escapes in FN', () => {
    const result = parseVcard('FN:O\'Brien\\, Sean')
    expect(result.name).toContain(',')
  })
})
