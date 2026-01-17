#!/usr/bin/env bash
set -euo pipefail

# FoodGrid Admin Bootstrap Script
# Creates the initial admin user (restaurant owner) using API calls

BASE_URL="${BASE_URL:-http://localhost:8080}"

if ! command -v jq >/dev/null 2>&1; then
  echo "[WARN] jq not found. Please install jq for JSON parsing (brew install jq on macOS)." >&2
  exit 1
fi

log() {
  echo "[BOOTSTRAP] $*"
}

print_json() {
  local label="$1" json="$2"
  log "  Response for $label:"
  echo "$json" | jq . 2>/dev/null || echo "$json"
}

########################################
# Bootstrap admin user (restaurant owner)
########################################
log "Creating restaurant owner admin user..."

ADMIN_BOOTSTRAP_RESP=$(curl -s -X POST "$BASE_URL/api/v1/bootstrap/admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paulsouraj99@gmail.com",
    "password": "Souraj@123",
    "displayName": "Souraj Paul",
    "status": "ACTIVE"
  }')

print_json "admin bootstrap" "$ADMIN_BOOTSTRAP_RESP"

# Extract tokens
ADMIN_TOKEN=$(echo "$ADMIN_BOOTSTRAP_RESP" | jq -r '.accessToken' 2>/dev/null || true)
if [[ -z "${ADMIN_TOKEN:-}" ]]; then
  echo "[ERROR] Failed to get admin token from bootstrap response" >&2
  echo "$ADMIN_BOOTSTRAP_RESP" >&2
  exit 1
fi

export ADMIN_TOKEN
log "  Restaurant owner admin user created successfully!"
log "  ADMIN_TOKEN acquired"

echo ""
echo "Restaurant owner admin user created successfully!"
echo "Email: paulsouraj99@gmail.com"
echo "Password: Souraj@123"
echo ""
echo "This user can now:"
echo "- Create and manage multiple outlets"
echo "- Create and manage employees for each outlet"
echo "- Access all POS operations for their outlets"
echo ""
echo "Next steps:"
echo "1. Create outlets using: POST /api/v1/admin/outlets"
echo "2. Create employees for each outlet"
echo "3. Run the POS user flow script for specific outlets"
