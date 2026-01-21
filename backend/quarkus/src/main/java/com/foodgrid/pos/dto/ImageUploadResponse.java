package com.foodgrid.pos.dto;

/**
 * Response DTO for image upload operations.
 */
public record ImageUploadResponse(
    String id,
    String filePath,
    String url,
    String fileName,
    String contentType
) {}
