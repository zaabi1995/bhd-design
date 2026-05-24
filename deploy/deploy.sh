#!/usr/bin/env bash
# deploy.sh — push BHD design system to design.bhd.om on BHD VPS.
# Idempotent. Run after every src/ edit.
#
# Prereqs (one-time):
#   1. Cloudflare DNS A record: design.bhd.om → 147.93.20.54 (proxied)
#   2. apex bhd.om wildcard CF Origin cert in place at
#      /www/server/panel/vhost/cert/bhd.om/{fullchain,privkey}.pem
#   3. nginx vhost installed (--setup)
#
# Usage:
#   bash deploy.sh           # push src/ to /www/wwwroot/design.bhd.om/
#   bash deploy.sh --setup   # also (re)install nginx vhost + reload nginx
set -euo pipefail

VPS="${VPS:-root@147.93.20.54}"
REMOTE_ROOT="${REMOTE_ROOT:-/www/wwwroot/design.bhd.om}"
LOCAL_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "${1:-}" == "--setup" || "${1:-}" == "--reload-nginx" ]]; then
  echo "==> Installing/updating nginx vhost on VPS"
  ssh "$VPS" "mkdir -p $REMOTE_ROOT && chown -R www:www $REMOTE_ROOT"
  scp -q "$(dirname "$0")/nginx-design-bhd-om.conf" "$VPS:/www/server/panel/vhost/nginx/design.bhd.om.conf"
  ssh "$VPS" "nginx -t && systemctl reload nginx"
  echo "==> Vhost installed/reloaded."
  if [[ "${1:-}" == "--reload-nginx" ]]; then
    exit 0
  fi
fi

echo "==> Pushing src/ to VPS"
rsync -az --delete \
  --exclude='.DS_Store' \
  --exclude='__pycache__' \
  "$LOCAL_ROOT/src/" \
  "$VPS:$REMOTE_ROOT/" 2>&1 | tail -10

ssh "$VPS" "chown -R www:www $REMOTE_ROOT && \
  find $REMOTE_ROOT -type d -exec chmod 755 {} + && \
  find $REMOTE_ROOT -type f -exec chmod 644 {} +"

echo "==> Verifying"
ssh "$VPS" "ls $REMOTE_ROOT/"

echo
echo "Done."
echo "  Live:  https://design.bhd.om/"
echo "  Shell: https://design.bhd.om/admin-shell.html"

# Optional CF cache purge
if [[ -n "${CF_PURGE_TOKEN:-}" ]] && [[ -f "$LOCAL_ROOT/../../fonts/scripts/purge-cf-cache.sh" ]]; then
  echo
  echo "==> Purging Cloudflare cache"
  CF_PURGE_HOSTNAME=design.bhd.om bash "$LOCAL_ROOT/../../fonts/scripts/purge-cf-cache.sh" || true
fi
