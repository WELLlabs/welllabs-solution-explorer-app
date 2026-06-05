#!/bin/bash
set -e
exec >> /var/log/welllabs-deploy.log 2>&1

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

# ── Health check helper ───────────────────────────────────────
check() {
  local PORT="$1" URL="$2"
  for i in $(seq 1 30); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL" 2>/dev/null || echo "000")
    [ "$CODE" = "200" ] && { echo "[deploy] OK :${PORT} (attempt $i)"; return 0; }
    echo "[deploy] :${PORT} → $CODE, retry $i/30..."
    sleep 3
  done
  echo "[deploy] FAILED :${PORT} after 30 attempts"
  return 1
}

# ── Cleanup test processes ────────────────────────────────────
cleanup() {
  [ -n "$BACKEND_TEST_PID"  ] && kill "$BACKEND_TEST_PID"  2>/dev/null || true
  [ -n "$FRONTEND_TEST_PID" ] && kill "$FRONTEND_TEST_PID" 2>/dev/null || true
  sleep 2
  fuser -k 5001/tcp  2>/dev/null || true
  fuser -k 3001/tcp 2>/dev/null || true
}

# ── STEP 1: Create release directories ───────────────────────
mkdir -p "$BACKEND_REL" "$FRONTEND_REL"

# ── STEP 2: Copy new code into release dirs ───────────────────
cp -r "${DEPLOY_DIR}/backend/." "$BACKEND_REL/"
ln -sf "$SHARED_ENV" "$BACKEND_REL/.env"
cp -r "${DEPLOY_DIR}/frontend/dist/." "$FRONTEND_REL/"

echo "[deploy] Releases staged: $TIMESTAMP"

# ── STEP 3: Clear test ports ──────────────────────────────────
fuser -k ${BACKEND_TEST_PORT}/tcp  2>/dev/null || true
fuser -k ${FRONTEND_TEST_PORT}/tcp 2>/dev/null || true
sleep 1

# ── STEP 4: Start test processes (invisible to Nginx) ─────────
cd "$BACKEND_REL"
set -a; source "$SHARED_ENV"; set +a
PORT=${BACKEND_TEST_PORT} node server.js >> /opt/welllabs/logs/backend-test.log 2>&1 &
BACKEND_TEST_PID=$!

/usr/local/bin/serve -s "$FRONTEND_REL" -l ${FRONTEND_TEST_PORT} \
  >> /opt/welllabs/logs/frontend-test.log 2>&1 &
FRONTEND_TEST_PID=$!

echo "[deploy] Test processes started (backend PID=$BACKEND_TEST_PID, frontend PID=$FRONTEND_TEST_PID)"
sleep 5

# ── STEP 5: Health check both test ports ─────────────────────
BACKEND_OK=true
FRONTEND_OK=true

check $BACKEND_TEST_PORT  "http://127.0.0.1:${BACKEND_TEST_PORT}/api/health" || BACKEND_OK=false
check $FRONTEND_TEST_PORT "http://127.0.0.1:${FRONTEND_TEST_PORT}"           || FRONTEND_OK=false

# ── STEP 6: Swap or abort ─────────────────────────────────────
if [ "$BACKEND_OK" = "true" ] && [ "$FRONTEND_OK" = "true" ]; then
  cleanup

  # Atomic symlink swap
  ln -sfn "$BACKEND_REL"  /opt/welllabs/backend/current
  ln -sfn "$FRONTEND_REL" /opt/welllabs/frontend/current

  # Restart active services with new code
  systemctl restart welllabs-backend
  systemctl restart welllabs-frontend

  # Prune old releases (keep last 3)
  ls -dt /opt/welllabs/backend/releases/*/  2>/dev/null | tail -n +4 | xargs rm -rf || true
  ls -dt /opt/welllabs/frontend/releases/*/ 2>/dev/null | tail -n +4 | xargs rm -rf || true

  echo "[deploy] SUCCESS — $(date)"
else
  echo "[deploy] ABORTED (backend=$BACKEND_OK frontend=$FRONTEND_OK) — live services untouched"
  cleanup
  rm -rf "$BACKEND_REL" "$FRONTEND_REL" 2>/dev/null || true
  exit 1
fi
