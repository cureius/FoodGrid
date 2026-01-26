package com.foodgrid.customer.service;

import com.foodgrid.common.storage.ImageUploadService;
import com.foodgrid.common.util.Ids;
import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.model.*;
import com.foodgrid.pos.repo.MenuCategoryRepository;
import com.foodgrid.pos.repo.MenuItemImageRepository;
import com.foodgrid.pos.repo.MenuItemRecipeRepository;
import com.foodgrid.pos.repo.MenuItemRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class MenuCustomerService {

  @Inject MenuCategoryRepository categoryRepository;
  @Inject MenuItemRepository itemRepository;
  @Inject MenuItemImageRepository imageRepository;
  @Inject MenuItemRecipeRepository recipeRepository;
  @Inject SecurityIdentity identity;
  @Inject ImageUploadService imageUploadService;

  public List<MenuCategoryResponse> listCategories(final String outletId) {
    enforceOutlet(outletId);
    return categoryRepository.listByOutlet(outletId).stream().map(MenuCustomerService::toResponse).toList();
  }

  public List<MenuItemResponse> listItems(final String outletId, final String categoryId) {
    enforceOutlet(outletId);
    final List<MenuItem> items;
    if (categoryId == null || categoryId.isBlank()) {
      items = itemRepository.listByOutlet(outletId);
    }else {
      items = itemRepository.listByOutletAndCategory(outletId, categoryId);
    }

    // Load all categories for this outlet to map categoryId -> categoryName
    final Map<String, String> categoryNames = categoryRepository.listByOutlet(outletId).stream()
      .collect(Collectors.toMap(c -> c.id, c -> c.name));
    
    // Load all images for these items
    final List<String> itemIds = items.stream().map(i -> i.id).toList();
    final Map<String, List<MenuItemImage>> imagesByItem = itemIds.isEmpty() ? Map.of() :
      imageRepository.list("menuItemId IN ?1 ORDER BY sortOrder ASC", itemIds).stream()
        .collect(Collectors.groupingBy(img -> img.menuItemId));
    
    // Load all recipes for these items
    final Map<String, List<MenuItemRecipe>> recipesByItem = itemIds.isEmpty() ? Map.of() :
      recipeRepository.list("menuItemId IN ?1 ORDER BY sortOrder ASC", itemIds).stream()
        .collect(Collectors.groupingBy(recipe -> recipe.menuItemId));
    
    return items.stream()
      .map(i -> toResponse(i, categoryNames.get(i.categoryId), imagesByItem.getOrDefault(i.id, List.of()), recipesByItem.getOrDefault(i.id, List.of()), imageUploadService))
      .toList();
  }

  public List<MenuItemResponse> listItemsOfCategory(final String outletId, final String categoryId) {
    enforceOutlet(outletId);
    final List<MenuItem> items = itemRepository.listByOutletAndCategory(outletId, categoryId);
    
    // Load all categories for this outlet to map categoryId -> categoryName
    final Map<String, String> categoryNames = categoryRepository.listByOutlet(outletId).stream()
      .collect(Collectors.toMap(c -> c.id, c -> c.name));
    
    // Load all images for these items
    final List<String> itemIds = items.stream().map(i -> i.id).toList();
    final Map<String, List<MenuItemImage>> imagesByItem = itemIds.isEmpty() ? Map.of() :
      imageRepository.list("menuItemId IN ?1 ORDER BY sortOrder ASC", itemIds).stream()
        .collect(Collectors.groupingBy(img -> img.menuItemId));
    
    // Load all recipes for these items
    final Map<String, List<MenuItemRecipe>> recipesByItem = itemIds.isEmpty() ? Map.of() :
      recipeRepository.list("menuItemId IN ?1 ORDER BY sortOrder ASC", itemIds).stream()
        .collect(Collectors.groupingBy(recipe -> recipe.menuItemId));
    
    return items.stream()
      .map(i -> toResponse(i, categoryNames.get(i.categoryId), imagesByItem.getOrDefault(i.id, List.of()), recipesByItem.getOrDefault(i.id, List.of()), imageUploadService))
      .toList();
  }

  public MenuItemResponse getItem(final String outletId, final String itemId) {
    enforceOutlet(outletId);
    
    final MenuItem i = itemRepository.findByIdAndOutlet(itemId, outletId)
      .orElseThrow(() -> new NotFoundException("Item not found"));
    
    String categoryName = null;
    if (i.categoryId != null) {
      categoryName = categoryRepository.findByIdAndOutlet(i.categoryId, outletId)
        .map(c -> c.name)
        .orElse(null);
    }
    
    final List<MenuItemImage> images = imageRepository.list("menuItemId = ?1 ORDER BY sortOrder ASC", itemId);
    final List<MenuItemRecipe> recipes = recipeRepository.findByMenuItemId(itemId);
    
    return toResponse(i, categoryName, images, recipes, imageUploadService);
  }

  private void enforceOutlet(final String outletId) {
    final String tokenOutletId = claim("outletId");
    if (tokenOutletId != null && !tokenOutletId.equals(outletId)) {
      throw new BadRequestException("Not allowed for this outlet");
    }
  }

  private String claim(final String name) {
    final Object v = identity.getAttributes().get(name);
    return v == null ? null : v.toString();
  }

  private static MenuCategoryResponse toResponse(final MenuCategory c) {
    return new MenuCategoryResponse(c.id, c.outletId, c.name, c.sortOrder, c.status.name());
  }

  private MenuItemResponse toResponse(final MenuItem i, final String categoryName, final List<MenuItemImage> images, final List<MenuItemRecipe> recipes, final ImageUploadService imageUploadService) {
    final List<MenuItemImageResponse> imageResponses = images.stream()
      .map(img -> {
        // Convert file path to full URL
        final String imageUrl = imageUploadService.getImageUrl(img.imageUrl);
        return new MenuItemImageResponse(img.id, imageUrl, img.sortOrder, img.isPrimary);
      })
      .toList();
    
    final List<MenuItemRecipeResponse> recipeResponses = recipes.stream()
      .map(recipe -> {
        // Load ingredient and unit details
        final Ingredient ingredient = Ingredient.findById(recipe.ingredientId);
        final UnitOfMeasure unit = UnitOfMeasure.findById(recipe.unitId);
        
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
      })
      .toList();
    
    return new MenuItemResponse(
      i.id, i.outletId, i.categoryId, categoryName, i.name, i.description, 
      i.isVeg, i.basePrice, i.status.name(), imageResponses, recipeResponses
    );
  }
}
