package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.Ingredient;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class IngredientRepository implements PanacheRepositoryBase<Ingredient, String> {
  
  public List<Ingredient> listByOutlet(String outletId) {
    return list("outletId = ?1 ORDER BY name ASC", outletId);
  }

  public List<Ingredient> listActiveByOutlet(String outletId) {
    return list("outletId = ?1 AND status = ?2 ORDER BY name ASC", outletId, Ingredient.Status.ACTIVE);
  }

  public List<Ingredient> listByOutletAndCategory(String outletId, String categoryId) {
    return list("outletId = ?1 AND categoryId = ?2 ORDER BY name ASC", outletId, categoryId);
  }

  public List<Ingredient> listLowStock(String outletId) {
    return list("outletId = ?1 AND trackInventory = true AND currentStock <= reorderLevel AND status = ?2 ORDER BY name ASC", 
                outletId, Ingredient.Status.ACTIVE);
  }

  public List<Ingredient> listSellable(String outletId) {
    return list("outletId = ?1 AND isSellable = true AND status = ?2 ORDER BY name ASC", 
                outletId, Ingredient.Status.ACTIVE);
  }

  public Optional<Ingredient> findByIdAndOutlet(String id, String outletId) {
    return find("id = ?1 AND outletId = ?2", id, outletId).firstResultOptional();
  }

  public Optional<Ingredient> findBySkuAndOutlet(String sku, String outletId) {
    return find("sku = ?1 AND outletId = ?2", sku, outletId).firstResultOptional();
  }

  public boolean existsBySkuAndOutlet(String sku, String outletId) {
    return count("sku = ?1 AND outletId = ?2", sku, outletId) > 0;
  }

  public boolean existsBySkuAndOutletExcludingId(String sku, String outletId, String excludeId) {
    return count("sku = ?1 AND outletId = ?2 AND id != ?3", sku, outletId, excludeId) > 0;
  }

  public long countByCategory(String categoryId) {
    return count("categoryId = ?1", categoryId);
  }
}
