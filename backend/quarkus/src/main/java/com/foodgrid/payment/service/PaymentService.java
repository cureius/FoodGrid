package com.foodgrid.payment.service;

import com.foodgrid.admin.repo.AdminUserRepository;
import com.foodgrid.admin.repo.ClientRepository;
import com.foodgrid.auth.repo.OutletRepository;
import com.foodgrid.common.audit.AuditLogService;
import com.foodgrid.common.util.EncryptionUtil;
import com.foodgrid.common.util.Ids;
import com.foodgrid.payment.dto.*;
import com.foodgrid.payment.gateway.*;
import com.foodgrid.payment.model.*;
import com.foodgrid.payment.repo.*;
import com.foodgrid.pos.model.Order;
import com.foodgrid.pos.model.Payment;
import com.foodgrid.pos.repo.OrderRepository;
import com.foodgrid.pos.repo.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Payment service handling all payment gateway operations.
 * Coordinates between gateway factory, transaction management, and order updates.
 */
@ApplicationScoped
public class PaymentService {

    private static final Logger LOG = Logger.getLogger(PaymentService.class);

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

    @Inject
    OrderRepository orderRepository;

    @Inject
    PaymentRepository paymentRepository;

    @Inject
    OutletRepository outletRepository;

    @Inject
    ClientRepository clientRepository;

    @Inject
    AdminUserRepository adminUserRepository;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

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
        tx.createdAt = Instant.now();
        tx.updatedAt = Instant.now();

        transactionRepository.persist(tx);

        // Create order with gateway
        final String receipt = "FG-" + tx.id.substring(0, 8).toUpperCase();
        final GatewayOrderResult result = gateway.createOrder(
            tx.id, request.amount(), request.effectiveCurrency(), receipt, request.metadata()
        );

        if (!result.success()) {
            tx.failureReason = result.errorMessage();
            tx.gatewayResponse = result.rawResponse();
            tx.updatedAt = Instant.now();
            transactionRepository.persist(tx);

            auditService.record("PAYMENT_INITIATE_FAILED", outletId, "GatewayTransaction", tx.id,
                "order=" + request.orderId() + ", error=" + result.errorMessage());

            throw new BadRequestException("Payment initiation failed: " + result.errorMessage());
        }

        // Update transaction with gateway order info
        tx.gatewayOrderId = result.gatewayOrderId();
        tx.status = GatewayTransactionStatus.PENDING;
        tx.gatewayResponse = result.rawResponse();
        tx.updatedAt = Instant.now();
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
        tx.updatedAt = Instant.now();

