package com.foodgrid.pos.service;

import com.foodgrid.auth.model.ShiftSession;
import com.foodgrid.auth.repo.ShiftSessionRepository;
import com.foodgrid.common.audit.AuditLogService;
import com.foodgrid.common.idempotency.IdempotencyService;
import com.foodgrid.common.idempotency.RequestHash;
import com.foodgrid.common.security.TenantGuards;
import com.foodgrid.common.util.Ids;
import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.model.*;
import com.foodgrid.pos.repo.*;
import com.foodgrid.pos.dto.StockMovementCreateRequest;
import com.foodgrid.pos.service.IngredientService;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class OrderPosService {

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

  @Transactional
  public OrderResponse create(final OrderCreateRequest req) {
    final String outletId = claimRequired("outletId");
    guards.requireOutletInTenant(outletId);

    final ShiftSession ss = activeSession();

    final Order o = new Order();
    o.id = Ids.uuid();
    o.outletId = outletId;
    o.tenantId = guards.requireTenant();
    o.deviceId = ss.deviceId;
    o.shiftId = ss.shiftId;
    o.employeeId = employeeId();
    o.tableId = (req.tableId() == null || req.tableId().isBlank()) ? null : req.tableId();
    o.orderType = parseOrderType(req.orderType());
    o.status = Order.Status.OPEN;
    o.subtotal = moneyZero();
    o.taxTotal = moneyZero();
    o.discountTotal = moneyZero();
    o.grandTotal = moneyZero();
    o.notes = req.notes();
    o.createdAt = Date.from(Instant.now());
    o.updatedAt = Date.from(Instant.now());

    orderRepository.persist(o);

    return toResponse(o, List.of());
  }

  @Transactional
  public OrderResponse addItem(final String orderId, final OrderAddItemRequest req) {
    final Order o = getOrderForOutlet(orderId);
    ensureCanEdit(o);

    if (req.qty().compareTo(BigDecimal.ZERO) <= 0) {
      throw new BadRequestException("qty must be positive");
    }

    final MenuItem mi = menuItemRepository.findByIdAndOutlet(req.itemId(), o.outletId)
      .orElseThrow(() -> new BadRequestException("Invalid itemId"));

    if (mi.status != MenuItem.Status.ACTIVE) {
      throw new BadRequestException("Item inactive");
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
    oi.createdAt = Date.from(Instant.now());

    orderItemRepository.persist(oi);

    recomputeTotals(o);

    return get(orderId);
  }

  @Transactional
  public OrderResponse cancelItem(final String orderId, final String orderItemId) {
    final Order o = getOrderForOutlet(orderId);
    ensureCanEdit(o);

    final OrderItem oi = orderItemRepository.findByIdAndOrder(orderItemId, o.id)
      .orElseThrow(() -> new NotFoundException("Order item not found"));

    if (oi.status != OrderItem.Status.OPEN) {
      throw new BadRequestException("Item cannot be cancelled");
    }

    oi.status = OrderItem.Status.CANCELLED;
    orderItemRepository.persist(oi);

    recomputeTotals(o);

    return get(orderId);
  }

  @Transactional
  public OrderResponse markServed(final String orderId) {
    final Order o = getOrderForOutlet(orderId);

    if (o.status != Order.Status.OPEN && o.status != Order.Status.KOT_SENT) {
      throw new BadRequestException("Order cannot be marked as served");
    }

    // Deduct ingredients from stock for all order items
    deductIngredientsFromStock(o);

    o.status = Order.Status.SERVED;
    o.updatedAt = Date.from(Instant.now());
    orderRepository.persist(o);

    audit.record("ORDER_SERVED", o.outletId, "Order", o.id, "Order marked as served");

    return get(orderId);
  }

  private void deductIngredientsFromStock(final Order order) {
    final List<OrderItem> orderItems = orderItemRepository.listByOrder(order.id);
    
    for (final OrderItem orderItem : orderItems) {
      // Skip cancelled items
      if (orderItem.status == OrderItem.Status.CANCELLED) {
        continue;
      }

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
            "Order #" + order.id + " - " + orderItem.itemName // notes
          );
          
          ingredientService.recordStockMovement(order.outletId, stockMovementRequest);
        } catch (final Exception e) {
          // Log error but continue with other ingredients
          audit.record("STOCK_DEDUCTION_FAILED", order.outletId, "Order", order.id, 
            "Failed to deduct ingredient " + recipe.ingredientId + ": " + e.getMessage());
        }
      }
    }
  }

  @Transactional
  public OrderResponse bill(final String orderId) {
    final Order o = getOrderForOutlet(orderId);

    if (o.status != Order.Status.OPEN && o.status != Order.Status.KOT_SENT && o.status != Order.Status.SERVED) {
      throw new BadRequestException("Order cannot be billed");
    }

    recomputeTotals(o);
    o.status = Order.Status.BILLED;
    o.updatedAt = Date.from(Instant.now());
    orderRepository.persist(o);

    return get(orderId);
  }

  @Transactional
  public PaymentResponse pay(final String orderId, final PaymentCreateRequest req) {
    return payWithIdempotency(orderId, req, null);
  }

  @Transactional
  public PaymentResponse payWithIdempotency(final String orderId, final PaymentCreateRequest req, final String idempotencyKey) {
    final Order o = getOrderForOutlet(orderId);

    if (o.status != Order.Status.BILLED && o.status != Order.Status.PAID) {
      throw new BadRequestException("Order must be billed before payment");
    }

    final String tenantId = guards.requireTenant();
    final String requestFingerprint = RequestHash.sha256Hex(orderId + ":" + req.method() + ":" + req.amount());

    // Replay if already completed
    final var replay = idempotency.checkOrReserve(tenantId, OP_PAY, idempotencyKey, requestFingerprint);
    if (replay.isPresent()) {
      final String paymentId = replay.get().resultRef();
      final Payment existing = paymentRepository.findByIdAndOrder(paymentId, o.id)
        .orElseThrow(() -> new NotFoundException("Idempotent payment not found"));
      audit.record("PAYMENT_REPLAY", o.outletId, "Payment", existing.id, "orderId=" + o.id);
      return new PaymentResponse(existing.id, existing.orderId, existing.method.name(), existing.amount, existing.status.name());
    }

    final Payment p = new Payment();
    p.id = Ids.uuid();
    p.orderId = o.id;
    p.method = parsePaymentMethod(req.method());
    p.amount = money(req.amount());
    p.status = Payment.Status.CAPTURED;
    p.createdAt = Date.from(Instant.now());
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
      o.updatedAt = Date.from(Instant.now());
      orderRepository.persist(o);
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

  public List<OrderResponse> listRecent(final Integer limit) {
    final String outletId = claimRequired("outletId");
    guards.requireOutletInTenant(outletId);

    final int lim = (limit == null || limit <= 0 || limit > 200) ? 50 : limit;

    return orderRepository.listRecentByOutlet(outletId, lim).stream()
      .map(o -> toResponse(o, orderItemRepository.listByOrder(o.id).stream().map(OrderPosService::toResponse).toList()))
      .toList();
  }

  private void recomputeTotals(final Order o) {
    final List<OrderItem> items = orderItemRepository.listByOrder(o.id);

    final BigDecimal subtotal = items.stream()
      .filter(i -> i.status == OrderItem.Status.OPEN)
      .map(i -> i.lineTotal)
      .reduce(moneyZero(), BigDecimal::add);

    o.subtotal = money(subtotal);
    if (o.taxTotal == null) o.taxTotal = moneyZero();
    if (o.discountTotal == null) o.discountTotal = moneyZero();

    o.grandTotal = money(o.subtotal.add(o.taxTotal).subtract(o.discountTotal));
    o.updatedAt = Date.from(Instant.now());
    orderRepository.persist(o);
  }

  private void ensureCanEdit(final Order o) {
    if (o.status != Order.Status.OPEN) {
      throw new BadRequestException("Order is not editable");
    }
  }

  private Order getOrderForOutlet(final String orderId) {
    final String outletId = claimRequired("outletId");
    guards.requireOutletInTenant(outletId);

    final Order o = orderRepository.findByIdAndOutlet(orderId, outletId)
      .orElseThrow(() -> new NotFoundException("Order not found"));

    // Defensive tenant check
    final String tenantId = guards.requireTenant();
    if (o.tenantId != null && !o.tenantId.isBlank() && !tenantId.equals(o.tenantId)) {
      throw new ForbiddenException("Order not in tenant");
    }

    return o;
  }

  private ShiftSession activeSession() {
    final String sessionId = claimRequired("sessionId");
    return sessionRepository.findActiveById(sessionId)
      .orElseThrow(() -> new ForbiddenException("Session revoked"));
  }

  private String employeeId() {
    if (identity.getPrincipal() == null || identity.getPrincipal().getName() == null || identity.getPrincipal().getName().isBlank()) {
      throw new BadRequestException("Missing employee identity");
    }
    return identity.getPrincipal().getName();
  }

  private String claimRequired(final String name) {
    final String v = claim(name);
    if (v == null || v.isBlank()) {
      throw new BadRequestException("Missing " + name);
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
      throw new BadRequestException("Invalid orderType");
    }
  }

  private static Payment.Method parsePaymentMethod(final String value) {
    try {
      return Payment.Method.valueOf(value);
    } catch (final Exception ex) {
      throw new BadRequestException("Invalid payment method");
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

  private static OrderResponse toResponse(final Order o, final List<OrderItemResponse> items) {
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
      items
    );
  }
}
