#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# FoodGrid - Comprehensive Realistic Database Seeding Script
#
# This script seeds the database with realistic restaurant/cafe data including:
# - Multiple restaurant clients (brands/chains)
# - Outlets (branches) per client
# - Employees with realistic roles and schedules
# - Menu categories and items with authentic Indian cuisine data
# - Dining tables with realistic configurations
# - Units of measure for inventory
# - Ingredient categories and ingredients
# - Suppliers with realistic business details
# - Sample orders and payments
###############################################################################

BASE_URL="${BASE_URL:-http://localhost:8080}"

# Configuration for seeding volume
NUM_CLIENTS=${NUM_CLIENTS:-3}
DEV_CODE_PREFIX=${DEV_CODE_PREFIX:-POS}
BOOTSTRAP_RETRY_INTERVAL=${BOOTSTRAP_RETRY_INTERVAL:-2}
BOOTSTRAP_MAX_ATTEMPTS=${BOOTSTRAP_MAX_ATTEMPTS:-30}

if ! command -v jq >/dev/null 2>&1; then
  echo "[ERROR] jq not found. Install jq (brew install jq) and retry." >&2
  exit 1
fi

log() { echo "[SEED] $*"; }
debug() { [[ "${DEBUG:-}" == "true" ]] && echo "[DEBUG] $*" || true; }
print_json() {
  local label="$1" json="$2"
  if [[ "${VERBOSE:-false}" == "true" ]]; then
    log "  $label:"
    echo "$json" | jq . 2>/dev/null || echo "$json"
  fi
}

require_field() {
  local json="$1" field="$2" label="$3"
  local v
  v=$(echo "$json" | jq -er ".$field" 2>/dev/null || true)
  if [[ -z "${v:-}" || "$v" == "null" ]]; then
    echo "[ERROR] Missing field $field in $label" >&2
    echo "$json" >&2
    exit 1
  fi
  echo "$v"
}

admin_login() {
  local email="$1" password="$2"
  local resp http_code body
  resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/admin/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  http_code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  if [[ "$http_code" -lt 200 || "$http_code" -ge 300 ]]; then
    echo "[ERROR] Admin login failed for $email (HTTP $http_code)" >&2
    echo "$body" >&2
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
    return 1
  fi
  echo "$body"
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
    return 1
  fi
  echo "$body"
}

# Health check
if ! curl --head --silent --fail "$BASE_URL/" >/dev/null 2>&1; then
  echo "[ERROR] Backend not reachable at $BASE_URL. Start the server (mvn quarkus:dev) and retry." >&2
  exit 1
fi

###############################################################################
# REALISTIC DATA DEFINITIONS
###############################################################################

# Restaurant/Cafe Brands (Clients)
declare -a CLIENT_NAMES=(
  "Spice Garden Restaurant"
  "Chai Wala Cafe"
  "Mumbai Street Kitchen"
)

declare -a CLIENT_EMAILS=(
  "admin@spicegarden.com"
  "admin@chaiwala.com"
  "admin@mumbaistreet.com"
)

# Outlet configurations per client (name suffix, timezone)
declare -a SPICE_GARDEN_OUTLETS=(
  "Koramangala|Asia/Kolkata"
  "Indiranagar|Asia/Kolkata"
  "Whitefield|Asia/Kolkata"
)

declare -a CHAI_WALA_OUTLETS=(
  "MG Road|Asia/Kolkata"
  "HSR Layout|Asia/Kolkata"
)

declare -a MUMBAI_STREET_OUTLETS=(
  "JP Nagar|Asia/Kolkata"
  "Electronic City|Asia/Kolkata"
  "Marathahalli|Asia/Kolkata"
)

# Employee templates (name|email_suffix|role|pin)
declare -a EMPLOYEE_TEMPLATES=(
  "Rajesh Kumar|rajesh|MANAGER|123456"
  "Priya Sharma|priya|CASHIER|234567"
  "Amit Singh|amit|CASHIER|345678"
  "Sunita Devi|sunita|WAITER|456789"
  "Rahul Verma|rahul|WAITER|567890"
  "Neha Gupta|neha|KITCHEN|678901"
  "Vikram Patel|vikram|KITCHEN|789012"
)

# Menu Categories
declare -a MENU_CATEGORIES=(
  "Starters|1"
  "Main Course - Veg|2"
  "Main Course - Non-Veg|3"
  "Breads|4"
  "Rice & Biryani|5"
  "Beverages|6"
  "Desserts|7"
)

# Menu Items (name|description|isVeg|price|categoryIndex)
declare -a MENU_ITEMS_STARTERS=(
  "Paneer Tikka|Cottage cheese marinated in spices, grilled to perfection|true|249.00|0"
  "Veg Spring Roll|Crispy rolls stuffed with mixed vegetables|true|169.00|0"
  "Chicken Malai Kebab|Creamy chicken kebabs with cashew paste|false|329.00|0"
  "Fish Amritsari|Golden fried fish with punjabi spices|false|349.00|0"
  "Hara Bhara Kebab|Spinach and peas patties, lightly fried|true|189.00|0"
  "Mutton Seekh Kebab|Minced mutton kebabs with aromatic spices|false|379.00|0"
)

