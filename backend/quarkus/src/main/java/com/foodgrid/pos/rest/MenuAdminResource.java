package com.foodgrid.pos.rest;

import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.service.MenuAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/v1/admin/outlets/{outletId}/menu")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN","MANAGER", "TENANT_ADMIN"})
public class MenuAdminResource {

  @Inject MenuAdminService menuAdminService;

  @GET
  @Path("/categories")
  public List<MenuCategoryResponse> listCategories(@PathParam("outletId") final String outletId) {
    return menuAdminService.listCategories(outletId);
  }

  @POST
  @Path("/categories")
  public MenuCategoryResponse createCategory(@PathParam("outletId") final String outletId, @Valid final MenuCategoryUpsertRequest request) {
    return menuAdminService.createCategory(outletId, request);
  }

  @PUT
  @Path("/categories/{categoryId}")
  public MenuCategoryResponse updateCategory(
    @PathParam("outletId") final String outletId,
    @PathParam("categoryId") final String categoryId,
    @Valid final MenuCategoryUpsertRequest request
  ) {
    return menuAdminService.updateCategory(outletId, categoryId, request);
  }

  @DELETE
  @Path("/categories/{categoryId}")
  public void deleteCategory(@PathParam("outletId") final String outletId, @PathParam("categoryId") final String categoryId) {
    menuAdminService.deleteCategory(outletId, categoryId);
  }

  @GET
  @Path("/items")
  public List<MenuItemResponse> listItems(@PathParam("outletId") final String outletId) {
    return menuAdminService.listItems(outletId);
  }

  @POST
  @Path("/items")
  public MenuItemResponse createItem(@PathParam("outletId") final String outletId, @Valid final MenuItemUpsertRequest request) {
    return menuAdminService.createItem(outletId, request);
  }

  @PUT
  @Path("/items/{itemId}")
  public MenuItemResponse updateItem(
    @PathParam("outletId") final String outletId,
    @PathParam("itemId") final String itemId,
    @Valid final MenuItemUpsertRequest request
  ) {
    return menuAdminService.updateItem(outletId, itemId, request);
  }

  @DELETE
  @Path("/items/{itemId}")
  public void deleteItem(@PathParam("outletId") final String outletId, @PathParam("itemId") final String itemId) {
    menuAdminService.deleteItem(outletId, itemId);
  }
}
