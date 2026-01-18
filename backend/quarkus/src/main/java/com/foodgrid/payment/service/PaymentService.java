package com.foodgrid.payment.service;

import com.foodgrid.common.audit.AuditLogService;
import com.foodgrid.common.util.EncryptionUtil;
import com.foodgrid.common.util.Ids;
import com.foodgrid.payment.dto.*;
import com.foodgrid.payment.gateway.*;
import com.foodgrid.payment.model.*;
import com.foodgrid.payment.repo.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Payment service handling all payment gateway operations.
 * Coordinates between gateway factory, transaction management, and order updates.
 */
@ApplicationScoped
public class PaymentService {

    @Inject
    PaymentGatewayFactory gatewayFactory;

    @Inject
    GatewayTransactionRepository transactionRepository;

    @Inject
    GatewayRefundRepository refundRepository;

    @Inject
    GatewayWebhookEventRepository webhookRepository;

    @Inject
    ClientPaymentConfigRepository configRepository;

    @Inject
    EncryptionUtil encryptionUtil;

    @Inject
    AuditLogService auditService;

    /**
     * Initiate a payment for an order.
     * Creates a gateway order and returns data needed for client-side payment.
     */
    @Transactional
    public InitiatePaymentResponse initiatePayment(final String tenantId, final String clientId, final String outletId,
                                                   final InitiatePaymentRequest request) {
        // Check for idempotent request
        if (request.idempotencyKey() != null) {
            final var existing = transactionRepository.findByIdempotencyKey(request.idempotencyKey());
            if (existing.isPresent()) {
                final GatewayTransaction tx = existing.get();
                final PaymentGateway gateway = gatewayFactory.getPrimaryGateway(clientId);
                return new InitiatePaymentResponse(
                    tx.id, tx.orderId, tx.gatewayType, tx.gatewayOrderId,
                    tx.amount, tx.currency, tx.status, null, gateway.getPublicKey()
                );
            }
        }

        // Get the primary gateway for this client
        final PaymentGateway gateway = gatewayFactory.getPrimaryGateway(clientId);

        // Create transaction record
        final GatewayTransaction tx = new GatewayTransaction();
        tx.id = Ids.uuid();
        tx.tenantId = tenantId;
        tx.clientId = clientId;
        tx.outletId = outletId;
        tx.orderId = request.orderId();
        tx.paymentId = request.paymentId();
        tx.gatewayType = gateway.getType();
        tx.amount = request.amount();
        tx.currency = request.effectiveCurrency();
        tx.status = GatewayTransactionStatus.INITIATED;
        tx.idempotencyKey = request.idempotencyKey();
        tx.createdAt = Date.from(Instant.now());
        tx.updatedAt = Date.from(Instant.now());

        transactionRepository.persist(tx);

        // Create order with gateway
        final String receipt = "FG-" + tx.id.substring(0, 8).toUpperCase();
        final GatewayOrderResult result = gateway.createOrder(
            tx.id, request.amount(), request.effectiveCurrency(), receipt, request.metadata()
        );

        if (!result.success()) {
            tx.status = GatewayTransactionStatus.FAILED;
            tx.failureReason = result.errorMessage();
            tx.gatewayResponse = result.rawResponse();
            tx.updatedAt = Date.from(Instant.now());
            transactionRepository.persist(tx);

            auditService.record("PAYMENT_INITIATE_FAILED", outletId, "GatewayTransaction", tx.id,
                "order=" + request.orderId() + ", error=" + result.errorMessage());

            throw new BadRequestException("Payment initiation failed: " + result.errorMessage());
        }

        // Update transaction with gateway order info
        tx.gatewayOrderId = result.gatewayOrderId();
        tx.status = GatewayTransactionStatus.PENDING;
        tx.gatewayResponse = result.rawResponse();
        tx.updatedAt = Date.from(Instant.now());
        transactionRepository.persist(tx);

        auditService.record("PAYMENT_INITIATED", outletId, "GatewayTransaction", tx.id,
            "order=" + request.orderId() + ", gateway=" + gateway.getType());

        return new InitiatePaymentResponse(
            tx.id, tx.orderId, tx.gatewayType, tx.gatewayOrderId,
            tx.amount, tx.currency, tx.status, result.clientData(), gateway.getPublicKey()
        );
    }

/**
     * Verify and capture a payment after client-side completion.
     */
    @Transactional
    public GatewayTransactionResponse verifyPayment(final String clientId, final VerifyPaymentRequest request) {
        final GatewayTransaction tx = transactionRepository.findById(request.transactionId());
        if (tx == null) {
            throw new NotFoundException("Transaction not found");
        }

        // Use clientId from transaction if not provided
        final String effectiveClientId = clientId != null ? clientId : tx.clientId;

        return verifyPaymentInternal(tx, effectiveClientId, request);
    }

