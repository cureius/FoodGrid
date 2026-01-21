# Payment Gateway Integration

This document describes the payment gateway integration in FoodGrid, which supports multiple payment gateways using the Factory pattern.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        REST Layer                                │
│  ┌────────────────┐ ┌───────────────────┐ ┌──────────────────┐  │
│  │PaymentResource │ │PaymentConfigRes.  │ │PaymentWebhookRes.│  │
│  └───────┬────────┘ └─────────┬─────────┘ └────────┬─────────┘  │
└──────────┼────────────────────┼────────────────────┼────────────┘
           │                    │                    │
┌──────────┼────────────────────┼────────────────────┼────────────┐
│          ▼                    ▼                    ▼            │
│  ┌────────────────┐  ┌────────────────────┐                     │
│  │ PaymentService │  │PaymentConfigService│   Service Layer     │
│  └───────┬────────┘  └────────────────────┘                     │
└──────────┼──────────────────────────────────────────────────────┘
           │
┌──────────┼──────────────────────────────────────────────────────┐
│          ▼                                                       │
│  ┌────────────────────┐        Factory Pattern                  │
│  │PaymentGatewayFactory│───────────────────────────────────────┐│
│  └─────────┬──────────┘                                        ││
│            │ creates                                           ││
│            ▼                                                   ││
│  ┌───────────────────┐                                         ││
│  │  PaymentGateway   │ (Interface)                             ││
│  └─────────┬─────────┘                                         ││
│            │                                                   ││
│  ┌─────────┼─────────┬─────────────┬─────────────┐            ││
│  ▼         ▼         ▼             ▼             ▼            ││
│┌────────┐┌────────┐┌────────┐┌──────────┐┌──────────┐         ││
││Razorpay││ Stripe ││  PayU  ││ PhonePe* ││Cashfree* │         ││
│└────────┘└────────┘└────────┘└──────────┘└──────────┘         ││
│                                          * Not yet implemented ││
└─────────────────────────────────────────────────────────────────┘
```

## Supported Payment Gateways

| Gateway   | Status      | Default Currency | Features |
|-----------|-------------|------------------|----------|
| Razorpay  | ✅ Implemented | INR | Orders, Payments, Refunds, Webhooks |
| Stripe    | ✅ Implemented | USD | PaymentIntents, Refunds, Webhooks |
| PayU      | ✅ Implemented | INR | Hash-based, Redirect flow, Refunds |
| PhonePe   | 🚧 Placeholder | INR | Coming soon |
| Cashfree  | 🚧 Placeholder | INR | Coming soon |

## Configuration

### 1. Set Encryption Master Key (IMPORTANT!)

In `application.properties`, change the default encryption key for production:

```properties
foodgrid.encryption.master-key=your-secure-32-character-key-here
```

### 2. Configure Gateway for a Client

Use the `/api/v1/payment-config` endpoint to configure payment gateways:

```bash
POST /api/v1/payment-config
Authorization: Bearer <client_admin_token>
Content-Type: application/json

{
  "gatewayType": "RAZORPAY",
  "apiKey": "rzp_test_xxxxx",
  "secretKey": "your_secret_key",
  "webhookSecret": "your_webhook_secret",
  "isLiveMode": false
}
```

## Payment Flow

### 1. Initiate Payment

```bash
POST /api/v1/payments/initiate
Authorization: Bearer <pos_user_token>
Content-Type: application/json

