# Staff Login Integration Test Summary

## Integration Flow

### 1. **Login Page** (`/staff-login`)

- ✅ Two-step login: Email → PIN
- ✅ Device ID generation and storage
- ✅ Email validation (format check)
- ✅ PIN validation (6 digits)
- ✅ Error handling and user feedback

### 2. **Authentication Flow** (`loginWithEmail`)

- ✅ Gets login context (validates device exists)
- ✅ Validates email via `requestPinOtp` (finds employee by email)
- ✅ Gets employee list from login context
- ✅ Tries PIN login for each employee until match found
- ✅ Returns access token and refresh token

### 3. **Token Storage**

- ✅ Stores `fg_staff_access_token` in localStorage
- ✅ Stores `fg_staff_refresh_token` in localStorage
- ✅ Redirects to `/staff/dashboard` on success

### 4. **Route Protection** (`(staff)/layout.tsx`)

- ✅ Checks for `fg_staff_access_token` on all `/staff/*` routes
- ✅ Redirects to `/staff-login` if no token
- ✅ Allows `/staff-login` without authentication
- ✅ Shows loading spinner during auth check

### 5. **Staff Context** (`StaffContext.tsx`)

- ✅ Loads staff info from `/api/v1/pos/whoami` endpoint
- ✅ Extracts `outletId`, `employeeId`, `displayName`, `roles` from JWT
- ✅ Provides `useStaff()` hook for staff pages
- ✅ Handles token expiration and redirects to login

### 6. **Staff API Functions** (`staff.ts`)

- ✅ All APIs use `fg_staff_access_token` for authentication
- ✅ Order management APIs (POS endpoints)
- ✅ Menu, Tables, Outlets APIs (read-only)
- ✅ Payment APIs

## Known Issues & Requirements

### Device Registration

⚠️ **IMPORTANT**: The device must be pre-registered by an admin before staff can log in.

- `getLoginContext` can auto-register device if `outletId` is provided, but frontend doesn't have `outletId` before login
- `requestPinOtp` requires device to exist (throws 404 if not found)
- Error messages now clearly indicate if device is not registered

### Test Credentials

- Email: `test@spicegarden.com`
- PIN: `123456`

### Prerequisites for Testing

1. Device must be registered in the system (by admin)
2. Employee with email `test@spicegarden.com` must exist
3. Employee must have PIN set to `123456`
4. Employee must be assigned to an outlet
5. Device must be assigned to the same outlet

## API Endpoints Used

1. `GET /api/v1/auth/login-context?deviceId={deviceId}` - Get device/outlet/employee info
2. `POST /api/v1/auth/pin-otp/request` - Validate email exists
3. `POST /api/v1/auth/login/pin` - Login with employeeId + PIN
4. `GET /api/v1/pos/whoami` - Get current staff info from JWT

## Files Modified/Created

1. `/frontend/nextjs/src/app/staff-login/page.tsx` - Login page (root level)
2. `/frontend/nextjs/src/lib/api/auth.ts` - Added `loginWithEmail` function
3. `/frontend/nextjs/src/lib/api/staff.ts` - Staff API functions
4. `/frontend/nextjs/src/contexts/StaffContext.tsx` - Staff context provider
5. `/frontend/nextjs/src/app/(staff)/layout.tsx` - Route protection

## Testing Checklist

- [ ] Access `/staff-login` page (should load without auth)
- [ ] Enter email `test@spicegarden.com` and click Continue
- [ ] Enter PIN `123456` and click Login
- [ ] Should redirect to `/staff/dashboard` on success
- [ ] Should show error if device not registered
- [ ] Should show error if email doesn't exist
- [ ] Should show error if PIN is incorrect
- [ ] Access `/staff/*` routes without token (should redirect to login)
- [ ] Access `/staff/*` routes with valid token (should work)
- [ ] Staff context should load outletId from JWT token
- [ ] Staff APIs should use correct authentication headers
