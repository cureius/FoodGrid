package com.foodgrid.common.exception;

/**
 * Exception for business logic violations.
 * Maps to HTTP 400 Bad Request or 409 Conflict depending on the scenario.
 */
public class BusinessException extends FoodGridException {

    public BusinessException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
    }

    public BusinessException(final ErrorCode errorCode, final String message, final String details) {
        super(errorCode, message, details);
    }

    public static BusinessException orderNotEditable(final String orderId, final String currentStatus) {
        return new BusinessException(ErrorCode.BIZ_ORDER_NOT_EDITABLE,
            "Order cannot be modified", "Order " + orderId + " is in " + currentStatus + " state");
    }

    public static BusinessException invalidOrderTransition(final String fromStatus, final String toStatus, final String reason) {
        return new BusinessException(ErrorCode.BIZ_ORDER_INVALID_TRANSITION,
            "Invalid order status transition from " + fromStatus + " to " + toStatus, reason);
    }

    public static BusinessException paymentAlreadyProcessed(final String transactionId) {
        return new BusinessException(ErrorCode.BIZ_PAYMENT_ALREADY_PROCESSED,
            "Payment has already been processed", "Transaction ID: " + transactionId);
    }

    public static BusinessException insufficientStock(final String ingredientName, final String required, final String available) {
        return new BusinessException(ErrorCode.BIZ_INSUFFICIENT_STOCK,
            "Insufficient stock for " + ingredientName, "Required: " + required + ", Available: " + available);
    }

    public static BusinessException menuItemInactive(final String itemId) {
        return new BusinessException(ErrorCode.BIZ_MENU_ITEM_INACTIVE, "Menu item is not active: " + itemId);
    }

    public static BusinessException challengeAlreadyUsed(final String challengeId) {
        return new BusinessException(ErrorCode.BIZ_CHALLENGE_ALREADY_USED, "Challenge has already been used: " + challengeId);
    }

    public static BusinessException challengeExpired(final String challengeId) {
        return new BusinessException(ErrorCode.BIZ_CHALLENGE_EXPIRED, "Challenge has expired: " + challengeId);
    }

    public static BusinessException refundExceedsAmount(final String requested, final String available) {
        return new BusinessException(ErrorCode.BIZ_REFUND_EXCEEDS_AMOUNT,
            "Refund amount exceeds available balance", "Requested: " + requested + ", Available: " + available);
    }

    public static BusinessException duplicateEntry(final String entityType, final String identifier) {
        return new BusinessException(ErrorCode.BIZ_DUPLICATE_ENTRY,
            "Duplicate " + entityType + " entry", "Identifier: " + identifier);
    }

    public static BusinessException adminInactive(final String email) {
        return new BusinessException(ErrorCode.BIZ_ADMIN_INACTIVE, "Admin account is inactive: " + email);
    }

    public static BusinessException orderMustBeBilled() {
        return new BusinessException(ErrorCode.BIZ_ORDER_MUST_BE_BILLED, "Order must be billed before payment");
    }

    public static BusinessException outletNoOwner(final String outletId) {
        return new BusinessException(ErrorCode.BIZ_OUTLET_NO_OWNER, "Outlet has no owner configured: " + outletId);
    }

    public static BusinessException integrationSyncFailed(final String channel, final String reason) {
        return new BusinessException(ErrorCode.BIZ_INTEGRATION_SYNC_FAILED,
            "External channel sync failed for " + channel, reason);
    }
}
