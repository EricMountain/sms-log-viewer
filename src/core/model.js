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

/**
 * Splits an address attribute that may contain multiple phone numbers.
 * Each international number starts with '+'; local numbers stay together.
 * e.g. "+33782027451 +33687312454 +33782426985" → three normalized numbers.
 * e.g. "+33 6 50 47 07 84" (one number with spaces) → one normalized number.
 */
function splitAddresses(addr) {
  const cleaned = addr.trim().replace(/[,~]+/g, ' ')
  const numbers = []
  let current = ''
  for (const token of cleaned.split(/\s+/).filter(Boolean)) {
    if (token.startsWith('+') && current) {
      numbers.push(current)
      current = token
    } else {
      current += token
    }
  }
  if (current) numbers.push(current)
  return numbers.filter(n => n.length > 3)
}

function threadKey(msg) {
  if (msg.kind === 'mms' && msg.addrs.length > 0) {
    // Deduplicate first — some 1-on-1 MMS have the partner's number in both
    // type-130 and type-137 slots, inflating the count.
    const uniqueAddrs = [...new Set(msg.addrs.map(a => normalizeAddress(a.address)))]
    if (uniqueAddrs.length > 2) {
      return uniqueAddrs.sort().join(',')
    }
  }
  // The address attribute may be a space-separated list of phone numbers (group SMS).
  const parts = splitAddresses(msg.address)
  if (parts.length > 1) return parts.sort().join(',')
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
