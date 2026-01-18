#!/usr/bin/env bash
set -euo pipefail

# Seed DB via API using curl (multi-tenant real-world flow)
# - Uses only HTTP calls (curl) and jq for parsing
# - Creates multiple restaurant owners (clients), outlets per client, employees, menu, tables
# - Does not alter the DB directly

BASE_URL="${BASE_URL:-http://localhost:8080}"
CLIENTS=${CLIENTS:-2}
OUTLETS_PER_CLIENT=${OUTLETS_PER_CLIENT:-1}
EMPLOYEES_PER_OUTLET=${EMPLOYEES_PER_OUTLET:-2}
ITEMS_PER_OUTLET=${ITEMS_PER_OUTLET:-3}
DEV_CODE_PREFIX=${DEV_CODE_PREFIX:-POS-DEV}
# Retry settings for bootstrap (seconds between tries and number of attempts)
BOOTSTRAP_RETRY_INTERVAL=${BOOTSTRAP_RETRY_INTERVAL:-2}
BOOTSTRAP_MAX_ATTEMPTS=${BOOTSTRAP_MAX_ATTEMPTS:-30}

if ! command -v jq >/dev/null 2>&1; then
  echo "[ERROR] jq not found. Install jq (brew install jq) and retry." >&2
  exit 1
fi

log() { echo "[SEED] $*"; }
print_json(){ local label="$1" json="$2"; log "  $label:"; echo "$json" | jq . || echo "$json"; }
require_field(){ local json="$1" field="$2" label="$3"; local v; v=$(echo "$json" | jq -er ".$field" 2>/dev/null || true); if [[ -z "${v:-}" ]]; then echo "[ERROR] Missing field $field in $label" >&2; echo "$json" >&2; exit 1; fi; echo "$v"; }

admin_login() {
  local email="$1" password="$2"
  local resp
  resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/admin/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")

  local http_code body
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')

  if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
    echo "[ERROR] Admin login failed for $email (HTTP $http_code)" >&2
    echo "$body" >&2
    return 1
  fi

  echo "$body"
}

# quick health check
if ! curl --head --silent --fail "$BASE_URL/" >/dev/null 2>&1; then
  echo "[ERROR] Backend not reachable at $BASE_URL. Start the server (mvn quarkus:dev) and retry." >&2
  exit 1
fi

SUMMARY_FILE="/tmp/foodgrid_seed_summary.json"
> "$SUMMARY_FILE"

