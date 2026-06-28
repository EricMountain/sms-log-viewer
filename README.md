# SMS Log Viewer

A local, privacy-respecting viewer for **SMS Backup & Restore** (synctech.com.au) XML exports.
All parsing happens client-side — your data never leaves your machine.

## Quick start

```bash
git clone <repo-url> sms-log-viewer
cd sms-log-viewer
./run.sh
```

`run.sh` pulls the latest code, installs dependencies (only when needed), builds a self-contained `dist/index.html`, and opens it in your browser.

## Requirements

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- A modern browser (Chrome, Firefox, Safari, Edge)

## Usage

1. Export your messages from **SMS Backup & Restore** on Android.
2. Transfer the `sms-*.xml` file to your computer.
3. Run `./run.sh` (or open `dist/index.html` directly if already built).
4. Drop or select your XML file.

## Features

- Browse all SMS and MMS conversations
- Filter conversations by contact name or number
- View embedded images, videos, PDFs, and vCards inline
- Full-text search across all message bodies
- Adjustable text size and light/dark theme (saved between sessions)

## Development

```bash
npm run dev       # Hot-reload dev server
npm test          # Run unit tests
npm run build     # Build dist/index.html
```

## Privacy

No server, no network requests, no tracking. The built `dist/index.html` runs entirely offline.
