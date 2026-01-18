# FoodGrid Backend — End-to-End User Journey (curl)

This is an end-to-end **real-world POS journey** from initial bootstrap to taking a payment.

It’s written against the Quarkus backend in this repo and uses copy/paste `curl`.

> Notes (Jan 2026)
> - Tenant isolation is enforced for most authenticated endpoints.
> - POS payment creation supports **idempotency** via the `Idempotency-Key` header.

---

## 0) Base setup

```bash
export BASE_URL="http://localhost:8080"
```

Optional (recommended for parsing JSON):

```bash
command -v jq >/dev/null || echo "jq not found (optional, but recommended)"
```

---

## 1) Bootstrap (first-time only)

If you are running a fresh DB and **no admin user exists**, bootstrap one.

> This endpoint is now **dev-idempotent**:
> - If the admin email doesn’t exist, it creates the admin and returns tokens.
> - If the email already exists, it will try to log in and return tokens.

### 1.1 Bootstrap admin (creates admin + returns tokens)

**API**
`POST /api/v1/bootstrap/admin`

✅ Required fields: `email`, `password`, `displayName` (and optional `status`).

```bash
curl -s -X POST "$BASE_URL/api/v1/bootstrap/admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@foodgrid.com",
    "password": "123456",
    "displayName": "Restaurant Owner",
    "status": "ACTIVE"
  }'
```

If it still fails, run with HTTP status/debug output:

```bash
curl -i -X POST "$BASE_URL/api/v1/bootstrap/admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@foodgrid.com",
    "password": "123456",
    "displayName": "Restaurant Owner",
    "status": "ACTIVE"
  }' | cat
```

---

## 2) Admin login (backoffice)

### 2.1 Login → get `ADMIN_TOKEN` + `ADMIN_ID`

**API**
`POST /api/v1/admin/auth/login`

```bash
export ADMIN_LOGIN_JSON="$(curl -s -X POST "$BASE_URL/api/v1/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foodgrid.com","password":"123456"}')"

echo "$ADMIN_LOGIN_JSON" | jq

export ADMIN_TOKEN="$(echo "$ADMIN_LOGIN_JSON" | jq -r '.accessToken')"
export ADMIN_ID="$(echo "$ADMIN_LOGIN_JSON" | jq -r '.admin.id')"

echo "ADMIN_ID=$ADMIN_ID"
```

> `ADMIN_ID` becomes the **ownerId** when creating outlets.

---

## 3) Admin creates an outlet (tenant/outlet setup)

### 3.1 Create outlet → get `OUTLET_ID`

**API**
`POST /api/v1/admin/outlets`

Request body requires `ownerId`.

```bash
OUTLET_RES="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ownerId\":\"$ADMIN_ID\",\"name\":\"FoodGrid Downtown\",\"timezone\":\"Asia/Kolkata\",\"status\":\"ACTIVE\"}")"

echo "$OUTLET_RES" | jq
export OUTLET_ID="$(echo "$OUTLET_RES" | jq -r '.id // empty')"

echo "OUTLET_ID=$OUTLET_ID"
```

If `jq` errors here, the response is not JSON. Re-run with status output:

```bash
curl -i -X POST "$BASE_URL/api/v1/admin/outlets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ownerId\":\"$ADMIN_ID\",\"name\":\"FoodGrid Downtown\",\"timezone\":\"Asia/Kolkata\",\"status\":\"ACTIVE\"}" | cat
```

### 3.2 List outlets

**API**
`GET /api/v1/admin/outlets`

```bash
curl -s "$BASE_URL/api/v1/admin/outlets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

## 4) Device bootstrapping (POS terminal)

### 4.1 Choose a device code

In this backend, `deviceId` is a **device code string** like `POS-DEVICE-001`.

```bash
export DEVICE_CODE="POS-DEVICE-001"
```

### 4.2 Fetch login context (auto-registers device if unknown)

**API**
`GET /api/v1/auth/login-context?deviceId=...&outletId=...`

```bash
curl -s "$BASE_URL/api/v1/auth/login-context?deviceId=$DEVICE_CODE&outletId=$OUTLET_ID" | jq
```

### 4.3 (Optional) Verify device exists (admin)

**API**
`GET /api/v1/admin/outlets/{outletId}/devices`

```bash
curl -s "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/devices" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

---

## 5) Employee setup (admin)

### 5.1 Create employee → get `EMPLOYEE_ID`

**API**
`POST /api/v1/admin/outlets/{outletId}/employees`

```bash
export EMPLOYEE_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Cashier One",
    "email": "cashier1@foodgrid.com",
    "avatarUrl": null,
    "status": "ACTIVE",
    "pin": "123456"
  }' | jq -r '.id')"

echo "EMPLOYEE_ID=$EMPLOYEE_ID"
```

### 5.2 Assign roles to employee

**API**
`PUT /api/v1/admin/outlets/{outletId}/employees/{employeeId}/roles`

```bash
curl -s -X PUT "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/employees/$EMPLOYEE_ID/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roles":["CASHIER"]}' | jq
```

---

## 6) POS login (cashier)

### 6.1 POS fetches login context

**API**
`GET /api/v1/auth/login-context?deviceId=...`

```bash
curl -s "$BASE_URL/api/v1/auth/login-context?deviceId=$DEVICE_CODE" | jq
```

### 6.2 Login with PIN → get `POS_TOKEN`

**API**
`POST /api/v1/auth/login/pin`

