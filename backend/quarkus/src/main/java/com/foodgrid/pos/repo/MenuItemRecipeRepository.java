package com.foodgrid.pos.repo;

import com.foodgrid.pos.model.MenuItemRecipe;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class MenuItemRecipeRepository implements PanacheRepositoryBase<MenuItemRecipe, String> {
  
  public List<MenuItemRecipe> findByMenuItemId(String menuItemId) {
    return list("menuItemId = ?1 ORDER BY sortOrder ASC, createdAt ASC", menuItemId);
  }

  public void deleteByMenuItemId(String menuItemId) {
    delete("menuItemId = ?1", menuItemId);
  }

  public void deleteByMenuItemIds(List<String> menuItemIds) {
    delete("menuItemId in ?1", menuItemIds);
  }

  public MenuItemRecipe findByMenuItemAndIngredient(String menuItemId, String ingredientId) {
    return find("menuItemId = ?1 AND ingredientId = ?2", menuItemId, ingredientId).firstResult();
  }
}