declare -a MENU_ITEMS_MAIN_VEG=(
  "Paneer Butter Masala|Cottage cheese in rich tomato gravy|true|279.00|1"
  "Dal Makhani|Black lentils slow-cooked overnight|true|229.00|1"
  "Palak Paneer|Cottage cheese in creamy spinach gravy|true|259.00|1"
  "Aloo Gobi|Potatoes and cauliflower with Indian spices|true|199.00|1"
  "Kadai Paneer|Paneer with bell peppers in kadai masala|true|269.00|1"
  "Mixed Veg Curry|Seasonal vegetables in aromatic gravy|true|219.00|1"
  "Malai Kofta|Cheese dumplings in creamy cashew gravy|true|289.00|1"
)

declare -a MENU_ITEMS_MAIN_NONVEG=(
  "Butter Chicken|Tender chicken in creamy tomato sauce|false|329.00|2"
  "Chicken Tikka Masala|Grilled chicken in spicy masala gravy|false|319.00|2"
  "Mutton Rogan Josh|Kashmiri style mutton curry|false|399.00|2"
  "Fish Curry|Fresh fish in tangy coconut curry|false|349.00|2"
  "Prawn Masala|Jumbo prawns in spicy onion gravy|false|449.00|2"
  "Lamb Keema|Minced lamb with peas and spices|false|359.00|2"
  "Chicken Chettinad|South Indian style spicy chicken|false|339.00|2"
)

declare -a MENU_ITEMS_BREADS=(
  "Butter Naan|Soft leavened bread with butter|true|49.00|3"
  "Garlic Naan|Naan topped with garlic and coriander|true|59.00|3"
  "Laccha Paratha|Layered whole wheat bread|true|49.00|3"
  "Tandoori Roti|Whole wheat bread from tandoor|true|35.00|3"
  "Cheese Naan|Naan stuffed with cheese|true|89.00|3"
  "Missi Roti|Gram flour mixed roti|true|45.00|3"
)

declare -a MENU_ITEMS_RICE=(
  "Jeera Rice|Cumin flavored basmati rice|true|149.00|4"
  "Veg Biryani|Aromatic rice with mixed vegetables|true|249.00|4"
  "Chicken Biryani|Hyderabadi style chicken biryani|false|329.00|4"
  "Mutton Biryani|Slow-cooked mutton with basmati rice|false|399.00|4"
  "Prawn Biryani|Biryani with succulent prawns|false|429.00|4"
  "Mushroom Pulao|Rice cooked with mushrooms and herbs|true|199.00|4"
)

declare -a MENU_ITEMS_BEVERAGES=(
  "Masala Chai|Traditional Indian spiced tea|true|49.00|5"
  "Fresh Lime Soda|Sweet or salty lime soda|true|69.00|5"
  "Mango Lassi|Creamy yogurt drink with mango|true|99.00|5"
  "Cold Coffee|Chilled coffee with ice cream|true|129.00|5"
  "Buttermilk|Spiced churned yogurt drink|true|59.00|5"
  "Fresh Juice|Orange/Apple/Watermelon|true|89.00|5"
)

declare -a MENU_ITEMS_DESSERTS=(
  "Gulab Jamun|Deep fried milk balls in sugar syrup|true|99.00|6"
  "Rasmalai|Cottage cheese patties in saffron milk|true|119.00|6"
  "Kulfi|Traditional Indian ice cream|true|89.00|6"
  "Gajar Ka Halwa|Carrot pudding with nuts|true|129.00|6"
  "Kheer|Rice pudding with cardamom|true|109.00|6"
  "Ice Cream|Vanilla/Chocolate/Strawberry|true|79.00|6"
)

# Table configurations (tableCode|displayName|capacity)
declare -a TABLE_CONFIGS=(
  "T1|Table 1 - Window|4"
  "T2|Table 2 - Corner|2"
  "T3|Table 3 - Center|6"
  "T4|Table 4 - Booth|4"
  "T5|Table 5 - Patio|4"
  "T6|Table 6 - Private|8"
  "T7|Family Table|10"
  "T8|Bar Counter|2"
  "C1|Counter Seat 1|1"
  "C2|Counter Seat 2|1"
)

# Units of Measure (name|abbreviation|unitType)
declare -a UNITS_OF_MEASURE=(
  "Kilogram|kg|WEIGHT"
  "Gram|g|WEIGHT"
  "Milligram|mg|WEIGHT"
  "Litre|L|VOLUME"
  "Millilitre|ml|VOLUME"
  "Piece|pc|COUNT"
  "Dozen|dz|COUNT"
  "Packet|pkt|COUNT"
  "Box|box|COUNT"
  "Bunch|bnch|COUNT"
)

# Ingredient Categories (name|description|icon)
declare -a INGREDIENT_CATEGORIES=(
  "Vegetables|Fresh vegetables and greens|🥬"
  "Fruits|Fresh fruits|🍎"
  "Dairy|Milk, cheese, and dairy products|🥛"
  "Spices|Spices and seasonings|🌶️"
  "Grains & Pulses|Rice, wheat, lentils|🌾"
  "Meat & Poultry|Chicken, mutton, fish|🍗"
  "Oil & Fats|Cooking oils and ghee|🫒"
  "Bakery|Bread, flour products|🍞"
  "Beverages|Tea, coffee, drinks|☕"
  "Dry Fruits|Nuts and dried fruits|🥜"
)

