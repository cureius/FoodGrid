package com.foodgrid.pos.rest;

import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * REST resource for serving uploaded files from local storage.
 * Only used when storage provider is LOCAL.
 * Publicly accessible - no authentication required.
 */
@Path("/uploads")
@PermitAll
public class StaticFileResource {

    @ConfigProperty(name = "foodgrid.storage.local.base-path", defaultValue = "./uploads")
    String basePath;

    @GET
    @Path("/{folder}/{subFolder}/{fileName}")
    public Response serveFile(
            @PathParam("folder") final String folder,
            @PathParam("subFolder") final String subFolder,
            @PathParam("fileName") final String fileName
    ) {
        return serveFileInternal(folder + "/" + subFolder + "/" + fileName);
    }

    @GET
    @Path("/{folder}/{fileName}")
    public Response serveFileSimple(
            @PathParam("folder") final String folder,
            @PathParam("fileName") final String fileName
    ) {
        return serveFileInternal(folder + "/" + fileName);
    }

    private Response serveFileInternal(final String relativePath) {
        try {
            final java.nio.file.Path filePath = Paths.get(basePath, relativePath);

            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }

            // Security check: ensure file is within uploads directory
            final java.nio.file.Path normalizedBase = Paths.get(basePath).toAbsolutePath().normalize();
            final java.nio.file.Path normalizedFile = filePath.toAbsolutePath().normalize();
            if (!normalizedFile.startsWith(normalizedBase)) {
                return Response.status(Response.Status.FORBIDDEN).build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            final byte[] fileContent = Files.readAllBytes(filePath);

            return Response.ok(fileContent)
                    .type(contentType)
                    .header("Cache-Control", "public, max-age=86400") // Cache for 1 day
                    .header("Access-Control-Allow-Origin", "*") // Allow CORS for images
                    .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                    .header("Access-Control-Allow-Headers", "Content-Type")
                    .build();

        } catch (final IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).build();
        }
    }
}
