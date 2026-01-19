package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.StockMovement;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class StockMovementRepository implements PanacheRepositoryBase<StockMovement, String> {
  
  public List<StockMovement> listByIngredient(String ingredientId) {
    return list("ingredientId = ?1 ORDER BY recordedAt DESC", ingredientId);
  }

  public List<StockMovement> listByIngredientAndDateRange(String ingredientId, LocalDateTime startDate, LocalDateTime endDate) {
    return list("ingredientId = ?1 AND recordedAt >= ?2 AND recordedAt <= ?3 ORDER BY recordedAt DESC", 
                ingredientId, startDate, endDate);
  }

  public List<StockMovement> listByOutlet(String outletId) {
    return list("outletId = ?1 ORDER BY recordedAt DESC", outletId);
  }

  public List<StockMovement> listByOutletAndDateRange(String outletId, LocalDateTime startDate, LocalDateTime endDate) {
    return list("outletId = ?1 AND recordedAt >= ?2 AND recordedAt <= ?3 ORDER BY recordedAt DESC", 
                outletId, startDate, endDate);
  }

  public List<StockMovement> listByOutletAndType(String outletId, StockMovement.MovementType movementType) {
    return list("outletId = ?1 AND movementType = ?2 ORDER BY recordedAt DESC", outletId, movementType);
  }

  public List<StockMovement> listRecentByOutlet(String outletId, int limit) {
    return find("outletId = ?1 ORDER BY recordedAt DESC", outletId).page(0, limit).list();
  }
}