# Sample Ingredients (name|sku|categoryIndex|costPrice|currentStock|reorderLevel|unitIndex)
declare -a INGREDIENTS=(
  "Onion|VEG001|0|30.00|50.00|10.00|0"
  "Tomato|VEG002|0|40.00|40.00|8.00|0"
  "Potato|VEG003|0|25.00|60.00|15.00|0"
  "Capsicum|VEG004|0|80.00|20.00|5.00|0"
  "Green Chilli|VEG005|0|100.00|10.00|2.00|0"
  "Ginger|VEG006|0|120.00|8.00|2.00|0"
  "Garlic|VEG007|0|150.00|10.00|2.00|0"
  "Paneer|DAI001|2|320.00|25.00|5.00|0"
  "Butter|DAI002|2|500.00|15.00|3.00|0"
  "Cream|DAI003|2|280.00|10.00|2.00|3"
  "Curd|DAI004|2|50.00|30.00|5.00|0"
  "Basmati Rice|GRN001|4|120.00|100.00|20.00|0"
  "Wheat Flour|GRN002|4|45.00|50.00|10.00|0"
  "Chickpea|GRN003|4|80.00|30.00|5.00|0"
  "Chicken|MET001|5|250.00|40.00|10.00|0"
  "Mutton|MET002|5|700.00|20.00|5.00|0"
  "Fish|MET003|5|400.00|15.00|4.00|0"
  "Prawns|MET004|5|800.00|10.00|2.00|0"
  "Cumin|SPI001|3|300.00|5.00|1.00|0"
  "Coriander Powder|SPI002|3|200.00|8.00|2.00|0"
  "Red Chilli Powder|SPI003|3|250.00|6.00|1.50|0"
  "Turmeric|SPI004|3|180.00|5.00|1.00|0"
  "Garam Masala|SPI005|3|400.00|4.00|1.00|0"
  "Sunflower Oil|OIL001|6|150.00|40.00|10.00|3"
  "Ghee|OIL002|6|600.00|20.00|5.00|0"
  "Cashew|DRY001|9|1200.00|5.00|1.00|0"
  "Almond|DRY002|9|1000.00|4.00|1.00|0"
  "Raisin|DRY003|9|300.00|3.00|0.50|0"
  "Tea Leaves|BEV001|8|500.00|10.00|2.00|0"
  "Coffee Powder|BEV002|8|600.00|8.00|1.50|0"
)

# Suppliers (name|contactPerson|email|phone|address)
declare -a SUPPLIERS=(
  "Fresh Farms Pvt Ltd|Suresh Reddy|orders@freshfarms.in|+91-9876543210|Plot 45, Agricultural Market, Bangalore 560001"
  "Metro Cash & Carry|Amit Kumar|b2b@metrocc.in|+91-9876543211|123 Industrial Area, Electronic City, Bangalore 560100"
  "Daily Dairy Products|Lakshmi Devi|supply@dailydairy.in|+91-9876543212|78 Milk Colony, Yelahanka, Bangalore 560064"
  "Spice King Traders|Mohammad Ali|info@spiceking.in|+91-9876543213|Spice Market, Chickpet, Bangalore 560053"
  "Ocean Fresh Seafood|Peter D'Souza|orders@oceanfresh.in|+91-9876543214|Fish Market, Mangalore Road, Bangalore 560032"
  "Reliance Fresh Wholesale|Priya Nair|wholesale@reliancefresh.in|+91-9876543215|Mall Road, Koramangala, Bangalore 560034"
)

###############################################################################
# MAIN SEEDING LOGIC
###############################################################################

SUMMARY_FILE="/tmp/foodgrid_realistic_seed_summary.json"
> "$SUMMARY_FILE"

log "=============================================="
log "FoodGrid Realistic Database Seeding"
log "=============================================="
log "Seeding ${#CLIENT_NAMES[@]} restaurant brands with multiple outlets..."
log ""

###############################################################################
# STEP 1: Bootstrap Super Admin
###############################################################################

SUPER_ADMIN_EMAIL="superadmin@foodgrid.com"
SUPER_ADMIN_PASSWORD="SuperAdmin@123"
SUPER_ADMIN_NAME="FoodGrid Super Admin"

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Step 1: Bootstrapping Super Admin"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

