#!/bin/bash
set -e

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
systemctl restart nginx
echo "[deploy] Nginx config deployed and restarted"

# Ensure node is available at both /usr/bin/node and /usr/local/bin/node
NODE_PATH=$(which node 2>/dev/null || true)
if [ -n "$NODE_PATH" ]; then
  [ -f /usr/bin/node ] || ln -sf "$NODE_PATH" /usr/bin/node
  [ -f /usr/local/bin/node ] || ln -sf "$NODE_PATH" /usr/local/bin/node
fi

# Ensure serve is installed globally
if ! command -v serve &>/dev/null; then
  echo "[deploy] serve not found. Installing globally..."
  npm install -g serve
fi

# Create a robust bash wrapper for serve to bypass the Node 20+ ESM require bug
SERVE_MAIN="$(npm root -g)/serve/build/main.js"
if [ -f "$SERVE_MAIN" ]; then
  echo "[deploy] Creating robust wrapper script for serve at /usr/bin/serve and /usr/local/bin/serve"
  rm -f /usr/bin/serve /usr/local/bin/serve
  cat << EOF > /tmp/serve_wrapper
#!/bin/bash
exec /usr/bin/node "$SERVE_MAIN" "\$@"
EOF
  chmod +x /tmp/serve_wrapper
  mv /tmp/serve_wrapper /usr/bin/serve
  ln -sf /usr/bin/serve /usr/local/bin/serve
else
  echo "[deploy] WARNING: serve main.js not found at $SERVE_MAIN. Attempting fallback symlink..."
  SERVE_PATH=$(which serve 2>/dev/null || true)
  if [ -n "$SERVE_PATH" ]; then
    rm -f /usr/bin/serve /usr/local/bin/serve
    ln -sf "$SERVE_PATH" /usr/bin/serve
    ln -sf "$SERVE_PATH" /usr/local/bin/serve
  fi
fi

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
echo "testing"
echo "testing 1"
echo "testing 2"
echo "testing 3"