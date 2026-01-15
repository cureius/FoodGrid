# FoodGrid POS Backend — End-to-End User Flow (curl)

## Base setup

```bash
export BASE_URL="http://localhost:8080"
```

Optional but recommended:

```bash
command -v jq >/dev/null || echo "jq not found (optional, but recommended)"
```

---

## Auth overview

- **Admin APIs**: use `ADMIN_TOKEN` from `/api/v1/admin/auth/login`
- **POS APIs**: use `POS_TOKEN` from `/api/v1/auth/login/pin` (or OTP flow)
- POS JWT contains `outletId` and `sessionId` claims.
- Device IDs used in login are *device codes* (client-provided strings like `POS-DEVICE-001`).

---

# 0) Admin login (get `ADMIN_TOKEN`)

## 0.1 Login

**API**
`POST /api/v1/admin/auth/login`

```bash
curl -s -X POST "$BASE_URL/api/v1/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@foodgrid.com",
    "password": "123456"
  }'
```

Extract token:

```bash
export ADMIN_TOKEN="$(curl -s -X POST "$BASE_URL/api/v1/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foodgrid.com","password":"123456"}' | jq -r '.accessToken')"

echo "$ADMIN_TOKEN"
```

---

# 1) Outlet setup (admin)

## 1.1 Create outlet

**API**
`POST /api/v1/admin/outlets`

```bash
curl -s -X POST "$BASE_URL/api/v1/admin/outlets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FoodGrid Downtown",
    "timezone": "Asia/Kolkata"
  }'
```

Extract `OUTLET_ID`:

```bash
export OUTLET_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"FoodGrid Downtown","timezone":"Asia/Kolkata"}' | jq -r '.id')"

echo "$OUTLET_ID"
```

## 1.2 List outlets

**API**
`GET /api/v1/admin/outlets`

```bash
curl -s "$BASE_URL/api/v1/admin/outlets" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

# 2) POS device bootstrap (auto-registration)

## 2.1 Pick a device code

```bash
export DEVICE_CODE="POS-DEVICE-001"
```

## 2.2 Fetch login context (auto-register device if unknown)

**API**
`GET /api/v1/auth/login-context?deviceId=...&outletId=...`

```bash
curl -s "$BASE_URL/api/v1/auth/login-context?deviceId=$DEVICE_CODE&outletId=$OUTLET_ID"
```

## 2.3 (Optional) Verify device exists (admin)

**API**
`GET /api/v1/admin/outlets/{outletId}/devices`

```bash
curl -s "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/devices" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

# 3) Employee setup (admin)

## 3.1 Create employee

**API**
`POST /api/v1/admin/outlets/{outletId}/employees`

```bash
curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Cashier One",
    "email": "cashier1@foodgrid.com",
    "avatarUrl": null,
    "pin": "123456",
    "status": "ACTIVE"
  }'
```

Extract `EMPLOYEE_ID`:

```bash
export EMPLOYEE_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Cashier One","email":"cashier1@foodgrid.com","avatarUrl":null,"pin":"123456","status":"ACTIVE"}' | jq -r '.id')"

echo "$EMPLOYEE_ID"
```

## 3.2 Assign employee roles

**API**
`PUT /api/v1/admin/outlets/{outletId}/employees/{employeeId}/roles`

```bash
curl -s -X PUT "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees/$EMPLOYEE_ID/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["CASHIER"]
  }'
```

---

# 4) POS login (employee) -> get `POS_TOKEN`

## 4.1 Fetch login context (POS screen)

**API**
`GET /api/v1/auth/login-context?deviceId=...`

```bash
curl -s "$BASE_URL/api/v1/auth/login-context?deviceId=$DEVICE_CODE"
```

## 4.2 Login with PIN

**API**
`POST /api/v1/auth/login/pin`

```bash
curl -s -X POST "$BASE_URL/api/v1/auth/login/pin" \
  -H "Content-Type: application/json" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\",
    \"pin\": \"123456\",
    \"deviceId\": \"$DEVICE_CODE\"
  }"
```

Extract `POS_TOKEN`:

