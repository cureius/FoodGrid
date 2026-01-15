package com.foodgrid.pos.service;

import com.foodgrid.auth.model.ShiftSession;
import com.foodgrid.auth.repo.ShiftSessionRepository;
import com.foodgrid.common.util.Ids;
import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.model.MenuItem;
import com.foodgrid.pos.model.Order;
import com.foodgrid.pos.model.OrderItem;
import com.foodgrid.pos.model.Payment;
import com.foodgrid.pos.repo.MenuItemRepository;
import com.foodgrid.pos.repo.OrderItemRepository;
import com.foodgrid.pos.repo.OrderRepository;
import com.foodgrid.pos.repo.PaymentRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class OrderPosService {

  @Inject ShiftSessionRepository sessionRepository;
  @Inject OrderRepository orderRepository;
  @Inject OrderItemRepository orderItemRepository;
  @Inject MenuItemRepository menuItemRepository;
  @Inject PaymentRepository paymentRepository;
  @Inject SecurityIdentity identity;

  @Transactional
  public OrderResponse create(OrderCreateRequest req) {
    String outletId = claimRequired("outletId");
    ShiftSession ss = activeSession();

    Order o = new Order();
    o.id = Ids.uuid();
    o.outletId = outletId;
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
  public OrderResponse addItem(String orderId, OrderAddItemRequest req) {
    Order o = getOrderForOutlet(orderId);
    ensureCanEdit(o);

    if (req.qty().compareTo(BigDecimal.ZERO) <= 0) {
      throw new BadRequestException("qty must be positive");
    }

    MenuItem mi = menuItemRepository.findByIdAndOutlet(req.itemId(), o.outletId)
      .orElseThrow(() -> new BadRequestException("Invalid itemId"));

    if (mi.status != MenuItem.Status.ACTIVE) {
      throw new BadRequestException("Item inactive");
    }

    OrderItem oi = new OrderItem();
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
  public OrderResponse cancelItem(String orderId, String orderItemId) {
    Order o = getOrderForOutlet(orderId);
    ensureCanEdit(o);

    OrderItem oi = orderItemRepository.findByIdAndOrder(orderItemId, o.id)
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
  public OrderResponse bill(String orderId) {
    Order o = getOrderForOutlet(orderId);

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
  public PaymentResponse pay(String orderId, PaymentCreateRequest req) {
    Order o = getOrderForOutlet(orderId);

    if (o.status != Order.Status.BILLED && o.status != Order.Status.PAID) {
      throw new BadRequestException("Order must be billed before payment");
    }

    Payment p = new Payment();
    p.id = Ids.uuid();
    p.orderId = o.id;
    p.method = parsePaymentMethod(req.method());
    p.amount = money(req.amount());
    p.status = Payment.Status.CAPTURED;
    p.createdAt = Date.from(Instant.now());
    paymentRepository.persist(p);

    // Update order status if fully paid
    BigDecimal paid = paymentRepository.listByOrder(o.id).stream()
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

  public OrderResponse get(String orderId) {
    Order o = getOrderForOutlet(orderId);
    List<OrderItemResponse> items = orderItemRepository.listByOrder(o.id).stream()
      .map(OrderPosService::toResponse)
      .toList();
    return toResponse(o, items);
  }

  public List<OrderResponse> listRecent(Integer limit) {
    String outletId = claimRequired("outletId");
    int lim = (limit == null || limit <= 0 || limit > 200) ? 50 : limit;

    return orderRepository.listRecentByOutlet(outletId, lim).stream()
      .map(o -> toResponse(o, orderItemRepository.listByOrder(o.id).stream().map(OrderPosService::toResponse).toList()))
      .toList();
  }

  private void recomputeTotals(Order o) {
    List<OrderItem> items = orderItemRepository.listByOrder(o.id);

    BigDecimal subtotal = items.stream()
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

  private void ensureCanEdit(Order o) {
    if (o.status != Order.Status.OPEN) {
      throw new BadRequestException("Order is not editable");
    }
  }

  private Order getOrderForOutlet(String orderId) {
    String outletId = claimRequired("outletId");
    return orderRepository.findByIdAndOutlet(orderId, outletId)
      .orElseThrow(() -> new NotFoundException("Order not found"));
  }

  private ShiftSession activeSession() {
    String sessionId = claimRequired("sessionId");
    return sessionRepository.findActiveById(sessionId)
      .orElseThrow(() -> new ForbiddenException("Session revoked"));
  }

  private String employeeId() {
    if (identity.getPrincipal() == null || identity.getPrincipal().getName() == null || identity.getPrincipal().getName().isBlank()) {
      throw new BadRequestException("Missing employee identity");
    }
    return identity.getPrincipal().getName();
  }

  private String claimRequired(String name) {
    String v = claim(name);
    if (v == null || v.isBlank()) {
      throw new BadRequestException("Missing " + name);
    }
    return v;
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static Order.OrderType parseOrderType(String value) {
    try {
      return Order.OrderType.valueOf(value);
    } catch (Exception ex) {
      throw new BadRequestException("Invalid orderType");
    }
  }

  private static Payment.Method parsePaymentMethod(String value) {
    try {
      return Payment.Method.valueOf(value);
    } catch (Exception ex) {
      throw new BadRequestException("Invalid payment method");
    }
  }

  private static BigDecimal moneyZero() {
    return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
  }

  private static BigDecimal money(BigDecimal v) {
    if (v == null) return moneyZero();
    return v.setScale(2, RoundingMode.HALF_UP);
  }

  private static OrderItemResponse toResponse(OrderItem i) {
    return new OrderItemResponse(i.id, i.itemId, i.itemName, i.qty, i.unitPrice, i.lineTotal, i.status.name());
  }

  private static OrderResponse toResponse(Order o, List<OrderItemResponse> items) {
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
