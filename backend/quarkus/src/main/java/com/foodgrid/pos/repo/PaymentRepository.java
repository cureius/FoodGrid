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
  public List<Payment> findByClientIdPaginated(
      final String clientId,
      final int page,
      final int size,
      final String status,
      final String method,
      final String fromDate,
      final String toDate) {
    
    final StringBuilder query = new StringBuilder("clientId = ?1");
    final java.util.ArrayList<Object> params = new java.util.ArrayList<>();
    params.add(clientId);
    int paramIndex = 2;
    
    if (status != null && !status.isBlank() && !status.equalsIgnoreCase("All")) {
      query.append(" and status = ?").append(paramIndex++);
      params.add(com.foodgrid.pos.model.Payment.Status.valueOf(status.toUpperCase()));
    }
    if (method != null && !method.isBlank() && !method.equalsIgnoreCase("All")) {
      query.append(" and method = ?").append(paramIndex++);
      params.add(com.foodgrid.pos.model.Payment.Method.valueOf(method.toUpperCase()));
    }
    if (fromDate != null && !fromDate.isBlank()) {
      query.append(" and createdAt >= ?").append(paramIndex++);
      params.add(java.time.Instant.parse(fromDate));
    }
    if (toDate != null && !toDate.isBlank()) {
      query.append(" and createdAt <= ?").append(paramIndex++);
      params.add(java.time.Instant.parse(toDate));
    }
    
    query.append(" order by createdAt desc");
    
    return find(query.toString(), params.toArray()).page(page, size).list();
  }

  public long countByClientIdFiltered(
      final String clientId,
      final String status,
      final String method,
      final String fromDate,
      final String toDate) {
    
    final StringBuilder query = new StringBuilder("clientId = ?1");
    final java.util.ArrayList<Object> params = new java.util.ArrayList<>();
    params.add(clientId);
    int paramIndex = 2;
    
    if (status != null && !status.isBlank() && !status.equalsIgnoreCase("All")) {
      query.append(" and status = ?").append(paramIndex++);
      params.add(com.foodgrid.pos.model.Payment.Status.valueOf(status.toUpperCase()));
    }
    if (method != null && !method.isBlank() && !method.equalsIgnoreCase("All")) {
      query.append(" and method = ?").append(paramIndex++);
      params.add(com.foodgrid.pos.model.Payment.Method.valueOf(method.toUpperCase()));
    }
    if (fromDate != null && !fromDate.isBlank()) {
      query.append(" and createdAt >= ?").append(paramIndex++);
      params.add(java.time.Instant.parse(fromDate));
    }
    if (toDate != null && !toDate.isBlank()) {
      query.append(" and createdAt <= ?").append(paramIndex++);
      params.add(java.time.Instant.parse(toDate));
    }

    return count(query.toString(), params.toArray());
  }
}
