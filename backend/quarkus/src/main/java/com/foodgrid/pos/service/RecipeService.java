package com.foodgrid.pos.service;

import com.foodgrid.common.util.Ids;
import com.foodgrid.pos.dto.MenuItemRecipeResponse;
import com.foodgrid.pos.dto.MenuItemRecipeUpsertRequest;
import com.foodgrid.pos.model.Ingredient;
import com.foodgrid.pos.model.MenuItem;
import com.foodgrid.pos.model.MenuItemRecipe;
import com.foodgrid.pos.model.UnitOfMeasure;
import com.foodgrid.pos.repo.IngredientRepository;
import com.foodgrid.pos.repo.MenuItemRecipeRepository;
import com.foodgrid.pos.repo.MenuItemRepository;
import com.foodgrid.pos.repo.UnitOfMeasureRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class RecipeService {

  @Inject MenuItemRecipeRepository recipeRepository;
  @Inject MenuItemRepository menuItemRepository;
  @Inject IngredientRepository ingredientRepository;
  @Inject UnitOfMeasureRepository unitRepository;
  @Inject SecurityIdentity identity;

  public List<MenuItemRecipeResponse> getRecipes(String outletId, String menuItemId) {
    enforceOutlet(outletId);
    
    menuItemRepository.findByIdAndOutlet(menuItemId, outletId)
      .orElseThrow(() -> new NotFoundException("Menu item not found"));
    
    List<MenuItemRecipe> recipes = recipeRepository.findByMenuItemId(menuItemId);
    
    return recipes.stream()
      .map(this::toResponse)
      .toList();
  }

  @Transactional
  public MenuItemRecipeResponse createRecipe(String outletId, String menuItemId, MenuItemRecipeUpsertRequest request) {
    enforceOutlet(outletId);
    
    menuItemRepository.findByIdAndOutlet(menuItemId, outletId)
      .orElseThrow(() -> new NotFoundException("Menu item not found"));
    
    ingredientRepository.findByIdAndOutlet(request.ingredientId(), outletId)
      .orElseThrow(() -> new BadRequestException("Ingredient not found"));
    
    unitRepository.findByIdOptional(request.unitId())
      .orElseThrow(() -> new BadRequestException("Unit not found"));
    
    // Check if recipe already exists
    MenuItemRecipe existing = recipeRepository.findByMenuItemAndIngredient(menuItemId, request.ingredientId());
    if (existing != null) {
      throw new BadRequestException("Recipe item already exists for this ingredient");
    }
    
    MenuItemRecipe recipe = new MenuItemRecipe();
    recipe.id = Ids.uuid();
    recipe.menuItemId = menuItemId;
    recipe.ingredientId = request.ingredientId();
    recipe.quantity = request.quantity();
    recipe.unitId = request.unitId();
    recipe.notes = request.notes();
    recipe.isOptional = request.isOptional() != null && request.isOptional();
    recipe.sortOrder = request.sortOrder() != null ? request.sortOrder() : 0;
    
    recipeRepository.persist(recipe);
    
    return toResponse(recipe);
  }

  @Transactional
  public MenuItemRecipeResponse updateRecipe(String outletId, String menuItemId, String recipeId, MenuItemRecipeUpsertRequest request) {
    enforceOutlet(outletId);
    
    menuItemRepository.findByIdAndOutlet(menuItemId, outletId)
      .orElseThrow(() -> new NotFoundException("Menu item not found"));
    
    MenuItemRecipe recipe = recipeRepository.findByIdOptional(recipeId)
      .orElseThrow(() -> new NotFoundException("Recipe not found"));
    
    if (!recipe.menuItemId.equals(menuItemId)) {
      throw new BadRequestException("Recipe does not belong to this menu item");
    }
    
    ingredientRepository.findByIdAndOutlet(request.ingredientId(), outletId)
      .orElseThrow(() -> new BadRequestException("Ingredient not found"));
    
    unitRepository.findByIdOptional(request.unitId())
      .orElseThrow(() -> new BadRequestException("Unit not found"));
    
    // If ingredient changed, check for duplicates
    if (!recipe.ingredientId.equals(request.ingredientId())) {
      MenuItemRecipe existing = recipeRepository.findByMenuItemAndIngredient(menuItemId, request.ingredientId());
      if (existing != null && !existing.id.equals(recipeId)) {
        throw new BadRequestException("Recipe item already exists for this ingredient");
      }
    }
    
    recipe.ingredientId = request.ingredientId();
    recipe.quantity = request.quantity();
    recipe.unitId = request.unitId();
    recipe.notes = request.notes();
    recipe.isOptional = request.isOptional() != null && request.isOptional();
    recipe.sortOrder = request.sortOrder() != null ? request.sortOrder() : recipe.sortOrder;
    
    recipeRepository.persist(recipe);
    
    return toResponse(recipe);
  }

  @Transactional
  public void deleteRecipe(String outletId, String menuItemId, String recipeId) {
    enforceOutlet(outletId);
    
    menuItemRepository.findByIdAndOutlet(menuItemId, outletId)
      .orElseThrow(() -> new NotFoundException("Menu item not found"));
    
    MenuItemRecipe recipe = recipeRepository.findByIdOptional(recipeId)
      .orElseThrow(() -> new NotFoundException("Recipe not found"));
    
    if (!recipe.menuItemId.equals(menuItemId)) {
      throw new BadRequestException("Recipe does not belong to this menu item");
    }
    
    recipeRepository.delete(recipe);
  }

  @Transactional
  public void deleteAllRecipes(String outletId, String menuItemId) {
    enforceOutlet(outletId);
    
    menuItemRepository.findByIdAndOutlet(menuItemId, outletId)
      .orElseThrow(() -> new NotFoundException("Menu item not found"));
    
    recipeRepository.deleteByMenuItemId(menuItemId);
  }

  @Transactional
  public List<MenuItemRecipeResponse> upsertRecipes(String outletId, String menuItemId, List<MenuItemRecipeUpsertRequest> requests) {
    enforceOutlet(outletId);
    
    menuItemRepository.findByIdAndOutlet(menuItemId, outletId)
      .orElseThrow(() -> new NotFoundException("Menu item not found"));
    
    // Delete all existing recipes
    recipeRepository.deleteByMenuItemId(menuItemId);
    
    // Create new recipes
    if (requests != null && !requests.isEmpty()) {
      for (int i = 0; i < requests.size(); i++) {
        MenuItemRecipeUpsertRequest req = requests.get(i);
        
        ingredientRepository.findByIdAndOutlet(req.ingredientId(), outletId)
          .orElseThrow(() -> new BadRequestException("Ingredient not found: " + req.ingredientId()));
        
        unitRepository.findByIdOptional(req.unitId())
          .orElseThrow(() -> new BadRequestException("Unit not found: " + req.unitId()));
        
        MenuItemRecipe recipe = new MenuItemRecipe();
        recipe.id = Ids.uuid();
        recipe.menuItemId = menuItemId;
        recipe.ingredientId = req.ingredientId();
        recipe.quantity = req.quantity();
        recipe.unitId = req.unitId();
        recipe.notes = req.notes();
        recipe.isOptional = req.isOptional() != null && req.isOptional();
        recipe.sortOrder = req.sortOrder() != null ? req.sortOrder() : i;
        
        recipeRepository.persist(recipe);
      }
    }
    
    return getRecipes(outletId, menuItemId);
  }

  private MenuItemRecipeResponse toResponse(MenuItemRecipe recipe) {
    Ingredient ingredient = ingredientRepository.findByIdOptional(recipe.ingredientId).orElse(null);
    UnitOfMeasure unit = unitRepository.findByIdOptional(recipe.unitId).orElse(null);
    
    return new MenuItemRecipeResponse(
      recipe.id,
      recipe.menuItemId,
      recipe.ingredientId,
      ingredient != null ? ingredient.name : null,
      recipe.unitId,
      unit != null ? unit.name : null,
      unit != null ? unit.abbreviation : null,
      recipe.quantity,
      recipe.notes,
      recipe.isOptional,
      recipe.sortOrder
    );
  }

  private void enforceOutlet(String outletId) {
    String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }
  }

  private String claim(String name) {
    Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }
}
