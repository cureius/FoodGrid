package com.foodgrid.pos.service;

import com.foodgrid.common.util.Ids;
import com.foodgrid.common.storage.ImageUploadService;
import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.model.*;
import com.foodgrid.pos.repo.MenuCategoryRepository;
import com.foodgrid.pos.repo.MenuItemRepository;
import com.foodgrid.pos.repo.MenuItemImageRepository;
import com.foodgrid.pos.repo.MenuItemRecipeRepository;
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
import java.util.logging.Logger;
import java.util.stream.Collectors;

@ApplicationScoped
public class MenuAdminService {

  @Inject MenuCategoryRepository categoryRepository;
  @Inject MenuItemRepository itemRepository;
  @Inject MenuItemImageRepository imageRepository;
  @Inject MenuItemRecipeRepository recipeRepository;
  @Inject SecurityIdentity identity;
  @Inject ImageUploadService imageUploadService;

  public List<MenuCategoryResponse> listCategories(final String outletId) {
    enforceOutlet(outletId);
    return categoryRepository.listByOutlet(outletId).stream().map(MenuAdminService::toResponse).toList();
  }

  @Transactional
  public MenuCategoryResponse createCategory(final String outletId, final MenuCategoryUpsertRequest req) {
    enforceOutlet(outletId);

    final MenuCategory c = new MenuCategory();
    c.id = Ids.uuid();
    c.outletId = outletId;
    c.name = req.name();
    c.sortOrder = req.sortOrder() == null ? 0 : req.sortOrder();
    c.status = parseCategoryStatus(req.status());
    c.createdAt = Date.from(Instant.now());
    c.updatedAt = Date.from(Instant.now());

    categoryRepository.persist(c);
    return toResponse(c);
  }

  @Transactional
  public MenuCategoryResponse updateCategory(final String outletId, final String categoryId, final MenuCategoryUpsertRequest req) {
    enforceOutlet(outletId);

    final MenuCategory c = categoryRepository.findByIdAndOutlet(categoryId, outletId)
      .orElseThrow(() -> new NotFoundException("Category not found"));

    c.name = req.name();
    c.sortOrder = req.sortOrder() == null ? c.sortOrder : req.sortOrder();
    c.status = parseCategoryStatus(req.status());
    c.updatedAt = Date.from(Instant.now());
    categoryRepository.persist(c);

    return toResponse(c);
  }

  @Transactional
  public void deleteCategory(final String outletId, final String categoryId) {
    enforceOutlet(outletId);

    final MenuCategory c = categoryRepository.findByIdAndOutlet(categoryId, outletId)
      .orElseThrow(() -> new NotFoundException("Category not found"));
    categoryRepository.delete(c);
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

  @Transactional
  public MenuItemResponse createItem(final String outletId, final MenuItemUpsertRequest req) {
    enforceOutlet(outletId);

    String categoryName = null;
    if (req.categoryId() != null && !req.categoryId().isBlank()) {
      final MenuCategory cat = categoryRepository.findByIdAndOutlet(req.categoryId(), outletId)
        .orElseThrow(() -> new BadRequestException("Invalid categoryId"));
      categoryName = cat.name;
    }

    final MenuItem i = new MenuItem();
    i.id = Ids.uuid();
    i.outletId = outletId;
    i.categoryId = (req.categoryId() == null || req.categoryId().isBlank()) ? null : req.categoryId();
    i.name = req.name();
    i.description = req.description();
    i.isVeg = req.isVeg() != null && req.isVeg();
    i.basePrice = req.basePrice();
    i.status = parseItemStatus(req.status());
    i.createdAt = Date.from(Instant.now());
    i.updatedAt = Date.from(Instant.now());

    itemRepository.persist(i);
    
    // Handle images
    final List<MenuItemImage> savedImages = saveImages(i.id, req.images());
    
    // Load recipes
    final List<MenuItemRecipe> recipes = recipeRepository.findByMenuItemId(i.id);

    return toResponse(i, categoryName, savedImages, recipes, imageUploadService);
  }

  @Transactional
  public MenuItemResponse updateItem(final String outletId, final String itemId, final MenuItemUpsertRequest req) {
    enforceOutlet(outletId);

    final MenuItem i = itemRepository.findByIdAndOutlet(itemId, outletId)
      .orElseThrow(() -> new NotFoundException("Item not found"));

    String categoryName = null;
    if (req.categoryId() != null && !req.categoryId().isBlank()) {
      final MenuCategory cat = categoryRepository.findByIdAndOutlet(req.categoryId(), outletId)
        .orElseThrow(() -> new BadRequestException("Invalid categoryId"));
      i.categoryId = req.categoryId();
      categoryName = cat.name;
    } else {
      i.categoryId = null;
    }

    i.name = req.name();
    i.description = req.description();
    i.isVeg = req.isVeg() != null && req.isVeg();
    i.basePrice = req.basePrice();
    i.status = parseItemStatus(req.status());
    i.updatedAt = Date.from(Instant.now());

    itemRepository.persist(i);
    
    // Delete existing images and save new ones
    imageRepository.deleteByMenuItem(itemId);
    final List<MenuItemImage> savedImages = saveImages(itemId, req.images());
    
    // Load recipes
    final List<MenuItemRecipe> recipes = recipeRepository.findByMenuItemId(itemId);

    return toResponse(i, categoryName, savedImages, recipes, imageUploadService);
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

  @Transactional
  public void deleteItem(final String outletId, final String itemId) {
    enforceOutlet(outletId);

    final MenuItem i = itemRepository.findByIdAndOutlet(itemId, outletId)
      .orElseThrow(() -> new NotFoundException("Item not found"));
    
    // Delete images first
    imageRepository.deleteByMenuItem(itemId);
    itemRepository.delete(i);
  }

  private List<MenuItemImage> saveImages(final String menuItemId, final List<MenuItemImageUpsertRequest> images) {
    if (images == null || images.isEmpty()) {
      return List.of();
    }
    
    final List<MenuItemImage> savedImages = new ArrayList<>();
    for (int idx = 0; idx < images.size(); idx++) {
      final MenuItemImageUpsertRequest imgReq = images.get(idx);
      if (imgReq.imageUrl() == null || imgReq.imageUrl().isBlank()) continue;
      
      final MenuItemImage img = new MenuItemImage();
      img.id = Ids.uuid();
      img.menuItemId = menuItemId;
      img.imageUrl = imgReq.imageUrl();
      img.sortOrder = imgReq.sortOrder();
      img.isPrimary = imgReq.isPrimary();
      imageRepository.persist(img);
      savedImages.add(img);
    }
    return savedImages;
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

  private static MenuCategory.Status parseCategoryStatus(final String status) {
    if (status == null || status.isBlank()) return MenuCategory.Status.ACTIVE;
    try {
      return MenuCategory.Status.valueOf(status);
    } catch (final IllegalArgumentException ex) {
      throw new BadRequestException("Invalid status");
    }
  }

  private static MenuItem.Status parseItemStatus(final String status) {
    if (status == null || status.isBlank()) return MenuItem.Status.ACTIVE;
    try {
      return MenuItem.Status.valueOf(status);
    } catch (final IllegalArgumentException ex) {
      throw new BadRequestException("Invalid status");
    }
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