    /**
     * Public verify - gets clientId from transaction.
     */
    @Transactional
    public GatewayTransactionResponse verifyPaymentPublic(final VerifyPaymentRequest request) {
        final GatewayTransaction tx = transactionRepository.findById(request.transactionId());
        if (tx == null) {
            throw new NotFoundException("Transaction not found");
        }
        return verifyPaymentInternal(tx, tx.clientId, request);
    }

    private GatewayTransactionResponse verifyPaymentInternal(final GatewayTransaction tx, final String clientId,
                                                             final VerifyPaymentRequest request) {

        if (tx.status == GatewayTransactionStatus.CAPTURED) {
            // Already captured, return success
            return toResponse(tx);
        }

        if (tx.status != GatewayTransactionStatus.PENDING && tx.status != GatewayTransactionStatus.AUTHORIZED) {
            throw new BadRequestException("Transaction cannot be verified in status: " + tx.status);
        }

        final PaymentGateway gateway = gatewayFactory.getGateway(clientId, tx.gatewayType);

        final GatewayVerifyResult result = gateway.verifyPayment(
            request.gatewayOrderId() != null ? request.gatewayOrderId() : tx.gatewayOrderId,
            request.gatewayPaymentId(),
            request.gatewaySignature(),
            request.additionalData()
        );

        tx.gatewayPaymentId = request.gatewayPaymentId();
        tx.gatewaySignature = request.gatewaySignature();
        tx.gatewayResponse = result.rawResponse();
        tx.updatedAt = Date.from(Instant.now());

        if (result.success()) {
            tx.status = result.status();
            tx.paymentMethod = result.paymentMethod();
            tx.completedAt = Date.from(Instant.now());

            auditService.record("PAYMENT_CAPTURED", tx.outletId, "GatewayTransaction", tx.id,
                "order=" + tx.orderId + ", method=" + tx.paymentMethod);
        } else {
            tx.status = GatewayTransactionStatus.FAILED;
            tx.failureReason = result.errorMessage();

            auditService.record("PAYMENT_VERIFY_FAILED", tx.outletId, "GatewayTransaction", tx.id,
                "order=" + tx.orderId + ", error=" + result.errorMessage());
        }

        transactionRepository.persist(tx);
        return toResponse(tx);
    }

