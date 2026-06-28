/**
 * Renders the welcome/drop-zone screen and resolves with XML string when a file is chosen.
 */
export function showLoader(container) {
  container.innerHTML = `
    <div class="welcome">
      <h1>SMS Log Viewer</h1>
      <p>Load an <strong>SMS Backup &amp; Restore</strong> XML export to browse your conversations.</p>
      <div class="dropzone" id="dropzone">
        <div class="drop-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p>Drop your <code>sms-*.xml</code> file here</p>
        <button class="btn btn-primary" id="choose-file-btn">Choose file</button>
        <input type="file" id="file-input" accept=".xml" hidden>
      </div>
    </div>
  `

  return new Promise((resolve, reject) => {
    const dropzone = container.querySelector('#dropzone')
    const fileInput = container.querySelector('#file-input')
    const btn = container.querySelector('#choose-file-btn')

    btn.addEventListener('click', () => fileInput.click())

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) readFile(fileInput.files[0], resolve, reject)
    })

    dropzone.addEventListener('dragover', e => {
      e.preventDefault()
      dropzone.classList.add('drag-over')
    })

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'))

    dropzone.addEventListener('drop', e => {
      e.preventDefault()
      dropzone.classList.remove('drag-over')
      const file = e.dataTransfer.files[0]
      if (file) readFile(file, resolve, reject)
    })
  })
}

function readFile(file, resolve, reject) {
  const reader = new FileReader()
  reader.onload = e => resolve({ xml: e.target.result, fileName: file.name })
  reader.onerror = () => reject(new Error('Failed to read file'))
  reader.readAsText(file, 'UTF-8')
}
