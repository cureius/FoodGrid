package com.foodgrid.customer.rest;

import com.foodgrid.admin.dto.OutletResponse;
import com.foodgrid.admin.service.OutletAdminService;
import com.foodgrid.customer.service.MenuCustomerService;
import com.foodgrid.customer.service.OutletCustomerService;
import com.foodgrid.pos.dto.MenuCategoryResponse;
import com.foodgrid.pos.dto.MenuItemResponse;
import com.foodgrid.pos.dto.ImageUploadResponse;
import com.foodgrid.pos.service.MenuAdminService;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Path("/api/v1/customer/outlets")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
@Tag(name = "Customer Outlets", description = "Public/Customer-facing outlet and menu information")
public class CustomerOutletResource {

    @Inject OutletCustomerService outletCustomerService;
    @Inject MenuCustomerService menuCustomerService;
    @Inject com.foodgrid.common.storage.ImageUploadService imageUploadService;

    @GET
    @Operation(summary = "List all outlets", description = "Get a list of all active outlets for customers to browse")
    public List<OutletResponse> list() {
        return outletCustomerService.list();
    }

    @GET
    @Path("/{outletId}")
    @Operation(summary = "Get outlet details", description = "Get details of a specific outlet")
    public OutletResponse get(@PathParam("outletId") final String outletId) {
        // Here we'd ideally filter just for what customers need, but reusing admin response for simplicity
        return outletCustomerService.get(outletId);
    }

    @GET
    @Path("/{outletId}/menu/categories")
    @Operation(summary = "List menu categories", description = "Get all menu categories for an outlet")
    public List<MenuCategoryResponse> listCategories(@PathParam("outletId") final String outletId) {
        return menuCustomerService.listCategories(outletId);
    }

    @GET
    @Path("/{outletId}/menu/items")
    @Operation(summary = "List menu items", description = "Get all menu items for an outlet")
    public List<MenuItemResponse> listItems(
            @PathParam("outletId") final String outletId,
            @QueryParam("categoryId") final String categoryId) {
        return menuCustomerService.listItems(outletId, categoryId);
    }

    @GET
    @Path("/{outletId}/menu-items/{menuItemId}/images")
    @Operation(summary = "Get menu item images", description = "Get all images associated with a menu item")
    public List<ImageUploadResponse> getMenuItemImages(
            @PathParam("outletId") final String outletId,
            @PathParam("menuItemId") final String menuItemId
    ) {
        final List<com.foodgrid.pos.model.MenuItemImage> images = com.foodgrid.pos.model.MenuItemImage.list("menuItemId = ?1 order by sortOrder", menuItemId);
        return images.stream()
                .map(img -> new ImageUploadResponse(
                        img.id,
                        img.imageUrl,
                        imageUploadService.getImageUrl(img.imageUrl),
                        null,
                        null
                ))
                .toList();
    }
}
