#!/usr/bin/env bash
set -euo pipefail

# Always operate from the repo root (directory containing this script)
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

SERVICE_NAME="${SERVICE_NAME:-md-print}"
VENV_DIR="${VENV_DIR:-.venv}"
REQ_FILE="${REQ_FILE:-requirements.txt}"

echo "[deploy] Repo: $REPO_DIR"
echo "[deploy] Service: $SERVICE_NAME"

if [[ ! -d "$VENV_DIR" ]]; then
  echo "[deploy] ERROR: venv not found at '$REPO_DIR/$VENV_DIR'"
  echo "[deploy] Create it with: python3 -m venv $VENV_DIR"
  exit 1
fi

# Activate venv
# shellcheck disable=SC1090
source "$VENV_DIR/bin/activate"

# Update deps if requirements exists
if [[ -f "$REQ_FILE" ]]; then
  echo "[deploy] Installing requirements from $REQ_FILE"
  python -m pip install --upgrade pip
  python -m pip install -r "$REQ_FILE"
else
  echo "[deploy] No $REQ_FILE found, skipping dependency install"
fi

echo "[deploy] Restarting systemd service: $SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo "[deploy] Status:"
systemctl --no-pager --full status "$SERVICE_NAME" | sed -n '1,15p'

echo "[deploy] Done."
