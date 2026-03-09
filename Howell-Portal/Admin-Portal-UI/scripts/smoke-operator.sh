#!/usr/bin/env bash
set -euo pipefail

HOST="${SMOKE_HOST:-127.0.0.1}"
PORT="${SMOKE_PORT:-4173}"
BASE_URL="http://${HOST}:${PORT}"
PREVIEW_LOG="/tmp/howell-operator-preview.log"

npm run build --workspace @howell-technologies/operator-portal
npm run preview --workspace @howell-technologies/operator-portal -- --host "${HOST}" --port "${PORT}" >"${PREVIEW_LOG}" 2>&1 &
PREVIEW_PID=$!

cleanup() {
  kill "${PREVIEW_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in {1..45}; do
  if curl -fsS "${BASE_URL}/login" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "${BASE_URL}/login" >/dev/null; then
  echo "Smoke test failed: preview server did not become ready at ${BASE_URL}"
  echo "--- Preview log ---"
  cat "${PREVIEW_LOG}" || true
  exit 1
fi

curl -fsS "${BASE_URL}/" >/dev/null
curl -fsS "${BASE_URL}/login" >/dev/null

echo "Smoke test passed for operator portal (${BASE_URL})."