log "Seeding $CLIENTS client(s) with $OUTLETS_PER_CLIENT outlet(s) each."
for i in $(seq 1 $CLIENTS); do
  email="client${i}@example.com"
  password="Client${i}@123"
  name="Client ${i}"

  log "Creating client admin: $email"

  # Bootstrap with retry loop to wait for schema readiness.
  # If bootstrap fails because the user already exists, we fall back to admin login.
  attempt=0
  BOOTSTRAP_RESP=""
  while true; do
    attempt=$((attempt+1))

    RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/bootstrap/admin" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\",\"displayName\":\"$name\",\"status\":\"ACTIVE\"}")
    HTTP_CODE=$(echo "$RESP" | tail -n1)
    BODY=$(echo "$RESP" | sed '$d')

    print_json "bootstrap response (client $i)" "$BODY"

    if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
      BOOTSTRAP_RESP="$BODY"
      break
    fi

    # If user already exists, try login and synthesize the bootstrap response
    if [[ "$HTTP_CODE" == "400" ]] && echo "$BODY" | grep -Eqi "already|exists|duplicate"; then
      log "Bootstrap indicates user probably exists; trying admin login for $email..."
      LOGIN_BODY=$(admin_login "$email" "$password")
      BOOTSTRAP_RESP="$LOGIN_BODY"
      break
    fi

    log "Bootstrap failed (HTTP $HTTP_CODE) on attempt $attempt/$BOOTSTRAP_MAX_ATTEMPTS. Retrying in ${BOOTSTRAP_RETRY_INTERVAL}s..."
    if echo "$BODY" | grep -qi "SQLGrammarException"; then
      log "  Detected SQLGrammarException in bootstrap response (likely missing table)."
    fi

    if [[ $attempt -ge $BOOTSTRAP_MAX_ATTEMPTS ]]; then
      echo "[ERROR] Bootstrap failed after $attempt attempts. Last response (HTTP $HTTP_CODE):" >&2
      echo "$BODY" >&2
      exit 1
    fi
    sleep "$BOOTSTRAP_RETRY_INTERVAL"
  done

  ACCESS_TOKEN=$(echo "$BOOTSTRAP_RESP" | jq -r '.accessToken // empty')
  ADMIN_ID=$(echo "$BOOTSTRAP_RESP" | jq -r '.admin.id // empty')
  if [[ -z "${ACCESS_TOKEN}" || -z "${ADMIN_ID}" ]]; then
    echo "[ERROR] Failed to obtain admin token for $email" >&2
    echo "$BOOTSTRAP_RESP" >&2
    exit 1
  fi

  client_summary="{\"email\":\"$email\",\"adminId\":\"$ADMIN_ID\",\"outlets\":[] }"

  for o in $(seq 1 $OUTLETS_PER_CLIENT); do
    outlet_name="${name} Outlet ${o}"
    timezone="Asia/Kolkata"

    log "  Creating outlet: $outlet_name"
    OUTLET_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"ownerId\":\"$ADMIN_ID\",\"name\":\"$outlet_name\",\"timezone\":\"$timezone\"}")

    print_json "create outlet" "$OUTLET_RESP"
    OUTLET_ID=$(echo "$OUTLET_RESP" | jq -r '.id // empty')
    if [[ -z "$OUTLET_ID" ]]; then
      echo "[ERROR] Failed to create outlet for $email" >&2
      exit 1
    fi

    device_code="${DEV_CODE_PREFIX}-${i}-${o}"
    log "  Registering device/login-context: $device_code"
    LOGIN_CTX=$(curl -s "$BASE_URL/api/v1/auth/login-context?deviceId=$device_code&outletId=$OUTLET_ID")
    print_json "login-context" "$LOGIN_CTX"

    emp_ids="[]"
    for e in $(seq 1 $EMPLOYEES_PER_OUTLET); do
      emp_email="emp${i}${o}${e}@example.com"
      emp_name="Employee ${i}-${o}-${e}"
      pin="1${i}${o}${e}2345"
      log "    Creating employee: $emp_email"
      EMP_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"displayName\":\"$emp_name\",\"email\":\"$emp_email\",\"avatarUrl\":null,\"pin\":\"$pin\",\"status\":\"ACTIVE\"}")
      print_json "create employee" "$EMP_RESP"
      EMP_ID=$(echo "$EMP_RESP" | jq -r '.id // empty')
      if [[ -z "$EMP_ID" ]]; then echo "[ERROR] Failed to create employee" >&2; exit 1; fi

      ROLE_RESP=$(curl -s -X PUT "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees/$EMP_ID/roles" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"roles":["CASHIER"]}')
      print_json "assign role" "$ROLE_RESP"

      emp_ids=$(echo "$emp_ids" | jq ". + [\"$EMP_ID\"]")
    done

    log "  Creating menu category and $ITEMS_PER_OUTLET items"
    CAT_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/categories" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name":"Popular","sortOrder":1,"status":"ACTIVE"}')
    print_json "create category" "$CAT_RESP"
    CAT_ID=$(echo "$CAT_RESP" | jq -r '.id // empty')

    item_ids="[]"
    for it in $(seq 1 $ITEMS_PER_OUTLET); do
      item_name="Item-${i}-${o}-${it}"
      price=$((50 + it * 10)).00
      ITEM_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/items" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"categoryId\":\"$CAT_ID\",\"name\":\"$item_name\",\"description\":\"Tasty\",\"isVeg\":true,\"basePrice\":$price,\"status\":\"ACTIVE\"}")
      print_json "create item" "$ITEM_RESP"
      ITEM_ID=$(echo "$ITEM_RESP" | jq -r '.id // empty')
      item_ids=$(echo "$item_ids" | jq ". + [\"$ITEM_ID\"]")
    done

    TABLE_IDS="[]"
    for tnum in 1 2; do
      TABLE_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/tables" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"tableCode\":\"T${tnum}\",\"displayName\":\"Table ${tnum}\",\"capacity\":4,\"status\":\"ACTIVE\"}")
      print_json "create table" "$TABLE_RESP"
      TID=$(echo "$TABLE_RESP" | jq -r '.id // empty')
      TABLE_IDS=$(echo "$TABLE_IDS" | jq ". + [\"$TID\"]")
    done

    outlet_summary=$(jq -n \
      --arg id "$OUTLET_ID" \
      --arg name "$outlet_name" \
      --arg device "$device_code" \
      --argjson employees "$emp_ids" \
      --argjson items "$item_ids" \
      --argjson tables "$TABLE_IDS" \
      '{id:$id,name:$name,device:$device,employees:$employees,items:$items,tables:$tables}')

    client_summary=$(echo "$client_summary" | jq ".outlets += [ $outlet_summary ]")
  done

  echo "$client_summary" | jq . >> "$SUMMARY_FILE"
  echo >> "$SUMMARY_FILE"

  log "Client $email seeded"
  sleep 1
done

log "Seeding completed. Summary in $SUMMARY_FILE"
cat "$SUMMARY_FILE" | jq -s .

exit 0
