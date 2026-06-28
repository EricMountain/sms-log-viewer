/**
 * Parses SMS Backup & Restore XML into flat message arrays.
 * Returns { messages: Message[], count: number }
 */
export function parseBackup(xmlString) {
  const doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('XML parse error: ' + parseError.textContent.slice(0, 200))

  const root = doc.documentElement
  if (root.tagName !== 'smses') throw new Error('Not a valid SMS Backup & Restore file (expected <smses> root)')

  const messages = []
  for (const el of root.children) {
    if (el.tagName === 'sms') messages.push(parseSms(el))
    else if (el.tagName === 'mms') messages.push(parseMms(el))
  }
  return messages
}

function a(el, name, fallback = '') {
  const v = el.getAttribute(name)
  return v === null || v === 'null' ? fallback : v
}

function parseSms(el) {
  return {
    kind: 'sms',
    address: a(el, 'address'),
    contactName: a(el, 'contact_name'),
    body: a(el, 'body'),
    date: parseInt(a(el, 'date', '0'), 10),
    type: parseInt(a(el, 'type', '1'), 10),
    read: a(el, 'read') === '1',
  }
}

function parseMms(el) {
  const parts = []
  const partsEl = el.querySelector('parts')
  if (partsEl) {
    for (const part of partsEl.querySelectorAll('part')) {
      const ct = a(part, 'ct')
      if (ct === 'application/smil' || parseInt(a(part, 'seq', '0'), 10) === -1) continue
      if (ct.startsWith('proto:') || ct === 'botmessage' || ct === 'application/vnd.wap.multipart.related') continue
      const text = a(part, 'text')
      const data = a(part, 'data')
      parts.push({
        ct,
        text: text === 'null' ? '' : text,
        data: data === 'null' ? '' : data,
        name: a(part, 'name') || a(part, 'cl') || '',
        seq: parseInt(a(part, 'seq', '0'), 10),
      })
    }
    parts.sort((x, y) => x.seq - y.seq)
  }

  const addrs = []
  const addrsEl = el.querySelector('addrs')
  if (addrsEl) {
    for (const addr of addrsEl.querySelectorAll('addr')) {
      addrs.push({
        address: a(addr, 'address'),
        type: parseInt(a(addr, 'type', '0'), 10),
      })
    }
  }

  return {
    kind: 'mms',
    address: a(el, 'address'),
    contactName: a(el, 'contact_name'),
    date: parseInt(a(el, 'date', '0'), 10),
    msgBox: parseInt(a(el, 'msg_box', '1'), 10),
    textOnly: a(el, 'text_only') === '1',
    parts,
    addrs,
  }
}
