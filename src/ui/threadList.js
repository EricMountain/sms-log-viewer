import { formatDate } from './format.js'

/**
 * Manages the left-sidebar thread list.
 * onSelect(thread) called when a thread is clicked.
 */
export class ThreadList {
  constructor(container, onSelect) {
    this.container = container
    this.onSelect = onSelect
    this.threads = []
    this.activeId = null
  }

  setThreads(threads) {
    this.threads = threads
    this.render(threads)
  }

  setActive(threadId) {
    this.activeId = threadId
    this.container.querySelectorAll('.thread-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === threadId)
    })
  }

  filter(query) {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? this.threads.filter(t =>
          t.name.toLowerCase().includes(q) || t.address.toLowerCase().includes(q)
        )
      : this.threads
    this.render(filtered)
  }

  render(threads) {
    if (!threads.length) {
      this.container.innerHTML = '<div class="thread-empty">No conversations found.</div>'
      return
    }

    this.container.innerHTML = threads.map(t => `
      <div class="thread-item${t.id === this.activeId ? ' active' : ''}" data-id="${escHtml(t.id)}">
        <span class="thread-name">${escHtml(t.name !== t.address ? t.name : t.address)}</span>
        <span class="thread-date">${formatDate(t.lastDate)}</span>
        <span class="thread-preview">${escHtml(t.lastPreview || '')}</span>
        <span class="thread-count">${t.messageCount}</span>
      </div>
    `).join('')

    this.container.querySelectorAll('.thread-item').forEach((el, i) => {
      const thread = threads[i]
      el.addEventListener('click', () => {
        this.setActive(thread.id)
        this.onSelect(thread)
      })
    })
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
