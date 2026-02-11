# Razorpay Payment Flow Fix

## Issue
When users completed payment on Razorpay, a new tab would open with the callback URL (`https://foodgrid-be.theblueman.in/api/v1/webhooks/payment/razorpay`), which is the webhook endpoint. This created a poor user experience.

## Root Cause
The `callback_url` parameter in the Razorpay Payment Link API was being set to the webhook URL. In Razorpay:
- **`callback_url`**: Where the user is **redirected** after payment (opens in browser)
- **Webhooks**: Server-to-server notifications configured in Razorpay Dashboard

These are two different mechanisms and should not be confused.

## Solution

### Backend Changes

**File**: `/backend/quarkus/src/main/java/com/foodgrid/payment/gateway/impl/RazorpayGateway.java`

**Change**: Removed the `callback_url` parameter from payment link creation (lines 243-248)

**Before**:
```java
// Add callback URL if provided
if (webhookUrl != null && !webhookUrl.isBlank()) {
    paymentLinkRequest.put("callback_url", webhookUrl);
    paymentLinkRequest.put("callback_method", "get");
}
```

**After**:
```java
// Note: callback_url is intentionally NOT set here.
// When callback_url is not provided, Razorpay will show a success message
// and the payment window can be closed by the user or programmatically.
// Webhooks should be configured in Razorpay Dashboard to notify payment status
// to: https://foodgrid-be.theblueman.in/api/v1/webhooks/payment/razorpay
```

### How It Works Now

#### Payment Flow:
1. **User clicks "Pay Now"** → Opens Razorpay payment link in new tab
2. **User completes payment** → Razorpay shows success message
3. **User closes the payment tab** (or it can be closed programmatically)
4. **User returns to original tab** → Frontend polling detects payment status
5. **Razorpay sends webhook** → Backend receives payment notification
6. **Backend updates order status** → Frontend polling picks up the change

#### Webhook Flow (Server-to-Server):
1. **Payment completed** on Razorpay
2. **Razorpay sends POST request** to webhook URL
3. **Backend processes webhook** and updates order status
4. **Frontend polling** detects the status change
5. **UI updates** to show payment success

## Razorpay Dashboard Configuration

### Step 1: Enable Webhooks

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **Webhooks**
3. Click **"+ Add New Webhook"**

### Step 2: Configure Webhook

**Webhook URL**:
```
https://foodgrid-be.theblueman.in/api/v1/webhooks/payment/razorpay
```

**Events to Subscribe**:
- ✅ `payment_link.paid` - When payment link is successfully paid
- ✅ `payment.captured` - When payment is captured
- ✅ `payment.failed` - When payment fails
- ✅ `payment.authorized` - When payment is authorized (optional)

**Secret** (Optional but Recommended):
- Generate a webhook secret in Razorpay dashboard
- Store it securely in your backend configuration
- Use it to verify webhook signatures (currently not implemented, see TODO below)

### Step 3: Test Webhook

1. Make a test payment using Razorpay test mode
2. Check webhook logs in Razorpay Dashboard
3. Verify your backend receives and processes the webhook

## Frontend Polling

The frontend already has polling implemented to check payment status. This continues to work:

**How it works**:
1. After opening payment link, frontend starts polling
2. Polls every few seconds to check order status
3. When webhook updates order status, polling detects it
4. UI updates to show payment success

**No changes needed** to frontend polling logic.

## Benefits of This Approach

### ✅ Better User Experience
- No confusing redirect to webhook URL
- User stays in control of closing payment tab
- Seamless return to original application tab

### ✅ Reliable Payment Tracking
- Webhooks provide server-to-server notification
- No dependency on user's browser for payment confirmation
- Handles edge cases (user closes tab before redirect, network issues, etc.)

### ✅ Separation of Concerns
- **callback_url**: User-facing redirect (not used)
- **Webhooks**: Server-to-server notifications (used)
- **Polling**: Frontend status checking (used)

## Testing

### Test Mode (Razorpay Test Keys)

1. **Create test payment link**
2. **Open payment link** in new tab
3. **Use test card details**:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
4. **Complete payment**
5. **Verify**:
   - Razorpay shows success message (no redirect)
   - User can close tab
   - Webhook is received by backend
   - Frontend polling detects payment success

