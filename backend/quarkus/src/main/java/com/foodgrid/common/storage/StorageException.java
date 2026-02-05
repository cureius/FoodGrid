package com.foodgrid.common.storage;

import com.foodgrid.common.exception.ErrorCode;
import com.foodgrid.common.exception.FoodGridException;

/**
 * Exception thrown when storage operations fail.
 */
public class StorageException extends FoodGridException {

    public StorageException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
    }

    public StorageException(final ErrorCode errorCode, final String message, final Throwable cause) {
        super(errorCode, message, cause);
    }

    public StorageException(final ErrorCode errorCode, final String message, final String details) {
        super(errorCode, message, details);
    }

    /**
     * @deprecated Use the ErrorCode-based constructors instead
     */
    @Deprecated
    public StorageException(final String message) {
        super(ErrorCode.STR_PROVIDER_ERROR, message);
    }

    /**
     * @deprecated Use the ErrorCode-based constructors instead
     */
    @Deprecated
    public StorageException(final String message, final Throwable cause) {
        super(ErrorCode.STR_PROVIDER_ERROR, message, cause);
    }

    public static StorageException uploadFailed(final String fileName, final Throwable cause) {
        return new StorageException(ErrorCode.STR_UPLOAD_FAILED,
            "Failed to upload file: " + fileName, cause);
    }

    public static StorageException uploadFailed(final String fileName, final String reason) {
        return new StorageException(ErrorCode.STR_UPLOAD_FAILED,
            "Failed to upload file: " + fileName, reason);
    }

    public static StorageException deleteFailed(final String fileName, final Throwable cause) {
        return new StorageException(ErrorCode.STR_DELETE_FAILED,
            "Failed to delete file: " + fileName, cause);
    }

    public static StorageException providerError(final String provider, final String operation, final Throwable cause) {
        return new StorageException(ErrorCode.STR_PROVIDER_ERROR,
            "Storage provider error during " + operation, cause);
    }

    public static StorageException invalidFileType(final String fileName, final String allowedTypes) {
        return new StorageException(ErrorCode.STR_INVALID_FILE_TYPE,
            "Invalid file type for: " + fileName, "Allowed types: " + allowedTypes);
    }

    public static StorageException fileTooLarge(final String fileName, final long sizeBytes, final long maxBytes) {
        return new StorageException(ErrorCode.STR_FILE_TOO_LARGE,
            "File too large: " + fileName,
            "Size: " + sizeBytes + " bytes, Max: " + maxBytes + " bytes");
    }
}
