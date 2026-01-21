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
        // Return URL path for accessing the file
        return baseUrl + "/" + filePath;
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
