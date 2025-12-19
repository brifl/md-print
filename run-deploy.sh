#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

BRANCH="${BRANCH:-main}"

echo "[runner] Repo: $REPO_DIR"
echo "[runner] Pulling latest from origin/$BRANCH"

# Make sure we're on the intended branch
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[runner] Running deploy.sh (post-pull)"
exec "$REPO_DIR/deploy.sh"
