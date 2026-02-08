package com.foodgrid.pos.service;

import com.foodgrid.auth.model.Outlet;
import com.foodgrid.auth.model.ShiftSession;
import com.foodgrid.auth.repo.OutletRepository;
import com.foodgrid.auth.repo.ShiftSessionRepository;
import com.foodgrid.common.audit.AuditLogService;
import com.foodgrid.common.exception.*;
import com.foodgrid.common.idempotency.IdempotencyService;
import com.foodgrid.common.idempotency.RequestHash;
import com.foodgrid.common.logging.AppLogger;
import com.foodgrid.common.security.TenantGuards;
import com.foodgrid.common.util.Ids;
import com.foodgrid.integration.service.IntegrationService;
import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.model.*;
import com.foodgrid.pos.repo.*;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class OrderPosService {

  private static final Logger LOG = Logger.getLogger(OrderPosService.class);
  private static final String OP_PAY = "POS_ORDER_PAY";

  @Inject ShiftSessionRepository sessionRepository;
  @Inject OrderRepository orderRepository;
  @Inject OrderItemRepository orderItemRepository;
  @Inject MenuItemRepository menuItemRepository;
  @Inject MenuItemRecipeRepository recipeRepository;
  @Inject PaymentRepository paymentRepository;
  @Inject IngredientService ingredientService;
  @Inject SecurityIdentity identity;
  @Inject TenantGuards guards;
  @Inject IdempotencyService idempotency;
  @Inject AuditLogService audit;
  @Inject JsonWebToken jwt;
  @Inject OutletRepository outletRepository;
  @Inject IntegrationService integrationService;
  @Inject AppLogger appLogger;

  @Transactional
  public OrderResponse create(final OrderCreateRequest req, final String outletIdParam) {
    final String outletId = (outletIdParam != null && !outletIdParam.isBlank()) ? outletIdParam : claimRequired("outletId");
    guards.requireOutletInTenant(outletId);

    // Check if this is admin access (no sessionId in token) or POS access
    final boolean isAdminAccess = claim("sessionId") == null;
    final ShiftSession ss = isAdminAccess ? null : activeSession();

    final Order o = new Order();
    o.id = Ids.uuid();
    o.outletId = outletId;
    o.tenantId = guards.requireTenant();
    o.deviceId = isAdminAccess ? "admin-device" : ss.deviceId;
    o.shiftId = isAdminAccess ? "admin-shift" : ss.shiftId;
    o.employeeId = isAdminAccess ? "admin" : employeeId();
    o.customerId = null; // POS orders don't have customerId
    o.tableId = (req.tableId() == null || req.tableId().isBlank()) ? null : req.tableId();
    o.orderType = parseOrderType(req.orderType());
    o.status = Order.Status.OPEN;
    o.subtotal = moneyZero();
    o.taxTotal = moneyZero();
    o.discountTotal = moneyZero();
    o.grandTotal = moneyZero();
    o.notes = req.notes();
    o.createdAt = Instant.now();
    o.updatedAt = Instant.now();

    orderRepository.persist(o);

    return toResponse(o, List.of());
  }

  @Transactional
  public OrderResponse addItem(final String orderId, final OrderAddItemRequest req) {
    appLogger.info(LOG, "Adding item %s to order %s, qty=%s", req.itemId(), orderId, req.qty());
    final Order o = getOrderForOutlet(orderId);
    ensureCanEdit(o);

    if (req.qty().compareTo(BigDecimal.ZERO) <= 0) {
      throw ValidationException.invalidQuantity();
    }

    final MenuItem mi = menuItemRepository.findByIdAndOutlet(req.itemId(), o.outletId)
      .orElseThrow(() -> ResourceNotFoundException.menuItem(req.itemId()));

    if (mi.status != MenuItem.Status.ACTIVE) {
      throw BusinessException.menuItemInactive(req.itemId());
    }

    final OrderItem oi = new OrderItem();
    oi.id = Ids.uuid();
    oi.orderId = o.id;
    oi.itemId = mi.id;
    oi.itemName = mi.name;
    oi.qty = req.qty();
    oi.unitPrice = mi.basePrice;
    oi.lineTotal = money(req.qty().multiply(mi.basePrice));
    oi.status = OrderItem.Status.OPEN;
    oi.createdAt = Instant.now();

    orderItemRepository.persist(oi);

    recomputeTotals(o);

    return get(orderId);
  }

  @Transactional
  public OrderResponse cancelItem(final String orderId, final String orderItemId) {
    appLogger.info(LOG, "Cancelling item %s from order %s", orderItemId, orderId);
    final Order o = getOrderForOutlet(orderId);
    ensureCanEdit(o);

    final OrderItem oi = orderItemRepository.findByIdAndOrder(orderItemId, o.id)
      .orElseThrow(() -> ResourceNotFoundException.generic("OrderItem", orderItemId));

    if (oi.status != OrderItem.Status.OPEN) {
      throw BusinessException.orderNotEditable(orderId, "Item is in " + oi.status + " state");
    }

    oi.status = OrderItem.Status.CANCELLED;
    orderItemRepository.persist(oi);

    recomputeTotals(o);

    return get(orderId);
  }

  @Transactional
  public OrderResponse markServed(final String orderId) {
    appLogger.info(LOG, "Marking order %s as served", orderId);
    final Order o = getOrderForOutlet(orderId);

    // Business Logic:
    // TAKEAWAY: PAID -> KOT_SENT -> SERVED
    // DINE_IN: KOT_SENT -> SERVED
    if (o.status != Order.Status.KOT_SENT) {
      throw BusinessException.invalidOrderTransition(o.status.name(), "SERVED", "Order must be in KOT_SENT state first");
    }

    // Deduct ingredients from stock for all order items
    deductIngredientsFromStock(o);

    o.status = Order.Status.SERVED;
    o.updatedAt = Instant.now();
    orderRepository.persist(o);

    integrationService.updateExternalStatus(o, Order.Status.SERVED);

    audit.record("ORDER_SERVED", o.outletId, "Order", o.id, "Order marked as served");

    return get(orderId);
  }

  @Transactional
  public OrderResponse updateItemStatus(final String orderId, final String itemId, final String statusVal) {
    appLogger.info(LOG, "Updating item %s status to %s for order %s", itemId, statusVal, orderId);
    final Order o = getOrderForOutlet(orderId);
    final OrderItem oi = orderItemRepository.findByIdAndOrder(itemId, o.id)
      .orElseThrow(() -> ResourceNotFoundException.generic("OrderItem", itemId));

    try {
      final OrderItem.Status newStatus = OrderItem.Status.valueOf(statusVal.toUpperCase());

      if (newStatus == OrderItem.Status.SERVED && oi.status != OrderItem.Status.SERVED) {
        deductItemIngredients(o.outletId, o.id, oi);
      }

      oi.status = newStatus;
      orderItemRepository.persist(oi);

      // Auto-update order status if all items are served
      updateOrderStatusFromItems(o);

      return get(orderId);
    } catch (final IllegalArgumentException e) {
      throw ValidationException.invalidStatus(statusVal, "OPEN, PREPARING, SERVED, CANCELLED");
    }
  }

  private void updateOrderStatusFromItems(final Order o) {
    final List<OrderItem> items = orderItemRepository.listByOrder(o.id);
    final boolean allServedOrCancelled = items.stream()
      .allMatch(i -> i.status == OrderItem.Status.SERVED || i.status == OrderItem.Status.CANCELLED);
    
    if (allServedOrCancelled && !items.isEmpty()) {
       if (o.status == Order.Status.OPEN || o.status == Order.Status.KOT_SENT) {
           o.status = Order.Status.SERVED;
           o.updatedAt = Instant.now();
           orderRepository.persist(o);
           integrationService.updateExternalStatus(o, Order.Status.SERVED);
       }
    }
  }

  private void deductIngredientsFromStock(final Order order) {
    final List<OrderItem> orderItems = orderItemRepository.listByOrder(order.id);
    for (final OrderItem orderItem : orderItems) {
      if (orderItem.status == OrderItem.Status.OPEN) {
        deductItemIngredients(order.outletId, order.id, orderItem);
      }
    }
  }

  private void deductItemIngredients(final String outletId, final String orderId, final OrderItem orderItem) {
    // Get recipe for this menu item
    final List<MenuItemRecipe> recipes = recipeRepository.findByMenuItemId(orderItem.itemId);
    
    for (final MenuItemRecipe recipe : recipes) {
      // Skip optional ingredients
      if (Boolean.TRUE.equals(recipe.isOptional)) {
        continue;
      }

      // Calculate total quantity needed (recipe quantity * order item quantity)
      final BigDecimal totalQuantity = recipe.quantity.multiply(orderItem.qty);
      
      // Get ingredient to check if it tracks inventory
      final Ingredient ingredient = Ingredient.findById(recipe.ingredientId);
      if (ingredient == null || !Boolean.TRUE.equals(ingredient.trackInventory)) {
        continue; // Skip ingredients that don't track inventory
      }

      // Create stock movement for usage
      try {
        final StockMovementCreateRequest stockMovementRequest = new StockMovementCreateRequest(
          recipe.ingredientId,
          com.foodgrid.pos.model.StockMovement.MovementType.USAGE,
          totalQuantity,
          recipe.unitId,
          null, // unitCost
          null, // supplierId
          null, // purchaseOrderNumber
          null, // invoiceNumber
          null, // wastageReason
          "Order #" + orderId + " - " + orderItem.itemName // notes
        );
        
        ingredientService.recordStockMovement(outletId, stockMovementRequest);
      } catch (final Exception e) {
        // Log error but continue with other ingredients
        audit.record("STOCK_DEDUCTION_FAILED", outletId, "Order", orderId, 
          "Failed to deduct ingredient " + recipe.ingredientId + ": " + e.getMessage());
      }
    }
  }
  @Transactional
  public OrderResponse bill(final String orderId) {
    appLogger.info(LOG, "Billing order %s", orderId);
    final Order o = getOrderForOutlet(orderId);

    // TAKEAWAY: OPEN -> BILLED
    // DINE_IN: SERVED -> BILLED
    if (o.orderType == Order.OrderType.TAKEAWAY || o.orderType == Order.OrderType.DELIVERY) {
      if (o.status != Order.Status.OPEN) {
        throw BusinessException.invalidOrderTransition(o.status.name(), "BILLED", "Takeaway order can only be billed from OPEN state");
      }
    } else if (o.orderType == Order.OrderType.DINE_IN) {
      if (o.status != Order.Status.SERVED && o.status != Order.Status.OPEN && o.status != Order.Status.KOT_SENT) {
        // We allow from OPEN/KOT_SENT too for flexibility but preferred is SERVED
        // Actually user said specifically SERVED -> BILLED
        if (o.status != Order.Status.SERVED) {
          throw BusinessException.invalidOrderTransition(o.status.name(), "BILLED", "Dine-in order must be SERVED before billing");
        }
      }
    }

    recomputeTotals(o);
    o.status = Order.Status.BILLED;
    o.updatedAt = Instant.now();
    orderRepository.persist(o);

    integrationService.updateExternalStatus(o, Order.Status.BILLED);

    return get(orderId);
  }

  @Transactional
  public OrderResponse updateStatus(final String orderId, String statusVal) {
    if (statusVal == null || statusVal.isBlank()) {
      throw ValidationException.missingField("status");
    }

    final Order o = getOrderForOutlet(orderId);
    statusVal = statusVal.trim().toUpperCase();

    try {
      final Order.Status newStatus = Order.Status.valueOf(statusVal);

      // Enforce Lifecycle transitions via updateStatus too
      if (newStatus == Order.Status.CANCELLED) {
        validateCancellation(o);
      }

      if (newStatus == Order.Status.KOT_SENT) {
        // TAKEAWAY: PAID -> KOT_SENT
        // DINE_IN: OPEN -> KOT_SENT
        if (o.orderType == Order.OrderType.DINE_IN) {
          if (o.status != Order.Status.OPEN) {
            throw BusinessException.invalidOrderTransition(o.status.name(), "KOT_SENT", "Dine-in KOT can only be sent from OPEN state");
          }
        } else {
          if (o.status != Order.Status.PAID) {
            throw BusinessException.invalidOrderTransition(o.status.name(), "KOT_SENT", "Takeaway KOT can only be sent after payment (PAID)");
          }
        }
      }

      // Basic transitions validation
      if (newStatus == Order.Status.SERVED && o.status != Order.Status.SERVED) {
        deductIngredientsFromStock(o);
      }

      o.status = newStatus;
      o.updatedAt = Instant.now();
      orderRepository.persist(o);

      integrationService.updateExternalStatus(o, newStatus);

      audit.record("ORDER_STATUS_UPDATED", o.outletId, "Order", o.id, "Status changed to " + statusVal);

      return get(orderId);
    } catch (final IllegalArgumentException e) {
      throw ValidationException.invalidStatus(statusVal, "OPEN, KOT_SENT, SERVED, BILLED, PAID, CANCELLED");
    }
  }

  private void validateCancellation(final Order o) {
    // TAKEAWAY: can be cancelled before billed
    // DINE_IN: can be cancelled before kot sent
    if (o.orderType == Order.OrderType.DINE_IN) {
      if (o.status != Order.Status.OPEN) {
        throw BusinessException.invalidOrderTransition(o.status.name(), "CANCELLED", "Dine-in order cannot be cancelled after KOT is sent");
      }
    } else {
      if (o.status != Order.Status.OPEN && o.status != Order.Status.BILLED) {
         // Since PAID comes after BILLED, if it's not OPEN or BILLED, it might be PAID or further
         if (o.status != Order.Status.OPEN) {
           throw BusinessException.invalidOrderTransition(o.status.name(), "CANCELLED", "Takeaway order cannot be cancelled after billing/payment");
         }
      }
      // Explicit check for Takeaway flow: open -> billed -> paid
      if (o.status != Order.Status.OPEN) {
         throw BusinessException.invalidOrderTransition(o.status.name(), "CANCELLED", "Takeaway order can only be cancelled while in OPEN state");
      }
    }
  }
  @Transactional
  public PaymentResponse pay(final String orderId, final PaymentCreateRequest req) {
    return payWithIdempotency(orderId, req, null);
  }

  @Transactional
  public PaymentResponse payWithIdempotency(final String orderId, final PaymentCreateRequest req, final String idempotencyKey) {
    appLogger.info(LOG, "Processing payment for order %s, method=%s, amount=%s", orderId, req.method(), req.amount());
    final Order o = getOrderForOutlet(orderId);

    if (o.status != Order.Status.BILLED && o.status != Order.Status.PAID) {
      throw BusinessException.orderMustBeBilled();
    }

    final String tenantId = guards.requireTenant();
    final String requestFingerprint = RequestHash.sha256Hex(orderId + ":" + req.method() + ":" + req.amount());

    // Replay if already completed
    final var replay = idempotency.checkOrReserve(tenantId, OP_PAY, idempotencyKey, requestFingerprint);
    if (replay.isPresent()) {
      final String paymentId = replay.get().resultRef();
      final Payment existing = paymentRepository.findByIdAndOrder(paymentId, o.id)
        .orElseThrow(() -> ResourceNotFoundException.payment(paymentId));
      audit.record("PAYMENT_REPLAY", o.outletId, "Payment", existing.id, "orderId=" + o.id);
      return new PaymentResponse(existing.id, existing.orderId, existing.method.name(), existing.amount, existing.status.name());
    }

    final Payment p = new Payment();
    p.id = Ids.uuid();
    p.orderId = o.id;
    p.method = parsePaymentMethod(req.method());
    p.amount = money(req.amount());
    p.clientId = tenantId; // In POS context, tenantId is the clientId
    p.status = Payment.Status.CAPTURED;
    p.createdAt = Instant.now();
    paymentRepository.persist(p);

    audit.record("PAYMENT_CAPTURED", o.outletId, "Payment", p.id, "orderId=" + o.id + ", method=" + p.method.name());

    // Mark idempotency completed with payment id
    idempotency.markCompleted(tenantId, OP_PAY, idempotencyKey, requestFingerprint, p.id);

    // Update order status if fully paid
    final BigDecimal paid = paymentRepository.listByOrder(o.id).stream()
      .filter(x -> x.status == Payment.Status.CAPTURED)
      .map(x -> x.amount)
      .reduce(moneyZero(), BigDecimal::add);

    if (paid.compareTo(o.grandTotal) >= 0) {
      o.status = Order.Status.PAID;
      o.updatedAt = Instant.now();
      orderRepository.persist(o);
      integrationService.updateExternalStatus(o, Order.Status.PAID);
    }

    return new PaymentResponse(p.id, p.orderId, p.method.name(), p.amount, p.status.name());
  }

  public OrderResponse get(final String orderId) {
    final Order o = getOrderForOutlet(orderId);
    final List<OrderItemResponse> items = orderItemRepository.listByOrder(o.id).stream()
      .map(OrderPosService::toResponse)
      .toList();
    return toResponse(o, items);
  }

  public List<OrderResponse> listRecent(final Integer limit, final String outletIdParam) {
    final String outletId = (outletIdParam != null && !outletIdParam.isBlank()) ? outletIdParam : claimRequired("outletId");
    final Outlet outlet = guards.requireOutletInTenant(outletId);

    // Auto-migration: If outlet has no clientId but user accessing it does,
    // and this user is the owner, or part of the same client admin group.
    final String cid = claim("clientId");
    if (outlet.clientId == null && cid != null && !cid.isBlank()) {
        final String sub = claim("sub");
        if (sub != null && sub.equals(outlet.ownerId)) {
            outlet.clientId = cid;
            outletRepository.persist(outlet);
            audit.record("OUTLET_CLIENT_MIGRATED", outletId, "Outlet", outletId, "Migrated to clientId: " + cid);
        }
    }

    final int lim = (limit == null || limit <= 0 || limit > 200) ? 50 : limit;

    return orderRepository.listRecentByOutlet(outletId, lim).stream()
      .map(o -> toResponse(o, orderItemRepository.listByOrder(o.id).stream().map(OrderPosService::toResponse).toList()))
      .toList();
  }

  public List<OrderResponse> listByRange(final String outletIdParam, final Instant start, final Instant end) {
    final String outletId = (outletIdParam != null && !outletIdParam.isBlank()) ? outletIdParam : claimRequired("outletId");
    final Outlet outlet = guards.requireOutletInTenant(outletId);

    // Auto-migration: If outlet has no clientId but user accessing it does,
    // and this user is the owner.
    final String cid = claim("clientId");
    if (outlet.clientId == null && cid != null && !cid.isBlank()) {
        final String sub = claim("sub");
        if (sub != null && sub.equals(outlet.ownerId)) {
            outlet.clientId = cid;
            outletRepository.persist(outlet);
        }
    }

    return orderRepository.listByOutletAndDateRange(outletId, start, end).stream()
      .map(o -> toResponse(o, orderItemRepository.listByOrder(o.id).stream().map(OrderPosService::toResponse).toList()))
      .toList();
  }

  @Transactional
  public void delete(final String orderId) {
    final Order o = getOrderForOutlet(orderId);

    // Delete related order items first
    final List<OrderItem> items = orderItemRepository.listByOrder(o.id);
    for (final OrderItem item : items) {
      orderItemRepository.delete(item);
    }

    // Delete related payments
    final List<Payment> payments = paymentRepository.listByOrder(o.id);
    for (final Payment payment : payments) {
      paymentRepository.delete(payment);
    }

    // Delete the order
    orderRepository.delete(o);

    audit.record("ORDER_DELETED", o.outletId, "Order", o.id, "Order deleted");
  }

  private void recomputeTotals(final Order o) {
    final List<OrderItem> items = orderItemRepository.listByOrder(o.id);

    final BigDecimal subtotal = items.stream()
      .filter(i -> i.status != OrderItem.Status.CANCELLED)
      .map(i -> i.lineTotal)
      .reduce(moneyZero(), BigDecimal::add);

    o.subtotal = money(subtotal);
    if (o.taxTotal == null) o.taxTotal = moneyZero();
    if (o.discountTotal == null) o.discountTotal = moneyZero();

    o.grandTotal = money(o.subtotal.add(o.taxTotal).subtract(o.discountTotal));
    o.updatedAt = Instant.now();
    orderRepository.persist(o);
  }

  private void ensureCanEdit(final Order o) {
    if (o.status == Order.Status.PAID || o.status == Order.Status.CANCELLED) {
      throw BusinessException.orderNotEditable(o.id, o.status.name());
    }
  }

  private Order getOrderForOutlet(final String orderId) {
    // First, fetch the order by ID (works for both POS and Admin users)
    final Order o = orderRepository.findByIdOptional(orderId)
      .orElseThrow(() -> ResourceNotFoundException.order(orderId));

    // Get outletId from the order itself (not from JWT claims)
    // This allows Client Admin users to work with orders even if they don't have outletId in their JWT
    final String outletId = o.outletId;
    if (outletId == null || outletId.isBlank()) {
      throw ValidationException.invalidInput("Order has no outletId");
    }

    // Validate that the outlet belongs to the tenant
    final Outlet outlet = guards.requireOutletInTenant(outletId);

    // Defensive tenant check
    final String tenantId = guards.requireTenant();
    if (o.tenantId != null && !o.tenantId.isBlank() && !tenantId.equals(o.tenantId)) {
      // Allow it if it matches the outlet's ownerId (migration case)
      // This handles cases where orders were created when tenantId was resolved as ownerId, 
      // but now it's resolved as clientId.
      if (o.tenantId.equals(outlet.ownerId)) {
          // Auto-migrate order tenantId to current tenantId if possible
          o.tenantId = tenantId;
          orderRepository.persist(o);
          appLogger.info(LOG, "Auto-migrated order %s tenantId from %s (ownerId) to %s (clientId)", o.id, outlet.ownerId, tenantId);
      } else {
          throw AuthorizationException.tenantMismatch();
      }
    }

    return o;
  }

  private ShiftSession activeSession() {
    final String sessionId = claimRequired("sessionId");
    return sessionRepository.findActiveById(sessionId)
      .orElseThrow(AuthorizationException::sessionRevoked);
  }

  private String employeeId() {
    if (identity.getPrincipal() == null || identity.getPrincipal().getName() == null || identity.getPrincipal().getName().isBlank()) {
      return null; // Return null for admin access instead of throwing exception
    }
    return identity.getPrincipal().getName();
  }

  private String claimRequired(final String name) {
    final String v = claim(name);
    if (v == null || v.isBlank()) {
      throw ValidationException.missingField(name);
    }
    return v;
  }

  private String claim(final String name) {
    // Prefer JSON web token claims for reliability
    if (jwt != null) {
      try {
        final Object c = jwt.getClaim(name);
        if (c != null) {
          final String s = c.toString();
          if (!s.isBlank()) return s;
        }
      } catch (final Exception ignored) {
        // fall through
      }
    }

    // Fallback to SecurityIdentity attributes (older behavior)
    final Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static Order.OrderType parseOrderType(final String value) {
    try {
      return Order.OrderType.valueOf(value);
    } catch (final Exception ex) {
      throw ValidationException.invalidStatus(value, "DINE_IN, TAKEAWAY, DELIVERY");
    }
  }

  private static Payment.Method parsePaymentMethod(final String value) {
    try {
      return Payment.Method.valueOf(value);
    } catch (final Exception ex) {
      throw ValidationException.invalidStatus(value, "CASH, CARD, UPI, GATEWAY");
    }
  }

  private static BigDecimal moneyZero() {
    return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
  }

  private static BigDecimal money(final BigDecimal v) {
    if (v == null) return moneyZero();
    return v.setScale(2, RoundingMode.HALF_UP);
  }

  private static OrderItemResponse toResponse(final OrderItem i) {
    return new OrderItemResponse(i.id, i.itemId, i.itemName, i.qty, i.unitPrice, i.lineTotal, i.status.name());
  }

  private OrderResponse toResponse(final Order o, final List<OrderItemResponse> items) {
    final String outletName = outletRepository.findByIdOptional(o.outletId)
        .map(outlet -> outlet.name)
        .orElse("Unknown Store");

    return new OrderResponse(
      o.id,
      o.outletId,
      o.deviceId,
      o.shiftId,
      o.employeeId,
      o.tableId,
      o.orderType.name(),
      o.status.name(),
      o.subtotal,
      o.taxTotal,
      o.discountTotal,
      o.grandTotal,
      o.notes,
      o.createdAt,
      outletName,
      items
    );
  }
}
