#!/bin/bash
set -e
exec >> /var/log/welllabs-deploy.log 2>&1

echo "[deploy] ValidateService — $(date)"

FAIL=0

check_http() {
  local LABEL="$1" URL="$2" EXPECT="${3:-200}"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" 2>/dev/null || echo "000")
  if [ "$CODE" = "$EXPECT" ]; then
    echo "[deploy] OK   $LABEL → HTTP $CODE"
  else
    echo "[deploy] FAIL $LABEL → HTTP $CODE (expected $EXPECT)"
    FAIL=$((FAIL + 1))
  fi
}

check_svc() {
  local SVC="$1"
  STATUS=$(systemctl is-active "$SVC" 2>/dev/null || echo "unknown")
  if [ "$STATUS" = "active" ]; then
    echo "[deploy] OK   $SVC is active"
  else
    echo "[deploy] FAIL $SVC is $STATUS"
    FAIL=$((FAIL + 1))
  fi
}

# HTTP checks through Nginx
check_http "backend /api/health" "http://localhost/api/health"
check_http "frontend /"          "http://localhost/"

# systemd service checks
check_svc "welllabs-backend"
check_svc "welllabs-frontend"
check_svc "nginx"
check_svc "mongod"

# Confirm test ports are free
for PORT in 5001 3001; do
  fuser -k ${PORT}/tcp 2>/dev/null || true
done

if [ "$FAIL" -eq 0 ]; then
  echo "[deploy] ValidateService PASSED ($FAIL failures) — $(date)"
  exit 0
else
  echo "[deploy] ValidateService FAILED ($FAIL checks) — triggering rollback"
  exit 1
fi
