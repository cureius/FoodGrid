package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.Payment;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class PaymentRepository implements PanacheRepositoryBase<Payment, String> {
  public List<Payment> listByOrder(final String orderId) {
    return list("orderId", orderId);
  }

  public Optional<Payment> findByIdAndOrder(final String paymentId, final String orderId) {
    return find("id = ?1 and orderId = ?2", paymentId, orderId).firstResultOptional();
  }
}