### Production Mode

Same flow as test mode, but with real payment credentials.

## Important Notes

### 1. Webhook Signature Verification

**Current Status**: ⚠️ Not implemented (always returns `true`)

**Location**: `RazorpayGateway.java`, line 347-352

```java
@Override
public boolean verifyWebhookSignature(final String payload, final String signature) {
    // For now, always return true to allow webhook processing
    // TODO: Implement proper signature verification when webhook secret is configured
    LOG.infof("Webhook signature verification - payload: %s, signature: %s", payload, signature);
    return true;
}
```

**Recommendation**: Implement signature verification for production:

```java
@Override
public boolean verifyWebhookSignature(final String payload, final String signature) {
    try {
        String webhookSecret = credentials.webhookSecret(); // Add this to credentials
        String expectedSignature = generateHmacSha256(payload, webhookSecret);
        return expectedSignature.equals(signature);
    } catch (Exception e) {
        LOG.error("Webhook signature verification failed", e);
        return false;
    }
}
```

### 2. Webhook Retry Logic

Razorpay will retry webhooks if your endpoint:
- Returns non-2xx status code
- Times out
- Is unreachable

**Retry Schedule**:
- Immediate
- 5 minutes
- 10 minutes
- 30 minutes
- 1 hour
- 6 hours
- 24 hours

**Recommendation**: Ensure your webhook endpoint is:
- ✅ Idempotent (can handle duplicate webhooks)
- ✅ Fast (responds within 5 seconds)
- ✅ Reliable (handles errors gracefully)

### 3. Webhook Security

**Best Practices**:
1. ✅ Verify webhook signatures (TODO)
2. ✅ Use HTTPS (already done)
3. ✅ Validate payload structure
4. ✅ Log all webhook events
5. ✅ Handle duplicate events gracefully

## Troubleshooting

### Issue: Webhook not received

**Check**:
1. Webhook URL is correct in Razorpay Dashboard
2. Server is accessible from internet
3. Firewall allows incoming requests
4. Check Razorpay Dashboard → Webhooks → Logs

### Issue: Payment successful but order not updated

**Check**:
1. Webhook endpoint is working (`/api/v1/webhooks/payment/razorpay`)
2. Backend logs for webhook processing errors
3. Database connection is working
4. Order ID mapping is correct

### Issue: User confused about closing payment tab

**Solution**:
- Add instructions on payment page
- Implement automatic tab closing (JavaScript)
- Show clear success message

## Future Enhancements

### 1. Automatic Tab Closing

Add JavaScript to automatically close payment tab after success:

```javascript
// In Razorpay success handler
window.close(); // Close payment tab
window.opener.postMessage({ type: 'PAYMENT_SUCCESS' }, '*'); // Notify parent
```

### 2. Custom Success Page

Instead of no `callback_url`, set it to a custom success page:

```java
paymentLinkRequest.put("callback_url", "https://yourdomain.com/payment/success");
```

This page can:
- Show success message
- Automatically close tab
- Provide instructions

### 3. Real-time Updates (WebSocket)

Replace polling with WebSocket for instant updates:
- Backend sends WebSocket message when webhook received
- Frontend listens for real-time payment status
- Better UX, less server load

## Files Modified

1. `/backend/quarkus/src/main/java/com/foodgrid/payment/gateway/impl/RazorpayGateway.java`
   - Removed `callback_url` from payment link creation
   - Added documentation comments

## Configuration Required

### Razorpay Dashboard
- ✅ Add webhook URL
- ✅ Subscribe to payment events
- ⚠️ Generate webhook secret (recommended)

### Backend (Optional)
- Add webhook secret to configuration
- Implement signature verification
- Add webhook event logging

## Result

✅ Payment flow works correctly
✅ No unwanted redirects to webhook URL
✅ User can close payment tab naturally
✅ Webhooks notify backend of payment status
✅ Frontend polling detects status changes
✅ Seamless user experience

## References

- [Razorpay Payment Links API](https://razorpay.com/docs/api/payment-links/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [Webhook Signature Verification](https://razorpay.com/docs/webhooks/validate-test/)
