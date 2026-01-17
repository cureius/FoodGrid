#!/usr/bin/env bash
set -euo pipefail

# FoodGrid POS Backend — End-to-End User Flow Runner
# This script automates the curl flow from docs/POS_USER_FLOW.md and does basic checks.

BASE_URL="${BASE_URL:-http://localhost:8080}"

if ! command -v jq >/dev/null 2>&1; then
  echo "[WARN] jq not found. Please install jq for JSON parsing (brew install jq on macOS)." >&2
  exit 1
fi

log() {
  echo "[POS FLOW] $*"
}

print_json() {
  local label="$1" json="$2"
  log "  Response for $label:"
  echo "$json" | jq . 2>/dev/null || echo "$json"
}

require_field() {
  local json="$1" field="$2" label="$3"
  local v
  v=$(echo "$json" | jq -er ".$field" 2>/dev/null || true)
  if [[ -z "${v:-}" ]]; then
    echo "[ERROR] Missing or empty field '$field' in $label response" >&2
    echo "$json" >&2
    exit 1
  fi
  echo "$v"
}

########################################
# 0) Admin login (get ADMIN_TOKEN)
########################################
log "0) Admin login..."
ADMIN_LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"paulsouraj99@gmail.com","password":"Souraj@123"}')

print_json "admin login" "$ADMIN_LOGIN_RESP"

ADMIN_TOKEN=$(require_field "$ADMIN_LOGIN_RESP" accessToken "admin login")
export ADMIN_TOKEN
log "  ADMIN_TOKEN acquired"

########################################
# 1) Outlet setup (admin)
########################################
log "1) Create outlet..."
OUTLET_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"FoodGrid Downtown","timezone":"Asia/Kolkata"}')

print_json "create outlet" "$OUTLET_RESP"

OUTLET_ID=$(require_field "$OUTLET_RESP" id "create outlet")
export OUTLET_ID
log "  OUTLET_ID=$OUTLET_ID"

########################################
# 2) POS device bootstrap
########################################
log "2) POS device bootstrap..."
DEVICE_CODE="${DEVICE_CODE:-POS-DEVICE-001}"
export DEVICE_CODE

log "  Login context (auto-register device if needed)..."
LOGIN_CTX_RESP=$(curl -s "$BASE_URL/api/v1/auth/login-context?deviceId=$DEVICE_CODE&outletId=$OUTLET_ID")
print_json "login-context" "$LOGIN_CTX_RESP"
require_field "$LOGIN_CTX_RESP" outlet.id "login-context"

########################################
# 3) Employee setup (admin)
########################################
log "3) Employee setup..."
EMP_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Cashier One","email":"cashier1@foodgrid.com","avatarUrl":null,"pin":"123456","status":"ACTIVE"}')

print_json "create employee" "$EMP_RESP"

EMPLOYEE_ID=$(require_field "$EMP_RESP" id "create employee")
export EMPLOYEE_ID
log "  EMPLOYEE_ID=$EMPLOYEE_ID"

log "  Assign roles..."
ASSIGN_ROLES_RESP=$(curl -s -X PUT "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees/$EMPLOYEE_ID/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roles":["CASHIER"]}')
print_json "assign roles" "$ASSIGN_ROLES_RESP"

########################################
# 4) POS login (employee) -> POS_TOKEN
########################################
log "4) POS login (PIN)..."
LOGIN_PIN_RESP=$(curl -s -X POST "$BASE_URL/api/v1/auth/login/pin" \
  -H "Content-Type: application/json" \
  -d "{\"employeeId\":\"$EMPLOYEE_ID\",\"pin\":\"123456\",\"deviceId\":\"$DEVICE_CODE\"}")

print_json "login/pin" "$LOGIN_PIN_RESP"

POS_TOKEN=$(require_field "$LOGIN_PIN_RESP" accessToken "login/pin")
export POS_TOKEN
log "  POS_TOKEN acquired"

