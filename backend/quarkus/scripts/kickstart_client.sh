#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# FoodGrid - New Client Kickstart Script (Idempotent / Rerun-Proof)
#
# This script automates the onboarding of a new client (tenant) including:
# - Client & Admin User registration
# - Outlet creation
# - Default employees for the outlet
# - Menu seeding (Realistic or CSV-based)
# - Infrastructure (Tables, Units, Inventory)
###############################################################################

BASE_URL="${BASE_URL:-http://localhost:8080}"
SUPER_ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-admin@foodgrid.com}"
SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-123456}"

# Default values for new client
CLIENT_NAME="${1:-}"
CLIENT_EMAIL="${2:-}"
CLIENT_PASSWORD="${3:-123456}"
MENU_TYPE="${4:-realistic}" # realistic | csv
OUTLET_COUNT="${5:-3}"

if [[ -z "$CLIENT_NAME" || -z "$CLIENT_EMAIL" ]]; then
  echo "Usage: $0 \"<Client Name>\" \"<Admin Email>\" [\"<Admin Password>\"] [\"<Menu Type: realistic|csv>\"] [\"<Outlet Count>\"]"
  echo "Example: $0 \"The Pizza Hub\" \"admin@pizzahub.com\" \"Pizza@123\" \"realistic\" 3"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "[ERROR] jq not found. Install jq (brew install jq) and retry." >&2
  exit 1
fi

log() { echo "[KICKSTART] $*"; }
debug() { [[ "${DEBUG:-}" == "true" ]] && echo "[DEBUG] $*" || true; }

# --- API Helper Functions ---
admin_login() {
  local email="$1" password="$2"
  local resp http_code body
  resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/admin/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  if [[ "$http_code" -lt 200 || "$http_code" -ge 400 ]]; then
    debug "Login for $email failed (HTTP $http_code)"
    return 1
  fi
  echo "$body"
}

api_post() {
  local endpoint="$1" token="$2" data="$3"
  local resp http_code body
  resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$data")
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
    debug "POST $endpoint failed (HTTP $http_code): $body"
    echo "$body"
    return 0
  fi
  # Simple JSON check
  if [[ "$body" == *"{"* || "$body" == *"["* ]]; then
    echo "$body"
  else
    debug "POST $endpoint returned non-JSON body: $body"
    echo "{}"
  fi
}

api_put() {
  local endpoint="$1" token="$2" data="$3"
  local resp http_code body
  resp=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$data")
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
    debug "PUT $endpoint failed (HTTP $http_code): $body"
    echo "$body"
    return 0
  fi
  if [[ "$body" == *"{"* || "$body" == *"["* ]]; then
    echo "$body"
  else
    debug "PUT $endpoint returned non-JSON body: $body"
    echo "{}"
  fi
}

api_get() {
  local endpoint="$1" token="$2"
  local resp http_code body
  resp=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $token")
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
    debug "GET $endpoint failed (HTTP $http_code): $body"
    return 0
  fi
  if [[ "$body" == *"{"* || "$body" == *"["* ]]; then
    echo "$body"
  else
    debug "GET $endpoint returned non-JSON body: $body"
    echo "[]"
  fi
}

# --- Data Definitions ---

declare -a EMPLOYEE_TEMPLATES=(
  "Outlet Manager|manager|MANAGER|123456"
  "Day Cashier|cashier1|CASHIER|123456"
  "Head Waiter|waiter1|WAITER|123456"
  "Chef de Cuisine|chef1|KITCHEN|123456"
)

declare -a TABLE_CONFIGS=(
  "T1|Table 1|4"
  "T2|Table 2|2"
  "T3|Table 3|6"
  "T4|Table 4|4"
  "B1|Bar Counter|1"
)

declare -a UNITS_OF_MEASURE=(
  "Kilogram|kg|WEIGHT"
  "Gram|g|WEIGHT"
  "Litre|L|VOLUME"
  "Millilitre|ml|VOLUME"
  "Piece|pc|COUNT"
)

declare -a INGREDIENT_CATEGORIES=(
  "Vegetables|Fresh produce|🥬"
  "Dairy|Milk and cheese|🥛"
  "Spices|Seasonings|🌶️"
  "Meat|Poultry and red meat|🍗"
)

