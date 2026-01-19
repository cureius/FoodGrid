package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.Supplier;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class SupplierRepository implements PanacheRepositoryBase<Supplier, String> {
  
  public List<Supplier> listByOutlet(String outletId) {
    return list("outletId = ?1 ORDER BY name ASC", outletId);
  }

  public List<Supplier> listActiveByOutlet(String outletId) {
    return list("outletId = ?1 AND status = ?2 ORDER BY name ASC", outletId, Supplier.Status.ACTIVE);
  }

  public Optional<Supplier> findByIdAndOutlet(String id, String outletId) {
    return find("id = ?1 AND outletId = ?2", id, outletId).firstResultOptional();
  }
}
