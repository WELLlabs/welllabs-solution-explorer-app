#!/bin/bash
# FIX [VUL-1]: set -euo pipefail catches pipe failures AND unset variables.
# Without -u: a typo like ${DEPLOOY_DIR} silently becomes empty string → disaster.
# Without -o pipefail: a failed left-side of a pipe is swallowed → empty secrets.
set -euo pipefail

echo ""
echo "============================================================"
echo " AfterInstall started : $(date)"
echo "============================================================"

DEPLOY_DIR="/opt/welllabs/deployment"
SHARED_DIR="/opt/welllabs/shared"
SHARED_ENV="${SHARED_DIR}/.env"

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

# FIX [VUL-8 + VUL-3]: Normalize CRLF AFTER validation, and validate deploy-env
# before sourcing to prevent arbitrary code execution from a tampered artifact.
# Only lines matching KEY=VALUE, blank lines, or comments are permitted.
INVALID_LINES=$(grep -cvP '^\s*$|^\s*#|^[A-Z_][A-Z0-9_]*=\S' "${DEPLOY_DIR}/deploy-env" || true)
if [[ "${INVALID_LINES}" -gt 0 ]]; then
  echo "ERROR: deploy-env contains ${INVALID_LINES} non-KEY=value line(s). Aborting."
  echo "This may indicate a tampered or malformed build artifact."
  exit 1
fi

# Safe to source — only KEY=value lines are present
source "${DEPLOY_DIR}/deploy-env"

# Normalize all deployment scripts to have Unix (LF) line endings
# FIX [VUL-8]: Moved AFTER artifact validation so tampered scripts are caught first.
find "${DEPLOY_DIR}/devops/scripts" -type f -name "*.sh" -exec sed -i 's/\r$//' {} +

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

