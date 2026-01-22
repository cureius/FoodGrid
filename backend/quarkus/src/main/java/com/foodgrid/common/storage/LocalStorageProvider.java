package com.foodgrid.common.storage;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Local filesystem storage provider implementation.
 * Stores files in a configurable directory on the local filesystem.
 */
@ApplicationScoped
@Typed(LocalStorageProvider.class)  // Only expose as concrete type, not as BlobStorageProvider
public class LocalStorageProvider implements BlobStorageProvider {

    private static final Logger LOG = Logger.getLogger(LocalStorageProvider.class);

    @ConfigProperty(name = "foodgrid.storage.local.base-path", defaultValue = "./uploads")
    String basePath;

    @ConfigProperty(name = "foodgrid.storage.local.base-url", defaultValue = "/uploads")
    String baseUrl;

    @ConfigProperty(name = "foodgrid.storage.local.server-base-url", defaultValue = "http://localhost:8080")
    String serverBaseUrl;

    @Override
    public String upload(final InputStream inputStream, final String fileName, final String contentType, final String folder) {
        try {
            // Generate unique filename with original extension
            final String extension = getExtension(fileName);
            final String uniqueFileName = UUID.randomUUID().toString() + extension;

            // Create folder path
            final Path folderPath = Paths.get(basePath, folder);
            Files.createDirectories(folderPath);

            // Write file
            final Path filePath = folderPath.resolve(uniqueFileName);
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);

            LOG.infof("File uploaded to local storage: %s", filePath);

            // Return relative path (folder/filename)
            return folder + "/" + uniqueFileName;
        } catch (final IOException e) {
            LOG.errorf(e, "Failed to upload file to local storage: %s", fileName);
            throw new StorageException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean delete(final String filePath) {
        try {
            final Path path = Paths.get(basePath, filePath);
            final boolean deleted = Files.deleteIfExists(path);
            if (deleted) {
                LOG.infof("File deleted from local storage: %s", filePath);
            }
            return deleted;
        } catch (final IOException e) {
            LOG.errorf(e, "Failed to delete file from local storage: %s", filePath);
            return false;
        }
    }

    @Override
    public String getUrl(final String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        
        // If filePath is already a full URL (starts with http:// or https://), return as-is
        if (filePath.contains("http://") || filePath.contains("https://")) {
            return filePath;
        }
        
        // Return absolute URL for accessing the file
        // URLs always use forward slashes, regardless of OS
        final String URL_SEPARATOR = "/";
        
        // Remove leading slash from baseUrl if present, and ensure filePath doesn't have leading slash
        final String cleanBaseUrl = baseUrl.startsWith(URL_SEPARATOR) ? baseUrl : URL_SEPARATOR + baseUrl;
        final String cleanFilePath = filePath.startsWith(URL_SEPARATOR) ? filePath.substring(1) : filePath;
        final String relativePath = cleanBaseUrl + URL_SEPARATOR + cleanFilePath;
        
        // If serverBaseUrl is set, return absolute URL; otherwise return relative URL
        if (serverBaseUrl != null && !serverBaseUrl.isEmpty()) {
            // Remove trailing slash from serverBaseUrl if present
            final String cleanServerBaseUrl = serverBaseUrl.endsWith(URL_SEPARATOR)
                ? serverBaseUrl.substring(0, serverBaseUrl.length() - 1) 
                : serverBaseUrl;
            return cleanServerBaseUrl + relativePath;
        }
        
        return relativePath;
    }

    @Override
    public boolean exists(final String filePath) {
        final Path path = Paths.get(basePath, filePath);
        return Files.exists(path);
    }

    @Override
    public StorageProviderType getType() {
        return StorageProviderType.LOCAL;
    }

    private String getExtension(final String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}
