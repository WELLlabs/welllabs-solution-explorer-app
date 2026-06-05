#!/bin/bash
set -e
exec >> /var/log/welllabs-deploy.log 2>&1

echo "[deploy] BeforeInstall — $(date)"

# Clean and recreate staging area
rm -rf /opt/welllabs/deployment
mkdir -p /opt/welllabs/deployment

# Ensure runtime dirs exist
mkdir -p /opt/welllabs/shared
mkdir -p /opt/welllabs/backend/releases
mkdir -p /opt/welllabs/frontend/releases
mkdir -p /opt/welllabs/logs

# Create .env placeholder on very first deploy
if [ ! -f /opt/welllabs/shared/.env ]; then
  echo "[deploy] WARNING: no .env found — creating placeholder. Update before first deploy!"
  cat > /opt/welllabs/shared/.env << 'EOF'
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/welllabs
JWT_SECRET=CHANGE-ME-TO-A-LONG-RANDOM-SECRET-KEY-2026
ADMIN_EMAIL=admin@ifmr.ac.in
CONSULTANT_SECRET=CONSULTANT2026
GBA_SECRET=GBA_SECURE_2026
DONOR_SECRET=DONOR_LOVE_2026
WELL_LABS_2_SECRET=WELL_LABS_2_SECURE
EOF
fi

echo "[deploy] BeforeInstall done"
