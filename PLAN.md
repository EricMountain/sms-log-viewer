# SMS / MMS Backup Viewer — Plan

A local, privacy-respecting viewer for **SMS Backup & Restore** (synctech.com.au)
XML exports. Lets you load a backup, browse conversations, filter by contact,
full-text search, and view embedded media. Call logs are out of scope for now.

## Goals

- Load a backup XML file and browse it as conversation threads.
- **Filter by caller/contact** (primary feature).
- **Full-text search** across message bodies (nice-to-have, but planned in).
- **Display embedded media** (images, video, PDF, vCards) inline.
- **User-adjustable, persisted UI** — font size / zoom (for eyesight) and theme,
  remembered across sessions via `localStorage`.
- Focus on **SMS + MMS**; ignore the call log file.
- **Launch / update via one script** — `run.sh` pulls latest, builds, and opens.
- **Distributable** to a handful of people through `git clone` + a couple steps.
- **Data never leaves the machine** — parsing happens entirely client-side.

## The data format (verified against the samples)

The backup is a single XML file (`sms-*.xml`, ~20 MB in the sample) with a root
`<smses count="…">` containing a flat, chronological list of two element types.

### `<sms>` — plain text messages (2498 in sample)
Key attributes:
| attr | meaning |
|---|---|
| `address` | phone number / short code (sender or recipient) |
| `contact_name` | resolved name, or `(Unknown)` |
| `body` | message text |
| `date` | epoch **milliseconds** (received time) |
| `date_sent` | epoch ms (sent time; `0` for outgoing) |
| `type` | **1 = received (inbox), 2 = sent** |
| `read` | 0/1 |
| `readable_date` | human string, e.g. `16 Dec 2017 15:33:44` |

### `<mms>` — multimedia / group messages (436 in sample)
Attributes of note: `address`, `contact_name`, `date` (epoch ms),
`msg_box` (**1 = received, 2 = sent**, 4 = outbox), `text_only`.
Contains two child blocks:

- `<parts>` → one or more `<part>`:
  | attr | meaning |
  |---|---|
  | `ct` | MIME content type |
  | `text` | text content (for `text/plain` parts) |
  | `data` | **base64-encoded bytes** for binary parts (images, pdf, video, vcard) |
  | `cl` / `name` | filename/label |
  | `seq` | ordering (`-1` = SMIL layout part, ignore) |

  Content types seen in the sample: `application/smil` (layout, **skip**),
  `text/plain`, `image/jpeg`, `image/png`, `application/pdf`, `video/mp4`,
  `text/x-vcard`, plus some Google RCS `proto:*`/`botmessage` parts (**skip/ignore**).

- `<addrs>` → `<addr address="…" type="…">` — participants. `type 137` =
  sender (from), `type 151` = recipient (to). Used to detect **group MMS**.

**Important:** all media is embedded inline as base64 in the `data` attribute —
there are **no external media files** to manage. The viewer is fully self-contained.

## Conversation model

- A **conversation** = the set of messages sharing a normalized `address`
  (fall back to `contact_name`). Group MMS (multiple `<addr>` of type 151) form
  their own thread keyed by the sorted participant set.
- Within a thread, messages sort by `date` ascending.
- **Direction**: `sms.type==2` or `mms.msg_box==2` → outgoing (right-aligned);
  otherwise incoming (left-aligned).
- Thread list shows: contact name, number, last-message preview + timestamp,
  message count; sorted by most-recent activity.

## Architecture (decided)

**Modular ES-module source, built into a single self-contained `index.html`.**
Develop with proper modules + unit tests; ship one inlined HTML file the user
just opens. This keeps the code testable/extensible while preserving the
"open a file, data stays local" experience.

### Stack
- **Vite** — dev server with hot-reload during development; production build
  inlines all JS/CSS into one self-contained `dist/index.html`
  (via `vite-plugin-singlefile`).
- **Vitest** — unit tests for the DOM-free logic (parsing, thread grouping,
  search, vCard). UI/integration tests deferred until we actually hit issues.
- **Plain ES modules (JavaScript)** to start — simple to debug; Vite makes a
  later switch to TypeScript trivial if it ever earns its keep.
- **No UI framework** — the app is small and DOM-light; vanilla keeps it lean.
  (Revisit only if component complexity demands it.)

### Why this over a single hand-written file
A single inlined `file://` page can't use ES-module `import`s (browsers block
them cross-origin), which would force everything into one growing file. Building
from modules gives us real separation + tests, and still emits one openable file.

### Code organization (DOM-free core vs thin UI)
- **Core (pure, unit-tested):** `parser` (XML → message objects),
  `model` (group into threads, sort, direction), `search` (index + query),
  `vcard` (extract name/number), `settings` (load/save prefs).
- **UI (thin):** file loading, thread-list rendering, message rendering, media
  rendering, search box, settings panel. Talks only to the core.

