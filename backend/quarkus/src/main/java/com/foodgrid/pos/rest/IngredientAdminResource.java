package com.foodgrid.pos.rest;

import com.foodgrid.pos.dto.*;
import com.foodgrid.pos.service.IngredientService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/v1/admin/outlets/{outletId}/inventory")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({"ADMIN", "MANAGER", "TENANT_ADMIN"})
public class IngredientAdminResource {

  @Inject IngredientService ingredientService;

  // ==================== INGREDIENT CATEGORIES ====================

  @GET
  @Path("/categories")
  public List<IngredientCategoryResponse> listCategories(@PathParam("outletId") String outletId) {
    return ingredientService.listCategories(outletId);
  }

  @POST
  @Path("/categories")
  public IngredientCategoryResponse createCategory(
      @PathParam("outletId") String outletId,
      @Valid IngredientCategoryUpsertRequest request) {
    return ingredientService.createCategory(outletId, request);
  }

  @PUT
  @Path("/categories/{categoryId}")
  public IngredientCategoryResponse updateCategory(
      @PathParam("outletId") String outletId,
      @PathParam("categoryId") String categoryId,
      @Valid IngredientCategoryUpsertRequest request) {
    return ingredientService.updateCategory(outletId, categoryId, request);
  }

  @DELETE
  @Path("/categories/{categoryId}")
  public void deleteCategory(
      @PathParam("outletId") String outletId,
      @PathParam("categoryId") String categoryId) {
    ingredientService.deleteCategory(outletId, categoryId);
  }

  @POST
  @Path("/categories/delete-batch")
  public void deleteBatchCategories(
      @PathParam("outletId") String outletId,
      List<String> categoryIds) {
    ingredientService.deleteCategories(outletId, categoryIds);
  }

  // ==================== UNITS OF MEASURE ====================

  @GET
  @Path("/units")
  public List<UnitOfMeasureResponse> listUnits(@PathParam("outletId") String outletId) {
    return ingredientService.listUnits(outletId);
  }

  @POST
  @Path("/units")
  public UnitOfMeasureResponse createUnit(
      @PathParam("outletId") String outletId,
      @Valid UnitOfMeasureUpsertRequest request) {
    return ingredientService.createUnit(outletId, request);
  }

  @PUT
  @Path("/units/{unitId}")
  public UnitOfMeasureResponse updateUnit(
      @PathParam("outletId") String outletId,
      @PathParam("unitId") String unitId,
      @Valid UnitOfMeasureUpsertRequest request) {
    return ingredientService.updateUnit(outletId, unitId, request);
  }

  @DELETE
  @Path("/units/{unitId}")
  public void deleteUnit(
      @PathParam("outletId") String outletId,
      @PathParam("unitId") String unitId) {
    ingredientService.deleteUnit(outletId, unitId);
  }

  @POST
  @Path("/units/delete-batch")
  public void deleteBatchUnits(
      @PathParam("outletId") String outletId,
      List<String> unitIds) {
    ingredientService.deleteUnits(outletId, unitIds);
  }

  // ==================== SUPPLIERS ====================

  @GET
  @Path("/suppliers")
  public List<SupplierResponse> listSuppliers(@PathParam("outletId") String outletId) {
    return ingredientService.listSuppliers(outletId);
  }

  @POST
  @Path("/suppliers")
  public SupplierResponse createSupplier(
      @PathParam("outletId") String outletId,
      @Valid SupplierUpsertRequest request) {
    return ingredientService.createSupplier(outletId, request);
  }

  @PUT
  @Path("/suppliers/{supplierId}")
  public SupplierResponse updateSupplier(
      @PathParam("outletId") String outletId,
      @PathParam("supplierId") String supplierId,
      @Valid SupplierUpsertRequest request) {
    return ingredientService.updateSupplier(outletId, supplierId, request);
  }

  @DELETE
  @Path("/suppliers/{supplierId}")
  public void deleteSupplier(
      @PathParam("outletId") String outletId,
      @PathParam("supplierId") String supplierId) {
    ingredientService.deleteSupplier(outletId, supplierId);
  }

  @POST
  @Path("/suppliers/delete-batch")
  public void deleteBatchSuppliers(
      @PathParam("outletId") String outletId,
      List<String> supplierIds) {
    ingredientService.deleteSuppliers(outletId, supplierIds);
  }

  // ==================== INGREDIENTS ====================

  @GET
  @Path("/ingredients")
  public List<IngredientResponse> listIngredients(
      @PathParam("outletId") String outletId,
      @QueryParam("categoryId") String categoryId,
      @QueryParam("lowStock") Boolean lowStock) {
    if (Boolean.TRUE.equals(lowStock)) {
      return ingredientService.listLowStockIngredients(outletId);
    }
    if (categoryId != null) {
      return ingredientService.listIngredientsByCategory(outletId, categoryId);
    }
    return ingredientService.listIngredients(outletId);
  }

  @GET
  @Path("/ingredients/{ingredientId}")
  public IngredientResponse getIngredient(
      @PathParam("outletId") String outletId,
      @PathParam("ingredientId") String ingredientId) {
    return ingredientService.getIngredient(outletId, ingredientId);
  }

  @POST
  @Path("/ingredients")
  public IngredientResponse createIngredient(
      @PathParam("outletId") String outletId,
      @Valid IngredientUpsertRequest request) {
    return ingredientService.createIngredient(outletId, request);
  }

  @PUT
  @Path("/ingredients/{ingredientId}")
  public IngredientResponse updateIngredient(
      @PathParam("outletId") String outletId,
      @PathParam("ingredientId") String ingredientId,
      @Valid IngredientUpsertRequest request) {
    return ingredientService.updateIngredient(outletId, ingredientId, request);
  }

  @DELETE
  @Path("/ingredients/{ingredientId}")
  public void deleteIngredient(
      @PathParam("outletId") String outletId,
      @PathParam("ingredientId") String ingredientId) {
    ingredientService.deleteIngredient(outletId, ingredientId);
  }

  @POST
  @Path("/ingredients/delete-batch")
  public void deleteBatchIngredients(
      @PathParam("outletId") String outletId,
      List<String> ingredientIds) {
    ingredientService.deleteIngredients(outletId, ingredientIds);
  }

  // ==================== STOCK MOVEMENTS ====================

  @GET
  @Path("/stock-movements")
  public List<StockMovementResponse> listStockMovements(
      @PathParam("outletId") String outletId,
      @QueryParam("ingredientId") String ingredientId) {
    return ingredientService.listStockMovements(outletId, ingredientId);
  }

  @POST
  @Path("/stock-movements")
  public StockMovementResponse recordStockMovement(
      @PathParam("outletId") String outletId,
      @Valid StockMovementCreateRequest request) {
    return ingredientService.recordStockMovement(outletId, request);
  }
}
