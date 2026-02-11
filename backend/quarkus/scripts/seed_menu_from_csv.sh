#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# FoodGrid - Dietico Specific Seeding Script (Fixed jq & Bash 3.2+)
###############################################################################

# BASE_URL="${BASE_URL:-https://foodgrid-production-064c.up.railway.app}"
BASE_URL="${BASE_URL:-http://localhost:8080}"
SUPER_ADMIN_EMAIL="superadmin@foodgrid.com"
SUPER_ADMIN_PASSWORD="SuperAdmin@123"

# Dietico Credentials
CLIENT_NAME="Dietico"clie
CLIENT_EMAIL="dietico@foodgrid.local"
CLIENT_PASSWORD="123456"
OUTLET_NAME="Dietico - Main Outlet"

log() { echo "[SEED] $*"; }

# --- API Helper Functions ---
admin_login() {
  local email="$1" password="$2"
  curl -s -X POST "$BASE_URL/api/v1/admin/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}"
}

api_post() {
  local endpoint="$1" token="$2" data="$3"
  curl -s -X POST "$BASE_URL$endpoint" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# --- Parallel Arrays for Category Lookup (Bash 3.2 Compatibility) ---
CAT_NAMES=()
CAT_IDS=()

get_category_id() {
  local search_name="$1"
  for i in "${!CAT_NAMES[@]}"; do
    if [[ "${CAT_NAMES[$i]}" == "$search_name" ]]; then
      echo "${CAT_IDS[$i]}"
      return 0
    fi
  done
  return 1
}

# --- MENU DATA ---
declare -a RAW_MENU_DATA=(
  "Sandwich Item Veg|Open Paneer Cheese Chilli Sandwich|170|true"
  "Sandwich Item Veg|Open Pizza Cheese Sandwich|180|true"
  "Sandwich Item Veg|Paneer Cheese Chilli Sandwich|152|true"
  "Sandwich Item Veg|Paneer Cheese Grill Sandwich|152|true"
  "Sandwich Item Veg|Paneer Tandoori Masala Cheese Sandwich|168|true"
  "Sandwich Item Veg|Paneer Tandoori Masala Sandwich|150|true"
  "Sandwich Item Veg|Veg Cheese Grill Sandwich|96|true"
  "Sandwich Item Veg|Veg Grill Sandwich|75|true"
  "Sandwiches|Aloo Cheese Sandwich|86|true"
  "Sandwiches|Boiled Egg Sandwich|108|false"
  "Sandwiches|Boiled Sandwich|86|true"
  "Sandwiches|Bread Butter Grill|44|true"
  "Sandwiches|Bread Butter Jam|54|true"
  "Sandwiches|Cheese Chilli Sandwich|108|true"
  "Sandwich Item (Non-Veg)|Chicken Masala Cheese Sandwich|157|false"
  "Sandwich Item (Non-Veg)|Chicken Cheese Mayo Sandwich|157|false"
  "Sandwich Item (Non-Veg)|Chicken Masala Sandwich|128|false"
  "Sandwich Item (Non-Veg)|Chicken Tandoori Masala Cheese|168|false"
  "Sandwich Item (Non-Veg)|Chicken Tandoori Masala Sandwich|150|false"
  "Sandwich Item (Non-Veg)|Chatni Cheese Sandwich|86|true"
  "Sandwich Item (Non-Veg)|Kaun Sandwich Cheese Sandwich|131|true"
  "Sandwich Item (Non-Veg)|Omelette Cheese Sandwich|108|false"
  "Sandwich Item (Non-Veg)|Egg Omlet Sandwich|86|false"
  "Sandwich Item (Non-Veg)|Mumbai Masala Cheese Grill|105|true"
  "Sandwich Item (Non-Veg)|Open Cheese Chilli Sandwich|168|true"
  "Sandwich Item (Non-Veg)|Open Cheese Sandwich|189|true"
  "Panini Sandwich Veg|Paneer Mexican Panini|193|true"
  "Panini Sandwich Veg|Paneer Cheese Chilli Panini|193|true"
  "Panini Sandwich Veg|Paneer College Panini|193|true"
  "Panini Sandwich Veg|Paneer Tandoori Paneer|194|true"
  "Sandwich Item Non-Veg (Panini)|Chicken Mexican Panini|215|false"
  "Sandwich Item Non-Veg (Panini)|Chicken Tandoori Panini|215|false"
  "Pasta With Choice of sauce|Spaghetti Alle Olive|162|true"
  "Pasta With Choice of sauce|Veg Fusli Formaggio|162|true"
  "Pasta With Choice of sauce|Veg Penne Arranita|162|true"
  "Pasta With Choice of sauce|Veg Spaghetti With Red Sauce|162|true"
  "Pasta With (Non-Veg)|Chicken Panne Arabia|183|false"
  "Pasta With (Non-Veg)|Chicken Fusli Formaggio|183|false"
  "Pasta With (Non-Veg)|Chicken Spagheet Alle Olive|183|false"
  "Flavoured Sweet Corn|Butter Sweet Corn|44|true"
  "Flavoured Sweet Corn|Cheese Chilli Sweet Corn|54|true"
  "Flavoured Sweet Corn|Masala Sweet Corn|44|true"
  "Dosa Variety|Butter Cheese Masala Dosa|108|true"
  "Dosa Variety|Butter Cheese Sada Dosa|86|true"
  "Dosa Variety|Butter Masala Dosa|86|true"
  "Dosa Variety|Butter Sada Dosa|75|true"
  "Dosa Variety|Cheese Chilli Dosa|86|true"
  "Dosa Variety|Cheese Sada Dosa|86|true"
  "Dosa Variety|Jini Dosa|194|true"
  "Dosa Variety|Masala Dosa|86|true"
  "Dosa Variety|Mysore Cheese Masala Dosa|108|true"
  "Dosa Variety|Mysore Cheese Sada Dosa|86|true"
  "Dosa Variety|Mysore Masala Dosa|96|true"
  "Dosa Variety|Mysore Sada Dosa|86|true"
  "Dosa & Uttapa Variety|Onion Tomato Utappa|96|true"
  "Dosa & Uttapa Variety|Onion Uttappa|96|true"
  "Dosa & Uttapa Variety|Paneer Cheese Dosa|216|true"
  "Dosa & Uttapa Variety|Sada Dosa|67|true"
  "Dosa & Uttapa Variety|Cheese Masala|108|true"
  "Dosa & Uttapa Variety|Schezwan Cheese Sada Dosa|96|true"
  "Dosa & Uttapa Variety|Schezwan Masala Dosa|86|true"
  "Dosa & Uttapa Variety|Schezwan Sada Dosa|86|true"
  "Dosa & Uttapa Variety|Sultan Dosa|194|true"
  "Dosa & Uttapa Variety|Vegetable Cheese Dosa|194|true"
  "Dosa & Uttapa Variety|Dil Khush Dosa|190|true"
  "Egg Counter|Bhurji Pav|75|false"
  "Egg Counter|Boiled|54|false"
  "Egg Counter|Chicken Masala Omelette Pav|142|false"
  "Egg Counter|Egg Kolhapuri Bhurji Pav|86|false"
  "Egg Counter|Extra Egg (1 Piece)|31|false"
  "Egg Counter|Half Fry Pav|65|false"
  "Egg Counter|Masala Omelette Pav|75|false"
  "Egg Counter|Omelette Pav|65|false"
  "Egg Counter|Spinach Omelette|75|false"
  "Frankie Rolls|Chicken Frankie|141|false"
  "Frankie Rolls|Egg Frankie|86|false"
  "Frankie Rolls|Paneer Frankie|131|true"
  "Frankie Rolls|Veg Frankie|75|true"
  "Fruit Box|Cut Fruit Box|108|true"
  "Evening Snacks|Green Moong Chilla With Green Chutney|84|true"
  "Atta Maggi|Cheese Maggi|75|true"
  "Atta Maggi|Chicken Maggi|108|false"
  "Atta Maggi|Corn Cheese Maggi|86|true"
  "Atta Maggi|Corn Maggi|65|true"
  "Atta Maggi|Mix Veg Maggi|54|true"
  "Atta Maggi|Paneer Maggi|86|true"
  "Atta Maggi|Plain Maggi|44|true"
  "Atta Maggi|Paneer Vegetable Maggi|86|true"
  "Atta Maggi (Fried)|Chicken Fried Maggi|162|false"
  "Atta Maggi (Fried)|Veg Fried Maggi|108|true"
  "Atta Maggi (Fried)|Egg Fried Maggi|141|false"
  "Beverages|Banana Chocolate Milkshake|107|true"
  "Beverages|Banana Milk Shake|96|true"
  "Beverages|Buttermilk|44|true"
  "Beverages|Chocolate Milk Shake|96|true"
  "Beverages|Cold Coffee|96|true"
  "Beverages|Strawberry Milk Shake|109|true"
  "Beverages|Oreo Chocolate Milkshake|108|true"
  "Beverages|Rose Milk Shake|98|true"
  "Beverages|Sweet Lassi|65|true"
  "Mocktails|Fresh Lime Soda|69|true"
  "Mocktails|Green Apple Soda|105|true"
  "Mocktails|Jeera Masala Soda|69|true"
  "Mocktails|Kala Khatta|93|true"
  "Mocktails|Lichi Soda|105|true"
  "Mocktails|Rose Soda|104|true"
  "Mocktails|Strawberry Lemoned|115|true"
  "Juices|Cucumber Spinach Juice|110|true"
  "Juices|Fresh lime Juice|65|true"
  "Juices|Freshlime Mint Juice|65|true"
  "Juices|Orange Juice|110|true"
  "Juices|Pineapple Juice|110|true"
  "Juices|Papaya Juice|99|true"
  "Juices|Kokum Juice|79|true"
  "Juices|Watermelon Juice|99|true"
  "Oats|Masala Oats|47|true"
  "Oats|Vegetables Masala Oats|55|true"
  "Lunch|Non-veg Lunch|231|false"
  "Lunch|Pav Bhaji|142|true"
  "Lunch|Steam Rice|66|true"
  "Lunch|Veg Biryani|163|true"
  "Lunch|Veg Lunch|163|true"
  "Lunch (Sides/Other)|Dal Rice|132|true"
  "Lunch (Sides/Other)|Dal Tadka|73|true"
  "Chat Counter|Bhelpuri|75|true"
  "Chat Counter|Corn Chat|86|true"
  "Chat Counter|Dahi Puri|86|true"
  "Breakfast|Aloo Paratha|84|true"
  "Breakfast|Poori Bhaji|74|true"
  "Breakfast|Misal Pav|86|true"
  "Chinese Items|Veg Combination Rice With Gravy|184|true"
  "Chinese Items|Chicken Triple Rice With Gravy|257|false"
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

log "1. Authenticating Super Admin..."
SA_RESP=$(admin_login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD")
SA_TOKEN=$(echo "$SA_RESP" | jq -r '.accessToken')

log "2. Ensuring Client '$CLIENT_NAME' exists..."
api_post "/api/v1/admin/tenants" "$SA_TOKEN" \
  "{\"name\":\"$CLIENT_NAME\",\"contactEmail\":\"$CLIENT_EMAIL\",\"adminEmail\":\"$CLIENT_EMAIL\",\"adminPassword\":\"$CLIENT_PASSWORD\",\"status\":\"ACTIVE\"}" > /dev/null 2>&1 || true

log "3. Logging in as Client Admin ($CLIENT_EMAIL)..."
LOGIN_RESP=$(admin_login "$CLIENT_EMAIL" "$CLIENT_PASSWORD")
ACCESS_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.accessToken')
ADMIN_ID=$(echo "$LOGIN_RESP" | jq -r '.admin.id')

log "4. Creating/Fetching Outlet: $OUTLET_NAME..."
## Try to create
#OUTLET_RESP=$(api_post "/api/v1/admin/outlets" "$ACCESS_TOKEN" \
#  "{\"ownerId\":\"$ADMIN_ID\",\"name\":\"$OUTLET_NAME\",\"timezone\":\"Asia/Kolkata\"}")

# Use safer jq to get ID from single object or first in array
#OUTLET_ID=$(echo "$OUTLET_RESP" | jq -r 'if type=="array" then .[0].id elif type=="object" then .id else empty end')

# Fallback: Fetch all outlets if creation response didn't give an ID
#if [[ -z "$OUTLET_ID" || "$OUTLET_ID" == "null" ]]; then
#    LIST_RESP=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/admin/outlets")
#    OUTLET_ID=$(echo "$LIST_RESP" | jq -r 'if type=="array" then .[0].id elif type=="object" then .id else empty end')
#fi
#
#if [[ -z "$OUTLET_ID" || "$OUTLET_ID" == "null" ]]; then
#    echo "[ERROR] Could not find or create Outlet ID. Response: $OUTLET_RESP"
#    exit 1
#fi
OUTLET_ID="144bb00b-b842-4cbd-934e-f208f6f2681f"

log "Outlet ID confirmed: $OUTLET_ID"

#log "5. Seeding Menu Categories and Items..."
#for row in "${RAW_MENU_DATA[@]}"; do
#  IFS='|' read -r CAT_NAME ITEM_NAME PRICE IS_VEG <<< "$row"
#
#  # Find or Create Category
#  CURRENT_CAT_ID=$(get_category_id "$CAT_NAME" || echo "")
#
#  if [[ -z "$CURRENT_CAT_ID" ]]; then
#    CAT_RESP=$(api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/categories" "$ACCESS_TOKEN" \
#      "{\"name\":\"$CAT_NAME\",\"sortOrder\":0,\"status\":\"ACTIVE\"}")
#    CURRENT_CAT_ID=$(echo "$CAT_RESP" | jq -r '.id')
#
#    # Store in parallel arrays for next lookup
#    CAT_NAMES+=("$CAT_NAME")
#    CAT_IDS+=("$CURRENT_CAT_ID")
#  fi
#
#  # Create Menu Item
#  api_post "/api/v1/admin/outlets/$OUTLET_ID/menu/items" "$ACCESS_TOKEN" \
#    "{\"categoryId\":\"$CURRENT_CAT_ID\",\"name\":\"$ITEM_NAME\",\"description\":\"$ITEM_NAME\",\"isVeg\":$IS_VEG,\"basePrice\":$PRICE,\"status\":\"ACTIVE\"}" > /dev/null
#
#  echo -n "."
#done

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


log ""
log "✅ Seeding Completed for Dietico!"