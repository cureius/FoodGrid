package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.DiningTable;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class DiningTableRepository implements PanacheRepositoryBase<DiningTable, String> {
  public List<DiningTable> listByOutlet(String outletId) {
    return list("outletId", outletId);
  }

  public Optional<DiningTable> findByIdAndOutlet(String id, String outletId) {
    return find("id = ?1 and outletId = ?2", id, outletId).firstResultOptional();
  }
}