    /**
     * Process a refund for a captured payment.
     */
    @Transactional
    public RefundResponse processRefund(final String clientId, final RefundRequest request) {
        final GatewayTransaction tx = transactionRepository.findById(request.transactionId());
        if (tx == null) {
            throw new NotFoundException("Transaction not found");
        }

        if (tx.status != GatewayTransactionStatus.CAPTURED &&
            tx.status != GatewayTransactionStatus.PARTIALLY_REFUNDED) {
            throw new BadRequestException("Transaction cannot be refunded in status: " + tx.status);
        }

        // Calculate total already refunded
        final BigDecimal totalRefunded = refundRepository.findByTransactionId(tx.id).stream()
            .filter(r -> r.status == RefundStatus.COMPLETED || r.status == RefundStatus.PROCESSING)
            .map(r -> r.amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalRefunded.add(request.amount()).compareTo(tx.amount) > 0) {
            throw new BadRequestException("Refund amount exceeds available balance");
        }

        final PaymentGateway gateway = gatewayFactory.getGateway(clientId, tx.gatewayType);

        // Create refund record
        final GatewayRefund refund = new GatewayRefund();
        refund.id = Ids.uuid();
        refund.transactionId = tx.id;
        refund.amount = request.amount();
        refund.status = RefundStatus.INITIATED;
        refund.reason = request.reason();
        refund.createdAt = Date.from(Instant.now());
        refundRepository.persist(refund);

        // Process with gateway
        final GatewayRefundResult result = gateway.processRefund(tx.gatewayPaymentId, request.amount(), request.reason());

        refund.gatewayRefundId = result.gatewayRefundId();
        refund.gatewayResponse = result.rawResponse();
        refund.status = result.status();

        if (result.success()) {
            if (result.status() == RefundStatus.COMPLETED) {
                refund.processedAt = Date.from(Instant.now());
            }

            // Update transaction status
            final BigDecimal newTotalRefunded = totalRefunded.add(request.amount());
            if (newTotalRefunded.compareTo(tx.amount) >= 0) {
                tx.status = GatewayTransactionStatus.REFUNDED;
            } else {
                tx.status = GatewayTransactionStatus.PARTIALLY_REFUNDED;
            }
            tx.updatedAt = Date.from(Instant.now());
            transactionRepository.persist(tx);

            auditService.record("PAYMENT_REFUND_" + result.status(), tx.outletId, "GatewayRefund", refund.id,
                "transaction=" + tx.id + ", amount=" + request.amount());
        } else {
            refund.status = RefundStatus.FAILED;
            auditService.record("PAYMENT_REFUND_FAILED", tx.outletId, "GatewayRefund", refund.id,
                "transaction=" + tx.id + ", error=" + result.errorMessage());
        }

        refundRepository.persist(refund);

        return new RefundResponse(
            refund.id, refund.transactionId, refund.gatewayRefundId,
            refund.amount, refund.status, refund.reason, refund.createdAt, refund.processedAt
        );
    }

    /**
     * Get transaction by ID.
     */
    public GatewayTransactionResponse getTransaction(final String transactionId) {
        final GatewayTransaction tx = transactionRepository.findById(transactionId);
        if (tx == null) {
            throw new NotFoundException("Transaction not found");
        }
        return toResponse(tx);
    }

    /**
     * Get transaction by order ID.
     */
    public GatewayTransactionResponse getTransactionByOrderId(final String orderId) {
        return transactionRepository.findByOrderId(orderId)
            .map(this::toResponse)
            .orElseThrow(() -> new NotFoundException("No transaction found for order"));
    }

