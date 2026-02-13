#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# FoodGrid - Coffee Nation Pitch Edition
# Automates onboarding for Coffee Nation with high-quality images and data.
###############################################################################

BASE_URL="${BASE_URL:-http://localhost:8080}"
SUPER_ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-admin@foodgrid.com}"
SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-123456}"

# Default values for Coffee Nation
CLIENT_NAME="${1:-Coffee Nation}"
CLIENT_EMAIL="${2:-corporate@coffeenation.com}"
CLIENT_PASSWORD="${3:-Coffee@2026}"
OUTLET_COUNT="${4:-3}"

# --- Data Definitions (Curated for Coffee Nation) ---

# Format: CategoryName|SortOrder
declare -a CAFE_CATEGORIES=(
  "Espresso Bar|1"
  "Cold Brews & Iced Coffee|2"
  "Gourmet Sandwiches|3"
  "Artisan Desserts|4"
)

# Format: Category|Name|Description|isVeg|Price|ImageURL
declare -a CAFE_MENU=(
  "Espresso Bar|Classic Cappuccino|Rich espresso with steamed milk foam and cocoa dusting|true|189.00|https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80"
  "Espresso Bar|Vanilla Latte|Smooth espresso with velvety milk and Madagascar vanilla|true|210.00|https://images.unsplash.com/photo-1595434066389-49c089ea3acd?auto=format&fit=crop&w=800&q=80"
  "Espresso Bar|Flat White|Double shot of espresso with micro-foam|true|195.00|https://images.unsplash.com/photo-1570968015861-d5d5c4b3a9c1?auto=format&fit=crop&w=800&q=80"
  
  "Cold Brews & Iced Coffee|Signature Cold Brew|18-hour slow steeped coffee served over ice|true|220.00|https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80"
  "Cold Brews & Iced Coffee|Hazelnut Frappe|Blended coffee with hazelnut syrup and whipped cream|true|245.00|https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80"
  "Cold Brews & Iced Coffee|Iced Americano|Bold espresso shots topped with water and ice|true|160.00|https://images.unsplash.com/photo-1517701632951-d03bb02937e0?auto=format&fit=crop&w=800&q=80"

  "Gourmet Sandwiches|Paneer Pesto Panini|Grilled sourdough with pesto and marinated paneer|true|280.00|https://images.unsplash.com/photo-1528733918455-5a59687cedf0?auto=format&fit=crop&w=800&q=80"
  "Gourmet Sandwiches|Smoked Chicken Croissant|Flaky croissant filled with smoked chicken and aioli|false|310.00|https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80"
  
  "Artisan Desserts|Belgian Chocolate Brownie|Warm, gooey brownie made with 70% dark chocolate|true|145.00|https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80"
  "Artisan Desserts|Blueberry Cheesecake|Classic New York style cheesecake with blueberry compote|true|260.00|https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80"
)

declare -a TABLE_CONFIGS=(
  "C1|Window Seat 1|2"
  "C2|Window Seat 2|2"
  "W1|Work Station A|1"
  "L1|Lounge Sofa|4"
  "B1|Bar Counter|1"
)

declare -a EMPLOYEE_TEMPLATES=(
  "Store Manager|manager|MANAGER|123456"
  "Head Barista|barista1|WAITER|123456"
  "Junior Barista|barista2|WAITER|123456"
  "Kitchen Lead|chef1|KITCHEN|123456"
)

# --- Logic Starts Here ---

if ! command -v jq >/dev/null 2>&1; then echo "[ERROR] jq required."; exit 1; fi

log() { echo "[COFFEE-NATION-KICKSTART] $*"; }
debug() { [[ "${DEBUG:-}" == "true" ]] && echo "[DEBUG] $*" || true; }

# Helper: API POST with Error Checking
api_post() {
  local endpoint="$1" token="$2" data="$3"
  local resp http_code body
  resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" -d "$data")
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  if [[ "$http_code" -ge 400 ]]; then debug "Error $http_code on $endpoint: $body"; fi
  echo "$body"
}

api_get() {
  curl -s -H "Authorization: Bearer $2" "$BASE_URL$1"
}

log "Step 1: Authenticating as Super Admin..."
SA_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\"}")
SA_TOKEN=$(echo "$SA_RESP" | jq -r '.accessToken // empty')

if [[ -z "$SA_TOKEN" ]]; then
  log "Creating Super Admin via Bootstrap..."
  SA_RESP=$(curl -s -X POST "$BASE_URL/api/v1/bootstrap/admin" -H "Content-Type: application/json" -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\",\"displayName\":\"System Admin\"}")
  SA_TOKEN=$(echo "$SA_RESP" | jq -r '.accessToken // empty')
fi

