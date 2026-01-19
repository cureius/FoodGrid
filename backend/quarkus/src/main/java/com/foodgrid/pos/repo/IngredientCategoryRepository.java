package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.IngredientCategory;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class IngredientCategoryRepository implements PanacheRepositoryBase<IngredientCategory, String> {
  
  public List<IngredientCategory> listByOutlet(String outletId) {
    return list("outletId = ?1 ORDER BY sortOrder ASC, name ASC", outletId);
  }

  public Optional<IngredientCategory> findByIdAndOutlet(String id, String outletId) {
    return find("id = ?1 AND outletId = ?2", id, outletId).firstResultOptional();
  }

  public boolean existsByNameAndOutlet(String name, String outletId) {
    return count("name = ?1 AND outletId = ?2", name, outletId) > 0;
  }

  public boolean existsByNameAndOutletExcludingId(String name, String outletId, String excludeId) {
    return count("name = ?1 AND outletId = ?2 AND id != ?3", name, outletId, excludeId) > 0;
  }
}