    /**
     * List transactions for an outlet.
     */
    public List<GatewayTransactionResponse> listTransactions(final String outletId, final int limit) {
        return transactionRepository.findByOutletId(outletId, limit).stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * List refunds for a transaction.
     */
    public List<RefundResponse> listRefunds(final String transactionId) {
        return refundRepository.findByTransactionId(transactionId).stream()
            .map(r -> new RefundResponse(
                r.id, r.transactionId, r.gatewayRefundId,
                r.amount, r.status, r.reason, r.createdAt, r.processedAt
            ))
            .toList();
    }

    /**
     * Process a webhook event from a gateway.
     */
    @Transactional
    public void processWebhook(final PaymentGatewayType gatewayType, final String payload, final String signature) {
        // Store webhook event
        final GatewayWebhookEvent event = new GatewayWebhookEvent();
        event.id = Ids.uuid();
        event.gatewayType = gatewayType;
        event.payload = payload;
        event.signature = signature;
        event.createdAt = Date.from(Instant.now());

        // Get any client config for this gateway type to verify signature
        // In production, you'd want to identify the client from the webhook payload
        final List<ClientPaymentConfig> configs = configRepository.list("gatewayType = ?1 and isActive = true", gatewayType);

        boolean verified = false;
        PaymentGateway gateway = null;

        for (final ClientPaymentConfig config : configs) {
            try {
                gateway = gatewayFactory.getGateway(config);
                if (gateway.verifyWebhookSignature(payload, signature)) {
                    verified = true;
                    break;
                }
            } catch (final Exception e) {
                // Try next config
            }
        }

        event.isVerified = verified;

        if (!verified) {
            event.processingError = "Signature verification failed";
            webhookRepository.persist(event);
            return;
        }

        try {
            final WebhookEvent webhookEvent = gateway.parseWebhook(payload, signature);
            event.eventType = webhookEvent.eventType();
            event.gatewayEventId = webhookEvent.gatewayPaymentId();

            // Find and update transaction
            if (webhookEvent.gatewayOrderId() != null) {
                transactionRepository.findByGatewayOrderId(webhookEvent.gatewayOrderId())
                    .ifPresent(tx -> updateTransactionFromWebhook(tx, webhookEvent));
            } else if (webhookEvent.gatewayPaymentId() != null) {
                transactionRepository.findByGatewayPaymentId(webhookEvent.gatewayPaymentId())
                    .ifPresent(tx -> updateTransactionFromWebhook(tx, webhookEvent));
            }

            event.isProcessed = true;
            event.processedAt = Date.from(Instant.now());
        } catch (final Exception e) {
            event.processingError = e.getMessage();
        }

        webhookRepository.persist(event);
    }

    private void updateTransactionFromWebhook(final GatewayTransaction tx, final WebhookEvent event) {
        final String eventType = event.eventType().toLowerCase();

        if (eventType.contains("captured") || eventType.contains("succeeded") || eventType.contains("success")) {
            if (tx.status == GatewayTransactionStatus.PENDING || tx.status == GatewayTransactionStatus.AUTHORIZED) {
                tx.status = GatewayTransactionStatus.CAPTURED;
                tx.gatewayPaymentId = event.gatewayPaymentId();
                tx.paymentMethod = event.paymentMethod();
                tx.completedAt = Date.from(Instant.now());
                tx.updatedAt = Date.from(Instant.now());
                transactionRepository.persist(tx);

                auditService.record("PAYMENT_WEBHOOK_CAPTURED", tx.outletId, "GatewayTransaction", tx.id,
                    "event=" + event.eventType());
            }
        } else if (eventType.contains("failed") || eventType.contains("failure")) {
            if (tx.status == GatewayTransactionStatus.PENDING || tx.status == GatewayTransactionStatus.AUTHORIZED) {
                tx.status = GatewayTransactionStatus.FAILED;
                tx.failureReason = "Payment failed (webhook)";
                tx.updatedAt = Date.from(Instant.now());
                transactionRepository.persist(tx);

                auditService.record("PAYMENT_WEBHOOK_FAILED", tx.outletId, "GatewayTransaction", tx.id,
                    "event=" + event.eventType());
            }
        } else if (eventType.contains("refund")) {
            // Handle refund webhooks
            if (event.gatewayPaymentId() != null) {
                refundRepository.findByGatewayRefundId(event.gatewayPaymentId())
                    .ifPresent(refund -> {
                        if (eventType.contains("processed") || eventType.contains("completed")) {
                            refund.status = RefundStatus.COMPLETED;
                            refund.processedAt = Date.from(Instant.now());
                            refundRepository.persist(refund);
                        }
                    });
            }
        }
    }

    private GatewayTransactionResponse toResponse(final GatewayTransaction tx) {
        return new GatewayTransactionResponse(
            tx.id, tx.orderId, tx.paymentId, tx.gatewayType,
            tx.gatewayOrderId, tx.gatewayPaymentId, tx.amount, tx.currency,
            tx.status, tx.paymentMethod, tx.failureReason, tx.createdAt, tx.completedAt
        );
    }
}
