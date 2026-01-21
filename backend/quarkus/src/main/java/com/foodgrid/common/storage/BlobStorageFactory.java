package com.foodgrid.common.storage;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Factory for creating BlobStorageProvider instances based on configuration.
 * Uses the Factory pattern to abstract storage provider selection.
 *
 * Configure the provider type via: foodgrid.storage.provider
 * Supported values: LOCAL, AWS_S3, MINIO
 */
@ApplicationScoped
public class BlobStorageFactory {

    private static final Logger LOG = Logger.getLogger(BlobStorageFactory.class);

    @ConfigProperty(name = "foodgrid.storage.provider", defaultValue = "LOCAL")
    String providerType;

    @Inject
    LocalStorageProvider localStorageProvider;

    @Inject
    AwsS3StorageProvider awsS3StorageProvider;

    /**
     * Produces the configured BlobStorageProvider as a CDI bean.
     * This allows injection of BlobStorageProvider anywhere in the application.
     */
    @Produces
    @Singleton
    public BlobStorageProvider createStorageProvider() {
        StorageProviderType type;
        try {
            type = StorageProviderType.valueOf(providerType.toUpperCase());
        } catch (final IllegalArgumentException e) {
            LOG.warnf("Unknown storage provider type: %s, defaulting to LOCAL", providerType);
            type = StorageProviderType.LOCAL;
        }

        LOG.infof("Initializing blob storage provider: %s", type);

        return switch (type) {
            case LOCAL -> localStorageProvider;
            case AWS_S3, MINIO -> awsS3StorageProvider; // MINIO uses S3-compatible API
            default -> {
                LOG.warnf("Provider type %s not implemented, defaulting to LOCAL", type);
                yield localStorageProvider;
            }
        };
    }

    /**
     * Get a specific storage provider by type.
     * Useful when you need to explicitly use a specific provider.
     */
    public BlobStorageProvider getProvider(final StorageProviderType type) {
        return switch (type) {
            case LOCAL -> localStorageProvider;
            case AWS_S3, MINIO -> awsS3StorageProvider;
            default -> throw new StorageException("Unsupported storage provider: " + type);
        };
    }
}
