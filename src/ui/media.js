import { parseVcard } from '../core/vcard.js'

const PAGE_SIZE = 80

/**
 * Creates a DOM element for a single MMS part.
 * Base64 data is decoded lazily via IntersectionObserver.
 */
export function renderPart(part, isOutgoing) {
  const { ct, text, data, name } = part

  if (ct === 'text/plain') {
    return null // handled by the bubble text
  }

  if (ct.startsWith('image/')) {
    return makelazyImage(data, ct, name)
  }

  if (ct.startsWith('video/')) {
    return makeLazyVideo(data, ct)
  }

  if (ct === 'application/pdf') {
    return makePdfLink(data, name || 'document.pdf')
  }

  if (ct === 'text/x-vcard') {
    return makeVcardCard(text || atob(data || ''), name)
  }

  // Unknown / unsupported
  if (data) {
    const div = document.createElement('div')
    div.className = 'unsupported-part'
    div.textContent = `[Attachment: ${name || ct}]`
    const link = makeDownloadLink(data, ct, name || 'attachment')
    div.appendChild(document.createTextNode(' '))
    div.appendChild(link)
    return div
  }

  return null
}

function makelazyImage(data, ct, name) {
  const wrapper = document.createElement('div')
  wrapper.className = 'media-wrapper'

  const img = document.createElement('img')
  img.className = 'media-image'
  img.alt = name || 'image'
  img.dataset.lazyData = data
  img.dataset.lazyCt = ct

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const el = entry.target
        if (!el.src) {
          el.src = `data:${el.dataset.lazyCt};base64,${el.dataset.lazyData}`
          delete el.dataset.lazyData
          delete el.dataset.lazyCt
        }
        observer.unobserve(el)
      }
    }
  }, { rootMargin: '200px' })

  img.addEventListener('click', () => openLightbox(img.src))
  wrapper.appendChild(img)
  observer.observe(img)
  return wrapper
}

function makeLazyVideo(data, ct) {
  const wrapper = document.createElement('div')
  wrapper.className = 'media-wrapper'

  const video = document.createElement('video')
  video.className = 'media-video'
  video.controls = true
  video.dataset.lazyData = data
  video.dataset.lazyCt = ct

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const el = entry.target
        if (!el.src) {
          el.src = `data:${el.dataset.lazyCt};base64,${el.dataset.lazyData}`
          delete el.dataset.lazyData
          delete el.dataset.lazyCt
        }
        observer.unobserve(el)
      }
    }
  }, { rootMargin: '200px' })

  wrapper.appendChild(video)
  observer.observe(video)
  return wrapper
}

function makePdfLink(data, name) {
  const a = makeDownloadLink(data, 'application/pdf', name)
  a.textContent = `Download ${name}`
  a.className = 'media-download-link'
  return a
}

function makeVcardCard(text, name) {
  const card = parseVcard(text)
  const div = document.createElement('div')
  div.className = 'vcard-preview'

  const nameEl = document.createElement('div')
  nameEl.className = 'vcard-name'
  nameEl.textContent = card.name || name || 'Contact'
  div.appendChild(nameEl)

  for (const phone of card.phones) {
    const el = document.createElement('div')
    el.className = 'vcard-phone'
    el.textContent = phone
    div.appendChild(el)
  }

  for (const email of card.emails) {
    const el = document.createElement('div')
    el.className = 'vcard-email'
    el.textContent = email
    div.appendChild(el)
  }

  if (text) {
    const b64 = btoa(unescape(encodeURIComponent(text)))
    const link = makeDownloadLink(b64, 'text/x-vcard', (name || 'contact') + '.vcf')
    link.textContent = 'Save contact'
    link.className = 'media-download-link'
    div.appendChild(link)
  }

  return div
}

function makeDownloadLink(data, ct, filename) {
  const a = document.createElement('a')
  a.href = `data:${ct};base64,${data}`
  a.download = filename
  a.className = 'media-download-link'
  a.textContent = `Download ${filename}`
  return a
}

function openLightbox(src) {
  const overlay = document.createElement('div')
  overlay.className = 'lightbox'
  const img = document.createElement('img')
  img.src = src
  overlay.appendChild(img)
  overlay.addEventListener('click', () => overlay.remove())
  document.body.appendChild(overlay)
}
