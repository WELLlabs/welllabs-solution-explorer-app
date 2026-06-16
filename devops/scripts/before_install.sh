#!/bin/bash
set -e

echo "[deploy] BeforeInstall — $(date)"

# Clean and recreate staging area
rm -rf /opt/welllabs/deployment
mkdir -p /opt/welllabs/deployment

# Ensure runtime dirs exist
mkdir -p /opt/welllabs/shared
mkdir -p /opt/welllabs/backend/releases
mkdir -p /opt/welllabs/frontend/releases
mkdir -p /opt/welllabs/logs

# NOTE: .env is NO LONGER created here.
# It is fetched from AWS Secrets Manager by after_install.sh
# using the APP_CONFIG_SECRET_ARN from the deploy-env artifact file.

echo "[deploy] BeforeInstall done" 
