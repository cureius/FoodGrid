package com.foodgrid.payment.dto;

import java.util.List;

/**
 * Paginated response wrapper.
 */
public record PaginatedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean hasNext,
    boolean hasPrevious
) {
    public static <T> PaginatedResponse<T> of(List<T> content, int page, int size, long totalElements) {
        final int totalPages = (int) Math.ceil((double) totalElements / size);
        final boolean hasNext = page < totalPages - 1;
        final boolean hasPrevious = page > 0;
        return new PaginatedResponse<>(content, page, size, totalElements, totalPages, hasNext, hasPrevious);
    }
}
