import { formatDateTime, formatDateSeparator, sameDay } from './format.js'
import { renderPart } from './media.js'
import { highlightText } from '../core/search.js'

const PAGE_SIZE = 80

/**
 * Manages the right-pane message thread view.
 * Renders messages in pages (latest first), loading more on scroll-to-top.
 */
export class ThreadView {
  constructor(container) {
    this.container = container
    this.thread = null
    this.renderedCount = 0
    this.highlightIndex = null
    this.searchQuery = ''
    this._onScroll = this._handleScroll.bind(this)
  }

  show(thread, opts = {}) {
    this.thread = thread
    this.renderedCount = 0
    this.highlightIndex = opts.highlightIndex ?? null
    this.searchQuery = opts.searchQuery || ''
    this.container.removeEventListener('scroll', this._onScroll)
    this._render()
    this.container.addEventListener('scroll', this._onScroll)
  }

  clear() {
    this.thread = null
    this.container.innerHTML = ''
    this.container.removeEventListener('scroll', this._onScroll)
  }

  _render() {
    const msgs = this.thread.messages
    const total = msgs.length
    const start = Math.max(0, total - PAGE_SIZE)
    this.renderedCount = total - start

    const wasAtBottom = this.renderedCount >= total
    this.container.innerHTML = ''

    if (start > 0) {
      this.container.appendChild(this._makeLoadMore(start))
    }

    this._appendMessages(msgs, start, total)

    if (wasAtBottom || this.highlightIndex === null) {
      this.container.scrollTop = this.container.scrollHeight
    }

    if (this.highlightIndex !== null) {
      requestAnimationFrame(() => this._scrollToHighlight())
    }
  }

  _loadMore() {
    const msgs = this.thread.messages
    const total = msgs.length
    const alreadyRendered = this.renderedCount
    const newStart = Math.max(0, total - alreadyRendered - PAGE_SIZE)
    const newEnd = total - alreadyRendered

    const loadMoreBtn = this.container.querySelector('.load-more-btn')
    const prevScrollHeight = this.container.scrollHeight
    const prevScrollTop = this.container.scrollTop

    if (newStart > 0) {
      const newBtn = this._makeLoadMore(newStart)
      if (loadMoreBtn) loadMoreBtn.replaceWith(newBtn)
      else this.container.insertBefore(newBtn, this.container.firstChild)
    } else {
      loadMoreBtn?.remove()
    }

    const anchor = this.container.querySelector('.msg-row')
    const fragment = document.createDocumentFragment()
    this._buildMessageNodes(msgs, newStart, newEnd, fragment)
    if (anchor) this.container.insertBefore(fragment, anchor)
    else this.container.insertBefore(fragment, this.container.firstChild)

    this.renderedCount += newEnd - newStart

    // Maintain scroll position
    this.container.scrollTop = prevScrollTop + (this.container.scrollHeight - prevScrollHeight)
  }

  _makeLoadMore(remaining) {
    const btn = document.createElement('button')
    btn.className = 'btn btn-secondary load-more-btn'
    btn.textContent = `Load ${Math.min(PAGE_SIZE, remaining)} older messages`
    btn.addEventListener('click', () => this._loadMore())
    return btn
  }

  _appendMessages(msgs, start, end) {
    const frag = document.createDocumentFragment()
    this._buildMessageNodes(msgs, start, end, frag)
    this.container.appendChild(frag)
  }

  _buildMessageNodes(msgs, start, end, fragment) {
    let prevDate = null
    for (let i = start; i < end; i++) {
      const msg = msgs[i]
      if (!prevDate || !sameDay(prevDate, msg.date)) {
        fragment.appendChild(makeDateSeparator(msg.date))
      }
      prevDate = msg.date
      const isHighlighted = this.highlightIndex === i
      fragment.appendChild(this._buildRow(msg, isHighlighted))
    }
  }

  _buildRow(msg, highlighted) {
    const row = document.createElement('div')
    row.className = `msg-row ${msg.outgoing ? 'outgoing' : 'incoming'}`
    if (highlighted) row.classList.add('highlighted-message')
    row.dataset.date = msg.date

    const bubble = document.createElement('div')
    bubble.className = 'bubble'

    if (msg.kind === 'sms') {
      const body = msg.text || ''
      if (this.searchQuery && body) {
        bubble.innerHTML = highlightText(body, this.searchQuery)
      } else {
        bubble.textContent = body
      }
    } else {
      // MMS: render text body + media parts
      const textBody = msg.text || ''
      if (textBody) {
        const p = document.createElement('p')
        if (this.searchQuery) {
          p.innerHTML = highlightText(textBody, this.searchQuery)
        } else {
          p.textContent = textBody
        }
        bubble.appendChild(p)
      }
      for (const part of msg.parts) {
        if (part.ct === 'text/plain') continue
        const el = renderPart(part, msg.outgoing)
        if (el) bubble.appendChild(el)
      }
    }

    const time = document.createElement('span')
    time.className = 'bubble-time'
    time.textContent = formatDateTime(msg.date)
    bubble.appendChild(time)

    row.appendChild(bubble)
    return row
  }

  _handleScroll() {
    if (this.container.scrollTop < 80) {
      const msgs = this.thread.messages
      if (this.renderedCount < msgs.length) {
        this._loadMore()
      }
    }
  }

  _scrollToHighlight() {
    const hi = this.container.querySelector('.highlighted-message')
    if (hi) hi.scrollIntoView({ block: 'center' })
  }
}

function makeDateSeparator(epochMs) {
  const div = document.createElement('div')
  div.className = 'date-separator'
  const span = document.createElement('span')
  span.textContent = formatDateSeparator(epochMs)
  div.appendChild(span)
  return div
}