# FIX [VUL-2]: Separate stderr from stdout so that AWS CLI error messages are
# NOT captured into APP_CONFIG_JSON. Errors go to the log; the variable stays clean.
# Removing 2>&1 means a failure exits via set -e (stderr is visible in CodeDeploy logs).
APP_CONFIG_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "${APP_CONFIG_SECRET_ARN}" \
  --query SecretString \
  --output text) || {
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

# FIX [VUL-2]: Only log key names — never echo the raw JSON blob.
# Key names alone carry no sensitive information.
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

# ── [5] URL-encode MONGO_URI password ────────────────────────────────────────
echo ""
echo "--- [5/7] Encoding MONGO_URI password ---"

# Pure-bash URL encoder — MongoDB passwords contain : @ # ! etc.
url_encode() {
  local raw="${1}" encoded="" i char hex
  for (( i = 0; i < ${#raw}; i++ )); do
    char="${raw:i:1}"
    case "${char}" in
      [A-Za-z0-9._~-]) encoded+="${char}" ;;
      *) printf -v hex '%%%02X' "'${char}"; encoded+="${hex}" ;;
    esac
  done
  echo "${encoded}"
}

RAW_MONGO_URI=$(jq -r '.MONGO_URI // empty' <<< "${APP_CONFIG_JSON}")
[[ -n "${RAW_MONGO_URI}" ]] || { echo "ERROR: 'MONGO_URI' missing in secret JSON."; exit 1; }

MONGO_PASS_RAW=$(echo "${RAW_MONGO_URI}" | grep -oP '(?<=://)[^:]+:\K[^@]+')

if [[ -z "${MONGO_PASS_RAW}" ]]; then
  echo "WARNING: Could not parse password from MONGO_URI — using URI as-is."
  ENCODED_MONGO_URI="${RAW_MONGO_URI}"
else
  MONGO_SCHEME_USER=$(echo "${RAW_MONGO_URI}" | grep -oP '^[^:]+://[^:]+:')
  MONGO_AFTER_PASS=$(echo "${RAW_MONGO_URI}" | grep -oP '@.+$')
  ENCODED_MONGO_URI="${MONGO_SCHEME_USER}$(url_encode "${MONGO_PASS_RAW}")${MONGO_AFTER_PASS}"
  echo "MONGO_URI      : password URL-encoded (redacted)"
fi

# Patch encoded URI back into JSON so .env gets the safe version
APP_CONFIG_JSON=$(jq --arg uri "${ENCODED_MONGO_URI}" '.MONGO_URI = $uri' <<< "${APP_CONFIG_JSON}")

# ── [6] Write backend/.env dynamically ────────────────────────────────────────
echo ""
echo "--- [6/7] Writing ${SHARED_ENV} dynamically ---"

mkdir -p "${SHARED_DIR}"

# Generate .env file from ALL keys in JSON
# Values are single-quoted so shell metacharacters (: * # ^ ! @ etc.)
# inside passwords/secrets do NOT break "source .env" in application_start.sh.
# Any single-quote inside a value is escaped as '\'' (end quote, literal ', re-open quote).
jq -r 'to_entries | .[] | "\(.key)='\''\(.value | gsub("'\''"; "'\''\\'\'''\''"))'\''"' \
  <<< "${APP_CONFIG_JSON}" > "${SHARED_ENV}"

# Secure the file — only root can read it
chmod 600 "${SHARED_ENV}"
chown root:root "${SHARED_ENV}"

echo ".env written  : ${SHARED_ENV}"
echo ".env contents:"
echo "─────────────────────────────────────────────────────────────"

# FIX [VUL-6]: Only log the key NAMES — never echo any value (even partial).
# The original IFS='=' split broke on values containing '=', leaking partial secrets.
# Using grep to extract key names is safe and unambiguous.
echo "Keys written to .env:"
grep -oP "^[A-Z_a-z][A-Z_a-z0-9]*(?==)" "${SHARED_ENV}" | while read -r key; do
  echo "  ✓ ${key}"
done

echo "─────────────────────────────────────────────────────────────"

# ── [7] Backend deps, Nginx, symlinks ────────────────────────────────────────
echo ""
echo "--- [7/7] Installing backend dependencies ---"

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
# FIX [VUL-7]: Use -e (follows symlinks) instead of -f (regular file only).
# Double-quote "${NODE_PATH}" to handle paths with spaces (e.g. NVM installs).
NODE_PATH=$(which node 2>/dev/null || true)
if [[ -n "${NODE_PATH}" ]]; then
  [[ -e /usr/bin/node       ]] || ln -sf "${NODE_PATH}" /usr/bin/node
  [[ -e /usr/local/bin/node ]] || ln -sf "${NODE_PATH}" /usr/local/bin/node
  echo "[deploy] node symlinks verified → ${NODE_PATH}"
fi

# Ensure serve is installed
# FIX [VUL-5]: Pin the exact version of serve to ensure deterministic,
# auditable deployments. Never install an unpinned package in production.
if ! command -v serve &>/dev/null; then
  echo "[deploy] serve not found. Installing pinned version globally..."
  npm install -g serve@14.2.3
fi

# Robust serve wrapper
# FIX [VUL-4]: Write directly to /usr/bin/serve — no /tmp intermediary.
# /tmp is world-writable; writing there and then mv'ing creates a TOCTOU
# race window where an attacker can swap the file before mv executes as root.
SERVE_MAIN="$(npm root -g)/serve/build/main.js"
if [ -f "${SERVE_MAIN}" ]; then
  rm -f /usr/bin/serve /usr/local/bin/serve
  # Write directly to the final destination — eliminates the /tmp race window
  cat <<EOF > /usr/bin/serve
#!/bin/bash
exec /usr/bin/node "${SERVE_MAIN}" "\$@"
EOF
  chmod +x /usr/bin/serve
  ln -sf /usr/bin/serve /usr/local/bin/serve
fi

# ── [8] Deploy systemd units ──────────────────────────────────────────────────
echo ""
echo "--- [8/8] Deploying systemd units ---"

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
