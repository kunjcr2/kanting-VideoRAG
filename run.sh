#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
VITE_BACKEND_URL="${VITE_BACKEND_URL:-http://${BACKEND_HOST}:${BACKEND_PORT}}"
export BACKEND_HOST BACKEND_PORT FRONTEND_HOST FRONTEND_PORT VITE_BACKEND_URL

if [[ ! -x "$ROOT_DIR/work/venv/bin/python" ]]; then
  echo "Missing Python environment. Run: python3 -m venv work/venv && work/venv/bin/pip install -r requirements.txt"
  exit 1
fi

if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  echo "Missing frontend dependencies. Run: cd frontend && npm install"
  exit 1
fi

mkdir -p "$ROOT_DIR/work/logs"

OLLAMA_PID=""
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://127.0.0.1:11434}"
export OLLAMA_BASE_URL
if command -v ollama >/dev/null 2>&1 && ! curl -fsS --max-time 2 "$OLLAMA_BASE_URL/api/tags" >/dev/null 2>&1; then
  echo "Starting local Ollama service at $OLLAMA_BASE_URL"
  ollama serve > "$ROOT_DIR/work/logs/ollama.log" 2>&1 &
  OLLAMA_PID=$!
fi

echo "Starting Kanting backend at http://${BACKEND_HOST}:${BACKEND_PORT}"
PYTHONPATH="$ROOT_DIR/api" "$ROOT_DIR/work/venv/bin/python" -m flask \
  --app api.index run --host "$BACKEND_HOST" --port "$BACKEND_PORT" \
  > "$ROOT_DIR/work/logs/backend.log" 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend initialization..."
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"
for attempt in {1..90}; do
  if curl -fsS --max-time 2 "$BACKEND_URL/health" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Backend exited during startup. See work/logs/backend.log"
    exit 1
  fi
  if [[ "$attempt" == "90" ]]; then
    echo "Backend did not become ready. See work/logs/backend.log"
    exit 1
  fi
  sleep 1
done

echo "Starting Kanting frontend at http://${FRONTEND_HOST}:${FRONTEND_PORT}"
(cd "$ROOT_DIR/frontend" && npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT") \
  > "$ROOT_DIR/work/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  if [[ -n "$OLLAMA_PID" ]]; then kill "$OLLAMA_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

echo "Kanting is running. Press Ctrl+C to stop both services."
wait "$BACKEND_PID" "$FRONTEND_PID"
