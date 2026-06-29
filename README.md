# SMS Log Viewer

A local, privacy-respecting viewer for **SMS Backup & Restore** (synctech.com.au) XML exports.
All parsing happens client-side — your data never leaves your machine.

## Quick start

```bash
git clone <repo-url> sms-log-viewer
cd sms-log-viewer
./run.sh
```

`run.sh` handles everything: it pulls the latest code, runs `npm install` (only when needed), builds a self-contained `dist/index.html`, and opens it in your browser. You do not need to run `npm install` manually.

## Prerequisites

You need **Git** and **Node.js 18+**. A modern browser (Chrome, Firefox, Safari, Edge) is also required but is almost certainly already installed.

### macOS

```bash
# Install Homebrew if you don't have it (https://brew.sh)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install git node
```

### Ubuntu / Debian

The Node.js version in the default apt repository is often too old. Use the NodeSource package:

```bash
sudo apt update && sudo apt install -y git curl

# Add NodeSource LTS repository, then install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

### Fedora

```bash
sudo dnf install -y git nodejs
```

The `nodejs` package in Fedora 38+ ships Node 18 or later. On older releases, pin a newer stream:

```bash
sudo dnf module enable nodejs:20 -y && sudo dnf install -y nodejs
```

### Arch Linux

```bash
sudo pacman -S --needed git nodejs npm
```

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
