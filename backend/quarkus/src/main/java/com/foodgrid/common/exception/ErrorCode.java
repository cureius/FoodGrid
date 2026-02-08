package com.foodgrid.common.exception;

/**
 * Centralized error codes for the FoodGrid application.
 * Each code maps to an HTTP status and provides a unique identifier for client handling.
 */
public enum ErrorCode {

    // Authentication errors (AUTH_xxx) - 401
    AUTH_INVALID_CREDENTIALS("AUTH_001", "Invalid credentials", 401),
    AUTH_TOKEN_EXPIRED("AUTH_002", "Token has expired", 401),
    AUTH_TOKEN_INVALID("AUTH_003", "Invalid token", 401),
    AUTH_MISSING_TOKEN("AUTH_004", "Authentication required", 401),
    AUTH_OTP_INVALID("AUTH_005", "Invalid OTP code", 401),
    AUTH_OTP_EXPIRED("AUTH_006", "OTP has expired", 401),
    AUTH_PIN_INVALID("AUTH_007", "Invalid PIN", 401),
    AUTH_ACCOUNT_LOCKED("AUTH_008", "Account is locked", 401),

    // Authorization errors (AUTHZ_xxx) - 403
    AUTHZ_ACCESS_DENIED("AUTHZ_001", "Access denied", 403),
    AUTHZ_INSUFFICIENT_PERMISSIONS("AUTHZ_002", "Insufficient permissions", 403),
    AUTHZ_TENANT_MISMATCH("AUTHZ_003", "Resource belongs to different tenant", 403),
    AUTHZ_OUTLET_MISMATCH("AUTHZ_004", "Resource belongs to different outlet", 403),
    AUTHZ_DEVICE_MISMATCH("AUTHZ_005", "Device registered to different outlet", 403),
    AUTHZ_SESSION_REVOKED("AUTHZ_006", "Session has been revoked", 403),

    // Resource not found errors (RES_xxx) - 404
    RES_NOT_FOUND("RES_001", "Resource not found", 404),
    RES_EMPLOYEE_NOT_FOUND("RES_002", "Employee not found", 404),
    RES_OUTLET_NOT_FOUND("RES_003", "Outlet not found", 404),
    RES_ORDER_NOT_FOUND("RES_004", "Order not found", 404),
    RES_DEVICE_NOT_FOUND("RES_005", "Device not found", 404),
    RES_MENU_ITEM_NOT_FOUND("RES_006", "Menu item not found", 404),
    RES_CUSTOMER_NOT_FOUND("RES_007", "Customer not found", 404),
    RES_ADMIN_NOT_FOUND("RES_008", "Admin user not found", 404),
    RES_PAYMENT_NOT_FOUND("RES_009", "Payment not found", 404),
    RES_TRANSACTION_NOT_FOUND("RES_010", "Transaction not found", 404),
    RES_CHALLENGE_NOT_FOUND("RES_011", "Challenge not found", 404),
    RES_TABLE_NOT_FOUND("RES_012", "Table not found", 404),
    RES_INGREDIENT_NOT_FOUND("RES_013", "Ingredient not found", 404),
    RES_INTEGRATION_NOT_FOUND("RES_014", "Integration not found", 404),
    RES_CLIENT_NOT_FOUND("RES_015", "Client not found", 404),
    RES_SHIFT_NOT_FOUND("RES_016", "Shift not found", 404),

    // Validation errors (VAL_xxx) - 400
    VAL_INVALID_INPUT("VAL_001", "Invalid input", 400),
    VAL_MISSING_FIELD("VAL_002", "Required field missing", 400),
    VAL_INVALID_FORMAT("VAL_003", "Invalid format", 400),
    VAL_INVALID_PIN_FORMAT("VAL_004", "PIN must be 6 digits", 400),
    VAL_INVALID_EMAIL_FORMAT("VAL_005", "Invalid email format", 400),
    VAL_INVALID_PHONE_FORMAT("VAL_006", "Invalid phone format", 400),
    VAL_QUANTITY_INVALID("VAL_007", "Quantity must be positive", 400),
    VAL_AMOUNT_INVALID("VAL_008", "Amount must be positive", 400),
    VAL_STATUS_INVALID("VAL_009", "Invalid status value", 400),
    VAL_DATE_RANGE_INVALID("VAL_010", "Invalid date range", 400),

