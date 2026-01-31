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

  public List<Order> listByCustomer(String customerId, int limit) {
    return find("customerId = ?1 order by createdAt desc", customerId).page(0, limit).list();
  }

  public List<Order> listByCustomerAndOutlet(String customerId, String outletId, int limit) {
    return find("customerId = ?1 and outletId = ?2 order by createdAt desc", customerId, outletId).page(0, limit).list();
  }
  public List<Order> listByOutletAndDateRange(String outletId, java.time.Instant startDate, java.time.Instant endDate) {
    return find("outletId = ?1 and createdAt >= ?2 and createdAt <= ?3 order by createdAt desc", outletId, startDate, endDate).list();
  }
}
