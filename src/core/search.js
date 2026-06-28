/**
 * Simple in-memory full-text search over thread message bodies.
 */
export function buildSearchIndex(threads) {
  const entries = []
  for (const thread of threads) {
    for (let i = 0; i < thread.messages.length; i++) {
      const msg = thread.messages[i]
      if (msg.text) {
        entries.push({ threadId: thread.id, msgIndex: i, lower: msg.text.toLowerCase(), msg })
      }
    }
  }
  return entries
}

/**
 * Returns [{ threadId, hits: [{ msgIndex, msg }] }] for threads containing query.
 * Results are grouped by thread, hits ordered by message index.
 */
export function search(index, query) {
  if (!query || !query.trim()) return []
  const q = query.toLowerCase().trim()
  const grouped = new Map()

  for (const entry of index) {
    if (entry.lower.includes(q)) {
      if (!grouped.has(entry.threadId)) grouped.set(entry.threadId, [])
      grouped.get(entry.threadId).push({ msgIndex: entry.msgIndex, msg: entry.msg })
    }
  }

  return [...grouped.entries()].map(([threadId, hits]) => ({ threadId, hits }))
}

export function highlightText(text, query) {
  if (!query) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const escapedQ = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return escaped.replace(new RegExp(escapedQ, 'gi'), m => `<mark>${m}</mark>`)
}

export function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
