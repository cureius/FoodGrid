package com.foodgrid.common.exception;

/**
 * Exception for database-related failures.
 * Maps to HTTP 500 or 409 for constraint violations.
 */
public class DatabaseException extends FoodGridException {

    private final String entityType;
    private final String operation;

    public DatabaseException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
        this.entityType = null;
        this.operation = null;
    }

    public DatabaseException(final ErrorCode errorCode, final String message, final Throwable cause) {
        super(errorCode, message, cause);
        this.entityType = null;
        this.operation = null;
    }

    public DatabaseException(final ErrorCode errorCode, final String entityType, final String operation, final String message) {
        super(errorCode, message, "Entity: " + entityType + ", Operation: " + operation);
        this.entityType = entityType;
        this.operation = operation;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getOperation() {
        return operation;
    }

    public static DatabaseException connectionError(final Throwable cause) {
        return new DatabaseException(ErrorCode.DB_CONNECTION_ERROR, "Database connection error", cause);
    }

    public static DatabaseException queryError(final String operation, final Throwable cause) {
        return new DatabaseException(ErrorCode.DB_QUERY_ERROR, "Database query error during " + operation, cause);
    }

    public static DatabaseException constraintViolation(final String entityType, final String constraint) {
        return new DatabaseException(ErrorCode.DB_CONSTRAINT_VIOLATION, entityType, "persist",
            "Constraint violation: " + constraint);
    }

    public static DatabaseException deadlock(final String entityType, final String operation) {
        return new DatabaseException(ErrorCode.DB_DEADLOCK, entityType, operation,
            "Database deadlock detected. Please retry the operation.");
    }
}