    // Business logic errors (BIZ_xxx) - 400/409
    BIZ_ORDER_NOT_EDITABLE("BIZ_001", "Order cannot be modified in current state", 400),
    BIZ_ORDER_INVALID_TRANSITION("BIZ_002", "Invalid order status transition", 400),
    BIZ_PAYMENT_ALREADY_PROCESSED("BIZ_003", "Payment has already been processed", 400),
    BIZ_INSUFFICIENT_STOCK("BIZ_004", "Insufficient stock", 400),
    BIZ_MENU_ITEM_INACTIVE("BIZ_005", "Menu item is not active", 400),
    BIZ_CHALLENGE_ALREADY_USED("BIZ_006", "Challenge has already been used", 400),
    BIZ_CHALLENGE_EXPIRED("BIZ_007", "Challenge has expired", 400),
    BIZ_REFUND_EXCEEDS_AMOUNT("BIZ_008", "Refund amount exceeds available balance", 400),
    BIZ_DUPLICATE_ENTRY("BIZ_009", "Duplicate entry", 409),
    BIZ_ADMIN_INACTIVE("BIZ_010", "Admin account is inactive", 400),
    BIZ_ORDER_MUST_BE_BILLED("BIZ_011", "Order must be billed before payment", 400),
    BIZ_OUTLET_NO_OWNER("BIZ_012", "Outlet has no owner configured", 400),
    BIZ_INTEGRATION_SYNC_FAILED("BIZ_013", "External channel sync failed", 400),

    // Payment gateway errors (PAY_xxx) - 400/502
    PAY_GATEWAY_ERROR("PAY_001", "Payment gateway error", 502),
    PAY_INITIATION_FAILED("PAY_002", "Payment initiation failed", 400),
    PAY_VERIFICATION_FAILED("PAY_003", "Payment verification failed", 400),
    PAY_REFUND_FAILED("PAY_004", "Refund processing failed", 400),
    PAY_WEBHOOK_INVALID("PAY_005", "Invalid webhook signature", 400),
    PAY_CONFIG_MISSING("PAY_006", "Payment gateway not configured", 400),
    PAY_CAPTURE_FAILED("PAY_007", "Payment capture failed", 400),

    // Storage errors (STR_xxx) - 500
    STR_UPLOAD_FAILED("STR_001", "File upload failed", 500),
    STR_DELETE_FAILED("STR_002", "File deletion failed", 500),
    STR_PROVIDER_ERROR("STR_003", "Storage provider error", 500),
    STR_INVALID_FILE_TYPE("STR_004", "Invalid file type", 400),
    STR_FILE_TOO_LARGE("STR_005", "File size exceeds limit", 400),

    // External integration errors (EXT_xxx) - 502/503
    EXT_SERVICE_UNAVAILABLE("EXT_001", "External service unavailable", 503),
    EXT_TIMEOUT("EXT_002", "External service timeout", 504),
    EXT_CHANNEL_ERROR("EXT_003", "Channel integration error", 502),
    EXT_EMAIL_FAILED("EXT_004", "Email delivery failed", 502),

    // Database errors (DB_xxx) - 500
    DB_CONNECTION_ERROR("DB_001", "Database connection error", 500),
    DB_QUERY_ERROR("DB_002", "Database query error", 500),
    DB_CONSTRAINT_VIOLATION("DB_003", "Database constraint violation", 409),
    DB_DEADLOCK("DB_004", "Database deadlock detected", 500),

    // System errors (SYS_xxx) - 500
    SYS_INTERNAL_ERROR("SYS_001", "Internal server error", 500),
    SYS_ENCRYPTION_ERROR("SYS_002", "Encryption operation failed", 500),
    SYS_CONFIGURATION_ERROR("SYS_003", "Configuration error", 500),
    SYS_UNEXPECTED_ERROR("SYS_999", "An unexpected error occurred", 500);

    private final String code;
    private final String defaultMessage;
    private final int httpStatus;

    ErrorCode(final String code, final String defaultMessage, final int httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}