declare -a SUPPLIERS=(
  "Main Wholesale|John Supply|wholesale@foodgrid.local|+9100000000|Market Street 1"
  "Dairy Farm|Sarah Milk|dairy@foodgrid.local|+9100000001|Milk Colony 1"
)

# Realistic Menu Data
declare -a REALISTIC_CATEGORIES=("Starters|1" "Main Course|2" "Beverages|3" "Desserts|4")
declare -a REALISTIC_ITEMS=(
  "Starters|Paneer Tikka|Grilled cottage cheese|true|249.00"
  "Starters|Chicken Kebab|Spiced chicken skewers|false|329.00"
  "Main Course|Butter Chicken|Creamy tomato chicken curry|false|349.00"
  "Main Course|Dal Makhani|Slow cooked lentils|true|249.00"
  "Beverages|Masala Chai|Spiced tea|true|49.00"
  "Beverages|Fresh Lime Soda|Zesty soda|true|69.00"
  "Desserts|Gulab Jamun|Milk dumplings in syrup|true|99.00"
)

# CSV-like Menu Data
declare -a CSV_ITEMS=(
  "Sandwiches|Veg Grill Sandwich|75|true"
  "Sandwiches|Cheese Chilli Sandwich|108|true"
  "Egg Counter|Masala Omelette Pav|75|false"
  "Beverages|Cold Coffee|96|true"
  "Breakfast|Aloo Paratha|84|true"
)

# --- Start Kickstart ---

log "=============================================="
log "Kickstarting Client: $CLIENT_NAME"
log "=============================================="

# 1. Login/Bootstrap Super Admin
log "1. Authenticating Super Admin ($SUPER_ADMIN_EMAIL)..."
BOOTSTRAP_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/bootstrap/admin" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\",\"displayName\":\"System Admin\",\"status\":\"ACTIVE\"}")
HTTP_CODE=$(echo "$BOOTSTRAP_RESP" | tail -n1)
BODY=$(echo "$BOOTSTRAP_RESP" | sed '$d')

if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
  SA_TOKEN=$(echo "$BODY" | jq -r '.accessToken // empty')
else
  SA_RESP=$(admin_login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD") || {
    echo "[ERROR] Super Admin login failed. Ensure backend is running at $BASE_URL"
    exit 1
  }
  SA_TOKEN=$(echo "$SA_RESP" | jq -r '.accessToken // empty')
fi

# 2. Create Client (Tenant)
log "2. Ensuring Client '$CLIENT_NAME' exists..."
CLIENT_RESP=$(api_post "/api/v1/admin/tenants" "$SA_TOKEN" \
  "{\"name\":\"$CLIENT_NAME\",\"contactEmail\":\"$CLIENT_EMAIL\",\"status\":\"ACTIVE\",\"adminEmail\":\"$CLIENT_EMAIL\",\"adminPassword\":\"$CLIENT_PASSWORD\",\"adminDisplayName\":\"$CLIENT_NAME Admin\"}")

CLIENT_ID=$(echo "$CLIENT_RESP" | jq -r '.id // empty')
if [[ -z "$CLIENT_ID" || "$CLIENT_ID" == "null" ]]; then
  debug "Client creation response did not contain ID, checking existing tenants..."
  CLIENTS_LIST=$(api_get "/api/v1/admin/tenants" "$SA_TOKEN")
  CLIENT_ID=$(echo "$CLIENTS_LIST" | jq -r ".[] | select(.name == \"$CLIENT_NAME\") | .id" 2>/dev/null)
  if [[ -z "$CLIENT_ID" || "$CLIENT_ID" == "null" ]]; then
      echo "[ERROR] Failed to identify Client ID. Response: $CLIENT_RESP"
      exit 1
  fi
fi
log "   ✓ Client ID: $CLIENT_ID"

# 2b. Configure Payment Gateway
log "   💳 Ensuring payment gateway is configured (RAZORPAY)..."
CONFIGS=$(api_get "/api/v1/payment-config?clientId=$CLIENT_ID" "$SA_TOKEN")
EXISTING_GW=$(echo "$CONFIGS" | jq -r ".[] | select(.gatewayType == \"RAZORPAY\") | .id" 2>/dev/null)

