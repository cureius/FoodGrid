# Multi-stage build for Quarkus application

# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /build

# Copy pom.xml first for better layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (produces both JAR and native executable)
RUN mvn clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S quarkus && adduser -S quarkus -G quarkus

# Copy the JAR file from build stage
COPY --from=build /build/target/quarkus-app /app

# Create uploads directory for local storage
RUN mkdir -p /app/uploads && chown -R quarkus:quarkus /app

# Switch to non-root user
USER quarkus

# Expose the application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/q/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]
