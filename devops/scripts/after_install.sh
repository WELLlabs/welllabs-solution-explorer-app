#!/bin/bash
set -e
exec >> /var/log/welllabs-deploy.log 2>&1

echo "[deploy] AfterInstall — $(date)"

DEPLOY_DIR="/opt/welllabs/deployment"

# Normalize all deployment scripts to have Unix (LF) line endings to prevent bad interpreter errors
find "${DEPLOY_DIR}/devops/scripts" -type f -name "*.sh" -exec sed -i 's/\r$//' {} +


# 1. Install backend production dependencies
[ -f "${DEPLOY_DIR}/backend/package.json" ] || { echo "[deploy] ERROR: backend/package.json missing"; exit 1; }
cd "${DEPLOY_DIR}/backend"
npm ci --omit=dev
echo "[deploy] Backend deps installed"

# 2. Validate frontend build exists (built by CodeBuild)
[ -d "${DEPLOY_DIR}/frontend/dist" ] || { echo "[deploy] ERROR: frontend/dist missing — check buildspec.yml"; exit 1; }
echo "[deploy] frontend/dist OK ($(ls "${DEPLOY_DIR}/frontend/dist" | wc -l) files)"

# 3. Deploy Nginx config from repo
[ -f "${DEPLOY_DIR}/devops/nginx/welllabs.conf" ] || { echo "[deploy] ERROR: devops/nginx/welllabs.conf missing"; exit 1; }
cp "${DEPLOY_DIR}/devops/nginx/welllabs.conf" /etc/nginx/sites-available/welllabs.conf
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/welllabs.conf /etc/nginx/sites-enabled/welllabs.conf
nginx -t
systemctl reload nginx
echo "[deploy] Nginx config deployed and reloaded"

# 4. Deploy and enable systemd service files from repo
for SVC in welllabs-backend.service welllabs-frontend.service; do
  [ -f "${DEPLOY_DIR}/devops/systemd/${SVC}" ] || { echo "[deploy] ERROR: ${SVC} missing"; exit 1; }
  cp "${DEPLOY_DIR}/devops/systemd/${SVC}" "/etc/systemd/system/${SVC}"
done
systemctl daemon-reload
systemctl enable welllabs-backend  2>/dev/null || true
systemctl enable welllabs-frontend 2>/dev/null || true
echo "[deploy] systemd units deployed and enabled"

echo "[deploy] AfterInstall done"