if [[ -z "$EXISTING_GW" || "$EXISTING_GW" == "null" ]]; then
  api_post "/api/v1/payment-config/$CLIENT_ID" "$SA_TOKEN" \
    "{
      \"gatewayType\": \"RAZORPAY\",
      \"apiKey\": \"rzp_test_123456789\",
      \"secretKey\": \"rzp_test_secret_123456789\",
      \"isActive\": true,
      \"isLiveMode\": false,
      \"autoCaptureEnabled\": true,
      \"partialRefundEnabled\": true,
      \"webhookUrl\": \"http://localhost:8080/api/v1/webhooks/razorpay\"
    }" > /dev/null
  log "   ✓ Payment gateway configured"
else
  log "   ✓ Payment gateway already exists"
fi

# 3. Login as New Client Admin
log "3. Logging in as Client Admin ($CLIENT_EMAIL)..."
LOGIN_RESP=$(admin_login "$CLIENT_EMAIL" "$CLIENT_PASSWORD") || {
    echo "[ERROR] Client admin login failed."
    exit 1
}
ACCESS_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.accessToken // empty')
ADMIN_ID=$(echo "$LOGIN_RESP" | jq -r '.admin.id // empty')

# 4. Create Outlet(s)
OUTLETS_LIST=$(api_get "/api/v1/admin/outlets" "$ACCESS_TOKEN")

