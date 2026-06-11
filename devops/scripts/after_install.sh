#!/bin/bash
set -e

echo ""
echo "============================================================"
echo " AfterInstall started : $(date)"
echo "============================================================"

DEPLOY_DIR="/opt/welllabs/deployment"
SHARED_DIR="/opt/welllabs/shared"
SHARED_ENV="${SHARED_DIR}/.env"

# Normalize all deployment scripts to have Unix (LF) line endings
find "${DEPLOY_DIR}/devops/scripts" -type f -name "*.sh" -exec sed -i 's/\r$//' {} +

# ── [1] Source ARN pointer file from build artifact ──────────────────────────
echo ""
echo "--- [1/7] Reading deploy-env from artifact ---"

[[ -f "${DEPLOY_DIR}/deploy-env" ]] || {
  echo "ERROR: deploy-env not found in ${DEPLOY_DIR}."
  echo "Check: buildspec.yml post_build step writes this file."
  exit 1
}

# Strip leading whitespace (heredoc indentation from buildspec cat <<EOF)
sed -i 's/^[[:space:]]*//' "${DEPLOY_DIR}/deploy-env"

source "${DEPLOY_DIR}/deploy-env"

for var in PROJECT_NAME APP_CONFIG_SECRET_ARN; do
  [[ -n "${!var:-}" ]] || {
    echo "ERROR: '${var}' is missing or empty in deploy-env."
    echo "Check: Terraform pipeline module injects APP_CONFIG_SECRET_ARN and PROJECT_NAME."
    exit 1
  }
done

echo "Project        : ${PROJECT_NAME}"
echo "App Config ARN : ${APP_CONFIG_SECRET_ARN}"

# ── [2] Fetch the app-config secret from Secrets Manager ─────────────────────
echo ""
echo "--- [2/7] Fetching secret from AWS Secrets Manager ---"

APP_CONFIG_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "${APP_CONFIG_SECRET_ARN}" \
  --query SecretString \
  --output text 2>&1) || {
  echo "ERROR: Failed to fetch secret '${APP_CONFIG_SECRET_ARN}'."
  echo "Check: EC2 IAM role has secretsmanager:GetSecretValue on this ARN."
  echo "Run:   aws sts get-caller-identity   (to confirm role is attached)"
  exit 1
}

# ── [3] Validate JSON ─────────────────────────────────────────────────────────
echo ""
echo "--- [3/7] Validating secret JSON ---"

jq -e . > /dev/null 2>&1 <<< "${APP_CONFIG_JSON}" || {
  echo "ERROR: Secret value is not valid JSON."
  echo "Check: Secrets Manager secret was created by Terraform with jsonencode(...)."
  exit 1
}

echo "Keys in secret : $(jq -r 'keys | join(", ")' <<< "${APP_CONFIG_JSON}")"

# ── [4] Validate critical required fields ────────────────────────────────────
echo ""
echo "--- [4/7] Validating required fields ---"

REQUIRED_FIELDS=("MONGO_URI" "JWT_SECRET" "ADMIN_EMAIL")

for field in "${REQUIRED_FIELDS[@]}"; do
  VALUE=$(jq -r ".${field} // empty" <<< "${APP_CONFIG_JSON}")
  [[ -n "${VALUE}" ]] || {
    echo "ERROR: Required field '${field}' is missing or empty in Secrets Manager."
    echo "Check: Terraform secrets_manager module includes all required keys."
    exit 1
  }
  echo "✓ ${field} is present"
done

# ── [5] Write backend/.env dynamically ────────────────────────────────────────
echo ""
echo "--- [5/7] Writing ${SHARED_ENV} dynamically ---"

mkdir -p "${SHARED_DIR}"

# Generate .env file from ALL keys in JSON
jq -r 'to_entries | .[] | "\(.key)=\(.value)"' <<< "${APP_CONFIG_JSON}" > "${SHARED_ENV}"

