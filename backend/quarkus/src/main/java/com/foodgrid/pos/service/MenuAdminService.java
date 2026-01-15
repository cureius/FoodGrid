package com.foodgrid.pos.service;

import com.foodgrid.common.util.Ids;
import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.model.MenuCategory;
import com.foodgrid.pos.model.MenuItem;
import com.foodgrid.pos.repo.MenuCategoryRepository;
import com.foodgrid.pos.repo.MenuItemRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@ApplicationScoped
public class MenuAdminService {

  @Inject MenuCategoryRepository categoryRepository;
  @Inject MenuItemRepository itemRepository;
  @Inject SecurityIdentity identity;

  public List<MenuCategoryResponse> listCategories(String outletId) {
    enforceOutlet(outletId);
    return categoryRepository.listByOutlet(outletId).stream().map(MenuAdminService::toResponse).toList();
  }

  @Transactional
  public MenuCategoryResponse createCategory(String outletId, MenuCategoryUpsertRequest req) {
    enforceOutlet(outletId);

    MenuCategory c = new MenuCategory();
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
  public MenuCategoryResponse updateCategory(String outletId, String categoryId, MenuCategoryUpsertRequest req) {
    enforceOutlet(outletId);

    MenuCategory c = categoryRepository.findByIdAndOutlet(categoryId, outletId)
      .orElseThrow(() -> new NotFoundException("Category not found"));

    c.name = req.name();
    c.sortOrder = req.sortOrder() == null ? c.sortOrder : req.sortOrder();
    c.status = parseCategoryStatus(req.status());
    c.updatedAt = Date.from(Instant.now());
    categoryRepository.persist(c);

    return toResponse(c);
  }

  @Transactional
  public void deleteCategory(String outletId, String categoryId) {
    enforceOutlet(outletId);

    MenuCategory c = categoryRepository.findByIdAndOutlet(categoryId, outletId)
      .orElseThrow(() -> new NotFoundException("Category not found"));
    categoryRepository.delete(c);
  }

  public List<MenuItemResponse> listItems(String outletId) {
    enforceOutlet(outletId);
    return itemRepository.listByOutlet(outletId).stream().map(MenuAdminService::toResponse).toList();
  }

  @Transactional
  public MenuItemResponse createItem(String outletId, MenuItemUpsertRequest req) {
    enforceOutlet(outletId);

    if (req.categoryId() != null && !req.categoryId().isBlank()) {
      categoryRepository.findByIdAndOutlet(req.categoryId(), outletId)
        .orElseThrow(() -> new BadRequestException("Invalid categoryId"));
    }

    MenuItem i = new MenuItem();
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
    return toResponse(i);
  }

  @Transactional
  public MenuItemResponse updateItem(String outletId, String itemId, MenuItemUpsertRequest req) {
    enforceOutlet(outletId);

    MenuItem i = itemRepository.findByIdAndOutlet(itemId, outletId)
      .orElseThrow(() -> new NotFoundException("Item not found"));

    if (req.categoryId() != null && !req.categoryId().isBlank()) {
      categoryRepository.findByIdAndOutlet(req.categoryId(), outletId)
        .orElseThrow(() -> new BadRequestException("Invalid categoryId"));
      i.categoryId = req.categoryId();
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
    return toResponse(i);
  }

  @Transactional
  public void deleteItem(String outletId, String itemId) {
    enforceOutlet(outletId);

    MenuItem i = itemRepository.findByIdAndOutlet(itemId, outletId)
      .orElseThrow(() -> new NotFoundException("Item not found"));
    itemRepository.delete(i);
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

  private static MenuCategory.Status parseCategoryStatus(String status) {
    if (status == null || status.isBlank()) return MenuCategory.Status.ACTIVE;
    try {
      return MenuCategory.Status.valueOf(status);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid status");
    }
  }

  private static MenuItem.Status parseItemStatus(String status) {
    if (status == null || status.isBlank()) return MenuItem.Status.ACTIVE;
    try {
      return MenuItem.Status.valueOf(status);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("Invalid status");
    }
  }

  private static MenuCategoryResponse toResponse(MenuCategory c) {
    return new MenuCategoryResponse(c.id, c.outletId, c.name, c.sortOrder, c.status.name());
  }

  private static MenuItemResponse toResponse(MenuItem i) {
    return new MenuItemResponse(i.id, i.outletId, i.categoryId, i.name, i.description, i.isVeg, i.basePrice, i.status.name());
  }
}
