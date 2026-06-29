#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Pull latest if we're in a git repo with a remote
if git remote | grep -q .; then
  echo "Pulling latest changes…"
  git pull
fi

# Install deps only when necessary (node_modules missing or lockfile newer)
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json 2>/dev/null ]; then
  echo "Installing dependencies…"
  npm install
fi

echo "Building…"
npm run build

echo "Opening dist/index.html…"
if command -v open &>/dev/null; then
  open dist/index.html
elif command -v xdg-open &>/dev/null; then
  xdg-open dist/index.html
else
  echo "Open dist/index.html in your browser."
fi
