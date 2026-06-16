#!/bin/bash

set -euo pipefail

echo "[deploy] ApplicationStart — $(date)"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="/opt/welllabs/deployment"
BACKEND_REL="/opt/welllabs/backend/releases/${TIMESTAMP}"
FRONTEND_REL="/opt/welllabs/frontend/releases/${TIMESTAMP}"
SHARED_ENV="/opt/welllabs/shared/.env"

BACKEND_TEST_PORT=5001
FRONTEND_TEST_PORT=3001
BACKEND_TEST_PID=""
FRONTEND_TEST_PID=""


# If after_install.sh failed silently, the .env could be empty or missing.
# Starting the app with an empty .env means MONGO_URI="" → silent connection failure.
if [[ ! -f "${SHARED_ENV}" ]]; then
  echo "ERROR: ${SHARED_ENV} not found. after_install.sh may have failed."
  exit 1
fi
if [[ ! -s "${SHARED_ENV}" ]]; then
  echo "ERROR: ${SHARED_ENV} is empty. Secrets were not written correctly."
  exit 1
fi

# ── Health check helper ───────────────────────────────────────
check() {

  # Unquoted $PORT and $URL in [ ] and echo can break on values with spaces or special chars.
  local PORT="${1}" URL="${2}"
  for i in $(seq 1 30); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${URL}" 2>/dev/null || echo "000")
    if [[ "${CODE}" = "200" ]]; then
      echo "[deploy] OK :${PORT} (attempt ${i})"
      return 0
    fi
    echo "[deploy] :${PORT} → ${CODE}, retry ${i}/30..."
    sleep 3
  done
  echo "[deploy] FAILED :${PORT} after 30 attempts"
  return 1
}

# ── Cleanup test processes ────────────────────────────────────
cleanup() {
  
  # Also use [[ ]] (bash conditional) instead of [ ] for consistency and safety.
  [[ -n "${BACKEND_TEST_PID}"  ]] && kill "${BACKEND_TEST_PID}"  2>/dev/null || true
  [[ -n "${FRONTEND_TEST_PID}" ]] && kill "${FRONTEND_TEST_PID}" 2>/dev/null || true
  sleep 2
  
  fuser -k "${BACKEND_TEST_PORT}/tcp"  2>/dev/null || true
  fuser -k "${FRONTEND_TEST_PORT}/tcp" 2>/dev/null || true
}

# ── STEP 1: Create release directories ───────────────────────
mkdir -p "${BACKEND_REL}" "${FRONTEND_REL}"

# ── STEP 2: Copy new code into release dirs ───────────────────
cp -r "${DEPLOY_DIR}/backend/." "${BACKEND_REL}/"
ln -sf "${SHARED_ENV}" "${BACKEND_REL}/.env"
cp -r "${DEPLOY_DIR}/frontend/dist/." "${FRONTEND_REL}/"

echo "[deploy] Releases staged: ${TIMESTAMP}"

# ── STEP 3: Clear test ports ──────────────────────────────────
fuser -k "${BACKEND_TEST_PORT}/tcp"  2>/dev/null || true
fuser -k "${FRONTEND_TEST_PORT}/tcp" 2>/dev/null || true
sleep 1

# ── STEP 4: Start test processes (invisible to Nginx) ─────────
cd "${BACKEND_REL}"


if grep -qP '\r' "${SHARED_ENV}" 2>/dev/null; then
  echo "ERROR: ${SHARED_ENV} contains Windows line endings (\\r)."
  echo "This indicates after_install.sh did not write the .env correctly."
  exit 1
fi


# This is intentional — node needs the env vars. But we must ensure the file
# is root-owned (600) before sourcing, otherwise a low-privilege user could
# have tampered with it between after_install and now.
if [[ "$(stat -c '%a' "${SHARED_ENV}")" != "600" ]]; then
  echo "ERROR: ${SHARED_ENV} has unsafe permissions (expected 600)."
  echo "It may have been tampered with. Aborting."
  exit 1
fi

set -a; source "${SHARED_ENV}"; set +a

# FIX [VUL-7]: Quote ${BACKEND_TEST_PORT} in the node command.
# Without quotes, a variable containing spaces or special chars breaks the command.
PORT="${BACKEND_TEST_PORT}" node server.js >> /opt/welllabs/logs/backend-test.log 2>&1 &
BACKEND_TEST_PID=$!

# Dynamically find the serve binary to be highly robust, falling back to /usr/local/bin/serve
SERVE_BIN="/usr/local/bin/serve"
if [[ ! -x "${SERVE_BIN}" ]]; then
  SERVE_BIN=$(which serve 2>/dev/null || echo "/usr/bin/serve")
fi

# FIX [VUL-7]: Quote all variables — SERVE_BIN, FRONTEND_REL, FRONTEND_TEST_PORT.
"${SERVE_BIN}" -s "${FRONTEND_REL}" -l "${FRONTEND_TEST_PORT}" \
  >> /opt/welllabs/logs/frontend-test.log 2>&1 &
FRONTEND_TEST_PID=$!

echo "[deploy] Test processes started (backend PID=${BACKEND_TEST_PID}, frontend PID=${FRONTEND_TEST_PID})"
sleep 5

# ── STEP 5: Health check both test ports ─────────────────────
BACKEND_OK=true
FRONTEND_OK=true

# FIX [VUL-3]: Quote the port arguments to check() for safety.
check "${BACKEND_TEST_PORT}"  "http://127.0.0.1:${BACKEND_TEST_PORT}/api/health" || BACKEND_OK=false
check "${FRONTEND_TEST_PORT}" "http://127.0.0.1:${FRONTEND_TEST_PORT}"           || FRONTEND_OK=false

# ── STEP 6: Swap or abort ─────────────────────────────────────
if [[ "${BACKEND_OK}" = "true" ]] && [[ "${FRONTEND_OK}" = "true" ]]; then
  cleanup

  # Atomic symlink swap
  ln -sfn "${BACKEND_REL}"  /opt/welllabs/backend/current
  ln -sfn "${FRONTEND_REL}" /opt/welllabs/frontend/current

  # Restart active services with new code
  systemctl restart welllabs-backend
  systemctl restart welllabs-frontend

  # FIX [VUL-8]: Prune old releases safely.
  # Original used: ls -dt ... | tail -n +4 | xargs rm -rf
  # Problem: xargs rm -rf with no input runs "rm -rf" with NO arguments on some systems —
  # which on older xargs versions deletes the current directory.
  # Fix: use --no-run-if-empty (GNU xargs) to guarantee xargs does nothing if input is empty.
  ls -dt /opt/welllabs/backend/releases/*/  2>/dev/null | tail -n +4 | xargs --no-run-if-empty rm -rf || true
  ls -dt /opt/welllabs/frontend/releases/*/ 2>/dev/null | tail -n +4 | xargs --no-run-if-empty rm -rf || true

  echo "[deploy] SUCCESS — $(date)"
else
  echo "[deploy] ABORTED (backend=${BACKEND_OK} frontend=${FRONTEND_OK}) — live services untouched"

  echo "=== Backend Test Logs ==="
  cat /opt/welllabs/logs/backend-test.log 2>/dev/null || echo "No backend test log found."

  echo "=== Frontend Test Logs ==="
  cat /opt/welllabs/logs/frontend-test.log 2>/dev/null || echo "No frontend test log found."

  cleanup
  rm -rf "${BACKEND_REL}" "${FRONTEND_REL}" 2>/dev/null || true 
  exit 1
fi
