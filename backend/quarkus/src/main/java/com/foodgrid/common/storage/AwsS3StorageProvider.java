package com.foodgrid.common.storage;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Typed;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * AWS S3 storage provider implementation.
 * Can also be used with S3-compatible services like MinIO.
 */
@ApplicationScoped
@Typed(AwsS3StorageProvider.class)  // Only expose as concrete type, not as BlobStorageProvider
public class AwsS3StorageProvider implements BlobStorageProvider {

    private static final Logger LOG = Logger.getLogger(AwsS3StorageProvider.class);

    @ConfigProperty(name = "foodgrid.storage.s3.bucket")
    Optional<String> bucket;

    @ConfigProperty(name = "foodgrid.storage.s3.region", defaultValue = "us-east-1")
    String region;

    @ConfigProperty(name = "foodgrid.storage.s3.access-key")
    Optional<String> accessKey;

    @ConfigProperty(name = "foodgrid.storage.s3.secret-key")
    Optional<String> secretKey;

    @ConfigProperty(name = "foodgrid.storage.s3.endpoint")
    Optional<String> endpoint;

    @ConfigProperty(name = "foodgrid.storage.s3.presigned-url-duration-minutes", defaultValue = "60")
    int presignedUrlDurationMinutes;

    @ConfigProperty(name = "foodgrid.storage.s3.public-url-base")
    Optional<String> publicUrlBase;

    private S3Client s3Client;
    private S3Presigner s3Presigner;

    private S3Client getClient() {
        if (s3Client == null) {
            final var builder = S3Client.builder()
                    .region(Region.of(region));

            if (accessKey.isPresent() && secretKey.isPresent()) {
                builder.credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKey.get(), secretKey.get())
                        )
                );
            }

            // Custom endpoint for MinIO or other S3-compatible services
            endpoint.ifPresent(ep -> {
                builder.endpointOverride(URI.create(ep));
                builder.forcePathStyle(true); // Required for MinIO
            });

            s3Client = builder.build();
        }
        return s3Client;
    }

    private S3Presigner getPresigner() {
        if (s3Presigner == null) {
            final var builder = S3Presigner.builder()
                    .region(Region.of(region));

            if (accessKey.isPresent() && secretKey.isPresent()) {
                builder.credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKey.get(), secretKey.get())
                        )
                );
            }

            endpoint.ifPresent(ep -> builder.endpointOverride(URI.create(ep)));

            s3Presigner = builder.build();
        }
        return s3Presigner;
    }

    @Override
    public String upload(final InputStream inputStream, final String fileName, final String contentType, final String folder) {
        validateConfiguration();

        try {
            final String extension = getExtension(fileName);
            final String key = folder + "/" + UUID.randomUUID().toString() + extension;

            final byte[] bytes = inputStream.readAllBytes();

            final PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket.get())
                    .key(key)
                    .contentType(contentType)
                    .build();

            getClient().putObject(putRequest, RequestBody.fromBytes(bytes));

            LOG.infof("File uploaded to S3: %s/%s", bucket.get(), key);
            return key;
        } catch (final Exception e) {
            LOG.errorf(e, "Failed to upload file to S3: %s", fileName);
            throw new StorageException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean delete(final String filePath) {
        validateConfiguration();

        try {
            final DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket.get())
                    .key(filePath)
                    .build();

            getClient().deleteObject(deleteRequest);
            LOG.infof("File deleted from S3: %s/%s", bucket.get(), filePath);
            return true;
        } catch (final Exception e) {
            LOG.errorf(e, "Failed to delete file from S3: %s", filePath);
            return false;
        }
    }

    @Override
    public String getUrl(final String filePath) {
        validateConfiguration();

        // If a public URL base is configured (e.g., CloudFront), use that
        if (publicUrlBase.isPresent()) {
            return publicUrlBase.get() + "/" + filePath;
        }

        // Otherwise, generate a presigned URL
        try {
            final GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket.get())
                    .key(filePath)
                    .build();

            final GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(presignedUrlDurationMinutes))
                    .getObjectRequest(getObjectRequest)
                    .build();

            return getPresigner().presignGetObject(presignRequest).url().toString();
        } catch (final Exception e) {
            LOG.errorf(e, "Failed to generate presigned URL for: %s", filePath);
            throw new StorageException("Failed to generate URL: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(final String filePath) {
        validateConfiguration();

        try {
            final HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(bucket.get())
                    .key(filePath)
                    .build();

            getClient().headObject(headRequest);
            return true;
        } catch (final NoSuchKeyException e) {
            return false;
        } catch (final Exception e) {
            LOG.errorf(e, "Failed to check file existence in S3: %s", filePath);
            return false;
        }
    }

    @Override
    public StorageProviderType getType() {
        return StorageProviderType.AWS_S3;
    }

    private void validateConfiguration() {
        if (bucket.isEmpty()) {
            throw new StorageException("S3 bucket is not configured. Set foodgrid.storage.s3.bucket");
        }
    }

    private String getExtension(final String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}
