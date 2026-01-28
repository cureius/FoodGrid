package com.foodgrid.customer.service;

import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.model.*;
import com.foodgrid.pos.repo.*;
import com.foodgrid.auth.repo.OutletRepository;
import com.foodgrid.common.util.Ids;
import com.foodgrid.pos.service.IngredientService;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class OrderCustomerService {

    @Inject OrderRepository orderRepository;
    @Inject OrderItemRepository orderItemRepository;
    @Inject MenuItemRepository menuItemRepository;
    @Inject MenuItemRecipeRepository recipeRepository;
    @Inject IngredientService ingredientService;
    @Inject SecurityIdentity identity;
    @Inject OutletRepository outletRepository;

    @Transactional
    public OrderResponse create(final OrderCreateRequest req, final String outletId, final String customerId) {
        // Create order for the specific customer
        final Order o = new Order();
        o.id = Ids.uuid();
        o.outletId = outletId;
        o.tenantId = null; // Will be set by the system
        o.deviceId = "customer-device";
        o.shiftId = "customer-shift";
        o.employeeId = null; // No employee for customer orders
        o.customerId = customerId; // Set the customerId field
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

        // Process items if provided
        if (req.orderItems() != null && !req.orderItems().isEmpty()) {
            for (final OrderAddItemRequest itemReq : req.orderItems()) {
                final MenuItem mi = menuItemRepository.findByIdAndOutlet(itemReq.itemId(), o.outletId)
                    .orElseThrow(() -> new BadRequestException("Invalid itemId: " + itemReq.itemId()));

                if (mi.status != MenuItem.Status.ACTIVE) {
                    throw new BadRequestException("Item inactive: " + mi.name);
                }

                final OrderItem oi = new OrderItem();
                oi.id = Ids.uuid();
                oi.orderId = o.id;
                oi.itemId = mi.id;
                oi.itemName = mi.name;
                oi.qty = itemReq.qty();
                oi.unitPrice = mi.basePrice;
                oi.lineTotal = money(itemReq.qty().multiply(mi.basePrice));
                oi.status = OrderItem.Status.OPEN;
                oi.createdAt = Instant.now();

                orderItemRepository.persist(oi);
            }
            recomputeTotals(o);
        }

        return get(o.id, customerId);
    }

    @Transactional
    public OrderResponse addItem(final String orderId, final OrderAddItemRequest req, final String customerId) {
        final Order o = getOrderForCustomer(orderId, customerId);

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
        oi.createdAt = Instant.now();

        orderItemRepository.persist(oi);

        recomputeTotals(o);

        return get(orderId, customerId);
    }

    public OrderResponse get(final String orderId, final String customerId) {
        final Order o = getOrderForCustomer(orderId, customerId);
        final List<OrderItemResponse> items = orderItemRepository.listByOrder(o.id).stream()
          .map(OrderCustomerService::toResponse)
          .toList();
        return toResponse(o, items);
    }

    public List<OrderItemResponse> getOrderItems(final String orderId, final String customerId) {
        final Order o = getOrderForCustomer(orderId, customerId);
        return orderItemRepository.listByOrder(o.id).stream()
          .map(OrderCustomerService::toResponse)
          .toList();
    }

    public List<OrderResponse> listByCustomer(final String customerId, final Integer limit, final String outletId) {
        final int lim = (limit == null || limit <= 0 || limit > 200) ? 50 : limit;

        if (outletId != null && !outletId.isBlank()) {
            return orderRepository.listByCustomerAndOutlet(customerId, outletId, lim)
                .stream()
                .map(o -> toResponse(o, orderItemRepository.listByOrder(o.id).stream().map(OrderCustomerService::toResponse).toList()))
                .toList();
        } else {
            return orderRepository.listByCustomer(customerId, lim)
                .stream()
                .map(o -> toResponse(o, orderItemRepository.listByOrder(o.id).stream().map(OrderCustomerService::toResponse).toList()))
                .toList();
        }
    }

    @Transactional
    public void cancel(final String orderId, final String customerId) {
        final Order o = getOrderForCustomer(orderId, customerId);
        
        // Only allow cancellation if order is in OPEN status
        if (o.status != Order.Status.OPEN) {
            throw new BadRequestException("Order cannot be cancelled in current status");
        }

        o.status = Order.Status.CANCELLED;
        o.updatedAt = Instant.now();
        orderRepository.persist(o);
    }

    private Order getOrderForCustomer(final String orderId, final String customerId) {
        final Order o = orderRepository.findByIdOptional(orderId)
          .orElseThrow(() -> new NotFoundException("Order not found"));

        // Verify the order belongs to this customer
        if (!customerId.equals(o.customerId)) {
            throw new jakarta.ws.rs.ForbiddenException("Order not found");
        }

        return o;
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
        o.updatedAt = Instant.now();
        orderRepository.persist(o);
    }

    private static Order.OrderType parseOrderType(final String value) {
        try {
            return Order.OrderType.valueOf(value);
        } catch (final Exception ex) {
            throw new BadRequestException("Invalid orderType");
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
