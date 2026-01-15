package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.Order;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class OrderRepository implements PanacheRepositoryBase<Order, String> {
  public Optional<Order> findByIdAndOutlet(String id, String outletId) {
    return find("id = ?1 and outletId = ?2", id, outletId).firstResultOptional();
  }

  public List<Order> listRecentByOutlet(String outletId, int limit) {
    return find("outletId = ?1 order by createdAt desc", outletId).page(0, limit).list();
  }
}