########################################
# 5) Setup menu + tables (admin)
########################################
log "5) Setup menu and tables..."
CATEGORY_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/categories" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Starters","sortOrder":1,"status":"ACTIVE"}')
print_json "create category" "$CATEGORY_RESP"
CATEGORY_ID=$(require_field "$CATEGORY_RESP" id "create category")
export CATEGORY_ID

ITEM_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/items" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categoryId\":\"$CATEGORY_ID\",\"name\":\"Fries\",\"description\":\"Classic salted\",\"isVeg\":true,\"basePrice\":99.00,\"status\":\"ACTIVE\"}")
print_json "create item" "$ITEM_RESP"
ITEM_ID=$(require_field "$ITEM_RESP" id "create item")
export ITEM_ID

TABLE_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/tables" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableCode":"T1","displayName":"Table 1","capacity":4,"status":"ACTIVE"}')
print_json "create table" "$TABLE_RESP"
TABLE_ID=$(require_field "$TABLE_RESP" id "create table")
export TABLE_ID

########################################
# 6) POS order workflow
########################################
log "6) POS order workflow..."
ORDER_RESP=$(curl -s -X POST "$BASE_URL/api/v1/pos/orders" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderType\":\"DINE_IN\",\"tableId\":\"$TABLE_ID\",\"notes\":\"No onions\"}")
print_json "create order" "$ORDER_RESP"
ORDER_ID=$(require_field "$ORDER_RESP" id "create order")
export ORDER_ID
log "  ORDER_ID=$ORDER_ID"

log "  Add item to order..."
ADD_ITEM_RESP=$(curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/items" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"itemId\":\"$ITEM_ID\",\"qty\":2}")
print_json "add order item" "$ADD_ITEM_RESP"
require_field "$ADD_ITEM_RESP" id "add order item" >/dev/null

log "  Fetch order and get first order item id..."
ORDER_VIEW=$(curl -s "$BASE_URL/api/v1/pos/orders/$ORDER_ID" \
  -H "Authorization: Bearer $POS_TOKEN")
print_json "view order" "$ORDER_VIEW"
ORDER_ITEM_ID=$(echo "$ORDER_VIEW" | jq -er '.items[0].id' 2>/dev/null || true)
if [[ -z "${ORDER_ITEM_ID:-}" ]]; then
  echo "[ERROR] Could not extract ORDER_ITEM_ID from order view" >&2
  echo "$ORDER_VIEW" >&2
  exit 1
fi
export ORDER_ITEM_ID

log "  Cancel first order item..."
CANCEL_ITEM_RESP=$(curl -s -X DELETE "$BASE_URL/api/v1/pos/orders/$ORDER_ID/items/$ORDER_ITEM_ID" \
  -H "Authorization: Bearer $POS_TOKEN")
print_json "cancel order item" "$CANCEL_ITEM_RESP"

log "  Bill order..."
BILL_RESP=$(curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/bill" \
  -H "Authorization: Bearer $POS_TOKEN")
print_json "bill order" "$BILL_RESP"

log "  Take payment..."
PAYMENT_RESP=$(curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/payments" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"CASH","amount":198.00}')
print_json "take payment" "$PAYMENT_RESP"

log "  List recent orders..."
LIST_ORDERS_RESP=$(curl -s "$BASE_URL/api/v1/pos/orders?limit=50" \
  -H "Authorization: Bearer $POS_TOKEN")
print_json "list recent orders" "$LIST_ORDERS_RESP"

########################################
# 7) POS session end
########################################
log "7) POS session end..."
log "  Logout..."
LOGOUT_RESP=$(curl -s -X POST "$BASE_URL/api/v1/pos/logout" \
  -H "Authorization: Bearer $POS_TOKEN")
print_json "logout" "$LOGOUT_RESP"

log "  Close shift..."
CLOSE_SHIFT_RESP=$(curl -s -X POST "$BASE_URL/api/v1/pos/shift/close" \
  -H "Authorization: Bearer $POS_TOKEN")
print_json "close shift" "$CLOSE_SHIFT_RESP"

log "Flow completed successfully."
