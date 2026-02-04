package com.foodgrid.integration.service;

import com.foodgrid.integration.model.SourceChannel;
import com.foodgrid.integration.repo.ChannelIntegrationRepository;
import com.foodgrid.integration.repo.MenuChannelMappingRepository;
import com.foodgrid.pos.model.Order;
import com.foodgrid.pos.model.OrderItem;
import com.foodgrid.pos.repo.OrderRepository;
import com.foodgrid.pos.repo.OrderItemRepository;
import com.foodgrid.pos.repo.MenuItemRepository;
import com.foodgrid.common.util.Ids;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Optional;

@ApplicationScoped
public class ExternalOrderService {

    @Inject OrderRepository orderRepository;
    @Inject OrderItemRepository orderItemRepository;
    @Inject MenuItemRepository menuItemRepository;
    @Inject ChannelIntegrationRepository integrationRepository;
    @Inject MenuChannelMappingRepository mappingRepository;

    @Transactional
    public Order ingestOrder(SourceChannel channel, String externalStoreId, ExternalOrderPayload payload) {
        // 1. Find outlet by external store ID
        var integration = integrationRepository.find("channel = ?1 and externalStoreId = ?2", channel, externalStoreId)
                .firstResultOptional()
                .orElseThrow(() -> new RuntimeException("Integration not found for " + channel + " store " + externalStoreId));

        String outletId = integration.outletId;

        // 2. Idempotency check
        Optional<Order> existingOrder = orderRepository.find("sourceChannel = ?1 and externalOrderId = ?2", channel, payload.externalOrderId)
                .firstResultOptional();
        
        if (existingOrder.isPresent()) {
            return existingOrder.get();
        }

        // 3. Create Order
        Order o = new Order();
        o.id = Ids.uuid();
        o.outletId = outletId;
        o.sourceChannel = channel;
        o.externalOrderId = payload.externalOrderId;
        o.orderType = Order.OrderType.DELIVERY; // Most external orders are delivery
        o.status = Order.Status.OPEN; // Default to OPEN, maybe map from payload status
        o.subtotal = money(payload.subtotal);
        o.taxTotal = money(payload.taxTotal);
        o.discountTotal = money(payload.discountTotal);
        o.grandTotal = money(payload.grandTotal);
        o.notes = payload.notes;
        o.createdAt = Instant.now();
        o.updatedAt = Instant.now();
        
        orderRepository.persist(o);

        // 4. Create Order Items
        for (var itemPayload : payload.items) {
            var mapping = mappingRepository.findByExternalId(channel, itemPayload.externalItemId);
            
            OrderItem oi = new OrderItem();
            oi.id = Ids.uuid();
            oi.orderId = o.id;
            
            if (mapping.isPresent()) {
                oi.itemId = mapping.get().foodgridEntityId;
                var menuItem = menuItemRepository.findByIdOptional(oi.itemId);
                oi.itemName = menuItem.map(mi -> mi.name).orElse(itemPayload.name);
            } else {
                oi.itemId = "manual-" + channel.name().toLowerCase();
                oi.itemName = itemPayload.name;
            }
            
            oi.qty = itemPayload.qty;
            oi.unitPrice = money(itemPayload.unitPrice);
            oi.lineTotal = money(itemPayload.qty.multiply(itemPayload.unitPrice));
            oi.status = OrderItem.Status.OPEN;
            oi.createdAt = Instant.now();
            
            orderItemRepository.persist(oi);
        }

        return o;
    }

    private BigDecimal money(BigDecimal v) {
        if (v == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    public static record ExternalOrderPayload(
        String externalOrderId,
        BigDecimal subtotal,
        BigDecimal taxTotal,
        BigDecimal discountTotal,
        BigDecimal grandTotal,
        String notes,
        java.util.List<ExternalOrderItem> items
    ) {}

    public static record ExternalOrderItem(
        String externalItemId,
        String name,
        BigDecimal qty,
        BigDecimal unitPrice
    ) {}
}