{
  "orderId": "order-uuid",
  "amount": 500.00,
  "currency": "INR",
  "idempotencyKey": "unique-key-for-retry"
}
```

Response:
```json
{
  "transactionId": "tx-uuid",
  "orderId": "order-uuid",
  "gatewayType": "RAZORPAY",
  "gatewayOrderId": "order_xxxxx",
  "amount": 500.00,
  "currency": "INR",
  "status": "PENDING",
  "clientData": {
    "key": "rzp_test_xxxxx",
    "order_id": "order_xxxxx",
    "amount": 50000
  },
  "gatewayPublicKey": "rzp_test_xxxxx"
}
```

### 2. Client-Side Payment (Frontend)

Use the `clientData` to initialize the payment SDK:

**Razorpay Example:**
```javascript
const options = {
  key: response.clientData.key,
  amount: response.clientData.amount,
  currency: response.clientData.currency,
  order_id: response.clientData.order_id,
  handler: function(paymentResponse) {
    // Verify payment
    verifyPayment({
      transactionId: response.transactionId,
      gatewayPaymentId: paymentResponse.razorpay_payment_id,
      gatewaySignature: paymentResponse.razorpay_signature,
      gatewayOrderId: paymentResponse.razorpay_order_id
    });
  }
};
const rzp = new Razorpay(options);
rzp.open();
```

### 3. Verify Payment

```bash
POST /api/v1/payments/verify
Authorization: Bearer <pos_user_token>
Content-Type: application/json

{
  "transactionId": "tx-uuid",
  "gatewayPaymentId": "pay_xxxxx",
  "gatewaySignature": "signature_from_sdk",
  "gatewayOrderId": "order_xxxxx"
}
```

### 4. Process Refund (Admin only)

```bash
POST /api/v1/payments/refund
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "transactionId": "tx-uuid",
  "amount": 100.00,
  "reason": "Customer request"
}
```

## Webhook Configuration

Configure webhooks in your payment gateway dashboard to point to:

| Gateway   | Webhook URL |
|-----------|-------------|
| Razorpay  | `https://your-domain/api/v1/webhooks/payment/razorpay` |
| Stripe    | `https://your-domain/api/v1/webhooks/payment/stripe` |
| PayU      | `https://your-domain/api/v1/webhooks/payment/payu` |
| BharatPay | `https://your-domain/api/v1/webhooks/payment/bharatpay` |

## Database Schema

### Tables Created

1. **client_payment_configs** - Stores encrypted gateway credentials per client
2. **gateway_transactions** - Tracks all payment transactions
3. **gateway_refunds** - Tracks refund requests and status
4. **gateway_webhook_events** - Logs all webhook events for audit

### Key Relationships

```
clients (1) ──────> (N) client_payment_configs
orders (1) ────────> (N) gateway_transactions
gateway_transactions (1) ──> (N) gateway_refunds
payments (N) ──────> (1) gateway_transactions (optional link)
```

## Security Considerations

1. **Credential Encryption**: All API keys and secrets are encrypted using AES-256-GCM before storage
2. **Webhook Signature Verification**: All webhooks are verified using gateway-specific signature mechanisms
3. **Idempotency**: Payment initiation supports idempotency keys to prevent duplicate charges
4. **Role-Based Access**: Different operations require different roles (POS_USER, ADMIN, CLIENT_ADMIN)

## Adding a New Gateway

To add a new payment gateway:

1. Add the gateway type to `PaymentGatewayType` enum
2. Create a new class implementing `PaymentGateway` interface in `gateway/impl/`
3. Register it in `PaymentGatewayFactory.createGateway()`
4. Add webhook endpoint in `PaymentWebhookResource`
5. Update `PaymentConfigService.getSupportedGateways()`

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/payments/initiate` | POS_USER+ | Initiate a payment |
| POST | `/api/v1/payments/verify` | POS_USER+ | Verify/capture payment |
| POST | `/api/v1/payments/refund` | ADMIN+ | Process refund |
| GET | `/api/v1/payments/{id}` | POS_USER+ | Get transaction |
| GET | `/api/v1/payments/order/{orderId}` | POS_USER+ | Get transaction by order |
| GET | `/api/v1/payments` | POS_USER+ | List transactions |
| POST | `/api/v1/payment-config` | CLIENT_ADMIN+ | Save gateway config |
| GET | `/api/v1/payment-config` | CLIENT_ADMIN+ | List configs |
| DELETE | `/api/v1/payment-config/{type}` | CLIENT_ADMIN+ | Deactivate config |
| GET | `/api/v1/payment-config/gateways` | ADMIN+ | List supported gateways |
| POST | `/api/v1/public/payments/verify` | None | Public payment verification |
| POST | `/api/v1/webhooks/payment/*` | None | Webhook endpoints |
