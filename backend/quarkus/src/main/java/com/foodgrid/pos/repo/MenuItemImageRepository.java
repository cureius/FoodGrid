package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.MenuItemImage;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class MenuItemImageRepository implements PanacheRepositoryBase<MenuItemImage, String> {

  public List<MenuItemImage> listByMenuItem(String menuItemId) {
    return list("menuItemId = ?1 ORDER BY sortOrder ASC", menuItemId);
  }

  public void deleteByMenuItem(String menuItemId) {
    delete("menuItemId = ?1", menuItemId);
  }
}
