#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

BRANCH="${BRANCH:-main}"

echo "[run-deploy] Repo: $REPO_DIR"
echo "[run-deploy] Pulling latest from origin/$BRANCH"

# Make sure we're on the intended branch
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[run-deploy] Running deploy.sh (post-pull)"
exec "$REPO_DIR/deploy.sh"
