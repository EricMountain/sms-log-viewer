/**
 * Formatting helpers shared across UI modules.
 */

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const recentFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' })

export function formatDate(epochMs) {
  if (!epochMs) return ''
  const d = new Date(epochMs)
  const now = new Date()
  const diffMs = now - d
  const diffDays = diffMs / 86400000

  if (diffDays < 1 && now.getDate() === d.getDate()) return timeFormatter.format(d)
  if (diffDays < 7) return recentFormatter.format(d)
  return dateFormatter.format(d)
}

export function formatDateTime(epochMs) {
  if (!epochMs) return ''
  const d = new Date(epochMs)
  return dateFormatter.format(d) + ' ' + timeFormatter.format(d)
}

export function formatDateSeparator(epochMs) {
  if (!epochMs) return ''
  return dateFormatter.format(new Date(epochMs))
}

export function sameDay(ms1, ms2) {
  const a = new Date(ms1)
  const b = new Date(ms2)
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}
