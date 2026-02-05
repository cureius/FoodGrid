package com.foodgrid.common.exception;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Exception for input validation failures.
 * Maps to HTTP 400 Bad Request.
 */
public class ValidationException extends FoodGridException {

    private final Map<String, String> fieldErrors;

    public ValidationException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
        this.fieldErrors = Collections.emptyMap();
    }

    public ValidationException(final ErrorCode errorCode, final String message, final String details) {
        super(errorCode, message, details);
        this.fieldErrors = Collections.emptyMap();
    }

    public ValidationException(final ErrorCode errorCode, final String message, final Map<String, String> fieldErrors) {
        super(errorCode, message);
        this.fieldErrors = fieldErrors != null ? new HashMap<>(fieldErrors) : Collections.emptyMap();
    }

    public Map<String, String> getFieldErrors() {
        return Collections.unmodifiableMap(fieldErrors);
    }

    public static ValidationException invalidInput(final String message) {
        return new ValidationException(ErrorCode.VAL_INVALID_INPUT, message);
    }

    public static ValidationException missingField(final String fieldName) {
        return new ValidationException(ErrorCode.VAL_MISSING_FIELD, "Required field missing: " + fieldName, fieldName);
    }

    public static ValidationException invalidFormat(final String fieldName, final String expectedFormat) {
        return new ValidationException(ErrorCode.VAL_INVALID_FORMAT,
            "Invalid format for field: " + fieldName, "Expected format: " + expectedFormat);
    }

    public static ValidationException invalidPinFormat() {
        return new ValidationException(ErrorCode.VAL_INVALID_PIN_FORMAT, "PIN must be exactly 6 digits");
    }

    public static ValidationException invalidEmailFormat(final String email) {
        return new ValidationException(ErrorCode.VAL_INVALID_EMAIL_FORMAT, "Invalid email format: " + email);
    }

    public static ValidationException invalidPhoneFormat(final String phone) {
        return new ValidationException(ErrorCode.VAL_INVALID_PHONE_FORMAT, "Invalid phone format: " + phone);
    }

    public static ValidationException invalidQuantity() {
        return new ValidationException(ErrorCode.VAL_QUANTITY_INVALID, "Quantity must be a positive number");
    }

    public static ValidationException invalidAmount() {
        return new ValidationException(ErrorCode.VAL_AMOUNT_INVALID, "Amount must be a positive number");
    }

    public static ValidationException invalidStatus(final String status, final String validValues) {
        return new ValidationException(ErrorCode.VAL_STATUS_INVALID,
            "Invalid status: " + status, "Valid values: " + validValues);
    }

    public static ValidationException invalidDateRange() {
        return new ValidationException(ErrorCode.VAL_DATE_RANGE_INVALID, "End date must be after start date");
    }

    public static ValidationException withFieldErrors(final Map<String, String> errors) {
        return new ValidationException(ErrorCode.VAL_INVALID_INPUT, "Validation failed", errors);
    }
}