### Launch / update / distribute
- **`run.sh`** one-command launcher: `git pull` → `npm install` (only if
  `node_modules` missing or `package-lock` changed) → `npm run build` → open
  `dist/index.html`. This is also how recipients get updates.
- **Distribution:** `git clone`, then `./run.sh`. README documents the few steps.
- Dev loop: `npm run dev` (hot reload), `npm test` (watch), `npm run build`.

### Settings & persistence
- A `settings` module reads/writes `localStorage` (works on `file://` too).
- Exposed controls: **font scale / zoom** (eyesight) and **light/dark theme**.
- Implemented as a root CSS variable (e.g. `--font-scale`) applied to the
  document so one control rescales the whole UI; restored on load.

### Parsing strategy
- Sample is ~20 MB but only ~3,400 messages; the size is mostly base64 media.
- Parse once with `DOMParser` (acceptable at this size). If memory/latency is a
  problem, fall back to a streaming/`SAX`-style pass.
- **Lazy media:** keep base64 `data` as strings; only build `data:` URLs (or
  Blob URLs) when a message scrolls into view, and revoke them when out of view.
  This keeps memory bounded.
- **Virtualized rendering** of the message list so a 2,900-message thread stays
  responsive.

### Media rendering
- `image/*` → `<img>` (lazy `data:`/blob URL), click to enlarge.
- `video/mp4` → `<video controls>`.
- `application/pdf` → download link + optional inline `<embed>`.
- `text/x-vcard` → parse and show name/phone/email nicely, with a download link.
- `text/plain` parts → rendered as the message body.
- Unknown/`proto:`/`smil` → skipped (or shown as a small "unsupported
  attachment" chip with a raw-download fallback).

## Features → build order

### Phase 1 — Load & list (MVP)
- File picker / drag-drop; parse SMS+MMS; build thread index.
- Two-pane UI: conversation list (left) + message thread (right).
- Render text bubbles with direction, timestamp, contact header.

### Phase 2 — Filtering
- **Filter by contact**: search/select box over the thread list (by name or
  number). Live-filters the conversation list.

### Phase 3 — Media
- Render embedded images/video/pdf/vcard inline with lazy decoding + lightbox.

### Phase 4 — Full-text search
- Search box over message bodies (and vcard/text part content). Build a simple
  in-memory index; show matches grouped by conversation with snippet + highlight;
  click to jump to the message in its thread.

### Phase 5 — Settings & accessibility
- Settings panel with **font scale / zoom** and **light/dark theme**, persisted
  to `localStorage` and restored on load.
- `run.sh` launcher (pull → install → build → open) + README setup steps.

### Phase 6 — Polish (optional)
- Date jump / scroll-to-date, message counts, unread styling.
- Export a thread to text/HTML.
- Responsive layout.

## Edge cases to handle
- HTML entities in attributes (`&lt;`, smart quotes, accented chars — sample is
  French/UTF-8). DOMParser handles entity decoding; verify rendering.
- `(Unknown)` contacts and short-code senders (e.g. `38653`, `FLY`).
- Group MMS with multiple recipients.
- `null` string values (literal `"null"`) — treat as empty.
- Very large media parts — lazy-load; don't decode all upfront.
- `date` vs `readable_date` mismatch / timezone (prefer epoch `date`, format locally).
- Empty/`text_only` MMS, MMS that are actually just text.

## Non-goals (for now)
- Call log (`calls-*.xml`) viewing.
- Editing / writing back to the backup.
- **Multiple backups at once** — view one file at a time (no merge/dedupe).
- Full vCard parsing — show **name + number only** for now.
- Uploading data anywhere / any server-side processing.

## Decisions (resolved)
- **Architecture:** modular ES source → single self-contained `index.html` via Vite.
- **Launch:** `run.sh` does the work; recipients `git clone` + `./run.sh`.
- **Backups:** one at a time.
- **vCards:** name + number only.
- **Testing:** unit tests on the core now; UI tests only if issues arise.
- **Settings:** font scale/zoom + theme, persisted to `localStorage`.

## Proposed file layout
```
sms-log-viewer/
├── PLAN.md
├── README.md            # setup + run steps for recipients
├── run.sh               # pull → install → build → open dist/index.html
├── package.json
├── vite.config.js       # + vite-plugin-singlefile
├── index.html           # Vite entry (mounts the app)
├── src/
│   ├── main.js          # bootstraps UI
│   ├── core/
│   │   ├── parser.js    # XML → message objects
│   │   ├── model.js     # threads, sorting, direction
│   │   ├── search.js    # full-text index + query
│   │   ├── vcard.js     # name/number extraction
│   │   └── settings.js  # localStorage prefs
│   └── ui/
│       ├── loader.js    # file picker / drag-drop
│       ├── threadList.js
│       ├── thread.js    # message bubbles
│       ├── media.js     # image/video/pdf/vcard rendering
│       └── settingsPanel.js
├── test/                # vitest unit tests for src/core
└── data/                # sample backups (gitignored)
```
