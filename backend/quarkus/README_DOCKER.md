# Docker Build Instructions

This directory contains Dockerfiles for building the FoodGrid POS Backend application.

## Quick Start

### Build JVM Image (Recommended for development)

```bash
docker build -t foodgrid-pos-backend:latest .
```

### Build Native Image (Smaller, faster startup - for production)

```bash
docker build -f Dockerfile.native -t foodgrid-pos-backend:native .
```

## Running the Container

### Basic Run

```bash
docker run -p 8080:8080 \
  -e QUARKUS_DATASOURCE_JDBC_URL="jdbc:mysql://host.docker.internal:3307/foodgrid_db" \
  -e QUARKUS_DATASOURCE_USERNAME="root" \
  -e QUARKUS_DATASOURCE_PASSWORD="foodgrid" \
  foodgrid-pos-backend:latest
```

### With Docker Compose

The `docker-compose.yml` file includes a MySQL database. To run both the database and the application:

```bash
# Start database
docker-compose up -d db

# Run application container (after building the image)
docker run -p 8080:8080 \
  --network foodgrid_default \
  -e QUARKUS_DATASOURCE_JDBC_URL="jdbc:mysql://db:3306/foodgrid_db" \
  -e QUARKUS_DATASOURCE_USERNAME="root" \
  -e QUARKUS_DATASOURCE_PASSWORD="foodgrid" \
  foodgrid-pos-backend:latest
```

### Environment Variables

The application can be configured using environment variables. Key variables:

- `QUARKUS_DATASOURCE_JDBC_URL` - Database JDBC URL
- `QUARKUS_DATASOURCE_USERNAME` - Database username
- `QUARKUS_DATASOURCE_PASSWORD` - Database password
- `QUARKUS_HTTP_PORT` - HTTP port (default: 8080)
- `QUARKUS_HTTP_CORS_ORIGINS` - CORS allowed origins
- `FOODGRID_STORAGE_PROVIDER` - Storage provider (LOCAL, AWS_S3, MINIO)
- `FOODGRID_STORAGE_LOCAL_BASE_PATH` - Local storage path (default: ./uploads)
- `FOODGRID_ENCRYPTION_MASTER_KEY` - Encryption key for payment credentials

### Volume Mounts

For local file storage, mount a volume:

```bash
docker run -p 8080:8080 \
  -v $(pwd)/uploads:/app/uploads \
  foodgrid-pos-backend:latest
```

## Image Sizes

- **JVM Image**: ~300-400 MB (faster build, more memory usage)
- **Native Image**: ~100-150 MB (slower build, less memory, faster startup)

## Production Considerations

1. **Use environment variables** instead of hardcoded values in `application.properties`
2. **Use secrets management** (Docker secrets, Kubernetes secrets, etc.) for sensitive data
3. **Configure proper CORS origins** for production
4. **Set up proper logging** and monitoring
5. **Use native image** for better performance and smaller footprint
6. **Configure health checks** (already included in Dockerfile)
7. **Use a reverse proxy** (nginx, traefik) in front of the application

## Troubleshooting

### Build fails with "Out of memory"

Increase Docker memory limit or use native build which uses less memory during build.

### Application can't connect to database

Ensure:
- Database is accessible from container network
- Correct JDBC URL format
- Database credentials are correct
- Network configuration allows connection

### File uploads not working

Ensure:
- Volume is mounted correctly
- Directory permissions are set (already handled in Dockerfile)
- Storage provider is configured correctly
