package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.OrderItem;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class OrderItemRepository implements PanacheRepositoryBase<OrderItem, String> {
  public List<OrderItem> listByOrder(String orderId) {
    return list("orderId", orderId);
  }

  public Optional<OrderItem> findByIdAndOrder(String id, String orderId) {
    return find("id = ?1 and orderId = ?2", id, orderId).firstResultOptional();
  }
}
