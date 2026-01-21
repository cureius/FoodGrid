package com.foodgrid.pos.rest;

import com.foodgrid.common.storage.ImageUploadService;
import com.foodgrid.common.storage.StorageException;
import com.foodgrid.pos.dto.ImageUploadResponse;
import com.foodgrid.pos.model.Ingredient;
import com.foodgrid.pos.model.MenuItemImage;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.RestForm;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST resource for image upload operations.
 * Supports uploading images for menu items and ingredients.
 */
@Path("/api/v1/admin/outlets/{outletId}/images")
@RolesAllowed({"ADMIN", "MANAGER", "TENANT_ADMIN"})
public class ImageUploadResource {

    @Inject
    ImageUploadService imageUploadService;

    /**
     * Upload an image for a menu item.
     */
    @POST
    @Path("/menu-items/{menuItemId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadMenuItemImage(
            @PathParam("outletId") final String outletId,
            @PathParam("menuItemId") final String menuItemId,
            @RestForm("file") final FileUpload fileUpload,
            @RestForm("isPrimary") @DefaultValue("false") final boolean isPrimary,
            @RestForm("sortOrder") @DefaultValue("0") final int sortOrder
    ) {
        try {
            validateFileUpload(fileUpload);

            final String fileName = fileUpload.fileName();
            final String contentType = fileUpload.contentType();

            // Upload file to storage
            final String filePath;
            try (final InputStream is = Files.newInputStream(fileUpload.uploadedFile())) {
                filePath = imageUploadService.uploadMenuItemImage(is, fileName, contentType, outletId);
            }

            // Get the URL
            final String imageUrl = imageUploadService.getImageUrl(filePath);

            // If this should be primary, unset other primary images
            if (isPrimary) {
                MenuItemImage.update("isPrimary = false where menuItemId = ?1", menuItemId);
            }

            // Save image record to database
            final MenuItemImage image = new MenuItemImage();
            image.id = UUID.randomUUID().toString();
            image.menuItemId = menuItemId;
            image.imageUrl = filePath; // Store the path, not the URL
            image.isPrimary = isPrimary;
            image.sortOrder = sortOrder;
            image.createdAt = LocalDateTime.now();
            image.persist();

            return Response.ok(new ImageUploadResponse(
                    image.id,
                    filePath,
                    imageUrl,
                    fileName,
                    contentType
            )).build();

        } catch (final StorageException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        } catch (final IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to process file upload"))
                    .build();
        }
    }

    /**
     * Delete a menu item image.
     */
    @DELETE
    @Path("/menu-items/{menuItemId}/images/{imageId}")
    @Transactional
    public Response deleteMenuItemImage(
            @PathParam("outletId") final String outletId,
            @PathParam("menuItemId") final String menuItemId,
            @PathParam("imageId") final String imageId
    ) {
        final MenuItemImage image = MenuItemImage.findById(imageId);
        if (image == null || !image.menuItemId.equals(menuItemId)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Delete from storage
        imageUploadService.deleteImage(image.imageUrl);

        // Delete from database
        image.delete();

        return Response.noContent().build();
    }

    /**
     * Get all images for a menu item.
     */
    @GET
    @Path("/menu-items/{menuItemId}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<ImageUploadResponse> getMenuItemImages(
            @PathParam("outletId") final String outletId,
            @PathParam("menuItemId") final String menuItemId
    ) {
        final List<MenuItemImage> images = MenuItemImage.list("menuItemId = ?1 order by sortOrder", menuItemId);
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

    /**
     * Upload an image for an ingredient.
     */
    @POST
    @Path("/ingredients/{ingredientId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response uploadIngredientImage(
            @PathParam("outletId") final String outletId,
            @PathParam("ingredientId") final String ingredientId,
            @RestForm("file") final FileUpload fileUpload
    ) {
        try {
            validateFileUpload(fileUpload);

            final Ingredient ingredient = Ingredient.findById(ingredientId);
            if (ingredient == null || !ingredient.outletId.equals(outletId)) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            final String fileName = fileUpload.fileName();
            final String contentType = fileUpload.contentType();

            // Delete old image if exists
            if (ingredient.imageUrl != null && !ingredient.imageUrl.isEmpty()) {
                imageUploadService.deleteImage(ingredient.imageUrl);
            }

            // Upload new image
            final String filePath;
            try (final InputStream is = Files.newInputStream(fileUpload.uploadedFile())) {
                filePath = imageUploadService.uploadIngredientImage(is, fileName, contentType, outletId);
            }

            // Update ingredient record
            ingredient.imageUrl = filePath;
            ingredient.persist();

            final String imageUrl = imageUploadService.getImageUrl(filePath);

            return Response.ok(new ImageUploadResponse(
                    ingredientId,
                    filePath,
                    imageUrl,
                    fileName,
                    contentType
            )).build();

        } catch (final StorageException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        } catch (final IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to process file upload"))
                    .build();
        }
    }

    /**
     * Delete ingredient image.
     */
    @DELETE
    @Path("/ingredients/{ingredientId}/image")
    @Transactional
    public Response deleteIngredientImage(
            @PathParam("outletId") final String outletId,
            @PathParam("ingredientId") final String ingredientId
    ) {
        final Ingredient ingredient = Ingredient.findById(ingredientId);
        if (ingredient == null || !ingredient.outletId.equals(outletId)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        if (ingredient.imageUrl != null && !ingredient.imageUrl.isEmpty()) {
            imageUploadService.deleteImage(ingredient.imageUrl);
            ingredient.imageUrl = null;
            ingredient.persist();
        }

        return Response.noContent().build();
    }

    private void validateFileUpload(final FileUpload fileUpload) {
        if (fileUpload == null || fileUpload.uploadedFile() == null) {
            throw new StorageException("No file uploaded");
        }
        if (fileUpload.size() > 5 * 1024 * 1024) { // 5MB limit
            throw new StorageException("File size exceeds maximum allowed (5MB)");
        }
    }

    /**
     * Simple error response record.
     */
    public record ErrorResponse(String message) {}
}