        if (result.success()) {
            tx.status = result.status();
            tx.paymentMethod = result.paymentMethod();
            tx.completedAt = Instant.now();

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
        refund.createdAt = Instant.now();
        refundRepository.persist(refund);

        // Process with gateway
        final GatewayRefundResult result = gateway.processRefund(tx.gatewayPaymentId, request.amount(), request.reason());

        refund.gatewayRefundId = result.gatewayRefundId();
        refund.gatewayResponse = result.rawResponse();
        refund.status = result.status();

        if (result.success()) {
            if (result.status() == RefundStatus.COMPLETED) {
                refund.processedAt = Instant.now();
            }

            // Update transaction status
            final BigDecimal newTotalRefunded = totalRefunded.add(request.amount());
            if (newTotalRefunded.compareTo(tx.amount) >= 0) {
                tx.status = GatewayTransactionStatus.REFUNDED;
            } else {
                tx.status = GatewayTransactionStatus.PARTIALLY_REFUNDED;
            }
            tx.updatedAt = Instant.now();
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
     * Create payment link for an order.
     * This is called when an order is billed and proceeds to payment.
     * Returns the payment link URL that the client can use to complete payment.
     */
    @Transactional
    public PaymentLinkResponse createPaymentLink(final String tenantId, final String clientId, String outletId,
                                                 final String orderId, final String idempotencyKey) {
        // Check if order exists and is billed
        final Order order = orderRepository.findById(orderId);
        String derivedClientId;
        if (order == null) {
            throw new NotFoundException("Order not found");
        }


        if (order.orderType != Order.OrderType.TAKEAWAY && order.status != Order.Status.BILLED && order.status != Order.Status.PAID) {
            throw new BadRequestException("Order must be billed before creating payment link for take away orders");
        }

        if(outletId == null){
            outletId = order.outletId;
        }

        if(clientId == null){
            //find the admin id of the outletId -> outlet to adminuser -> adminuser to client
            final var outlet = outletRepository.findById(outletId);
            if (outlet == null) {
                throw new NotFoundException("Outlet not found: " + outletId);
            }
            
            derivedClientId = outlet.clientId;
            if(derivedClientId == null){
                final String adminUserId = outlet.ownerId;
                if (adminUserId == null) {
                    throw new BadRequestException("Outlet has no owner");
                }
                
                final var adminUser = adminUserRepository.findById(adminUserId);
                if (adminUser == null) {
                    throw new NotFoundException("Admin user not found: " + adminUserId);
                }
                
                derivedClientId = adminUser.clientId;
                if (derivedClientId == null) {
                    throw new BadRequestException("Admin user has no clientId");
                }
            }
        }else{
            derivedClientId = clientId;
        }


        // Check if payment link already exists for this order
        final var existingTx = transactionRepository.findByOrderId(orderId);
        if (existingTx.isPresent() && 
            (existingTx.get().status == GatewayTransactionStatus.PENDING || 
             existingTx.get().status == GatewayTransactionStatus.INITIATED)) {
            final GatewayTransaction tx = existingTx.get();
            final PaymentGateway gateway = gatewayFactory.getPrimaryGateway(derivedClientId);
            
            // Extract payment link from gatewayResponse if available
            final String paymentLink = extractPaymentLink(tx, gateway);
            
            return new PaymentLinkResponse(
                tx.id, tx.orderId, tx.gatewayType, tx.gatewayOrderId,
                paymentLink, tx.amount, tx.currency, tx.status
            );
        }

        // Use outletId from order if not provided (fallback)
        final String effectiveOutletId = outletId != null && !outletId.isBlank() ? outletId : order.outletId;
        
        // Create new payment transaction
        final Map<String, String> metadata = new HashMap<>();
        metadata.put("orderId", orderId);
        if (effectiveOutletId != null && !effectiveOutletId.isBlank()) {
            metadata.put("outletId", effectiveOutletId);
        }
        
        // Get the primary gateway for this client
        final PaymentGateway gateway = gatewayFactory.getPrimaryGateway(derivedClientId);
        
        // Create payment link using the gateway's payment link API
        final GatewayOrderResult linkResult = gateway.createPaymentLink(
            orderId,
            order.grandTotal,
            "INR",
            "Payment for Order " + orderId,
            null, // customer name - can be added later
            null, // customer contact - can be added later
            null  // callback URL - can be configured per client
        );
        
        if (!linkResult.success()) {
            throw new BadRequestException("Failed to create payment link: " + linkResult.errorMessage());
        }
        
        // Create transaction record
        final GatewayTransaction transaction = new GatewayTransaction();
        transaction.id = Ids.uuid();
        transaction.tenantId = tenantId;
        transaction.clientId = derivedClientId;
        transaction.outletId = effectiveOutletId;
        transaction.orderId = orderId;
        transaction.gatewayType = gateway.getType();
        transaction.gatewayOrderId = linkResult.gatewayOrderId();
        transaction.gatewayPaymentId = linkResult.gatewayOrderId();
        transaction.amount = order.grandTotal;
        transaction.currency = "INR";
        transaction.status = GatewayTransactionStatus.PENDING;
        transaction.gatewayResponse = linkResult.rawResponse();
        transaction.idempotencyKey = idempotencyKey;
        transaction.createdAt = Instant.now();
        
        transactionRepository.persist(transaction);
        
        // Extract payment link from clientData
        String paymentLink = null;
        if (linkResult.clientData() != null) {
            final Object linkObj = linkResult.clientData().get("short_url");
            if (linkObj != null) {
                paymentLink = linkObj.toString();
            }
        }

        return new PaymentLinkResponse(
            transaction.id, orderId, gateway.getType(), linkResult.gatewayOrderId(),
            paymentLink, order.grandTotal, "INR", transaction.status
        );
    }
    @Transactional
    public PaymentLinkResponse createPaymentLinkForCustomer(final String orderId, final String idempotencyKey) {
        final Order order = orderRepository.findById(orderId);
        if (order == null) {
            throw new NotFoundException("Order not found");
        }

        // Derive context from order/outlet with proper null checks
        final String outletId = order.outletId;
        if (outletId == null) {
            throw new BadRequestException("Order has no outletId");
        }
        
        final var outlet = outletRepository.findById(outletId);
        if (outlet == null) {
            throw new NotFoundException("Outlet not found: " + outletId);
        }
        
        final String adminUserId = outlet.ownerId;
        if (adminUserId == null) {
            throw new BadRequestException("Outlet has no owner");
        }
        
        final var adminUser = adminUserRepository.findById(adminUserId);
        if (adminUser == null) {
            throw new NotFoundException("Admin user not found: " + adminUserId);
        }
        
        final String clientId = adminUser.clientId;
        if (clientId == null) {
            throw new BadRequestException("Admin user has no clientId");
        }
        
        // Tenant ID is usually the clientId in our multi-tenant model
        final String tenantId = clientId;

        return createPaymentLink(tenantId, clientId, outletId, orderId, idempotencyKey);
    }

    /**
     * Extract payment link from transaction gatewayResponse.
     * Parses the JSON response to find payment_link field.
     */
    private String extractPaymentLink(final GatewayTransaction tx, final PaymentGateway gateway) {
        if (tx.gatewayResponse == null || tx.gatewayResponse.isBlank()) {
            return null;
        }

        try {
            final JsonNode json = OBJECT_MAPPER.readTree(tx.gatewayResponse);
            
            // Try different possible locations for payment link based on gateway
            if (json.has("data") && json.get("data").has("payment_link")) {
                return json.get("data").get("payment_link").asText();
            } else if (json.has("payment_link")) {
                return json.get("payment_link").asText();
            } else if (json.has("data") && json.get("data").has("data") && 
                       json.get("data").get("data").has("payment_link")) {
                return json.get("data").get("data").get("payment_link").asText();
            } else if (json.has("short_url")) {
                // Razorpay payment links use short_url field
                return json.get("short_url").asText();
            }
        } catch (final Exception e) {
            // Failed to parse, return null
        }
        
        return null;
    }

    /**
     * Get payment status for an order.
     * Used by UI to poll for payment status.
     */
    public PaymentStatusResponse getPaymentStatus(final String orderId) {
        final Order order = orderRepository.findById(orderId);
        if (order == null) {
            throw new NotFoundException("Order not found");
        }

        final var txOpt = transactionRepository.findByOrderId(orderId);
        if (txOpt.isEmpty()) {
            return new PaymentStatusResponse(
                orderId, null, null, null, null,
                "NO_PAYMENT_INITIATED", order.status.name(), order.grandTotal
            );
        }

        final GatewayTransaction tx = txOpt.get();
        return new PaymentStatusResponse(
            orderId, tx.id, tx.gatewayType.name(), tx.gatewayOrderId,
            tx.gatewayPaymentId, tx.status.name(), order.status.name(), tx.amount
        );
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
     * List transactions for a client with pagination and filters.
     */
    public PaginatedResponse<GatewayTransactionResponse> listClientTransactions(
            final String clientId,
            final int page,
            final int size,
            final String status,
            final String paymentMethod,
            final String fromDate,
            final String toDate) {
        
        final List<GatewayTransaction> transactions = transactionRepository.findByClientIdPaginated(
            clientId, page, size, status, paymentMethod, fromDate, toDate);
            
        final long totalElements = transactionRepository.countByClientIdFiltered(
            clientId, status, paymentMethod, fromDate, toDate);
            
        final List<GatewayTransactionResponse> content = transactions.stream()
            .map(this::toResponse)
            .toList();
            
        return PaginatedResponse.of(content, page, size, totalElements);
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
        event.createdAt = Instant.now();

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
                    .ifPresentOrElse(tx -> {
                        LOG.infof("Found transaction by gatewayOrderId: %s", tx.id);
                        updateTransactionFromWebhook(tx, webhookEvent);
                    }, () -> {
                        LOG.warnf("No transaction found with gatewayOrderId: %s", webhookEvent.gatewayOrderId());
                    });
            }
            if (webhookEvent.gatewayPaymentId() != null) {
                LOG.infof("Searching for transaction by gatewayPaymentId: %s", webhookEvent.gatewayPaymentId());
                transactionRepository.findByGatewayPaymentId(webhookEvent.gatewayPaymentId())
                    .ifPresentOrElse(tx -> {
                        LOG.infof("Found transaction by gatewayPaymentId: %s", tx.id);
                        updateTransactionFromWebhook(tx, webhookEvent);
                    }, () -> {
                        LOG.warnf("No transaction found with gatewayPaymentId: %s", webhookEvent.gatewayPaymentId());
                    });
            }
            
            // If no transaction was found, let's check all transactions for debugging
            LOG.infof("Checking all transactions for this order...");
            transactionRepository.findByOrderId("7e90d20f-96dc-4c8c-a706-85d9e755c287")
                .ifPresent(tx -> {
                    LOG.infof("Found transaction: id=%s, gatewayOrderId=%s, gatewayPaymentId=%s, status=%s", 
                        tx.id, tx.gatewayOrderId, tx.gatewayPaymentId, tx.status);
                });

            event.isProcessed = true;
            event.processedAt = Instant.now();
        } catch (final Exception e) {
            event.processingError = e.getMessage();
        }

        webhookRepository.persist(event);
    }

    private void updateTransactionFromWebhook(final GatewayTransaction tx, final WebhookEvent event) {
        final String eventType = event.eventType().toLowerCase();

        if (eventType.contains("captured") || eventType.contains("succeeded") || eventType.contains("success") || eventType.contains("paid")) {
            if (tx.status == GatewayTransactionStatus.PENDING || tx.status == GatewayTransactionStatus.AUTHORIZED) {
                tx.status = GatewayTransactionStatus.CAPTURED;
                tx.gatewayPaymentId = event.gatewayPaymentId();
                tx.paymentMethod = event.paymentMethod();
                tx.completedAt = Instant.now();
                tx.updatedAt = Instant.now();
                transactionRepository.persist(tx);

                // Create Payment entity and update Order status
                updateOrderAndCreatePayment(tx);

                auditService.record("PAYMENT_WEBHOOK_CAPTURED", tx.outletId, "GatewayTransaction", tx.id,
                    "event=" + event.eventType());
            }
        } else if (eventType.contains("failed") || eventType.contains("failure")) {
            if (tx.status == GatewayTransactionStatus.PENDING || tx.status == GatewayTransactionStatus.AUTHORIZED) {
                tx.status = GatewayTransactionStatus.FAILED;
                tx.failureReason = "Payment failed (webhook)";
                tx.updatedAt = Instant.now();
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
                            refund.processedAt = Instant.now();
                            refundRepository.persist(refund);
                        }
                    });
            }
        }
    }

    /**
     * Create Payment entity and update Order status when payment is successful.
     */
    @Transactional
    public void updateOrderAndCreatePayment(final GatewayTransaction tx) {
        // Find the order
        final Order order = orderRepository.findById(tx.orderId);
        if (order == null) {
            auditService.record("PAYMENT_ORDER_NOT_FOUND", tx.outletId, "GatewayTransaction", tx.id,
                "orderId=" + tx.orderId);
            return;
        }

        // Check if payment already exists for this transaction
        Payment payment = null;
        if (tx.paymentId != null && !tx.paymentId.isBlank()) {
            payment = paymentRepository.findById(tx.paymentId);
        }

        // Create or update Payment entity
        if (payment == null) {
            payment = new Payment();
            payment.id = Ids.uuid();
            payment.orderId = tx.orderId;
            payment.method = Payment.Method.GATEWAY;
            payment.amount = tx.amount;
            payment.status = Payment.Status.CAPTURED;
            payment.gatewayTransactionId = tx.id;
            payment.createdAt = Instant.now();
            paymentRepository.persist(payment);

            // Update transaction with payment ID
            tx.paymentId = payment.id;
            transactionRepository.persist(tx);
        } else {
            // Update existing payment
            payment.status = Payment.Status.CAPTURED;
            payment.gatewayTransactionId = tx.id;
            paymentRepository.persist(payment);
        }

        // Update order status if fully paid
        final BigDecimal totalPaid = paymentRepository.listByOrder(order.id).stream()
            .filter(p -> p.status == Payment.Status.CAPTURED)
            .map(p -> p.amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPaid.compareTo(order.grandTotal) >= 0 && order.status != Order.Status.PAID) {
            order.status = Order.Status.PAID;
            order.updatedAt = Instant.now();
            orderRepository.persist(order);

            auditService.record("ORDER_PAID", order.outletId, "Order", order.id,
                "transaction=" + tx.id + ", totalPaid=" + totalPaid);
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