```bash
export POS_LOGIN_JSON="$(curl -s -X POST "$BASE_URL/api/v1/auth/login/pin" \
  -H "Content-Type: application/json" \
  -d "{\"employeeId\":\"$EMPLOYEE_ID\",\"pin\":\"123456\",\"deviceId\":\"$DEVICE_CODE\"}")"

echo "$POS_LOGIN_JSON" | jq

export POS_TOKEN="$(echo "$POS_LOGIN_JSON" | jq -r '.accessToken')"

echo "POS_TOKEN=${POS_TOKEN:0:20}..."
```

> The POS token contains claims like `outletId`, `sessionId`, and (now) `clientId` for tenant resolution.

---

## 7) Admin config: menu + tables

### 7.1 Create menu category → `CATEGORY_ID`

**API**
`POST /api/v1/admin/outlets/{outletId}/menu/categories`

```bash
export CATEGORY_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/categories" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Starters","sortOrder":1,"status":"ACTIVE"}' | jq -r '.id')"

echo "CATEGORY_ID=$CATEGORY_ID"
```

### 7.2 Create menu item → `ITEM_ID`

**API**
`POST /api/v1/admin/outlets/{outletId}/menu/items`

```bash
export ITEM_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/menu/items" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categoryId\":\"$CATEGORY_ID\",\"name\":\"Fries\",\"description\":\"Classic salted\",\"isVeg\":true,\"basePrice\":99.00,\"status\":\"ACTIVE\"}" \
  | jq -r '.id')"

echo "ITEM_ID=$ITEM_ID"
```

### 7.3 Create dining table → `TABLE_ID`

**API**
`POST /api/v1/admin/outlets/{outletId}/tables`

```bash
export TABLE_ID="$(curl -s -X POST "$BASE_URL/api/v1/admin/outlets/$OUTLET_ID/tables" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableCode":"T1","displayName":"Table 1","capacity":4,"status":"ACTIVE"}' | jq -r '.id')"

echo "TABLE_ID=$TABLE_ID"
```

---

## 8) POS order lifecycle (create → add items → bill → pay)

### 8.1 Create order → `ORDER_ID`

**API**
`POST /api/v1/pos/orders`

```bash
ORDER_RES="$(curl -s -X POST "$BASE_URL/api/v1/pos/orders" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderType\":\"DINE_IN\",\"tableId\":\"$TABLE_ID\",\"notes\":\"No onions\"}")"

echo "$ORDER_RES" | jq
export ORDER_ID="$(echo "$ORDER_RES" | jq -r '.id // empty')"

echo "ORDER_ID=$ORDER_ID"
```

If you get a 400 here, print the status+body (don’t pipe to jq):

```bash
curl -i -X POST "$BASE_URL/api/v1/pos/orders" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderType\":\"DINE_IN\",\"tableId\":\"$TABLE_ID\",\"notes\":\"No onions\"}" | cat
```

### 8.2 Add item(s)

**API**
`POST /api/v1/pos/orders/{orderId}/items`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/items" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"itemId\":\"$ITEM_ID\",\"qty\":2}" | jq
```

### 8.3 Bill order

**API**
`POST /api/v1/pos/orders/{orderId}/bill`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/bill" \
  -H "Authorization: Bearer $POS_TOKEN" | jq
```

### 8.4 Pay (idempotent)

**API**
`POST /api/v1/pos/orders/{orderId}/payments`

#### 8.4.1 First payment request

```bash
export IDEM_KEY="pay-$ORDER_ID-1"

curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/payments" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{"method":"CASH","amount":198.00}' | jq
```

#### 8.4.2 Replay the same request (safe)

If the POS app times out and retries with the same `Idempotency-Key` and payload, the backend should return the **same payment result**.

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/payments" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{"method":"CASH","amount":198.00}' | jq
```

#### 8.4.3 Reuse the same key with a different payload (should 409)

```bash
curl -i -s -X POST "$BASE_URL/api/v1/pos/orders/$ORDER_ID/payments" \
  -H "Authorization: Bearer $POS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM_KEY" \
  -d '{"method":"CASH","amount":199.00}' | cat
```

---

## 9) POS session end

### 9.1 Logout (revokes current session)

**API**
`POST /api/v1/pos/logout`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/logout" \
  -H "Authorization: Bearer $POS_TOKEN" | jq
```

### 9.2 Close shift (closes shift + revokes all shift sessions)

**API**
`POST /api/v1/pos/shift/close`

```bash
curl -s -X POST "$BASE_URL/api/v1/pos/shift/close" \
  -H "Authorization: Bearer $POS_TOKEN" | jq
```

---

## Troubleshooting

- **500 with `Table 'foodgrid_db.employee_roles' doesn't exist`**: your DB schema is missing the `employee_roles` table.
  - If you just pulled code changes, restart the Quarkus app so Hibernate can create missing tables (dev uses `quarkus.hibernate-orm.database.generation=update`).
  - If you use a persistent DB volume, you may need to restart once after schema changes.
- **401/403**: Make sure you’re using the correct token (`ADMIN_TOKEN` vs `POS_TOKEN`) and that tenant/outlet claims are present.
- **Tenant not resolved**: Your JWT must include `clientId` (employee tokens do) or `outletId` must map to an outlet.
- **409 on idempotency**:
  - Same key + different payload → conflict
  - Same key while first request is still in progress → conflict
- **403 on `/api/v1/admin/auth/login`** usually means invalid credentials (wrong email/password) *or* the admin user wasn’t created yet.
- **Email already exists** during bootstrap: just run bootstrap again (it will login) or use `/api/v1/admin/auth/login`.
- **403 on `/api/v1/admin/outlets`** can be caused by:
  - missing/invalid `ADMIN_TOKEN`
  - roles missing `ADMIN`
  - (older builds) tenant resolution failing — if you just pulled code changes, **restart the Quarkus server**.
