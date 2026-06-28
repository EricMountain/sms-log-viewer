import { showLoader } from './ui/loader.js'
import { ThreadList } from './ui/threadList.js'
import { ThreadView } from './ui/thread.js'
import { openSettings } from './ui/settingsPanel.js'
import { parseBackup } from './core/parser.js'
import { buildThreads } from './core/model.js'
import { buildSearchIndex, search, highlightText, escapeHtml } from './core/search.js'
import { loadSettings, applySettings } from './core/settings.js'

const app = document.getElementById('app')
let currentSettings = loadSettings()
applySettings(currentSettings)

let threads = []
let searchIndex = []
let threadList = null
let threadView = null

// Wire up theme change listener for auto theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentSettings.theme === 'auto') applySettings(currentSettings)
})

async function boot() {
  const { xml, fileName } = await showLoader(app)
  await loadBackup(xml, fileName)
}

async function loadBackup(xml, fileName) {
  renderLoading()

  // Yield to paint loading screen before heavy parse
  await new Promise(r => setTimeout(r, 0))

  try {
    const messages = parseBackup(xml)
    threads = buildThreads(messages)
    searchIndex = buildSearchIndex(threads)
    renderMain(fileName)
  } catch (err) {
    renderError(err.message)
  }
}

function renderLoading() {
  app.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Parsing backup…</p>
    </div>
  `
}

function renderError(msg) {
  app.innerHTML = `
    <div class="loading">
      <p style="color:crimson">Error: ${escapeHtml(msg)}</p>
      <button class="btn btn-secondary" id="retry-btn">Try another file</button>
    </div>
  `
  app.querySelector('#retry-btn').addEventListener('click', boot)
}

function renderMain(fileName) {
  app.innerHTML = `
    <div class="main">
      <aside class="sidebar">
        <div class="sidebar-header">
          <input type="search" id="thread-filter" placeholder="Filter by name or number…" autocomplete="off" />
        </div>
        <div id="thread-list-container" class="thread-list"></div>
        <div class="sidebar-footer">
          <button class="btn btn-secondary" id="settings-btn">Settings</button>
          <button class="btn btn-secondary" id="reload-btn">Load file</button>
        </div>
      </aside>
      <main class="content">
        <div id="thread-header" class="thread-header hidden">
          <div class="thread-header-info">
            <strong id="thread-name"></strong>
            <span id="thread-address"></span>
          </div>
          <div class="search-bar">
            <input type="search" id="msg-search" placeholder="Search messages…" autocomplete="off" />
          </div>
        </div>
        <div id="message-container" class="message-container hidden"></div>
        <div id="search-results-pane" class="search-results-pane hidden"></div>
        <div id="empty-state" class="empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>Select a conversation</p>
          <small style="color:var(--text-tertiary)">${threads.length} conversations from ${fileName}</small>
        </div>
      </main>
    </div>
  `

  // Thread list
  threadList = new ThreadList(
    app.querySelector('#thread-list-container'),
    openThread,
  )
  threadList.setThreads(threads)

  // Thread view
  threadView = new ThreadView(app.querySelector('#message-container'))

  // Thread filter
  const filterInput = app.querySelector('#thread-filter')
  filterInput.addEventListener('input', () => threadList.filter(filterInput.value))

  // Message search
  const msgSearch = app.querySelector('#msg-search')
  msgSearch.addEventListener('input', () => onMessageSearch(msgSearch.value))

  // Settings
  app.querySelector('#settings-btn').addEventListener('click', async () => {
    currentSettings = await openSettings(currentSettings)
  })

  // Reload
  app.querySelector('#reload-btn').addEventListener('click', boot)
}

let activeThread = null

function openThread(thread) {
  activeThread = thread
  app.querySelector('#thread-header').classList.remove('hidden')
  app.querySelector('#thread-name').textContent = thread.name
  app.querySelector('#thread-address').textContent =
    thread.name !== thread.address ? thread.address : ''
  app.querySelector('#empty-state').classList.add('hidden')
  app.querySelector('#search-results-pane').classList.add('hidden')
  app.querySelector('#message-container').classList.remove('hidden')
  app.querySelector('#msg-search').value = ''
  threadView.show(thread)
}

function onMessageSearch(query) {
  const msgContainer = app.querySelector('#message-container')
  const resultsPane = app.querySelector('#search-results-pane')

  if (!query.trim()) {
    resultsPane.classList.add('hidden')
    if (activeThread) {
      msgContainer.classList.remove('hidden')
      threadView.show(activeThread)
    }
    return
  }

  msgContainer.classList.add('hidden')
  resultsPane.classList.remove('hidden')

  const results = search(searchIndex, query)
  renderSearchResults(resultsPane, results, query)
}

function renderSearchResults(pane, results, query) {
  if (!results.length) {
    pane.innerHTML = '<div class="loading"><p>No messages found.</p></div>'
    return
  }

  const threadMap = new Map(threads.map(t => [t.id, t]))

  pane.innerHTML = `<h3>${results.reduce((s, r) => s + r.hits.length, 0)} matches in ${results.length} conversation${results.length !== 1 ? 's' : ''}</h3>`

  for (const { threadId, hits } of results) {
    const thread = threadMap.get(threadId)
    if (!thread) continue

    const group = document.createElement('div')
    group.className = 'search-group'

    const header = document.createElement('div')
    header.className = 'search-group-header'
    header.textContent = `${thread.name}${thread.name !== thread.address ? ' — ' + thread.address : ''} (${hits.length})`
    header.addEventListener('click', () => {
      openThread(thread)
      threadList.setActive(thread.id)
    })
    group.appendChild(header)

    for (const { msgIndex, msg } of hits.slice(0, 5)) {
      const hit = document.createElement('div')
      hit.className = 'search-hit'
      hit.innerHTML = highlightText(msg.text.slice(0, 120), query)
      hit.addEventListener('click', () => {
        openThread(thread)
        threadList.setActive(thread.id)
        app.querySelector('#msg-search').value = query
        threadView.show(thread, { highlightIndex: msgIndex, searchQuery: query })
        app.querySelector('#message-container').classList.remove('hidden')
        app.querySelector('#search-results-pane').classList.add('hidden')
      })
      group.appendChild(hit)
    }

    if (hits.length > 5) {
      const more = document.createElement('div')
      more.style.cssText = 'font-size:0.8em;color:var(--text-tertiary);padding:4px 10px;'
      more.textContent = `…and ${hits.length - 5} more`
      group.appendChild(more)
    }

    pane.appendChild(group)
  }
}

boot()