log "Step 2: Creating Client Tenant: $CLIENT_NAME"
CLIENT_RESP=$(api_post "/api/v1/admin/tenants" "$SA_TOKEN" \
  "{\"name\":\"$CLIENT_NAME\",\"contactEmail\":\"$CLIENT_EMAIL\",\"status\":\"ACTIVE\",\"adminEmail\":\"$CLIENT_EMAIL\",\"adminPassword\":\"$CLIENT_PASSWORD\",\"adminDisplayName\":\"$CLIENT_NAME HQ\"}")
CLIENT_ID=$(echo "$CLIENT_RESP" | jq -r '.id // empty')

# Fallback lookup if already exists
if [[ "$CLIENT_ID" == "null" || -z "$CLIENT_ID" ]]; then
    CLIENT_ID=$(api_get "/api/v1/admin/tenants" "$SA_TOKEN" | jq -r ".[] | select(.contactEmail == \"$CLIENT_EMAIL\") | .id")
fi

log "Step 3: Logging in as Coffee Nation Admin..."
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/v1/admin/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"$CLIENT_PASSWORD\"}")
ACCESS_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.accessToken')
ADMIN_ID=$(echo "$LOGIN_RESP" | jq -r '.admin.id')

# Create Outlets
for i in $(seq 1 $OUTLET_COUNT); do
  OUTLET_NAME="Coffee Nation - Outlet $i"
  log "--- Configuring $OUTLET_NAME ---"
  
  OUTLET_RESP=$(api_post "/api/v1/admin/outlets" "$ACCESS_TOKEN" "{\"ownerId\":\"$ADMIN_ID\",\"name\":\"$OUTLET_NAME\",\"timezone\":\"Asia/Kolkata\"}")
  OUTLET_ID=$(echo "$OUTLET_RESP" | jq -r '.id // empty')
  
  if [[ "$OUTLET_ID" == "null" || -z "$OUTLET_ID" ]]; then
    OUTLET_ID=$(api_get "/api/v1/admin/outlets" "$ACCESS_TOKEN" | jq -r ".[] | select(.name == \"$OUTLET_NAME\") | .id")
  fi

  # Create Employees
  for emp in "${EMPLOYEE_TEMPLATES[@]}"; do
    IFS='|' read -r E_NAME E_PRE E_ROLE E_PIN <<< "$emp"
    E_EMAIL="${E_PRE}.${i}@coffeenation.local"
    api_post "/api/v1/admin/outlets/$OUTLET_ID/employees" "$ACCESS_TOKEN" \
      "{\"displayName\":\"$E_NAME\",\"email\":\"$E_EMAIL\",\"pin\":\"$E_PIN\",\"status\":\"ACTIVE\"}" > /dev/null
  done

  # Seed Categories and Items
  CAT_MAP_FILE=$(mktemp)
  for cat_str in "${CAFE_CATEGORIES[@]}"; do
    IFS='|' read -r C_NAME C_ORDER <<< "$cat_str"
    C_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/categories" "$ACCESS_TOKEN" "{\"name\":\"$C_NAME\",\"sortOrder\":$C_ORDER}")
    CID=$(echo "$C_RESP" | jq -r '.id // empty')
    if [[ -z "$CID" || "$CID" == "null" ]]; then
       CID=$(api_get "/api/v1/admin/outlets/$OUTLET_ID/menu/categories" "$ACCESS_TOKEN" | jq -r ".[] | select(.name == \"$C_NAME\") | .id")
    fi
    echo "$C_NAME|$CID" >> "$CAT_MAP_FILE"
  done

  for item_str in "${CAFE_MENU[@]}"; do
    IFS='|' read -r C_NAME I_NAME I_DESC I_VEG I_PRICE I_IMG <<< "$item_str"
    CID=$(grep "^$C_NAME|" "$CAT_MAP_FILE" | cut -d'|' -f2)
    
    log "   Adding Item: $I_NAME"
    api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/items" "$ACCESS_TOKEN" \
      "{
        \"categoryId\":\"$CID\",
        \"name\":\"$I_NAME\",
        \"description\":\"$I_DESC\",
        \"isVeg\":$I_VEG,
        \"basePrice\":$I_PRICE,
        \"imageUrl\":\"$I_IMG\",
        \"status\":\"ACTIVE\"
      }" > /dev/null
  done

  # Tables
  for t in "${TABLE_CONFIGS[@]}"; do
    IFS='|' read -r T_CODE T_NAME T_CAP <<< "$t"
    api_post "/api/v1/admin/outlets/$OUTLET_ID/tables" "$ACCESS_TOKEN" \
      "{\"tableCode\":\"$T_CODE\",\"displayName\":\"$T_NAME\",\"capacity\":$T_CAP,\"status\":\"ACTIVE\"}" > /dev/null
  done

  log "   ✓ Outlet $i fully configured."
done

log "✅ Kickstart for Coffee Nation Finished!"
log "Email: $CLIENT_EMAIL / Pass: $CLIENT_PASSWORD"