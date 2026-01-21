# Blob Storage Implementation

This document describes the blob storage system implemented using the Factory pattern for flexible storage provider selection.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BlobStorageProvider                         │
│                       (Interface)                               │
├─────────────────────────────────────────────────────────────────┤
│  + upload(inputStream, fileName, contentType, folder): String   │
│  + delete(filePath): boolean                                    │
│  + getUrl(filePath): String                                     │
│  + exists(filePath): boolean                                    │
│  + getType(): StorageProviderType                               │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │ implements
              ┌──────────────┼──────────────┐
              │              │              │
┌─────────────┴────┐  ┌──────┴──────┐  ┌────┴─────────────┐
│LocalStorageProvider│  │AwsS3Storage │  │ (Future: Azure,  │
│                    │  │  Provider   │  │   GCS, etc.)     │
└────────────────────┘  └─────────────┘  └──────────────────┘
              ▲              ▲
              │              │
              └──────┬───────┘
                     │
         ┌───────────┴───────────┐
         │  BlobStorageFactory   │
         │  (@Produces bean)     │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  ImageUploadService   │
         │  (Business Logic)     │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  ImageUploadResource  │
         │  (REST Endpoints)     │
         └───────────────────────┘
```

## Configuration

### Provider Selection

Set the storage provider in `application.properties`:

```properties
# Options: LOCAL, AWS_S3, MINIO
foodgrid.storage.provider=LOCAL
```

### Local Storage Configuration

```properties
foodgrid.storage.local.base-path=./uploads
foodgrid.storage.local.base-url=/uploads
```

### AWS S3 Configuration

```properties
foodgrid.storage.provider=AWS_S3
foodgrid.storage.s3.bucket=your-bucket-name
foodgrid.storage.s3.region=us-east-1
foodgrid.storage.s3.access-key=AKIAIOSFODNN7EXAMPLE
foodgrid.storage.s3.secret-key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
foodgrid.storage.s3.presigned-url-duration-minutes=60
# Optional: Use CloudFront CDN
foodgrid.storage.s3.public-url-base=https://d111111abcdef8.cloudfront.net
```

### MinIO Configuration (S3-Compatible)

```properties
foodgrid.storage.provider=MINIO
foodgrid.storage.s3.bucket=foodgrid
foodgrid.storage.s3.region=us-east-1
foodgrid.storage.s3.access-key=minioadmin
foodgrid.storage.s3.secret-key=minioadmin
foodgrid.storage.s3.endpoint=http://localhost:9000
```

## REST API Endpoints

### Menu Item Images

#### Upload Image
```http
POST /api/v1/admin/outlets/{outletId}/images/menu-items/{menuItemId}
Content-Type: multipart/form-data

file: <binary>
isPrimary: true/false (optional, default: false)
sortOrder: 0 (optional, default: 0)
```

Response:
```json
{
  "id": "uuid",
  "filePath": "menu-items/outlet-id/uuid.jpg",
  "url": "/uploads/menu-items/outlet-id/uuid.jpg",
  "fileName": "original-name.jpg",
  "contentType": "image/jpeg"
}
```

#### Get Menu Item Images
```http
GET /api/v1/admin/outlets/{outletId}/images/menu-items/{menuItemId}
```

#### Delete Image
```http
DELETE /api/v1/admin/outlets/{outletId}/images/menu-items/{menuItemId}/images/{imageId}
```

### Ingredient Images

#### Upload Image
```http
POST /api/v1/admin/outlets/{outletId}/images/ingredients/{ingredientId}
Content-Type: multipart/form-data

file: <binary>
```

#### Delete Image
```http
DELETE /api/v1/admin/outlets/{outletId}/images/ingredients/{ingredientId}/image
```

## File Constraints

- **Allowed file types**: JPEG, PNG, GIF, WebP
- **Maximum file size**: 5MB per file
- **File naming**: UUID-based to prevent conflicts

## Usage in Code

### Injecting the Storage Provider

```java
@Inject
BlobStorageProvider storageProvider;

// Or use the ImageUploadService for image-specific operations
@Inject
ImageUploadService imageUploadService;
```

### Uploading a File

```java
String filePath = storageProvider.upload(inputStream, "photo.jpg", "image/jpeg", "menu-items/outlet-123");
String publicUrl = storageProvider.getUrl(filePath);
```

### Using ImageUploadService

```java
String filePath = imageUploadService.uploadMenuItemImage(inputStream, fileName, contentType, outletId);
String url = imageUploadService.getImageUrl(filePath);
boolean deleted = imageUploadService.deleteImage(filePath);
```

## Adding a New Provider

1. Create a new class implementing `BlobStorageProvider`
2. Add the provider type to `StorageProviderType` enum
3. Register the provider in `BlobStorageFactory.createStorageProvider()`

Example for Azure Blob Storage:

```java
@ApplicationScoped
public class AzureBlobStorageProvider implements BlobStorageProvider {
    // Implementation
}
```

## Docker Compose - MinIO

Add MinIO to your `docker-compose.yml` for local S3-compatible storage:

```yaml
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data

volumes:
  minio_data:
```

## Security Considerations

1. **Authentication**: All image endpoints require authentication (ADMIN, MANAGER, or TENANT_ADMIN roles)
2. **Path Traversal**: The static file serving endpoint validates paths to prevent directory traversal attacks
3. **Content Type Validation**: Only allowed image types are accepted
4. **Size Limits**: Maximum file size is enforced

## Future Improvements

- [ ] Add Azure Blob Storage provider
- [ ] Add Google Cloud Storage provider
- [ ] Add image resizing/thumbnail generation
- [ ] Add virus scanning before storage
- [ ] Add CDN integration for better performance