attempt=0
SUPER_ADMIN_RESP=""
while true; do
  attempt=$((attempt+1))
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/bootstrap/admin" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\",\"displayName\":\"$SUPER_ADMIN_NAME\",\"status\":\"ACTIVE\"}")
  HTTP_CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')

  if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
    SUPER_ADMIN_RESP="$BODY"
    break
  fi

  if [[ "$HTTP_CODE" == "400" ]] && echo "$BODY" | grep -Eqi "already|exists|duplicate"; then
    log "  Super Admin exists, logging in..."
    LOGIN_BODY=$(admin_login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD")
    SUPER_ADMIN_RESP="$LOGIN_BODY"
    break
  fi

  if [[ $attempt -ge $BOOTSTRAP_MAX_ATTEMPTS ]]; then
    echo "[ERROR] Bootstrap failed after $attempt attempts" >&2
    exit 1
  fi
  sleep "$BOOTSTRAP_RETRY_INTERVAL"
done

SUPER_ADMIN_TOKEN=$(echo "$SUPER_ADMIN_RESP" | jq -r '.accessToken // empty')
SUPER_ADMIN_ID=$(echo "$SUPER_ADMIN_RESP" | jq -r '.admin.id // empty')

if [[ -z "${SUPER_ADMIN_TOKEN}" || -z "${SUPER_ADMIN_ID}" ]]; then
  echo "[ERROR] Failed to obtain super admin token" >&2
  exit 1
fi

log "  ✓ Super Admin authenticated (ID: ${SUPER_ADMIN_ID:0:8}...)"
log "    Email: $SUPER_ADMIN_EMAIL"
log "    Password: $SUPER_ADMIN_PASSWORD"
log ""

###############################################################################
# STEP 2: Create Clients (Restaurant Brands) via Super Admin
###############################################################################

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Step 2: Creating Restaurant Clients"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Arrays to store client data for later use
CLIENT_IDS=()
CLIENT_ADMIN_EMAILS=()
CLIENT_ADMIN_PASSWORDS=()

for client_idx in $(seq 0 $((${#CLIENT_NAMES[@]} - 1))); do
  if [[ $client_idx -ge $NUM_CLIENTS ]]; then
    break
  fi

  CLIENT_NAME="${CLIENT_NAMES[$client_idx]}"
  CLIENT_CONTACT_EMAIL="${CLIENT_EMAILS[$client_idx]}"
  CLIENT_ADMIN_PASSWORD="Admin@123"

  log ""
  log "  🏢 Creating Client: $CLIENT_NAME"

  # Create client via tenant API (this auto-creates client admin)
  CLIENT_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/admin/tenants" \
    -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$CLIENT_NAME\",\"contactEmail\":\"$CLIENT_CONTACT_EMAIL\",\"status\":\"ACTIVE\",\"adminEmail\":\"$CLIENT_CONTACT_EMAIL\",\"adminPassword\":\"$CLIENT_ADMIN_PASSWORD\",\"adminDisplayName\":\"$CLIENT_NAME Admin\"}")

  HTTP_CODE=$(echo "$CLIENT_RESP" | tail -n1)
  BODY=$(echo "$CLIENT_RESP" | sed '$d')

  if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
    CLIENT_ID=$(echo "$BODY" | jq -r '.id // empty')
    CLIENT_ADMIN_EMAIL=$(echo "$BODY" | jq -r '.adminEmail // empty')
    log "     ✓ Client created (ID: ${CLIENT_ID:0:8}...)"
    log "       Admin Email: $CLIENT_ADMIN_EMAIL"
    log "       Admin Password: $CLIENT_ADMIN_PASSWORD"
  elif echo "$BODY" | grep -Eqi "already|exists|duplicate"; then
    log "     Client already exists, fetching..."
    # Try to get the client list and find this one
    CLIENTS_LIST=$(curl -s -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" "$BASE_URL/api/v1/admin/tenants")
    CLIENT_ID=$(echo "$CLIENTS_LIST" | jq -r ".[] | select(.name == \"$CLIENT_NAME\") | .id" 2>/dev/null)
    CLIENT_ADMIN_EMAIL="$CLIENT_CONTACT_EMAIL"
    if [[ -z "$CLIENT_ID" || "$CLIENT_ID" == "null" ]]; then
      echo "[WARN] Could not find existing client: $CLIENT_NAME" >&2
      continue
    fi
    log "     ✓ Found existing client (ID: ${CLIENT_ID:0:8}...)"
  else
    echo "[ERROR] Failed to create client: $CLIENT_NAME (HTTP $HTTP_CODE)" >&2
    echo "$BODY" >&2
    continue
  fi

  CLIENT_IDS+=("$CLIENT_ID")
  CLIENT_ADMIN_EMAILS+=("$CLIENT_ADMIN_EMAIL")
  CLIENT_ADMIN_PASSWORDS+=("$CLIENT_ADMIN_PASSWORD")
done

log ""
log "  ✓ Created ${#CLIENT_IDS[@]} clients"

###############################################################################
# STEP 3: Each Client Admin Creates Their Outlets, Employees, Menu, etc.
###############################################################################

log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Step 3: Setting Up Each Client's Data"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for client_idx in $(seq 0 $((${#CLIENT_IDS[@]} - 1))); do
  CLIENT_ID="${CLIENT_IDS[$client_idx]}"
  CLIENT_EMAIL="${CLIENT_ADMIN_EMAILS[$client_idx]}"
  PASSWORD="${CLIENT_ADMIN_PASSWORDS[$client_idx]}"
  CLIENT_NAME="${CLIENT_NAMES[$client_idx]}"

  log ""
  log "┌─────────────────────────────────────────────"
  log "│ Client: $CLIENT_NAME"
  log "└─────────────────────────────────────────────"

  # Login as client admin
  LOGIN_RESP=$(admin_login "$CLIENT_EMAIL" "$PASSWORD")
  ACCESS_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.accessToken // empty')
  ADMIN_ID=$(echo "$LOGIN_RESP" | jq -r '.admin.id // empty')

  if [[ -z "${ACCESS_TOKEN}" || -z "${ADMIN_ID}" ]]; then
    echo "[ERROR] Failed to login as client admin: $CLIENT_EMAIL" >&2
    continue
  fi

  log "  ✓ Client Admin logged in (ID: ${ADMIN_ID:0:8}...)"

  # Determine outlets for this client (avoiding declare -n for zsh compatibility)
  case $client_idx in
    0) OUTLETS_LIST=("${SPICE_GARDEN_OUTLETS[@]}") ;;
    1) OUTLETS_LIST=("${CHAI_WALA_OUTLETS[@]}") ;;
    2) OUTLETS_LIST=("${MUMBAI_STREET_OUTLETS[@]}") ;;
  esac

  client_summary="{\"name\":\"$CLIENT_NAME\",\"email\":\"$CLIENT_EMAIL\",\"clientId\":\"$CLIENT_ID\",\"adminId\":\"$ADMIN_ID\",\"outlets\":[]}"

  for outlet_idx in "${!OUTLETS_LIST[@]}"; do
    IFS='|' read -r OUTLET_SUFFIX TIMEZONE <<< "${OUTLETS_LIST[$outlet_idx]}"
    OUTLET_NAME="$CLIENT_NAME - $OUTLET_SUFFIX"

    log ""
    log "  📍 Creating Outlet: $OUTLET_NAME"

    # Create outlet
    OUTLET_RESP=$(api_post "/api/v1/admin/outlets" "$ACCESS_TOKEN" \
      "{\"ownerId\":\"$ADMIN_ID\",\"name\":\"$OUTLET_NAME\",\"timezone\":\"$TIMEZONE\"}")
    OUTLET_ID=$(echo "$OUTLET_RESP" | jq -r '.id // empty')

    if [[ -z "$OUTLET_ID" || "$OUTLET_ID" == "null" ]]; then
      echo "[ERROR] Failed to create outlet: $OUTLET_NAME" >&2
      continue
    fi
    log "     ✓ Outlet created (ID: ${OUTLET_ID:0:8}...)"

    # Register POS device
    DEVICE_CODE="${DEV_CODE_PREFIX}-${client_idx}-${outlet_idx}"
    curl -s "$BASE_URL/api/v1/auth/login-context?deviceId=$DEVICE_CODE&outletId=$OUTLET_ID" > /dev/null
    log "     ✓ POS Device registered: $DEVICE_CODE"

    # Create employees
    log "     👥 Creating employees..."
    emp_ids="[]"
    for emp_template in "${EMPLOYEE_TEMPLATES[@]}"; do
      IFS='|' read -r EMP_NAME EMP_SUFFIX EMP_ROLE EMP_PIN <<< "$emp_template"
      EMP_EMAIL="${EMP_SUFFIX}.${outlet_idx}@${CLIENT_EMAIL#*@}"

      EMP_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/employees" "$ACCESS_TOKEN" \
        "{\"displayName\":\"$EMP_NAME\",\"email\":\"$EMP_EMAIL\",\"avatarUrl\":null,\"pin\":\"$EMP_PIN\",\"status\":\"ACTIVE\"}")
      EMP_ID=$(echo "$EMP_RESP" | jq -r '.id // empty')

      if [[ -n "$EMP_ID" && "$EMP_ID" != "null" ]]; then
        # Assign role
        api_put "/api/v1/admin/outlets/$OUTLET_ID/employees/$EMP_ID/roles" "$ACCESS_TOKEN" \
          "{\"roles\":[\"$EMP_ROLE\"]}" > /dev/null 2>&1 || true
        emp_ids=$(echo "$emp_ids" | jq ". + [\"$EMP_ID\"]")
        debug "       Created employee: $EMP_NAME ($EMP_ROLE)"
      fi
    done
    log "     ✓ ${#EMPLOYEE_TEMPLATES[@]} employees created"

    # Create menu categories and items
    log "     🍽️  Creating menu..."
    cat_ids=()
    for cat_template in "${MENU_CATEGORIES[@]}"; do
      IFS='|' read -r CAT_NAME SORT_ORDER <<< "$cat_template"
      CAT_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/categories" "$ACCESS_TOKEN" \
        "{\"name\":\"$CAT_NAME\",\"sortOrder\":$SORT_ORDER,\"status\":\"ACTIVE\"}")
      CAT_ID=$(echo "$CAT_RESP" | jq -r '.id // empty')
      cat_ids+=("$CAT_ID")
      debug "       Category: $CAT_NAME"
    done

    # Create menu items
    item_ids="[]"
    declare -a ALL_MENU_ITEMS=()
    ALL_MENU_ITEMS+=("${MENU_ITEMS_STARTERS[@]}")
    ALL_MENU_ITEMS+=("${MENU_ITEMS_MAIN_VEG[@]}")
    ALL_MENU_ITEMS+=("${MENU_ITEMS_MAIN_NONVEG[@]}")
    ALL_MENU_ITEMS+=("${MENU_ITEMS_BREADS[@]}")
    ALL_MENU_ITEMS+=("${MENU_ITEMS_RICE[@]}")
    ALL_MENU_ITEMS+=("${MENU_ITEMS_BEVERAGES[@]}")
    ALL_MENU_ITEMS+=("${MENU_ITEMS_DESSERTS[@]}")

    for item_template in "${ALL_MENU_ITEMS[@]}"; do
      IFS='|' read -r ITEM_NAME ITEM_DESC IS_VEG PRICE CAT_IDX <<< "$item_template"
      CAT_ID="${cat_ids[$CAT_IDX]:-}"

      if [[ -n "$CAT_ID" && "$CAT_ID" != "null" ]]; then
        ITEM_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/items" "$ACCESS_TOKEN" \
          "{\"categoryId\":\"$CAT_ID\",\"name\":\"$ITEM_NAME\",\"description\":\"$ITEM_DESC\",\"isVeg\":$IS_VEG,\"basePrice\":$PRICE,\"status\":\"ACTIVE\"}")
        ITEM_ID=$(echo "$ITEM_RESP" | jq -r '.id // empty')
        if [[ -n "$ITEM_ID" && "$ITEM_ID" != "null" ]]; then
          item_ids=$(echo "$item_ids" | jq ". + [\"$ITEM_ID\"]")
        fi
      fi
    done
    log "     ✓ ${#MENU_CATEGORIES[@]} categories, ${#ALL_MENU_ITEMS[@]} items created"

    # Create dining tables
    log "     🪑 Creating dining tables..."
    table_ids="[]"
    for table_template in "${TABLE_CONFIGS[@]}"; do
      IFS='|' read -r TABLE_CODE DISPLAY_NAME CAPACITY <<< "$table_template"
      TABLE_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/tables" "$ACCESS_TOKEN" \
        "{\"tableCode\":\"$TABLE_CODE\",\"displayName\":\"$DISPLAY_NAME\",\"capacity\":$CAPACITY,\"status\":\"ACTIVE\"}")
      TABLE_ID=$(echo "$TABLE_RESP" | jq -r '.id // empty')
      if [[ -n "$TABLE_ID" && "$TABLE_ID" != "null" ]]; then
        table_ids=$(echo "$table_ids" | jq ". + [\"$TABLE_ID\"]")
      fi
    done
    log "     ✓ ${#TABLE_CONFIGS[@]} tables created"

    # Create units of measure
    log "     📏 Creating units of measure..."
    unit_ids=()
    for unit_template in "${UNITS_OF_MEASURE[@]}"; do
      IFS='|' read -r UNIT_NAME ABBREV UNIT_TYPE <<< "$unit_template"
      UNIT_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/inventory/units" "$ACCESS_TOKEN" \
        "{\"name\":\"$UNIT_NAME\",\"abbreviation\":\"$ABBREV\",\"unitType\":\"$UNIT_TYPE\",\"status\":\"ACTIVE\"}" 2>/dev/null || echo "{}")
      UNIT_ID=$(echo "$UNIT_RESP" | jq -r '.id // empty' 2>/dev/null || echo "")
      unit_ids+=("$UNIT_ID")
    done
    log "     ✓ Units of measure created"

    # Create ingredient categories
    log "     📦 Creating ingredient categories..."
    ing_cat_ids=()
    for ing_cat_template in "${INGREDIENT_CATEGORIES[@]}"; do
      IFS='|' read -r ING_CAT_NAME ING_CAT_DESC ING_CAT_ICON <<< "$ing_cat_template"
      ING_CAT_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/inventory/categories" "$ACCESS_TOKEN" \
        "{\"name\":\"$ING_CAT_NAME\",\"description\":\"$ING_CAT_DESC\",\"icon\":\"$ING_CAT_ICON\",\"sortOrder\":0,\"status\":\"ACTIVE\"}" 2>/dev/null || echo "{}")
      ING_CAT_ID=$(echo "$ING_CAT_RESP" | jq -r '.id // empty' 2>/dev/null || echo "")
      ing_cat_ids+=("$ING_CAT_ID")
    done
    log "     ✓ Ingredient categories created"

    # Create suppliers
    log "     🚚 Creating suppliers..."
    supplier_ids=()
    for supplier_template in "${SUPPLIERS[@]}"; do
      IFS='|' read -r SUP_NAME SUP_CONTACT SUP_EMAIL SUP_PHONE SUP_ADDR <<< "$supplier_template"
      SUP_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/inventory/suppliers" "$ACCESS_TOKEN" \
        "{\"name\":\"$SUP_NAME\",\"contactPerson\":\"$SUP_CONTACT\",\"email\":\"$SUP_EMAIL\",\"phone\":\"$SUP_PHONE\",\"address\":\"$SUP_ADDR\",\"status\":\"ACTIVE\"}" 2>/dev/null || echo "{}")
      SUP_ID=$(echo "$SUP_RESP" | jq -r '.id // empty' 2>/dev/null || echo "")
      supplier_ids+=("$SUP_ID")
    done
    log "     ✓ ${#SUPPLIERS[@]} suppliers created"

    # Create ingredients
    log "     🥘 Creating ingredients..."
    for ing_template in "${INGREDIENTS[@]}"; do
      IFS='|' read -r ING_NAME ING_SKU ING_CAT_IDX ING_COST ING_STOCK ING_REORDER UNIT_IDX <<< "$ing_template"
      ING_CAT_ID="${ing_cat_ids[$ING_CAT_IDX]:-}"
      UNIT_ID="${unit_ids[$UNIT_IDX]:-${unit_ids[0]:-}}"

      if [[ -n "$UNIT_ID" && "$UNIT_ID" != "null" ]]; then
        api_post "/api/v1/admin/outlets/$OUTLET_ID/inventory/ingredients" "$ACCESS_TOKEN" \
          "{\"name\":\"$ING_NAME\",\"sku\":\"$ING_SKU\",\"categoryId\":\"$ING_CAT_ID\",\"unitId\":\"$UNIT_ID\",\"costPrice\":$ING_COST,\"currentStock\":$ING_STOCK,\"reorderLevel\":$ING_REORDER,\"trackInventory\":true,\"status\":\"ACTIVE\"}" > /dev/null 2>&1 || true
      fi
    done
    log "     ✓ ${#INGREDIENTS[@]} ingredients created"

    # Build outlet summary
    outlet_summary=$(jq -n \
      --arg id "$OUTLET_ID" \
      --arg name "$OUTLET_NAME" \
      --arg device "$DEVICE_CODE" \
      --argjson employees "$emp_ids" \
      --argjson items "$item_ids" \
      --argjson tables "$table_ids" \
      '{id:$id,name:$name,device:$device,employees:$employees,tables:$tables,itemCount:($items|length),tableCount:($tables|length)}')

    client_summary=$(echo "$client_summary" | jq ".outlets += [$outlet_summary]")
  done

  echo "$client_summary" | jq . >> "$SUMMARY_FILE"
  echo >> "$SUMMARY_FILE"

  log ""
  log "  ✅ Client '$CLIENT_NAME' seeded successfully"
  sleep 1
done

###############################################################################
# OPTIONAL: Create sample orders (requires POS login)
###############################################################################

if [[ "${CREATE_SAMPLE_ORDERS:-true}" == "true" ]]; then
  log ""
  log "=============================================="
  log "Creating Sample Orders..."
  log "=============================================="

  # Read the first client from summary to create sample orders
  # Use jq -s to slurp multiple JSON objects into an array
  FIRST_CLIENT=$(cat "$SUMMARY_FILE" | jq -s '.[0] // empty' 2>/dev/null)

  if [[ -z "$FIRST_CLIENT" || "$FIRST_CLIENT" == "null" ]]; then
    log "  ⚠️  No client data found in summary file (skipping sample orders)"
  else
    FIRST_OUTLET=$(echo "$FIRST_CLIENT" | jq -r '.outlets[0] // empty')
    OUTLET_ID=$(echo "$FIRST_OUTLET" | jq -r '.id // empty')
    DEVICE_CODE=$(echo "$FIRST_OUTLET" | jq -r '.device // empty')
    FIRST_EMP_ID=$(echo "$FIRST_OUTLET" | jq -r '.employees[0] // empty')
    FIRST_TABLE_ID=$(echo "$FIRST_OUTLET" | jq -r '.tables[0] // empty')

    if [[ -n "$OUTLET_ID" && "$OUTLET_ID" != "null" && -n "$FIRST_EMP_ID" && "$FIRST_EMP_ID" != "null" ]]; then
      log "  Using outlet: $(echo "$FIRST_OUTLET" | jq -r '.name')"
      log "  Employee ID: ${FIRST_EMP_ID:0:8}..."

      # Login as employee using PIN
      POS_LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/v1/auth/login/pin" \
        -H "Content-Type: application/json" \
        -d "{\"employeeId\":\"$FIRST_EMP_ID\",\"pin\":\"123456\",\"deviceId\":\"$DEVICE_CODE\"}")

      POS_TOKEN=$(echo "$POS_LOGIN_RESP" | jq -r '.accessToken // empty')

      if [[ -n "$POS_TOKEN" && "$POS_TOKEN" != "null" ]]; then
        log "  ✓ POS Employee logged in"

        # Get menu items to use in orders
        MENU_ITEMS_RESP=$(curl -s -H "Authorization: Bearer $POS_TOKEN" \
          "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/items")
        ITEM_IDS=$(echo "$MENU_ITEMS_RESP" | jq -r '.[0:5] | .[].id' 2>/dev/null)

        SAMPLE_ORDER_COUNT=0
        ORDER_TYPES=("DINE_IN" "TAKEAWAY" "DINE_IN" "DELIVERY" "DINE_IN")

        for order_num in 1 2 3 4 5; do
          ORDER_TYPE="${ORDER_TYPES[$((order_num-1))]}"
          TABLE_PARAM=""
          [[ "$ORDER_TYPE" == "DINE_IN" && -n "$FIRST_TABLE_ID" && "$FIRST_TABLE_ID" != "null" ]] && TABLE_PARAM=",\"tableId\":\"$FIRST_TABLE_ID\""

          # Create order
          ORDER_RESP=$(curl -s -X POST "$BASE_URL/api/v1/pos/orders" \
            -H "Authorization: Bearer $POS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"orderType\":\"$ORDER_TYPE\"$TABLE_PARAM,\"notes\":\"Sample order $order_num\"}")

          ORDER_ID=$(echo "$ORDER_RESP" | jq -r '.id // empty')

          if [[ -n "$ORDER_ID" && "$ORDER_ID" != "null" ]]; then
            # Add 2-3 random items to each order
            ITEMS_TO_ADD=$(echo "$MENU_ITEMS_RESP" | jq -r ".[$((order_num % 5))].id, .[$((order_num % 5 + 1))].id" 2>/dev/null | head -2)

            for ITEM_ID in $ITEMS_TO_ADD; do
              if [[ -n "$ITEM_ID" && "$ITEM_ID" != "null" ]]; then
                QTY=$((1 + RANDOM % 3))
                curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/items" \
                  -H "Authorization: Bearer $POS_TOKEN" \
                  -H "Content-Type: application/json" \
                  -d "{\"itemId\":\"$ITEM_ID\",\"qty\":$QTY}" > /dev/null 2>&1
              fi
            done

            # Bill the order
            curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/bill" \
              -H "Authorization: Bearer $POS_TOKEN" > /dev/null 2>&1

            # Pay for some orders (leave some unpaid for testing)
            if [[ $order_num -le 3 ]]; then
              ORDER_TOTAL=$(curl -s -H "Authorization: Bearer $POS_TOKEN" \
                "$BASE_URL/api/v1/pos/orders/$ORDER_ID" | jq -r '.grandTotal // "0"')

              PAYMENT_METHODS=("CASH" "UPI" "CARD")
              PAYMENT_METHOD="${PAYMENT_METHODS[$((order_num % 3))]}"

              curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/payments" \
                -H "Authorization: Bearer $POS_TOKEN" \
                -H "Content-Type: application/json" \
                -H "Idempotency-Key: seed-order-$order_num-$(date +%s)" \
                -d "{\"method\":\"$PAYMENT_METHOD\",\"amount\":$ORDER_TOTAL}" > /dev/null 2>&1
            fi

            SAMPLE_ORDER_COUNT=$((SAMPLE_ORDER_COUNT + 1))
            debug "       Created order $order_num ($ORDER_TYPE)"
          fi
        done

        log "  ✓ Created $SAMPLE_ORDER_COUNT sample orders (3 paid, 2 pending)"
      else
        log "  ⚠️  Could not login as POS employee (skipping sample orders)"
        debug "Login response: $POS_LOGIN_RESP"
      fi
    else
      log "  ⚠️  Missing outlet/employee data (skipping sample orders)"
    fi
  fi
fi

log ""
log "=============================================="
log "✅ Seeding Completed Successfully!"
log "=============================================="
log ""
log "Summary saved to: $SUMMARY_FILE"
log ""
log "Quick stats:"
cat "$SUMMARY_FILE" | jq -s '{
  totalClients: length,
  totalOutlets: [.[].outlets | length] | add,
  sampleCredentials: .[0] | {
    email: .email,
    password: "Admin@123",
    firstOutlet: .outlets[0].name
  }
}'

log ""
log "═══════════════════════════════════════════════"
log "📋 SEEDED DATA SUMMARY"
log "═══════════════════════════════════════════════"
log ""
log "👑 SUPER ADMIN:"
log "   • Email: $SUPER_ADMIN_EMAIL"
log "   • Password: $SUPER_ADMIN_PASSWORD"
log ""
log "🏢 CLIENTS (Restaurant Brands) & Their Admins:"
log "   • Spice Garden Restaurant"
log "     Admin: admin@spicegarden.com (Password: Admin@123)"
log "   • Chai Wala Cafe"
log "     Admin: admin@chaiwala.com (Password: Admin@123)"
log "   • Mumbai Street Kitchen"
log "     Admin: admin@mumbaistreet.com (Password: Admin@123)"
log ""
log "📍 OUTLETS:"
log "   • Spice Garden: Koramangala, Indiranagar, Whitefield"
log "   • Chai Wala: MG Road, HSR Layout"
log "   • Mumbai Street: JP Nagar, Electronic City, Marathahalli"
log ""
log "👥 EMPLOYEES (per outlet):"
log "   • Rajesh Kumar (Manager, PIN: 123456)"
log "   • Priya Sharma (Cashier, PIN: 234567)"
log "   • Amit Singh (Cashier, PIN: 345678)"
log "   • + 4 more (Waiters, Kitchen staff)"
log ""
log "🍽️  MENU:"
log "   • 7 Categories: Starters, Main Course (Veg/Non-Veg), Breads, Rice, Beverages, Desserts"
log "   • 45+ Items with realistic Indian cuisine names and prices"
log ""
log "🪑 TABLES:"
log "   • 10 tables per outlet (T1-T8, C1-C2)"
log "   • Capacities: 1-10 seats"
log ""
log "📦 INVENTORY:"
log "   • 10 Ingredient Categories"
log "   • 30 Ingredients with stock levels"
log "   • 10 Units of Measure"
log "   • 6 Suppliers"
log ""
log "🖥️  POS DEVICES:"
log "   • Device codes: POS-0-0, POS-0-1, POS-0-2, etc."
log ""
log "═══════════════════════════════════════════════"
log ""
log "🚀 Test the seeded data:"
log "   1. Super Admin Panel: Login with $SUPER_ADMIN_EMAIL"
log "   2. Client Admin Panel: Login with client admin email"
log "   3. POS Device: Use login-context API with device code"
log "   4. Employee Login: Use PIN authentication"
log ""

exit 0
