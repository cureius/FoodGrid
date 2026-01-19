package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.UnitOfMeasure;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class UnitOfMeasureRepository implements PanacheRepositoryBase<UnitOfMeasure, String> {
  
  public List<UnitOfMeasure> listByOutlet(String outletId) {
    return list("outletId = ?1 ORDER BY unitType ASC, name ASC", outletId);
  }

  public Optional<UnitOfMeasure> findByIdAndOutlet(String id, String outletId) {
    return find("id = ?1 AND outletId = ?2", id, outletId).firstResultOptional();
  }

  public boolean existsByNameAndOutlet(String name, String outletId) {
    return count("name = ?1 AND outletId = ?2", name, outletId) > 0;
  }
}
