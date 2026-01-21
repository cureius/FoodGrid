package com.foodgrid.common.storage;

/**
 * Exception thrown when storage operations fail.
 */
public class StorageException extends RuntimeException {

    public StorageException(final String message) {
        super(message);
    }

    public StorageException(final String message, final Throwable cause) {
        super(message, cause);
    }
}
