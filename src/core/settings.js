const KEY = 'sms-viewer-settings'
const DEFAULTS = { fontScale: 1.0, theme: 'auto' }

export function loadSettings() {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) }
  } catch {}
  return { ...DEFAULTS }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {}
}

export function applySettings(settings) {
  document.documentElement.style.setProperty('--font-scale', settings.fontScale)
  const theme = settings.theme === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme
  document.documentElement.setAttribute('data-theme', theme)
}
