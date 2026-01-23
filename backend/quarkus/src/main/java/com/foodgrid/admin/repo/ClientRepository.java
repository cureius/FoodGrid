package com.foodgrid.admin.repo;

import com.foodgrid.admin.model.Client;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ClientRepository implements PanacheRepositoryBase<Client, String> {
  public Optional<Client> findByName(String name) {
    return find("name", name).firstResultOptional();
  }

  public Optional<Client> findByContactEmail(String contactEmail) {
    return find("contactEmail", contactEmail).firstResultOptional();
  }

  /**
   * Find clients by status.
   */
  public List<Client> findByStatus(Client.Status status) {
    return list("status", status);
  }

  /**
   * Find clients with payments enabled.
   */
  public List<Client> findWithPaymentsEnabled() {
    return list("paymentEnabled", true);
  }

  /**
   * Find clients by default gateway type.
   */
  public List<Client> findByDefaultGatewayType(com.foodgrid.payment.model.PaymentGatewayType gatewayType) {
    return list("defaultGatewayType", gatewayType);
  }

  /**
   * Check if contact email exists (excluding a specific client ID).
   */
  public boolean contactEmailExists(String contactEmail, String excludeClientId) {
    return count("contactEmail = ?1 and id != ?2", contactEmail, excludeClientId) > 0;
  }

  /**
   * Find active clients with payments enabled.
   */
  public List<Client> findActiveWithPaymentsEnabled() {
    return list("status = ?1 and paymentEnabled = ?2", Client.Status.ACTIVE, true);
  }
}

