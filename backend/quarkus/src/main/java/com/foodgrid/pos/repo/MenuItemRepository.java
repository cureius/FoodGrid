package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.MenuItem;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class MenuItemRepository implements PanacheRepositoryBase<MenuItem, String> {
  public List<MenuItem> listByOutlet(String outletId) {
    return list("outletId", outletId);
  }

  public Optional<MenuItem> findByIdAndOutlet(String id, String outletId) {
    return find("id = ?1 and outletId = ?2", id, outletId).firstResultOptional();
  }

  public List<MenuItem> listByOutletAndCategory(String outletId, String categoryId) {
    return list("outletId = ?1 and categoryId = ?2", outletId, categoryId);
  }
}
