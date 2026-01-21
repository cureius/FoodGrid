package com.foodgrid.common.storage;

import java.io.InputStream;

/**
 * Interface for blob storage providers.
 * Implementations can be LOCAL filesystem, AWS S3, Azure Blob, GCS, etc.
 */
public interface BlobStorageProvider {

    /**
     * Upload a file to storage.
     *
     * @param inputStream The file content
     * @param fileName    Original file name (used for extension)
     * @param contentType MIME type of the file
     * @param folder      Logical folder/prefix (e.g., "menu-items", "ingredients")
     * @return The stored file path/key or URL
     */
    String upload(InputStream inputStream, String fileName, String contentType, String folder);

    /**
     * Delete a file from storage.
     *
     * @param filePath The file path/key returned from upload
     * @return true if deleted successfully, false otherwise
     */
    boolean delete(String filePath);

    /**
     * Get a public URL to access the file.
     * For local storage, this returns the relative path.
     * For cloud providers, this may return a signed URL or public URL.
     *
     * @param filePath The file path/key
     * @return The accessible URL
     */
    String getUrl(String filePath);

    /**
     * Check if a file exists.
     *
     * @param filePath The file path/key
     * @return true if exists
     */
    boolean exists(String filePath);

    /**
     * Get the provider type identifier.
     *
     * @return Provider type (LOCAL, AWS_S3, AZURE_BLOB, GCS, etc.)
     */
    StorageProviderType getType();
}