```bash
export POS_TOKEN="$(curl -s -X POST "$BASE_URL/api/v1/auth/login/pin" \
  -H "Content-Type: application/json" \
  -d "{\"employeeId\":\"$EMPLOYEE_ID\",\"pin\":\"123456\",\"deviceId\":\"$DEVICE_CODE\"}" | jq -r '.accessToken')"

echo "$POS_TOKEN"
```

---

# 5) Setup menu + tables (admin)

## 5.1 Create a menu category

**API**
`POST /api/v1/admin/outlets/{outletId}/menu/categories`

```bash
export CATEGORY_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/categories" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Starters","sortOrder":1,"status":"ACTIVE"}' | jq -r '.id')"

echo "$CATEGORY_ID"
```

## 5.2 Create a menu item

**API**
`POST /api/v1/admin/outlets/{outletId}/menu/items`

```bash
export ITEM_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/items" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"categoryId\": \"$CATEGORY_ID\",
    \"name\": \"Fries\",
    \"description\": \"Classic salted\",
    \"isVeg\": true,
    \"basePrice\": 99.00,
    \"status\": \"ACTIVE\"
  }" | jq -r '.id')"

echo "$ITEM_ID"
```

## 5.3 Create a dining table

**API**
`POST /api/v1/admin/outlets/{outletId}/tables`

```bash
export TABLE_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/tables" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableCode":"T1","displayName":"Table 1","capacity":4,"status":"ACTIVE"}' | jq -r '.id')"

echo "$TABLE_ID"
```

---

# 6) POS order workflow (create -> add items -> bill -> pay)

## 6.1 Create an order

**API**
`POST /api/v1/pos/orders`

```bash
export ORDER_ID="$(curl -s -X POST "$BASE_URL/api/v1/pos/orders" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderType\": \"DINE_IN\",
    \"tableId\": \"$TABLE_ID\",
    \"notes\": \"No onions\"
  }" | jq -r '.id')"

echo "$ORDER_ID"
```

## 6.2 Add an item to the order

**API**
`POST /api/v1/pos/orders/{orderId}/items`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/items" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"itemId\":\"$ITEM_ID\",\"qty\":2}"
```

## 6.3 View the order

**API**
`GET /api/v1/pos/orders/{orderId}`

```bash
curl -s "$BASE_URL/api/v1/pos/orders/$ORDER_ID" \
  -H "Authorization: Bearer $POS_TOKEN"
```

Extract first `orderItemId`:

```bash
export ORDER_ITEM_ID="$(curl -s "$BASE_URL/api/v1/pos/orders/$ORDER_ID" \
  -H "Authorization: Bearer $POS_TOKEN" | jq -r '.items[0].id')"

echo "$ORDER_ITEM_ID"
```

## 6.4 Cancel an order item

**API**
`DELETE /api/v1/pos/orders/{orderId}/items/{orderItemId}`

```bash
curl -s -X DELETE "$BASE_URL/api/v1/pos/orders/$ORDER_ID/items/$ORDER_ITEM_ID" \
  -H "Authorization: Bearer $POS_TOKEN"
```

## 6.5 Bill the order

**API**
`POST /api/v1/pos/orders/{orderId}/bill`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/bill" \
  -H "Authorization: Bearer $POS_TOKEN"
```

## 6.6 Take payment

**API**
`POST /api/v1/pos/orders/{orderId}/payments`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/payments" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "CASH",
    "amount": 198.00
  }'
```

## 6.7 List recent orders

**API**
`GET /api/v1/pos/orders?limit=50`

```bash
curl -s "$BASE_URL/api/v1/pos/orders?limit=50" \
  -H "Authorization: Bearer $POS_TOKEN"
```

---

# 7) POS session end (logout / close shift)

## 7.1 Logout (revokes current session)

**API**
`POST /api/v1/pos/logout`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/logout" \
  -H "Authorization: Bearer $POS_TOKEN"
```

## 7.2 Close shift (closes shift + revokes all sessions for the shift)

**API**
`POST /api/v1/pos/shift/close`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/shift/close" \
  -H "Authorization: Bearer $POS_TOKEN"
```
