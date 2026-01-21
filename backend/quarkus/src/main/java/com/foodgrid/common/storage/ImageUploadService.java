package com.foodgrid.common.storage;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.io.InputStream;
import java.util.Set;

/**
 * Service for handling image uploads with validation.
 * Uses the configured BlobStorageProvider via factory pattern.
 */
@ApplicationScoped
public class ImageUploadService {

    private static final Logger LOG = Logger.getLogger(ImageUploadService.class);

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Inject
    BlobStorageProvider storageProvider;

    /**
     * Upload an image for a menu item.
     *
     * @param inputStream File content
     * @param fileName    Original file name
     * @param contentType MIME type
     * @param outletId    Outlet identifier for organizing files
     * @return Uploaded file path/key
     */
    public String uploadMenuItemImage(final InputStream inputStream, final String fileName, final String contentType, final String outletId) {
        validateImageType(contentType);
        final String folder = "menu-items/" + outletId;
        return storageProvider.upload(inputStream, fileName, contentType, folder);
    }

    /**
     * Upload an image for an ingredient.
     *
     * @param inputStream File content
     * @param fileName    Original file name
     * @param contentType MIME type
     * @param outletId    Outlet identifier for organizing files
     * @return Uploaded file path/key
     */
    public String uploadIngredientImage(final InputStream inputStream, final String fileName, final String contentType, final String outletId) {
        validateImageType(contentType);
        final String folder = "ingredients/" + outletId;
        return storageProvider.upload(inputStream, fileName, contentType, folder);
    }

    /**
     * Upload a generic image to a specified folder.
     *
     * @param inputStream File content
     * @param fileName    Original file name
     * @param contentType MIME type
     * @param folder      Target folder
     * @return Uploaded file path/key
     */
    public String uploadImage(final InputStream inputStream, final String fileName, final String contentType, final String folder) {
        validateImageType(contentType);
        return storageProvider.upload(inputStream, fileName, contentType, folder);
    }

    /**
     * Delete an image.
     *
     * @param filePath The file path/key
     * @return true if deleted successfully
     */
    public boolean deleteImage(final String filePath) {
        return storageProvider.delete(filePath);
    }

    /**
     * Get the public URL for an image.
     *
     * @param filePath The file path/key
     * @return Accessible URL
     */
    public String getImageUrl(final String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        return storageProvider.getUrl(filePath);
    }

    /**
     * Check if an image exists.
     *
     * @param filePath The file path/key
     * @return true if exists
     */
    public boolean imageExists(final String filePath) {
        return storageProvider.exists(filePath);
    }

    private void validateImageType(final String contentType) {
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new StorageException("Invalid image type: " + contentType +
                    ". Allowed types: " + ALLOWED_IMAGE_TYPES);
        }
    }
}