# Secure the file — only root can read it
chmod 600 "${SHARED_ENV}"
chown root:root "${SHARED_ENV}"

echo ".env written  : ${SHARED_ENV}"
echo ".env contents:"
echo "─────────────────────────────────────────────────────────────"
# Show keys but mask sensitive values
while IFS='=' read -r key value; do
  if [[ "$key" =~ (SECRET|PASSWORD|TOKEN|KEY|URI) ]]; then
    echo "$key=[REDACTED, ${#value} chars]"
  else
    echo "$key=$value"
  fi
done < "${SHARED_ENV}"
echo "─────────────────────────────────────────────────────────────"

# ── [6] Backend deps, Nginx, symlinks ────────────────────────────────────────
echo ""
echo "--- [6/7] Installing backend dependencies ---"

[ -f "${DEPLOY_DIR}/backend/package.json" ] || {
  echo "ERROR: backend/package.json missing"
  exit 1
}
cd "${DEPLOY_DIR}/backend"
npm ci --omit=dev
echo "[deploy] Backend deps installed"

# Validate frontend build
[ -d "${DEPLOY_DIR}/frontend/dist" ] || {
  echo "ERROR: frontend/dist missing — check buildspec.yml"
  exit 1
}
echo "[deploy] frontend/dist OK ($(ls "${DEPLOY_DIR}/frontend/dist" | wc -l) files)"

# Deploy Nginx config
# [ -f "${DEPLOY_DIR}/devops/nginx/welllabs.conf" ] || {
#   echo "ERROR: devops/nginx/welllabs.conf missing"
#   exit 1
# }
# cp "${DEPLOY_DIR}/devops/nginx/welllabs.conf" /etc/nginx/sites-available/welllabs.conf
# rm -f /etc/nginx/sites-enabled/default
# ln -sf /etc/nginx/sites-available/welllabs.conf /etc/nginx/sites-enabled/welllabs.conf
# nginx -t
# systemctl restart nginx
# echo "[deploy] Nginx config deployed and restarted"

# Ensure node symlinks
NODE_PATH=$(which node 2>/dev/null || true)
if [ -n "$NODE_PATH" ]; then
  [ -f /usr/bin/node ]       || ln -sf "$NODE_PATH" /usr/bin/node
  [ -f /usr/local/bin/node ] || ln -sf "$NODE_PATH" /usr/local/bin/node
fi

# Ensure serve is installed
if ! command -v serve &>/dev/null; then
  echo "[deploy] serve not found. Installing globally..."
  npm install -g serve
fi

# Robust serve wrapper
SERVE_MAIN="$(npm root -g)/serve/build/main.js"
if [ -f "$SERVE_MAIN" ]; then
  rm -f /usr/bin/serve /usr/local/bin/serve
  cat << EOF > /tmp/serve_wrapper
#!/bin/bash
exec /usr/bin/node "$SERVE_MAIN" "\$@"
EOF
  chmod +x /tmp/serve_wrapper
  mv /tmp/serve_wrapper /usr/bin/serve
  ln -sf /usr/bin/serve /usr/local/bin/serve
fi

# ── [7] Deploy systemd units ──────────────────────────────────────────────────
echo ""
echo "--- [7/7] Deploying systemd units ---"

for SVC in welllabs-backend.service welllabs-frontend.service; do
  [ -f "${DEPLOY_DIR}/devops/systemd/${SVC}" ] || {
    echo "ERROR: ${SVC} missing"
    exit 1
  }
  cp "${DEPLOY_DIR}/devops/systemd/${SVC}" "/etc/systemd/system/${SVC}"
done

systemctl daemon-reload
systemctl enable welllabs-backend  2>/dev/null || true
systemctl enable welllabs-frontend 2>/dev/null || true
echo "[deploy] systemd units deployed and enabled"

echo ""
echo "============================================================"
echo " AfterInstall DONE : $(date)"
echo "============================================================"
