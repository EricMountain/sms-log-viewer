/**
 * Groups flat messages into conversation threads.
 * Returns Thread[] sorted by most-recent activity (descending).
 */
export function buildThreads(messages) {
  const threadMap = new Map()

  for (const msg of messages) {
    const key = threadKey(msg)
    if (!threadMap.has(key)) {
      threadMap.set(key, {
        id: key,
        address: msg.address,
        name: resolveName(msg),
        messages: [],
        lastDate: 0,
        lastPreview: '',
        messageCount: 0,
      })
    }

    const thread = threadMap.get(key)
    const enriched = { ...msg, outgoing: isOutgoing(msg), text: messageText(msg) }
    thread.messages.push(enriched)

    if (msg.date > thread.lastDate) {
      thread.lastDate = msg.date
      thread.lastPreview = enriched.text || mediaPreview(msg)
    }
    // Prefer the most informative contact name seen in the thread
    const name = resolveName(msg)
    if (name && name !== msg.address && thread.name === thread.address) {
      thread.name = name
    }
  }

  for (const thread of threadMap.values()) {
    thread.messages.sort((a, b) => a.date - b.date)
    thread.messageCount = thread.messages.length
  }

  return [...threadMap.values()].sort((a, b) => b.lastDate - a.lastDate)
}

function normalizeAddress(addr) {
  return addr.replace(/[\s\-().]/g, '')
}

function threadKey(msg) {
  // Group MMS: more than one type-151 (recipient) addr → group thread
  if (msg.kind === 'mms' && msg.addrs.length > 2) {
    const participants = msg.addrs.map(a => normalizeAddress(a.address)).sort()
    return participants.join(',')
  }
  return normalizeAddress(msg.address)
}

function isOutgoing(msg) {
  return msg.kind === 'sms' ? msg.type === 2 : msg.msgBox === 2
}

export function messageText(msg) {
  if (msg.kind === 'sms') return msg.body || ''
  const p = msg.parts.find(p => p.ct === 'text/plain' && p.text && p.text.trim())
  return p ? p.text : ''
}

function mediaPreview(msg) {
  if (msg.kind !== 'mms') return ''
  for (const p of msg.parts) {
    if (p.ct.startsWith('image/')) return '[Photo]'
    if (p.ct.startsWith('video/')) return '[Video]'
    if (p.ct === 'application/pdf') return '[PDF]'
    if (p.ct === 'text/x-vcard') return '[Contact]'
  }
  return '[Media]'
}

function resolveName(msg) {
  if (msg.contactName && msg.contactName !== '(Unknown)') return msg.contactName
  return msg.address
}