for i in $(seq 1 $OUTLET_COUNT); do
  OUTLET_NAME="$CLIENT_NAME - Outlet $i"
  if [[ $OUTLET_COUNT -eq 1 ]]; then OUTLET_NAME="$CLIENT_NAME - Main Outlet"; fi
  
  log ""
  log "--- Ensuring Outlet: $OUTLET_NAME ---"
  
  OUTLET_ID=$(echo "$OUTLETS_LIST" | jq -r ".[] | select(.name == \"$OUTLET_NAME\") | .id" 2>/dev/null)
  
  if [[ -z "$OUTLET_ID" || "$OUTLET_ID" == "null" ]]; then
    OUTLET_RESP=$(api_post "/api/v1/admin/outlets" "$ACCESS_TOKEN" \
      "{\"ownerId\":\"$ADMIN_ID\",\"name\":\"$OUTLET_NAME\",\"timezone\":\"Asia/Kolkata\"}")
    OUTLET_ID=$(echo "$OUTLET_RESP" | jq -r '.id // empty')
  fi

  if [[ -z "$OUTLET_ID" || "$OUTLET_ID" == "null" ]]; then
    echo "[ERROR] Failed to create or identify outlet: $OUTLET_NAME"
    continue
  fi
  log "   ✓ Outlet ID: $OUTLET_ID"

  # Register POS Device
  DEVICE_CODE="POS-$(echo $CLIENT_NAME | tr '[:upper:]' '[:lower:]' | tr -d ' ')-$i"
  curl -s "$BASE_URL/api/v1/auth/login-context?deviceId=$DEVICE_CODE&outletId=$OUTLET_ID" > /dev/null
  log "   ✓ POS Device heartbeat: $DEVICE_CODE"

  # 5. Create Employees
  log "   👥 Ensuring employees exist..."
  EXISTING_EMPS=$(api_get "/api/v1/admin/outlets/$OUTLET_ID/employees" "$ACCESS_TOKEN")
  for emp in "${EMPLOYEE_TEMPLATES[@]}"; do
    IFS='|' read -r E_NAME E_SUFFIX E_ROLE E_PIN <<< "$emp"
    E_EMAIL="${E_SUFFIX}.${i}@${CLIENT_EMAIL#*@}"
    
    EMP_ID=$(echo "$EXISTING_EMPS" | jq -r ".[] | select(.email == \"$E_EMAIL\") | .id" 2>/dev/null)
    
    if [[ -z "$EMP_ID" || "$EMP_ID" == "null" ]]; then
      EMP_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/employees" "$ACCESS_TOKEN" \
        "{\"displayName\":\"$E_NAME\",\"email\":\"$E_EMAIL\",\"pin\":\"$E_PIN\",\"status\":\"ACTIVE\"}")
      EMP_ID=$(echo "$EMP_RESP" | jq -r '.id // empty')
      
      if [[ -n "$EMP_ID" && "$EMP_ID" != "null" ]]; then
        api_put "/api/v1/admin/outlets/$OUTLET_ID/employees/$EMP_ID/roles" "$ACCESS_TOKEN" \
          "{\"roles\":[\"$E_ROLE\"]}" > /dev/null
      fi
    fi
  done
  log "   ✓ Employees checked"

  # 6. Seed Menu
  log "   🍽️  Ensuring menu is seeded ($MENU_TYPE)..."
  EXISTING_CATS=$(api_get "/api/v1/admin/outlets/$OUTLET_ID/menu/categories" "$ACCESS_TOKEN")
  EXISTING_ITEMS=$(api_get "/api/v1/admin/outlets/$OUTLET_ID/menu/items" "$ACCESS_TOKEN")
  
  declare -a CAT_MAP_NAMES=()
  declare -a CAT_MAP_IDS=()

  # Helper to get/create category
  get_or_create_cat() {
    local c_name="$1"
    local c_order="${2:-0}"
    local m_id=$(echo "$EXISTING_CATS" | jq -r ".[] | select(.name == \"$c_name\") | .id" 2>/dev/null)
    if [[ -z "$m_id" || "$m_id" == "null" ]]; then
        local c_resp=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/categories" "$ACCESS_TOKEN" \
          "{\"name\":\"$c_name\",\"sortOrder\":$c_order,\"status\":\"ACTIVE\"}")
        m_id=$(echo "$c_resp" | jq -r '.id')
        # Update local cache for immediate use
        EXISTING_CATS=$(echo "$EXISTING_CATS" | jq ". + [{\"id\":\"$m_id\",\"name\":\"$c_name\"}]")
    fi
    echo "$m_id"
  }

  if [[ "$MENU_TYPE" == "realistic" ]]; then
    for cat in "${REALISTIC_CATEGORIES[@]}"; do
      IFS='|' read -r C_NAME C_ORDER <<< "$cat"
      get_or_create_cat "$C_NAME" "$C_ORDER" > /dev/null
    done

    for item in "${REALISTIC_ITEMS[@]}"; do
      IFS='|' read -r C_NAME I_NAME I_DESC I_VEG I_PRICE <<< "$item"
      MATCH_ID=$(get_or_create_cat "$C_NAME")
      
      ITEM_EXISTS=$(echo "$EXISTING_ITEMS" | jq -r ".[] | select(.name == \"$I_NAME\" and .categoryId == \"$MATCH_ID\") | .id" 2>/dev/null)
      if [[ -z "$ITEM_EXISTS" || "$ITEM_EXISTS" == "null" ]]; then
        api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/items" "$ACCESS_TOKEN" \
          "{\"categoryId\":\"$MATCH_ID\",\"name\":\"$I_NAME\",\"description\":\"$I_DESC\",\"isVeg\":$I_VEG,\"basePrice\":$I_PRICE,\"status\":\"ACTIVE\"}" > /dev/null
      fi
    done
  else
    for item in "${CSV_ITEMS[@]}"; do
      IFS='|' read -r C_NAME I_NAME I_PRICE I_VEG <<< "$item"
      MATCH_ID=$(get_or_create_cat "$C_NAME")
      
      ITEM_EXISTS=$(echo "$EXISTING_ITEMS" | jq -r ".[] | select(.name == \"$I_NAME\" and .categoryId == \"$MATCH_ID\") | .id" 2>/dev/null)
      if [[ -z "$ITEM_EXISTS" || "$ITEM_EXISTS" == "null" ]]; then
        api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/items" "$ACCESS_TOKEN" \
          "{\"categoryId\":\"$MATCH_ID\",\"name\":\"$I_NAME\",\"description\":\"$I_NAME\",\"isVeg\":$I_VEG,\"basePrice\":$I_PRICE,\"status\":\"ACTIVE\"}" > /dev/null
      fi
    done
  fi
  log "   ✓ Menu checked"

  # 7. Infrastructure
  log "   🪑 Ensuring tables exist..."
  EXISTING_TABLES=$(api_get "/api/v1/admin/outlets/$OUTLET_ID/tables" "$ACCESS_TOKEN")
  for t in "${TABLE_CONFIGS[@]}"; do
    IFS='|' read -r T_CODE T_NAME T_CAP <<< "$t"
    T_EXISTS=$(echo "$EXISTING_TABLES" | jq -r ".[] | select(.tableCode == \"$T_CODE\") | .id" 2>/dev/null)
    if [[ -z "$T_EXISTS" || "$T_EXISTS" == "null" ]]; then
      api_post "/api/v1/admin/outlets/$OUTLET_ID/tables" "$ACCESS_TOKEN" \
        "{\"tableCode\":\"$T_CODE\",\"displayName\":\"$T_NAME\",\"capacity\":$T_CAP,\"status\":\"ACTIVE\"}" > /dev/null
    fi
  done

  log "   📏 Ensuring inventory basics exist..."
  EXISTING_UNITS=$(api_get "/api/v1/admin/outlets/$OUTLET_ID/inventory/units" "$ACCESS_TOKEN")
  for u in "${UNITS_OF_MEASURE[@]}"; do
    IFS='|' read -r U_NAME U_ABBR U_TYPE <<< "$u"
    U_EXISTS=$(echo "$EXISTING_UNITS" | jq -r ".[] | select(.abbreviation == \"$U_ABBR\") | .id" 2>/dev/null)
    if [[ -z "$U_EXISTS" || "$U_EXISTS" == "null" ]]; then
      api_post "/api/v1/admin/outlets/$OUTLET_ID/inventory/units" "$ACCESS_TOKEN" \
        "{\"name\":\"$U_NAME\",\"abbreviation\":\"$U_ABBR\",\"unitType\":\"$U_TYPE\",\"status\":\"ACTIVE\"}" > /dev/null
    fi
  done

  EXISTING_ING_CATS=$(api_get "/api/v1/admin/outlets/$OUTLET_ID/inventory/categories" "$ACCESS_TOKEN")
  for ic in "${INGREDIENT_CATEGORIES[@]}"; do
    IFS='|' read -r IC_NAME IC_DESC IC_ICON <<< "$ic"
    IC_EXISTS=$(echo "$EXISTING_ING_CATS" | jq -r ".[] | select(.name == \"$IC_NAME\") | .id" 2>/dev/null)
    if [[ -z "$IC_EXISTS" || "$IC_EXISTS" == "null" ]]; then
      api_post "/api/v1/admin/outlets/$OUTLET_ID/inventory/categories" "$ACCESS_TOKEN" \
        "{\"name\":\"$IC_NAME\",\"description\":\"$IC_DESC\",\"icon\":\"$IC_ICON\",\"status\":\"ACTIVE\"}" > /dev/null
    fi
  done

  EXISTING_SUPPLIERS=$(api_get "/api/v1/admin/outlets/$OUTLET_ID/inventory/suppliers" "$ACCESS_TOKEN")
  for s in "${SUPPLIERS[@]}"; do
    IFS='|' read -r S_NAME S_CONTACT S_EMAIL S_PHONE S_ADDR <<< "$s"
    S_EXISTS=$(echo "$EXISTING_SUPPLIERS" | jq -r ".[] | select(.name == \"$S_NAME\") | .id" 2>/dev/null)
    if [[ -z "$S_EXISTS" || "$S_EXISTS" == "null" ]]; then
      api_post "/api/v1/admin/outlets/$OUTLET_ID/inventory/suppliers" "$ACCESS_TOKEN" \
        "{\"name\":\"$S_NAME\",\"contactPerson\":\"$S_CONTACT\",\"email\":\"$S_EMAIL\",\"phone\":\"$S_PHONE\",\"address\":\"$S_ADDR\",\"status\":\"ACTIVE\"}" > /dev/null
    fi
  done
  log "   ✓ Infrastructure checked"

done

log ""
log "=============================================="
log "✅ Kickstart Completed Successfully!"
log "=============================================="
log "Client Admin: $CLIENT_EMAIL"
log "Password:     $CLIENT_PASSWORD"
log "Outlet(s):    $OUTLET_COUNT"
log "Menu Type:    $MENU_TYPE"
log "=============================================="
