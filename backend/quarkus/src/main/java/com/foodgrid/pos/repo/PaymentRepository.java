package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.Payment;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class PaymentRepository implements PanacheRepositoryBase<Payment, String> {
  public List<Payment> listByOrder(String orderId) {
    return list("orderId", orderId);
  }
}
