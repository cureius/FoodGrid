package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.MenuCategory;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class MenuCategoryRepository implements PanacheRepositoryBase<MenuCategory, String> {
  public List<MenuCategory> listByOutlet(String outletId) {
    return list("outletId", outletId);
  }

  public Optional<MenuCategory> findByIdAndOutlet(String id, String outletId) {
    return find("id = ?1 and outletId = ?2", id, outletId).firstResultOptional();
  }
}
