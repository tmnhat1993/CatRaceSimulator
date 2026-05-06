#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [[ ! -d dist ]] || [[ -z "$(ls -A dist 2>/dev/null)" ]]; then
  echo "dist/ is missing or empty. Run: npm run build" >&2
  exit 1
fi

REMOTE="$(git remote get-url origin)"
SITE="$(mktemp -d)"
trap 'rm -rf "$SITE"' EXIT

cp -a dist/. "$SITE/"
cd "$SITE"

git init -b deploy
git add -A
git commit -m "Deploy static build $(date -u +%Y-%m-%dT%H:%MZ)"
git remote add origin "$REMOTE"
git push -u origin deploy --force

echo "Pushed branch deploy to origin."
