import { describe, it, expect } from 'vitest'
import { buildThreads, messageText } from '../src/core/model.js'

const alice1 = { kind: 'sms', address: '+33123456789', contactName: 'Alice', body: 'Hey', date: 1000, type: 1 }
const alice2 = { kind: 'sms', address: '+33123456789', contactName: 'Alice', body: 'Back', date: 2000, type: 2 }
const bob1   = { kind: 'sms', address: '+33987654321', contactName: 'Bob',   body: 'Hi',  date: 500,  type: 1 }

describe('buildThreads', () => {
  it('groups messages by address', () => {
    const threads = buildThreads([alice1, alice2, bob1])
    expect(threads.length).toBe(2)
  })

  it('sorts threads by most-recent activity (descending)', () => {
    const threads = buildThreads([alice1, alice2, bob1])
    expect(threads[0].name).toBe('Alice')
    expect(threads[1].name).toBe('Bob')
  })

  it('sorts messages within a thread by date ascending', () => {
    const threads = buildThreads([alice2, alice1])
    const [thread] = threads
    expect(thread.messages[0].date).toBe(1000)
    expect(thread.messages[1].date).toBe(2000)
  })

  it('marks outgoing messages correctly', () => {
    const threads = buildThreads([alice1, alice2])
    const [t] = threads
    expect(t.messages[0].outgoing).toBe(false)
    expect(t.messages[1].outgoing).toBe(true)
  })

  it('marks MMS outgoing when msg_box=2', () => {
    const mms = { kind: 'mms', address: '+1', contactName: '', date: 100, msgBox: 2, parts: [], addrs: [] }
    const [t] = buildThreads([mms])
    expect(t.messages[0].outgoing).toBe(true)
  })

  it('uses address as name when contact_name is Unknown', () => {
    const msg = { kind: 'sms', address: '+33999', contactName: '(Unknown)', body: 'x', date: 1, type: 1 }
    const [t] = buildThreads([msg])
    expect(t.name).toBe('+33999')
  })

  it('sets messageCount correctly', () => {
    const threads = buildThreads([alice1, alice2, bob1])
    const alice = threads.find(t => t.name === 'Alice')
    expect(alice.messageCount).toBe(2)
  })

  it('merges SMS with same number written with and without spaces', () => {
    const spaced  = { kind: 'sms', address: '+33 1 23 45 67 89', contactName: 'Alice', body: 'a', date: 1, type: 1 }
    const compact = { kind: 'sms', address: '+33123456789',      contactName: 'Alice', body: 'b', date: 2, type: 2 }
    const threads = buildThreads([spaced, compact])
    expect(threads.length).toBe(1)
    expect(threads[0].messageCount).toBe(2)
  })

  it('groups space-separated multi-number SMS address as a group thread', () => {
    const group = { kind: 'sms', address: '+33111111111 +33222222222', contactName: 'A', body: 'hi', date: 1, type: 1 }
    const solo  = { kind: 'sms', address: '+33111111111',              contactName: 'A', body: 'yo', date: 2, type: 1 }
    const threads = buildThreads([group, solo])
    expect(threads.length).toBe(2)
  })

  it('does not treat MMS with type-130 duplicate addr as a group', () => {
    // Three addrs but only 2 unique phone numbers → 1-on-1, not group
    const mms = {
      kind: 'mms', address: '+33999888777', contactName: 'Carol', date: 1, msgBox: 1,
      parts: [], addrs: [
        { address: '+33999888777', type: 130 },
        { address: '+33999888777', type: 137 },
        { address: '+33000000000', type: 151 },
      ],
    }
    const sms = { kind: 'sms', address: '+33999888777', contactName: 'Carol', body: 'hi', date: 2, type: 1 }
    const threads = buildThreads([mms, sms])
    expect(threads.length).toBe(1)
    expect(threads[0].messageCount).toBe(2)
  })
})

describe('messageText', () => {
  it('returns body for SMS', () => {
    expect(messageText(alice1)).toBe('Hey')
  })

  it('returns text/plain part text for MMS', () => {
    const mms = {
      kind: 'mms',
      parts: [
        { ct: 'image/jpeg', text: '', data: 'abc' },
        { ct: 'text/plain', text: 'Hello MMS', data: '' },
      ],
    }
    expect(messageText(mms)).toBe('Hello MMS')
  })

  it('returns empty string for MMS with no text part', () => {
    const mms = { kind: 'mms', parts: [{ ct: 'image/png', text: '', data: 'data' }] }
    expect(messageText(mms)).toBe('')
  })
})
