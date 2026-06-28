import { saveSettings, applySettings } from '../core/settings.js'

/**
 * Opens a modal settings panel. Closes on save or backdrop click.
 */
export function openSettings(currentSettings) {
  const overlay = document.createElement('div')
  overlay.className = 'settings-overlay'

  overlay.innerHTML = `
    <div class="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
      <h2>Settings</h2>
      <div class="setting-row">
        <label class="setting-label" for="theme-select">Theme</label>
        <div class="setting-control">
          <select id="theme-select">
            <option value="auto">Auto (system)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
      <div class="setting-row">
        <label class="setting-label" for="font-scale">Text size</label>
        <div class="setting-control">
          <span class="scale-label" style="font-size:0.8em">A</span>
          <input type="range" id="font-scale" min="0.75" max="2" step="0.05"
            class="font-scale-slider" value="${currentSettings.fontScale}" />
          <span class="scale-label" style="font-size:1.4em">A</span>
          <span id="scale-value">${Math.round(currentSettings.fontScale * 100)}%</span>
        </div>
      </div>
      <div class="settings-footer">
        <button class="btn btn-secondary" id="settings-cancel">Cancel</button>
        <button class="btn btn-primary" id="settings-save">Save</button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  const themeSelect = overlay.querySelector('#theme-select')
  const fontSlider = overlay.querySelector('#font-scale')
  const scaleValue = overlay.querySelector('#scale-value')
  const panel = overlay.querySelector('.settings-panel')

  themeSelect.value = currentSettings.theme

  fontSlider.addEventListener('input', () => {
    scaleValue.textContent = Math.round(fontSlider.value * 100) + '%'
    applySettings({ ...currentSettings, fontScale: parseFloat(fontSlider.value), theme: themeSelect.value })
  })

  themeSelect.addEventListener('change', () => {
    applySettings({ ...currentSettings, fontScale: parseFloat(fontSlider.value), theme: themeSelect.value })
  })

  return new Promise(resolve => {
    function save() {
      const settings = {
        fontScale: parseFloat(fontSlider.value),
        theme: themeSelect.value,
      }
      saveSettings(settings)
      applySettings(settings)
      overlay.remove()
      resolve(settings)
    }

    function cancel() {
      // Revert live preview
      applySettings(currentSettings)
      overlay.remove()
      resolve(currentSettings)
    }

    overlay.querySelector('#settings-save').addEventListener('click', save)
    overlay.querySelector('#settings-cancel').addEventListener('click', cancel)
    overlay.addEventListener('click', e => { if (e.target === overlay) cancel() })
    panel.addEventListener('click', e => e.stopPropagation())
  })
}
